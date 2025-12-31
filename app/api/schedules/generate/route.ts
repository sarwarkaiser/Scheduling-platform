import { NextRequest, NextResponse } from 'next/server'
import { SchedulingEngine } from '@/lib/modules/scheduling/engine'
import { enqueueScheduleGeneration } from '@/lib/modules/jobs/scheduler'
import { prisma } from '@/lib/prisma'
import { validateBody, handleAPIError } from '@/lib/api-handler'
import { generateScheduleSchema } from '@/lib/schemas'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('API Input:', body)

    // Validate Input
    const options = validateBody(generateScheduleSchema, body)
    const { programId, startDate, endDate, callPoolIds, siteIds, async = false } = options
    // Note: userId is not in the schema yet, might need to add it or extract from session

    if (async) {
      // Enqueue as background job
      const job = await enqueueScheduleGeneration({
        programId,
        startDate,
        endDate,
        callPoolIds,
        siteIds,
        userId: 'system', // TODO: Get from auth
      })

      return NextResponse.json({
        jobId: job.id,
        status: 'queued',
        message: 'Schedule generation queued',
      })
    } else {
      console.log('Starting synchronous generation with options:', {
        programId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        callPoolIds,
        siteIds,
      })

      const engine = new SchedulingEngine()
      const result = await engine.generateSchedule({
        programId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        callPoolIds,
        siteIds,
      })

      console.log('Engine Result:', {
        assignmentsCount: result.assignments.length,
        shiftInstancesCount: result.shiftInstances.length,
        violationsCount: result.violations.length
      })

      // PERSIST RESULTS
      // 1. Clear existing assignments for this program/period
      await prisma.assignment.deleteMany({
        where: {
          shiftInstance: {
            shiftTemplate: { programId },
            date: {
              gte: new Date(startDate),
              lte: new Date(endDate),
            },
          },
        },
      })

      // 2. Save new assignments & shift instances
      // Map temporary IDs to DB IDs
      const shiftInstanceIdMap = new Map<string, string>()

      // First, save all shift instances
      // The engine result now includes shiftInstances
      const instancesToSave = result.shiftInstances || []

      for (const si of instancesToSave) {
        const createdSi = await prisma.shiftInstance.upsert({
          where: {
            shiftTemplateId_date: {
              shiftTemplateId: si.shiftTemplateId,
              date: new Date(si.date)
            }
          },
          update: {
            startTime: new Date(si.startTime),
            endTime: new Date(si.endTime),
            siteId: si.siteId,
          },
          create: {
            shiftTemplateId: si.shiftTemplateId,
            date: new Date(si.date),
            startTime: new Date(si.startTime),
            endTime: new Date(si.endTime),
            siteId: si.siteId,
            status: 'PUBLISHED',
          }
        })
        shiftInstanceIdMap.set(si.id, createdSi.id)
      }

      const savedAssignments = []

      for (const assignment of result.assignments) {
        const dbShiftInstanceId = shiftInstanceIdMap.get(assignment.shiftInstanceId)

        if (!dbShiftInstanceId) {
          console.warn(`Could not find DB ID for shift instance ${assignment.shiftInstanceId}`)
          continue
        }

        const saved = await prisma.assignment.create({
          data: {
            shiftInstanceId: dbShiftInstanceId,
            residentId: assignment.residentId,
            status: 'ASSIGNED',
            role: assignment.role || 'Primary',
            siteId: assignment.siteId,
            assignedAt: new Date(),
            assignedBy: 'system',
          }
        })
        savedAssignments.push(saved)
      }

      return NextResponse.json({
        status: 'completed',
        result: {
          assignments: savedAssignments.length,
          violations: result.violations.length,
          unassignedShifts: result.unassignedShifts.length,
          score: result.score,
        },
      })
    }
  } catch (error) {
    console.error('Schedule generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate schedule', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
