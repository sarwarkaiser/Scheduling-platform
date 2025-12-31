import { PrismaClient } from '../lib/generated/client/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import * as dotenv from 'dotenv'

dotenv.config()

const connectionString = process.env.DATABASE_URL
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
    console.log('Seeding database...')

    // 1. Create Organization
    const org = await prisma.organization.upsert({
        where: { id: 'org-1' },
        update: {},
        create: {
            id: 'org-1',
            name: 'University Hospital',
            slug: 'university-hospital',
            description: 'Main hospital organization'
        }
    })
    console.log('Created Organization:', org.id)

    // 2. Create Site
    const site = await prisma.site.upsert({
        where: { id: 'site-1' },
        update: {},
        create: {
            id: 'site-1',
            organizationId: 'org-1',
            name: 'Main Campus',
            timezone: 'America/New_York'
        }
    })
    console.log('Created Site:', site.id)

    // 3. Create Service
    const service = await prisma.service.upsert({
        where: { id: 'svc-1' }, // Note: Schema has @@unique([organizationId, code]), but ID is PK.
        update: {},
        create: {
            id: 'svc-1',
            organizationId: 'org-1',
            name: 'Internal Medicine',
            code: 'IM'
        }
    })
    console.log('Created Service:', service.id)

    // 4. Create Program
    const program = await prisma.program.upsert({
        where: { id: 'prog-1' },
        update: {},
        create: {
            id: 'prog-1',
            organizationId: 'org-1',
            name: 'Internal Medicine Residency',
            code: 'IM-RES'
        }
    })
    console.log('Created Program:', program.id)

    // 5. Create Shift Types
    const shiftTypes = [
        { id: 'st-1', name: 'Night Call', code: 'NIGHT', pointsWeight: 1.5 },
        { id: 'st-2', name: '24 Hour Call', code: '24H', pointsWeight: 2.0 },
        { id: 'st-3', name: 'Weekend Day', code: 'WEEKEND', pointsWeight: 1.2 }
    ]

    for (const st of shiftTypes) {
        await prisma.shiftType.upsert({
            where: { id: st.id },
            update: {},
            create: st
        })
    }
    console.log('Created Shift Types')

    // 6. Create Call Pool
    const pool = await prisma.callPool.upsert({
        where: { id: 'pool-1' },
        update: {},
        create: {
            id: 'pool-1',
            programId: 'prog-1',
            name: 'IM Call Pool'
        }
    })
    console.log('Created Call Pool:', pool.id)

    // 7. Create Shift Template
    const template = await prisma.shiftTemplate.upsert({
        where: { id: 'tpl-1' },
        update: {},
        create: {
            id: 'tpl-1',
            programId: 'prog-1',
            name: 'Night Call',
            shiftTypeId: 'st-1',
            recurrencePattern: JSON.stringify({ type: 'daily', interval: 1 }),
            startTime: '18:00',
            endTime: '06:00',
            callPoolId: 'pool-1'
        }
    })
    console.log('Created Shift Template:', template.id)

    // ============================================================================
    // PSYCHIATRY SEED DATA
    // ============================================================================

    // 8. Create Psychiatry Service
    const psychService = await prisma.service.upsert({
        where: { id: 'svc-psych' },
        update: {},
        create: {
            id: 'svc-psych',
            organizationId: 'org-1',
            name: 'Psychiatry',
            code: 'PSYCH'
        }
    })
    console.log('Created Psych Service:', psychService.id)

    // 9. Create Psychiatry Program
    const psychProgram = await prisma.program.upsert({
        where: { id: 'prog-psych' },
        update: {},
        create: {
            id: 'prog-psych',
            organizationId: 'org-1',
            name: 'Psychiatry Residency',
            code: 'PSYCH-RES'
        }
    })
    console.log('Created Psych Program:', psychProgram.id)

    // 10. Create Psych Shift Types
    const psychShiftTypes = [
        { id: 'st-psych-1', name: 'Psych Emerge', code: 'PSY-EM', pointsWeight: 1.5 },
        { id: 'st-psych-2', name: 'Consult Liaison', code: 'PSY-CL', pointsWeight: 1.0 },
    ]

    for (const st of psychShiftTypes) {
        await prisma.shiftType.upsert({
            where: { id: st.id },
            update: {},
            create: st
        })
    }
    console.log('Created Psych Shift Types')

    // 11. Create Psych Call Pool
    const psychPool = await prisma.callPool.upsert({
        where: { id: 'pool-psych' },
        update: {},
        create: {
            id: 'pool-psych',
            programId: 'prog-psych',
            name: 'Psych Call Pool'
        }
    })
    console.log('Created Psych Call Pool:', psychPool.id)

    // 11.5 Create Psych Shift Templates
    const psychTemplates = [
        {
            id: 'tpl-psych-1',
            programId: 'prog-psych',
            name: 'Psych Emerge',
            shiftTypeId: 'st-psych-1',
            recurrencePattern: JSON.stringify({ type: 'daily', interval: 1 }),
            startTime: '08:00',
            endTime: '20:00',
            callPoolId: 'pool-psych'
        },
        {
            id: 'tpl-psych-2',
            programId: 'prog-psych',
            name: 'Consult Liaison',
            shiftTypeId: 'st-psych-2',
            recurrencePattern: JSON.stringify({ type: 'daily', interval: 1 }),
            startTime: '09:00',
            endTime: '17:00',
            // No call pool for CL, it's a rotation shift, but simplified for now
        }
    ]

    for (const t of psychTemplates) {
        await prisma.shiftTemplate.upsert({
            where: { id: t.id },
            update: {},
            create: t
        })
    }
    console.log('Created Psych Shift Templates')

    // ============================================================================
    // PROGRAM YEARS - REQUIRED FOR RESIDENTS
    // ============================================================================

    // IM Years
    const imYears = [
        { id: 'py-im-1', name: 'PGY1', year: 1 },
        { id: 'py-im-2', name: 'PGY2', year: 2 },
        { id: 'py-im-3', name: 'PGY3', year: 3 },
    ]
    for (const py of imYears) {
        await prisma.programYear.upsert({
            where: {
                programId_year: {
                    programId: 'prog-1',
                    year: py.year
                }
            },
            update: {
                id: py.id // Ensure ID matches our seed expectation if possible, or just update name
            },
            create: {
                id: py.id,
                programId: 'prog-1',
                name: py.name,
                year: py.year
            }
        })
    }
    console.log('Created IM Program Years')

    // Psych Years
    const psychYears = [
        { id: 'py-psych-1', name: 'PGY1', year: 1 },
        { id: 'py-psych-2', name: 'PGY2', year: 2 },
        { id: 'py-psych-3', name: 'PGY3', year: 3 },
        { id: 'py-psych-4', name: 'PGY4', year: 4 },
    ]
    for (const py of psychYears) {
        await prisma.programYear.upsert({
            where: {
                programId_year: {
                    programId: 'prog-psych',
                    year: py.year
                }
            },
            update: {
                id: py.id
            },
            create: {
                id: py.id,
                programId: 'prog-psych',
                name: py.name,
                year: py.year
            }
        })
    }
    console.log('Created Psych Program Years')


    // ============================================================================
    // RESIDENTS - CRITICAL FOR SCHEDULE GENERATION
    // ============================================================================

    // 12. Create Users & Residents (IM)
    const imResidents = [
        { name: 'John Doe', email: 'john.doe@example.com', pgy: 1 },
        { name: 'Jane Smith', email: 'jane.smith@example.com', pgy: 1 },
        { name: 'Bob Johnson', email: 'bob.johnson@example.com', pgy: 2 },
        { name: 'Alice Williams', email: 'alice.williams@example.com', pgy: 2 },
        { name: 'Charlie Brown', email: 'charlie.brown@example.com', pgy: 3 },
    ]

    for (const r of imResidents) {
        // Create User
        const user = await prisma.user.upsert({
            where: { email: r.email },
            update: {},
            create: { email: r.email, name: r.name }
        })

        // Cleanup existing residents for this user/program to avoid dups or constraint errors
        await prisma.resident.deleteMany({
            where: { userId: user.id, programId: 'prog-1' }
        })

        // Create Resident
        // Look up dynamically if needed, or assume ID match from above
        // Since we upserted ProgramYear with specific ID, we can try to use it.
        // Fallback: fetch it?
        // Let's safe fetch.
        const py = await prisma.programYear.findUnique({
            where: { programId_year: { programId: 'prog-1', year: r.pgy } }
        })

        if (py) {
            await prisma.resident.create({
                data: {
                    userId: user.id,
                    programId: 'prog-1',
                    programYearId: py.id,
                    active: true,
                    startDate: new Date('2024-07-01'),
                    endDate: new Date('2027-06-30'),
                }
            })
        }
    }
    console.log('Created IM Residents')

    // 13. Create Users & Residents (Psych)
    const psychResidents = [
        { name: 'Sigmund Freud', email: 's.freud@example.com', pgy: 4 },
        { name: 'Carl Jung', email: 'c.jung@example.com', pgy: 3 },
    ]

    for (const r of psychResidents) {
        const user = await prisma.user.upsert({
            where: { email: r.email },
            update: {},
            create: { email: r.email, name: r.name }
        })

        await prisma.resident.deleteMany({
            where: { userId: user.id, programId: 'prog-psych' }
        })

        const py = await prisma.programYear.findUnique({
            where: { programId_year: { programId: 'prog-psych', year: r.pgy } }
        })

        if (py) {
            await prisma.resident.create({
                data: {
                    userId: user.id,
                    programId: 'prog-psych',
                    programYearId: py.id,
                    active: true,
                    startDate: new Date('2024-07-01'),
                    endDate: new Date('2028-06-30'),
                }
            })
        }
    }
    console.log('Created Psych Residents')

    console.log('Seeding finished.')
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
