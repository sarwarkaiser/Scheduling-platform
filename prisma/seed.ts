// Seed script for demo data
import 'dotenv/config';
import { PrismaClient } from '../lib/generated/client/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  console.log('🌱 Starting database seed...');

  // Hash password for demo users
  const hashedPassword = await bcrypt.hash('demo123', 10);

  // 1. Create Organization
  const organization = await prisma.organization.upsert({
    where: { slug: 'university-hospital' },
    update: {},
    create: {
      id: 'org-1',
      name: 'University Hospital',
      slug: 'university-hospital',
      description: 'Academic medical center',
    },
  });
  console.log('✅ Created organization:', organization.name);

  // 2. Create Sites
  const mainCampus = await prisma.site.upsert({
    where: { id: 'site-1' },
    update: {},
    create: {
      id: 'site-1',
      organizationId: organization.id,
      name: 'Main Campus',
      address: '123 Medical Center Dr',
      timezone: 'America/New_York',
    },
  });

  const communitySite = await prisma.site.upsert({
    where: { id: 'site-2' },
    update: {},
    create: {
      id: 'site-2',
      organizationId: organization.id,
      name: 'Community Hospital',
      address: '456 Community Blvd',
      timezone: 'America/New_York',
    },
  });
  console.log('✅ Created sites');

  // 3. Create Services
  const internalMedicine = await prisma.service.upsert({
    where: { organizationId_code: { organizationId: organization.id, code: 'IM' } },
    update: {},
    create: {
      id: 'svc-1',
      organizationId: organization.id,
      name: 'Internal Medicine',
      code: 'IM',
      description: 'Internal Medicine Service',
    },
  });

  const emergencyMedicine = await prisma.service.upsert({
    where: { organizationId_code: { organizationId: organization.id, code: 'EM' } },
    update: {},
    create: {
      id: 'svc-2',
      organizationId: organization.id,
      name: 'Emergency Medicine',
      code: 'EM',
      description: 'Emergency Medicine Service',
    },
  });

  const psychiatry = await prisma.service.upsert({
    where: { organizationId_code: { organizationId: organization.id, code: 'PSY' } },
    update: {},
    create: {
      id: 'svc-3',
      organizationId: organization.id,
      name: 'Psychiatry',
      code: 'PSY',
      description: 'Psychiatry Service',
    },
  });
  console.log('✅ Created services');

  // 4. Create Site-Service associations
  await prisma.siteService.create({
    data: {
      siteId: mainCampus.id,
      serviceId: internalMedicine.id,
    },
  }).catch(() => {});

  await prisma.siteService.create({
    data: {
      siteId: communitySite.id,
      serviceId: internalMedicine.id,
    },
  }).catch(() => {});
  console.log('✅ Created site-service associations');

  // 5. Create Program
  const program = await prisma.program.upsert({
    where: { organizationId_code: { organizationId: organization.id, code: 'IM-RES' } },
    update: {},
    create: {
      id: 'prog-1',
      organizationId: organization.id,
      name: 'Internal Medicine Residency',
      code: 'IM-RES',
      description: 'Categorical Internal Medicine Residency Program',
    },
  });
  console.log('✅ Created program:', program.name);

  // 6. Create Program Years
  const pgy1 = await prisma.programYear.upsert({
    where: { programId_year: { programId: program.id, year: 1 } },
    update: {},
    create: {
      id: 'py-1',
      programId: program.id,
      year: 1,
      name: 'PGY1',
    },
  });

  const pgy2 = await prisma.programYear.upsert({
    where: { programId_year: { programId: program.id, year: 2 } },
    update: {},
    create: {
      id: 'py-2',
      programId: program.id,
      year: 2,
      name: 'PGY2',
    },
  });

  const pgy3 = await prisma.programYear.upsert({
    where: { programId_year: { programId: program.id, year: 3 } },
    update: {},
    create: {
      id: 'py-3',
      programId: program.id,
      year: 3,
      name: 'PGY3',
    },
  });
  console.log('✅ Created program years');

  // 7. Create Call Pool
  const callPool = await prisma.callPool.upsert({
    where: { programId_name: { programId: program.id, name: 'IM Call Pool' } },
    update: {},
    create: {
      id: 'pool-1',
      programId: program.id,
      name: 'IM Call Pool',
      description: 'Internal Medicine Call Pool',
    },
  });
  console.log('✅ Created call pool');

  // 8. Create Shift Types
  const nightShift = await prisma.shiftType.upsert({
    where: { code: 'NIGHT' },
    update: {},
    create: {
      id: 'st-1',
      name: 'Night Call',
      code: 'NIGHT',
      description: 'Overnight call (7pm-7am)',
      durationHours: 12,
      pointsWeight: 1.5,
    },
  });

  const day24Shift = await prisma.shiftType.upsert({
    where: { code: '24H' },
    update: {},
    create: {
      id: 'st-2',
      name: '24 Hour Call',
      code: '24H',
      description: '24 hour call',
      durationHours: 24,
      pointsWeight: 2.0,
    },
  });

  const weekendShift = await prisma.shiftType.upsert({
    where: { code: 'WEEKEND' },
    update: {},
    create: {
      id: 'st-3',
      name: 'Weekend Day',
      code: 'WEEKEND',
      description: 'Weekend day shift',
      durationHours: 12,
      pointsWeight: 1.2,
    },
  });

  const dayShift = await prisma.shiftType.upsert({
    where: { code: 'DAY' },
    update: {},
    create: {
      id: 'st-4',
      name: 'Day Shift',
      code: 'DAY',
      description: 'Regular day shift (7am-5pm)',
      durationHours: 10,
      pointsWeight: 1.0,
    },
  });
  console.log('✅ Created shift types');

  // 9. Create Demo Users and Residents
  const demoResidents = [
    { email: 'john.doe@example.com', name: 'John Doe', pgy: 2 },
    { email: 'jane.smith@example.com', name: 'Jane Smith', pgy: 1 },
    { email: 'bob.wilson@example.com', name: 'Bob Wilson', pgy: 3 },
    { email: 'alice.johnson@example.com', name: 'Alice Johnson', pgy: 2 },
    { email: 'charlie.brown@example.com', name: 'Charlie Brown', pgy: 1 },
  ];

  for (const residentData of demoResidents) {
    const user = await prisma.user.upsert({
      where: { email: residentData.email },
      update: {},
      create: {
        id: `user-${residentData.email.split('@')[0]}`,
        email: residentData.email,
        name: residentData.name,
        password: hashedPassword,
        role: 'RESIDENT',
      },
    });

    const programYear = residentData.pgy === 1 ? pgy1 : residentData.pgy === 2 ? pgy2 : pgy3;
    const residentId = `res-${user.id}`;

    await prisma.resident.upsert({
      where: { id: residentId },
      update: {},
      create: {
        id: residentId,
        userId: user.id,
        programId: program.id,
        programYearId: programYear.id,
        employeeId: `EMP${Math.floor(Math.random() * 10000)}`,
        startDate: new Date('2024-07-01'),
        endDate: new Date('2027-06-30'),
        active: true,
      },
    });

    // Add to call pool
    await prisma.callPoolMember.create({
      data: {
        callPoolId: callPool.id,
        residentId: residentId,
        active: true,
      },
    }).catch(() => {});
  }
  console.log('✅ Created demo residents');

  // 10. Create Admin User
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: { password: hashedPassword },
    create: {
      id: 'user-admin',
      email: 'admin@example.com',
      name: 'Admin User',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });
  console.log('✅ Created admin user');

  // 11. Create Rule Set
  const ruleSet = await prisma.ruleSet.create({
    data: {
      id: 'rules-1',
      name: 'IM Residency Standard Rules',
      description: 'Standard scheduling rules for Internal Medicine',
      programId: program.id,
      active: true,
      priority: 1,
    },
  });
  console.log('✅ Created rule set');

  // 12. Create Constraint Definitions
  await prisma.constraintDefinition.createMany({
    data: [
      {
        ruleSetId: ruleSet.id,
        name: 'Max Shifts Per Week',
        type: 'hard',
        pluginType: 'max_shifts_per_period',
        parameters: { period: 'week', max: 5 },
        active: true,
      },
      {
        ruleSetId: ruleSet.id,
        name: 'Min Rest Between Shifts',
        type: 'hard',
        pluginType: 'min_rest_between',
        parameters: { hours: 8 },
        active: true,
      },
      {
        ruleSetId: ruleSet.id,
        name: 'No Consecutive Night Shifts',
        type: 'hard',
        pluginType: 'no_consecutive_nights',
        parameters: { max: 3 },
        active: true,
      },
    ],
  });
  console.log('✅ Created constraint definitions');

  // 13. Create Fairness Metrics
  await prisma.fairnessMetric.createMany({
    data: [
      {
        programId: program.id,
        name: 'Night Shifts',
        type: 'nights',
        shiftTypeId: nightShift.id,
        weight: 1.5,
        targetValue: 4.0,
        active: true,
      },
      {
        programId: program.id,
        name: 'Weekend Shifts',
        type: 'weekends',
        shiftTypeId: weekendShift.id,
        weight: 1.2,
        targetValue: 3.0,
        active: true,
      },
      {
        programId: program.id,
        name: 'Total Points',
        type: 'points',
        weight: 1.0,
        active: true,
      },
    ],
  });
  console.log('✅ Created fairness metrics');

  // 14. Create Holidays
  const holidays = [
    { name: 'New Year\'s Day', date: '2025-01-01' },
    { name: 'Independence Day', date: '2025-07-04' },
    { name: 'Thanksgiving', date: '2025-11-27' },
    { name: 'Christmas', date: '2025-12-25' },
  ];

  for (const holiday of holidays) {
    await prisma.holiday.upsert({
      where: { programId_date: { programId: program.id, date: new Date(holiday.date) } },
      update: {},
      create: {
        programId: program.id,
        name: holiday.name,
        date: new Date(holiday.date),
      },
    });
  }
  console.log('✅ Created holidays');

  // 15. Create sample shift templates with coverage requirements
  console.log('📋 Creating shift templates...');
  
  // Template 1: Night Call (Daily)
  const nightTemplate = await prisma.shiftTemplate.upsert({
    where: { id: 'tpl-night-1' },
    update: {},
    create: {
      id: 'tpl-night-1',
      programId: program.id,
      name: 'Night Call',
      shiftTypeId: nightShift.id,
      siteId: mainCampus.id,
      serviceId: internalMedicine.id,
      callPoolId: callPool.id,
      recurrencePattern: JSON.stringify({ type: 'daily', interval: 1 }),
      startTime: '17:00',
      endTime: '07:00',
      active: true,
    },
  });

  await prisma.coverageRequirement.upsert({
    where: { id: 'cr-night-1' },
    update: {},
    create: {
      id: 'cr-night-1',
      shiftTemplateId: nightTemplate.id,
      role: 'Primary',
      count: 1, // 1 resident per night
      priority: 1,
    },
  });

  // Template 2: Day Shift (Weekdays) - Multiple residents
  const dayTemplate = await prisma.shiftTemplate.upsert({
    where: { id: 'tpl-day-1' },
    update: {},
    create: {
      id: 'tpl-day-1',
      programId: program.id,
      name: 'Day Shift',
      shiftTypeId: dayShift.id,
      siteId: mainCampus.id,
      serviceId: internalMedicine.id,
      callPoolId: callPool.id,
      recurrencePattern: JSON.stringify({ type: 'weekly', days: [1, 2, 3, 4, 5], interval: 1 }), // Mon-Fri
      startTime: '07:00',
      endTime: '17:00',
      active: true,
    },
  });

  await prisma.coverageRequirement.createMany({
    data: [
      {
        id: 'cr-day-1',
        shiftTemplateId: dayTemplate.id,
        role: 'Primary',
        count: 2, // 2 residents per day
        priority: 1,
      },
      {
        id: 'cr-day-2',
        shiftTemplateId: dayTemplate.id,
        role: 'Backup',
        count: 1, // 1 backup resident
        priority: 2,
      },
    ],
  });

  // Template 3: Weekend Day Shift
  const weekendTemplate = await prisma.shiftTemplate.upsert({
    where: { id: 'tpl-weekend-1' },
    update: {},
    create: {
      id: 'tpl-weekend-1',
      programId: program.id,
      name: 'Weekend Day',
      shiftTypeId: weekendShift.id,
      siteId: mainCampus.id,
      serviceId: internalMedicine.id,
      callPoolId: callPool.id,
      recurrencePattern: JSON.stringify({ type: 'weekly', days: [0, 6], interval: 1 }), // Sat, Sun
      startTime: '08:00',
      endTime: '18:00',
      active: true,
    },
  });

  await prisma.coverageRequirement.upsert({
    where: { id: 'cr-weekend-1' },
    update: {},
    create: {
      id: 'cr-weekend-1',
      shiftTemplateId: weekendTemplate.id,
      role: 'Primary',
      count: 1,
      priority: 1,
    },
  });

  // Template 4: 24 Hour Call (Every 4th day for each resident)
  const call24Template = await prisma.shiftTemplate.upsert({
    where: { id: 'tpl-24h-1' },
    update: {},
    create: {
      id: 'tpl-24h-1',
      programId: program.id,
      name: '24 Hour Call',
      shiftTypeId: day24Shift.id,
      siteId: mainCampus.id,
      serviceId: emergencyMedicine.id,
      callPoolId: callPool.id,
      recurrencePattern: JSON.stringify({ type: 'daily', interval: 1 }),
      startTime: '07:00',
      endTime: '07:00',
      active: true,
    },
  });

  await prisma.coverageRequirement.upsert({
    where: { id: 'cr-24h-1' },
    update: {},
    create: {
      id: 'cr-24h-1',
      shiftTemplateId: call24Template.id,
      role: 'Primary',
      count: 1,
      priority: 1,
    },
  });

  console.log('✅ Created shift templates:');
  console.log('   - Night Call: Daily 17:00-07:00 (1 resident)');
  console.log('   - Day Shift: Mon-Fri 07:00-17:00 (2 residents + 1 backup)');
  console.log('   - Weekend Day: Sat-Sun 08:00-18:00 (1 resident)');
  console.log('   - 24 Hour Call: Daily 07:00-07:00 (1 resident)');

  console.log('\n🎉 Database seeding completed successfully!');
  console.log('\n📋 Demo Credentials:');
  console.log('   Admin: admin@example.com / demo123');
  console.log('   Residents: john.doe@example.com / demo123, etc.');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
