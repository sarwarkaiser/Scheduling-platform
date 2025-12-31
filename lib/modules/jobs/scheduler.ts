// Background job system for schedule generation

import { scheduleQueue, SCHEDULE_QUEUE_NAME } from '@/lib/queues/schedules'

export interface ScheduleGenerationJob {
  programId: string
  startDate: string
  endDate: string
  callPoolIds?: string[]
  siteIds?: string[]
  userId: string
}

// Helper to enqueue schedule generation
export async function enqueueScheduleGeneration(job: ScheduleGenerationJob) {
  return scheduleQueue.add('generate', job)
}
