// Scheduling engine - main pipeline

import type { ScheduleState, SolverResult, EligibilityResult, Assignment } from '@/lib/types/scheduling'
import { prisma } from '@/lib/prisma'
import { EligibilityModule } from './eligibility'
import { RankingModule } from './ranking'
import { SolverModule } from './solver'
import { ExplanationModule } from './explanation'
import { ValidationModule } from './validation'

export interface ScheduleGenerationOptions {
  programId: string
  startDate: Date
  endDate: Date
  callPoolIds?: string[]
  siteIds?: string[]
}

export class SchedulingEngine {
  private eligibility: EligibilityModule
  private ranking: RankingModule
  private solver: SolverModule
  private explanation: ExplanationModule
  private validation: ValidationModule

  constructor() {
    this.eligibility = new EligibilityModule()
    this.ranking = new RankingModule()
    this.solver = new SolverModule()
    this.explanation = new ExplanationModule()
    this.validation = new ValidationModule()
  }

  async generateSchedule(options: ScheduleGenerationOptions): Promise<SolverResult> {
    // Step 1: Build demand (expand templates to shift instances)
    const shiftInstances = await this.buildDemand(options)

    // Step 2: Build eligibility sets
    const eligibilityMap = await this.buildEligibility(shiftInstances, options)

    // Step 3: Construct candidate ranking
    const rankings = await this.buildRankings(shiftInstances, eligibilityMap, options)

    // Step 4: Solve
    const scheduleState: ScheduleState = {
      assignments: [],
      shiftInstances,
      residents: [],
      periodStart: options.startDate,
      periodEnd: options.endDate,
    }

    const result = await this.solver.solve(scheduleState, rankings, eligibilityMap)

    // Step 5: Explain
    const explanations = await this.explanation.explain(result.assignments, scheduleState)

    // Step 6: Validate
    const violations = await this.validation.validate(result.assignments, scheduleState)

    return {
      ...result,
      explanations,
      violations,
    }
  }

  private async buildDemand(options: ScheduleGenerationOptions) {
    // Expand shift templates into shift instances for the time range
    const templates = await prisma.shiftTemplate.findMany({
      where: {
        programId: options.programId,
        active: true,
        ...(options.callPoolIds && { callPoolId: { in: options.callPoolIds } }),
        ...(options.siteIds && { siteId: { in: options.siteIds } }),
        AND: [
          {
            OR: [
              { startDate: null },
              { startDate: { lte: options.endDate } },
            ],
          },
          {
            OR: [
              { endDate: null },
              { endDate: { gte: options.startDate } },
            ],
          },
        ],
      },
      include: {
        coverageRequirements: true,
        shiftType: true,
      },
    })

    const shiftInstances = []

    for (const template of templates) {
      // Parse recurrence pattern (simplified - would need full RRULE parsing)
      const pattern = JSON.parse(template.recurrencePattern || '{}')
      const instances = this.expandTemplate(template, pattern, options.startDate, options.endDate)
      shiftInstances.push(...instances)
    }

    return shiftInstances
  }

  private expandTemplate(
    template: any,
    pattern: any,
    startDate: Date,
    endDate: Date
  ) {
    // Simplified expansion - in production would use proper recurrence library
    const instances = []
    const current = new Date(startDate)

    while (current <= endDate) {
      const [startHour, startMinute] = template.startTime.split(':').map(Number)
      const [endHour, endMinute] = template.endTime.split(':').map(Number)

      const instanceStart = new Date(current)
      instanceStart.setHours(startHour, startMinute, 0, 0)

      const instanceEnd = new Date(current)
      instanceEnd.setHours(endHour, endMinute, 0, 0)

      // Handle overnight shifts
      if (instanceEnd < instanceStart) {
        instanceEnd.setDate(instanceEnd.getDate() + 1)
      }

      instances.push({
        id: `temp-${template.id}-${current.toISOString()}`,
        shiftTemplateId: template.id,
        date: new Date(current),
        startTime: instanceStart,
        endTime: instanceEnd,
        siteId: template.siteId,
        status: 'draft' as const,
        coverageRequirements: template.coverageRequirements,
      })

      // Move to next occurrence based on pattern
      if (pattern.type === 'daily') {
        current.setDate(current.getDate() + (pattern.interval || 1))
      } else if (pattern.type === 'weekly') {
        current.setDate(current.getDate() + 7 * (pattern.interval || 1))
      } else {
        current.setDate(current.getDate() + 1) // Default daily
      }
    }

    return instances
  }

  private async buildEligibility(
    shiftInstances: any[],
    options: ScheduleGenerationOptions
  ): Promise<Map<string, EligibilityResult[]>> {
    const eligibilityMap = new Map<string, EligibilityResult[]>()

    for (const shift of shiftInstances) {
      const eligible = await this.eligibility.calculateEligibility(shift, options)
      eligibilityMap.set(shift.id, eligible)
    }

    return eligibilityMap
  }

  private async buildRankings(
    shiftInstances: any[],
    eligibilityMap: Map<string, EligibilityResult[]>,
    options: ScheduleGenerationOptions
  ) {
    // Build rankings for each shift
    const rankings = new Map<string, Array<{ residentId: string; score: number }>>()

    for (const shift of shiftInstances) {
      const eligible = eligibilityMap.get(shift.id) || []
      const ranked = await this.ranking.rankCandidates(shift, eligible, options)
      rankings.set(shift.id, ranked)
    }

    return rankings
  }
}
