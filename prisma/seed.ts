import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

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
