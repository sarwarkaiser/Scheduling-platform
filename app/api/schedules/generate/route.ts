// API route for schedule generation

import { NextRequest, NextResponse } from 'next/server'
import { SchedulingEngine } from '@/lib/modules/scheduling/engine'
import { enqueueScheduleGeneration } from '@/lib/modules/jobs/scheduler'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { programId, startDate, endDate, callPoolIds, siteIds, userId, async = false } = body

    if (!programId || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required fields: programId, startDate, endDate' },
        { status: 400 }
      )
    }

    if (async) {
      // Enqueue as background job
      const job = await enqueueScheduleGeneration({
        programId,
        startDate,
        endDate,
        callPoolIds,
        siteIds,
        userId: userId || 'system',
      })

      return NextResponse.json({
        jobId: job.id,
        status: 'queued',
        message: 'Schedule generation queued',
      })
    } else {
      // Generate synchronously (for small schedules)
      const engine = new SchedulingEngine()
      const result = await engine.generateSchedule({
        programId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        callPoolIds,
        siteIds,
      })

      return NextResponse.json({
        status: 'completed',
        result: {
          assignments: result.assignments.length,
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
