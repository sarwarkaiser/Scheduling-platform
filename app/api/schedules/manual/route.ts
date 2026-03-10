import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET - Fetch manual shifts for a program
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const programId = searchParams.get('programId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!programId) {
      return NextResponse.json({ error: 'programId required' }, { status: 400 });
    }

    const shifts = await prisma.shiftInstance.findMany({
      where: {
        shiftTemplate: {
          programId,
        },
        ...(startDate && endDate && {
          date: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        }),
      },
      include: {
        shiftTemplate: {
          include: {
            shiftType: true,
            site: true,
            service: true,
          },
        },
        assignments: {
          include: {
            resident: {
              include: {
                user: true,
              },
            },
          },
        },
      },
      orderBy: {
        date: 'asc',
      },
    });

    // Transform to manual shift format
    const manualShifts = shifts.map((shift) => ({
      id: shift.id,
      date: shift.date.toISOString().split('T')[0],
      startTime: shift.startTime.toISOString().split('T')[1].slice(0, 5),
      endTime: shift.endTime.toISOString().split('T')[1].slice(0, 5),
      shiftType: shift.shiftTemplate.shiftType,
      site: shift.shiftTemplate.site,
      service: shift.shiftTemplate.service,
      residents: shift.assignments.map((a) => ({
        id: a.residentId,
        name: a.resident?.user.name || 'Unknown',
      })),
      notes: shift.status, // Could use a dedicated notes field
      createdBy: 'system',
      createdAt: shift.createdAt.toISOString(),
    }));

    return NextResponse.json(manualShifts);
  } catch (error) {
    console.error('Failed to fetch manual shifts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create a new manual shift
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      programId,
      date,
      startTime,
      endTime,
      shiftTypeId,
      siteId,
      serviceId,
      residentIds,
      notes,
    } = body;

    // Validate required fields
    if (!programId || !date || !startTime || !endTime || !shiftTypeId || !siteId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!residentIds || residentIds.length === 0) {
      return NextResponse.json(
        { error: 'At least one resident must be assigned' },
        { status: 400 }
      );
    }

    // Create shift template for this manual shift (one-time occurrence)
    const template = await prisma.shiftTemplate.create({
      data: {
        programId,
        name: `Manual Shift - ${date}`,
        shiftTypeId,
        siteId,
        serviceId: serviceId || null,
        recurrencePattern: JSON.stringify({ type: 'once', date }),
        startTime,
        endTime,
        active: true,
      },
    });

    // Create shift instance
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);

    const instanceStart = new Date(`${date}T${startTime}:00`);
    let instanceEnd = new Date(`${date}T${endTime}:00`);

    // Handle overnight shifts
    if (instanceEnd < instanceStart) {
      instanceEnd.setDate(instanceEnd.getDate() + 1);
    }

    const shiftInstance = await prisma.shiftInstance.create({
      data: {
        shiftTemplateId: template.id,
        date: instanceStart,
        startTime: instanceStart,
        endTime: instanceEnd,
        siteId,
        status: 'published',
      },
    });

    // Create assignments for each resident
    const assignments = await Promise.all(
      residentIds.map((residentId: string) =>
        prisma.assignment.create({
          data: {
            shiftInstanceId: shiftInstance.id,
            residentId,
            siteId,
            role: 'Primary',
            status: 'assigned',
            assignedBy: session.user?.email || 'manual',
            assignedAt: new Date(),
          },
        })
      )
    );

    return NextResponse.json({
      id: shiftInstance.id,
      message: 'Manual shift created successfully',
      assignments: assignments.length,
    });
  } catch (error) {
    console.error('Failed to create manual shift:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Remove a manual shift
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const shiftId = searchParams.get('id');

    if (!shiftId) {
      return NextResponse.json({ error: 'Shift ID required' }, { status: 400 });
    }

    // Delete assignments first
    await prisma.assignment.deleteMany({
      where: {
        shiftInstanceId: shiftId,
      },
    });

    // Get the shift instance to find the template
    const shiftInstance = await prisma.shiftInstance.findUnique({
      where: { id: shiftId },
      select: { shiftTemplateId: true },
    });

    if (!shiftInstance) {
      return NextResponse.json({ error: 'Shift not found' }, { status: 404 });
    }

    // Delete the shift instance
    await prisma.shiftInstance.delete({
      where: { id: shiftId },
    });

    // Optionally delete the template if it was created for manual shift
    await prisma.shiftTemplate.delete({
      where: { id: shiftInstance.shiftTemplateId },
    });

    return NextResponse.json({ message: 'Shift deleted successfully' });
  } catch (error) {
    console.error('Failed to delete manual shift:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
