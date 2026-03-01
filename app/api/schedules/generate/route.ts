import { NextRequest, NextResponse } from 'next/server'
import { SchedulingEngine } from '@/lib/modules/scheduling/engine'
import { enqueueScheduleGeneration } from '@/lib/modules/jobs/scheduler'
import { prisma } from '@/lib/prisma'
import { APIError, validateBody, handleAPIError } from '@/lib/api-handler'
import { generateScheduleSchema } from '@/lib/schemas'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('API Input:', body)

    // Validate Input
    const options = validateBody(generateScheduleSchema, body)
    const { programId, startDate, endDate, callPoolIds, siteIds, async = false } = options
    // Note: userId is not in the schema yet, might need to add it or extract from session

    const normalizedStart = new Date(startDate)
    const normalizedEnd = new Date(endDate)

    if (Number.isNaN(normalizedStart.getTime()) || Number.isNaN(normalizedEnd.getTime())) {
      throw new APIError('Invalid startDate or endDate', 400, 'INVALID_DATE')
    }

    normalizedStart.setHours(0, 0, 0, 0)
    normalizedEnd.setHours(23, 59, 59, 999)

    if (normalizedStart > normalizedEnd) {
      throw new APIError('startDate must be on or before endDate', 400, 'INVALID_RANGE')
    }

    if (async) {
      const missingSiteTemplates = await prisma.shiftTemplate.findMany({
        where: {
          programId,
          active: true,
          siteId: null,
          ...(callPoolIds && { callPoolId: { in: callPoolIds } }),
          ...(siteIds && { siteId: { in: siteIds } }),
          AND: [
            {
              OR: [
                { startDate: null },
                { startDate: { lte: normalizedEnd } },
              ],
            },
            {
              OR: [
                { endDate: null },
                { endDate: { gte: normalizedStart } },
              ],
            },
          ],
        },
        select: { id: true, name: true },
      })

      if (missingSiteTemplates.length > 0) {
        throw new APIError(
          'One or more shift templates are missing a site. Please assign a site to every template before generating schedules.',
          400,
          'MISSING_SITE',
          { templates: missingSiteTemplates }
        )
      }

      // Enqueue as background job
      const job = await enqueueScheduleGeneration({
        programId,
        startDate: normalizedStart.toISOString(),
        endDate: normalizedEnd.toISOString(),
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
        startDate: normalizedStart,
        endDate: normalizedEnd,
        callPoolIds,
        siteIds,
      })

      const engine = new SchedulingEngine()
      const result = await engine.generateSchedule({
        programId,
        startDate: normalizedStart,
        endDate: normalizedEnd,
        callPoolIds,
        siteIds,
      })

      console.log('Engine Result:', {
        assignmentsCount: result.assignments.length,
        shiftInstancesCount: result.shiftInstances.length,
        violationsCount: result.violations.length
      })

      // If any shift instances have null siteId, fall back to the program's first site
      const missingSiteInstances = (result.shiftInstances || []).filter(si => !si.siteId)
      if (missingSiteInstances.length > 0) {
        const fallbackSite = await prisma.site.findFirst({
          where: { organization: { programs: { some: { id: programId } } } },
          select: { id: true },
        })
        if (!fallbackSite) {
          throw new APIError(
            'No site configured for this program. Please create a site first.',
            400,
            'MISSING_SITE'
          )
        }
        for (const si of missingSiteInstances) {
          si.siteId = fallbackSite.id
        }
        // Also apply fallback to assignments missing siteId
        for (const a of result.assignments) {
          if (!a.siteId) a.siteId = fallbackSite.id
        }
      }

      // PERSIST RESULTS
      // 1. Clear existing assignments for this program/period
      await prisma.assignment.deleteMany({
        where: {
          shiftInstance: {
            shiftTemplate: { programId },
            date: {
              gte: normalizedStart,
              lte: normalizedEnd,
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
    return handleAPIError(error)
  }
}
