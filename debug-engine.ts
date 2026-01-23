
import { SchedulingEngine } from './lib/modules/scheduling/engine';
import { prisma } from './lib/prisma';

async function main() {
    console.log('Starting debug...');

    // Find the psych program
    const program = await prisma.program.findFirst({
        where: { code: 'PSYCH-RES' }
    });

    if (!program) {
        console.error('Psych program not found');
        return;
    }

    console.log('Found program:', program.id, program.name);

    const engine = new SchedulingEngine();
    const startDate = new Date('2026-01-24');
    const endDate = new Date('2026-03-14'); // User's range

    console.log(`Generating schedule from ${startDate.toISOString()} to ${endDate.toISOString()}`);

    try {
        const result = await engine.generateSchedule({
            programId: program.id,
            startDate,
            endDate
        });

        console.log('Generation Result:');
        console.log('Assignments:', result.assignments.length);
        console.log('Unassigned:', result.unassignedShifts.length);
        console.log('Shift Instances:', result.shiftInstances.length);

        if (result.shiftInstances.length === 0) {
            console.log('Checking templates...');
            const templates = await prisma.shiftTemplate.findMany({
                where: { programId: program.id }
            });
            console.log(`Found ${templates.length} templates for program`);
            templates.forEach(t => {
                console.log(`Template ${t.id}:`, t.name, t.recurrencePattern);
            });
        }

    } catch (e) {
        console.error('Engine error:', e);
    }
}

main();
