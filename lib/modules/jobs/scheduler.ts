// Background job system for schedule generation

import { Queue, Worker } from 'bullmq'
import { SchedulingEngine } from '../scheduling/engine'
import { prisma } from '@/lib/prisma'
import { auditLogger } from '../audit/logger'

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
}

export const scheduleQueue = new Queue('schedule-generation', { connection })

export interface ScheduleGenerationJob {
  programId: string
  startDate: string
  endDate: string
  callPoolIds?: string[]
  siteIds?: string[]
  userId: string
}

// Worker to process schedule generation jobs
export const scheduleWorker = new Worker(
  'schedule-generation',
  async (job) => {
    const { programId, startDate, endDate, callPoolIds, siteIds, userId } = job.data as ScheduleGenerationJob

    const engine = new SchedulingEngine()

    const result = await engine.generateSchedule({
      programId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      callPoolIds,
      siteIds,
    })

    // Save shift instances and assignments to database
    for (const shiftInstance of result.assignments.map(a => {
      // Find the shift instance
      return result.assignments.find(ass => ass.shiftInstanceId === a.shiftInstanceId)
    })) {
      // This is simplified - would need to properly save shift instances first
    }

    // Log audit
    await auditLogger.log({
      userId,
      action: 'generate_schedule',
      entityType: 'Schedule',
      entityId: programId,
      metadata: {
        startDate,
        endDate,
        assignmentsCount: result.assignments.length,
        violationsCount: result.violations.length,
      },
    })

    return result
  },
  { connection }
)

// Helper to enqueue schedule generation
export async function enqueueScheduleGeneration(job: ScheduleGenerationJob) {
  return scheduleQueue.add('generate', job, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  })
}
