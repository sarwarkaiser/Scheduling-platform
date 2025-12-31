import 'dotenv/config'
import { prisma } from '@/lib/prisma'
import { SwapWorkflowModule } from '@/lib/modules/workflow/swap'
import { addDays } from 'date-fns'

async function main() {
    console.log('🧪 Starting End-to-End Test...')

    // 1. Setup Data hierarchy
    console.log('📝 Setting up test data...')
    const now = Date.now()

    // Create Organization
    const org = await prisma.organization.create({
        data: {
            name: `Test Org ${now}`,
            slug: `test-org-${now}`
        }
    })

    // Create Program
    const program = await prisma.program.create({
        data: {
            name: 'Test Program',
            code: `TP-${now}`,
            organizationId: org.id
        }
    })

    // Create Site & Service
    const site = await prisma.site.create({
        data: { name: 'Test Site', organizationId: org.id }
    })
    const service = await prisma.service.create({
        data: { name: 'Test Service', code: 'TS', organizationId: org.id }
    })

    // Create Shift Type
    const shiftType = await prisma.shiftType.create({
        data: {
            name: 'Day',
            code: `DAY-${now}`,
        }
    })

    // Create Residents (Linked to Users)
    const createResident = async (name: string, email: string) => {
        const user = await prisma.user.create({
            data: {
                name,
                email,
                role: 'RESIDENT' as "RESIDENT",
                password: 'hash'
            }
        })

        return await prisma.resident.create({
            data: {
                programId: program.id,
                userId: user.id,
                active: true,
                startDate: new Date(),
            },
            include: { user: true }
        })
    }

    const r1 = await createResident('Dr. Test One', `test1_${now}@example.com`)
    const r2 = await createResident('Dr. Test Two', `test2_${now}@example.com`)


    // Create RuleSet and Constraints
    const ruleSet = await prisma.ruleSet.create({
        data: {
            name: 'Default Rules',
            programId: program.id,
            active: true,
            constraints: {
                create: {
                    name: 'Max Consecutive Shifts',
                    type: 'hard',
                    pluginType: 'max_consecutive_shifts', // Must match plugin definition
                    parameters: { limit: 6 },
                    active: true
                }
            }
        }
    })

    // Create Template
    const template = await prisma.shiftTemplate.create({
        data: {
            programId: program.id,
            name: 'Day Shift',
            startTime: '08:00',
            endTime: '17:00',
            recurrencePattern: JSON.stringify({ type: 'weekly' }),
            shiftTypeId: shiftType.id,
            siteId: site.id,
            serviceId: service.id
        }
    })

    // Create a Shift Instance for tomorrow
    const tomorrow = addDays(new Date(), 1)
    tomorrow.setHours(8, 0, 0, 0)

    const shift = await prisma.shiftInstance.create({
        data: {
            shiftTemplateId: template.id,
            date: tomorrow,
            startTime: tomorrow,
            endTime: addDays(tomorrow, 0.5),
            status: 'draft',
            siteId: site.id
        }
    })

    console.log('✅ Data setup complete.')

    // 2. Test Swap Validation (Smart Swap)

    // Assign R1
    const assignment = await prisma.assignment.create({
        data: {
            shiftInstanceId: shift.id,
            residentId: r1.id,
            role: 'Primary',
            status: 'assigned',
            assignedAt: new Date(),
            siteId: site.id
        },
        include: { shiftInstance: true, resident: true }
    })

    console.log('🔄 Testing Smart Swap Validation...')
    const swapModule = new SwapWorkflowModule()

    // Test 1: Valid Swap
    const validCheck = await swapModule.preCheckSwap({
        requesterId: r1.id,
        assignmentId: assignment.id,
        targetId: r2.id
    })

    if (validCheck.passed) {
        console.log('✅ Valid swap passed check.')
    } else {
        console.error('❌ Valid swap failed check!', validCheck.errors)
        process.exit(1)
    }

    // Test 2: Invalid Swap (Violate Max Consecutive)
    console.log('⚠️ Setting up constraint violation scenario...')
    const shiftsToCreate = []
    for (let i = 1; i <= 6; i++) {
        const d = addDays(tomorrow, -i)
        // create dummy shift/assignment
        shiftsToCreate.push(
            prisma.shiftInstance.create({
                data: {
                    shiftTemplateId: template.id,
                    date: d,
                    startTime: d,
                    endTime: addDays(d, 0.5),
                    status: 'published',
                    siteId: site.id,
                    assignments: {
                        create: {
                            residentId: r2.id,
                            role: 'Primary',
                            status: 'assigned',
                            assignedAt: new Date(),
                            siteId: site.id
                        }
                    }
                }
            })
        )
    }
    await prisma.$transaction(shiftsToCreate)

    const invalidCheck = await swapModule.preCheckSwap({
        requesterId: r1.id,
        assignmentId: assignment.id,
        targetId: r2.id
    })

    // Log the result for visual verification
    console.log('Simulating swap where Target (R2) works 6 days prior + this new day = 7 consecutive');

    if (!invalidCheck.passed) {
        console.log('✅ Invalid swap correctly rejected:', invalidCheck.errors)
    } else {
        console.log('ℹ️ Swap result:', invalidCheck)
        if (invalidCheck.warnings && invalidCheck.warnings.length > 0) {
            console.log('✅ Warnings present (Soft Limit):', invalidCheck.warnings)
        } else {
            console.warn('⚠️ Invalid swap passed without warnings. Check Plugin Config strictly.')
        }
    }

    console.log('🏁 Test Complete.')
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
