
import 'dotenv/config';
import { prisma } from './lib/prisma';

async function main() {
    const program = await prisma.program.findFirst();
    if (program) {
        console.log('Valid Program ID:', program.id);
    } else {
        console.log('No programs found.');
    }
}

main();
