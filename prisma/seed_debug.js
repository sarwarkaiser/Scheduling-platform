const { PrismaClient } = require('../../lib/generated/client/index.js');

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding database...');
    // 1. Create Organization
    try {
        const org = await prisma.organization.upsert({
            where: { id: 'org-1' },
            update: {},
            create: {
                id: 'org-1',
                name: 'University Hospital',
                slug: 'university-hospital',
                description: 'Main hospital organization'
            }
        });
        console.log('Created Organization:', org.id);
    } catch (e) {
        console.error(e);
    }
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
