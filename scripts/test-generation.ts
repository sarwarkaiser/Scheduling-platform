// Test script for schedule generation
import { PrismaClient } from '../lib/generated/client/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { SchedulingEngine } from '../lib/modules/scheduling/engine';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

async function test() {
  console.log('🧪 Testing Schedule Generation...\n');

  // Check data exists
  console.log('📋 Checking database...');
  const program = await prisma.program.findUnique({
    where: { id: 'prog-1' },
    include: {
      shiftTemplates: true,
      residents: { include: { callPools: true } },
    },
  });

  if (!program) {
    console.log('❌ Program not found!');
    return;
  }

  console.log(`✅ Found program: ${program.name}`);
  console.log(`   - Shift templates: ${program.shiftTemplates.length}`);
  console.log(`   - Residents: ${program.residents.length}`);

  if (program.shiftTemplates.length === 0) {
    console.log('\n⚠️  No shift templates found. Creating one...');
    const shiftType = await prisma.shiftType.findFirst();
    if (shiftType) {
      const site = await prisma.site.findFirst({
        where: { organization: { programs: { some: { id: program.id } } } },
      });
      if (site) {
        const template = await prisma.shiftTemplate.create({
          data: {
            programId: program.id,
            name: 'Test Night Call',
            shiftTypeId: shiftType.id,
            siteId: site.id,
            recurrencePattern: JSON.stringify({ type: 'daily', interval: 1 }),
            startTime: '18:00',
            endTime: '06:00',
            active: true,
          },
        });
        // Add coverage requirement
        await prisma.coverageRequirement.create({
          data: {
            shiftTemplateId: template.id,
            role: 'Primary',
            count: 1,
            priority: 1,
          },
        });
        console.log('✅ Created test shift template with coverage requirement');
      }
    }
  } else {
    // Check if existing templates have coverage requirements
    for (const template of program.shiftTemplates) {
      const reqs = await prisma.coverageRequirement.findMany({
        where: { shiftTemplateId: template.id },
      });
      if (reqs.length === 0) {
        console.log(`\n⚠️  Template "${template.name}" has no coverage requirements. Adding...`);
        await prisma.coverageRequirement.create({
          data: {
            shiftTemplateId: template.id,
            role: 'Primary',
            count: 1,
            priority: 1,
          },
        });
      }
    }
  }

  console.log('\n🚀 Running scheduling engine...');
  const engine = new SchedulingEngine();

  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 7);

  console.log(`   Period: ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);

  const start = Date.now();

  try {
    const result = await engine.generateSchedule({
      programId: program.id,
      startDate,
      endDate,
    });

    const elapsed = Date.now() - start;

    console.log('\n✅ Schedule generation completed!');
    console.log(`   Time: ${elapsed}ms`);
    console.log(`   Shift instances: ${result.shiftInstances.length}`);
    console.log(`   Assignments: ${result.assignments.length}`);
    console.log(`   Violations: ${result.violations.length}`);
    console.log(`   Unassigned: ${result.unassignedShifts.length}`);
    console.log(`   Score: ${result.score}`);
  } catch (error: any) {
    console.log('\n❌ Error during generation:');
    console.log(error.message);
    console.log(error.stack);
  }

  await prisma.$disconnect();
}

test().catch(console.error);
