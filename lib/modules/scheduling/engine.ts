// Scheduling engine - main pipeline

import type { ScheduleState, SolverResult, EligibilityResult, Assignment } from '@/lib/types/scheduling'
import { prisma } from '@/lib/prisma'
import { RRule } from 'rrule'
import { EligibilityModule } from './eligibility'
import { RankingModule } from './ranking'
import { SolverModule } from './solver'
import { ExplanationModule } from './explanation'
import { ValidationModule } from './validation'
import { ConstraintManager } from '../constraints/manager'
import { MaxConsecutiveShiftsPlugin } from '../constraints/plugins/max-consecutive'

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
  public constraints: ConstraintManager // Exposed for configuration

  constructor() {
    this.eligibility = new EligibilityModule()
    this.ranking = new RankingModule()
    this.solver = new SolverModule() // Solver will need access to constraints
    this.explanation = new ExplanationModule()
    this.validation = new ValidationModule()
    this.constraints = new ConstraintManager()

    // Register default plugins
    this.constraints.register(MaxConsecutiveShiftsPlugin)
  }

  async generateSchedule(options: ScheduleGenerationOptions): Promise<SolverResult> {
    // Step 1: Build demand (expand templates to shift instances)
    const shiftInstances = await this.buildDemand(options)

    // Step 1.5: Pre-fetch Residents (Fix N+1)
    const residents = await prisma.resident.findMany({
      where: {
        programId: options.programId,
        active: true,
      },
      include: {
        callPools: {
          include: {
            callPool: true,
          },
        },
        rotationBlocks: true,
        availabilities: true,
      },
    })

    // Step 2: Build eligibility sets
    const eligibilityMap = await this.buildEligibility(shiftInstances, residents, options)

    // Step 2.5: Fetch Rules and Requests (Already done, but residents now available)
    const ruleSets = await prisma.ruleSet.findMany({
      where: {
        programId: options.programId,
        active: true,
      },
      include: {
        constraints: {
          where: { active: true },
        },
      },
    })

    const availabilities = await prisma.availability.findMany({
      where: {
        resident: { programId: options.programId },
        OR: [
          { startDate: { gte: options.startDate, lte: options.endDate } },
          { endDate: { gte: options.startDate, lte: options.endDate } },
        ],
      },
    })

    // Step 3: Construct candidate ranking
    const rankings = await this.buildRankings(shiftInstances, eligibilityMap, options)

    // Step 4: Solve
    const scheduleState: ScheduleState = {
      assignments: [],
      shiftInstances,
      residents: residents as any, // Use the fetched residents (cast to avoid strict null vs undefined mismatch on programYearId)
      periodStart: options.startDate,
      periodEnd: options.endDate,
      ruleSets,
      availabilities,
    }

    const result = await this.solver.solve(scheduleState, rankings, eligibilityMap, this.constraints)

    // Step 5: Explain
    const explanations = await this.explanation.explain(result.assignments, scheduleState)

    // Step 6: Validate
    const violations = await this.validation.validate(result.assignments, scheduleState)

    return {
      ...result,
      explanations,
      violations,
      shiftInstances: scheduleState.shiftInstances,
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
    const instances = []

    // Convert simplified JSON pattern to RRule options or string
    let rule: RRule

    try {
      if (typeof pattern === 'string' && pattern.startsWith('RRULE:')) {
        // Handle raw RRULE string
        rule = RRule.fromString(pattern)
      } else {
        // Handle legacy JSON object from seed
        // Mapping: 'daily' -> RRule.DAILY (3), 'weekly' -> RRule.WEEKLY (2)
        const freqMap: Record<string, any> = {
          'daily': RRule.DAILY,
          'weekly': RRule.WEEKLY,
          'monthly': RRule.MONTHLY
        }

        const freq = freqMap[pattern.type] || RRule.DAILY

        rule = new RRule({
          freq,
          interval: pattern.interval || 1,
          dtstart: new Date(startDate), // Start generating from window start? Or template start?
          // Ideally dtstart should be the template's *original* start date if strictly recurring, 
          // but for this MVP we can align with the window or the template's startDate logic if available.
          // For now, let's use the requested startDate to ensure we cover the window.
          // Better: Use startDate of the generation window, but be careful with alignment.
          // Simple approach: Generate from startDate to endDate
          until: new Date(endDate)
        })
      }

      // Get all occurrences in range
      // Note: RRule.between(start, end) is exclusive of end? check docs. 
      // We want inclusive usually.
      const dates = rule.between(new Date(startDate), new Date(endDate), true)

      for (const date of dates) {
        const [startHour, startMinute] = template.startTime.split(':').map(Number)
        const [endHour, endMinute] = template.endTime.split(':').map(Number)

        const instanceStart = new Date(date)
        instanceStart.setHours(startHour, startMinute, 0, 0)

        const instanceEnd = new Date(date)
        instanceEnd.setHours(endHour, endMinute, 0, 0)

        // Handle overnight shifts
        if (instanceEnd < instanceStart) {
          instanceEnd.setDate(instanceEnd.getDate() + 1)
        }

        instances.push({
          id: `temp-${template.id}-${instanceStart.toISOString()}`,
          shiftTemplateId: template.id,
          date: new Date(instanceStart),
          startTime: instanceStart,
          endTime: instanceEnd,
          siteId: template.siteId,
          status: 'draft' as const,
          coverageRequirements: template.coverageRequirements,
        })
      }
    } catch (e) {
      console.error(`Failed to expand template ${template.id}:`, e)
    }

    return instances
  }

  private async buildEligibility(
    shiftInstances: any[],
    residents: any[],
    options: ScheduleGenerationOptions
  ): Promise<Map<string, EligibilityResult[]>> {
    const eligibilityMap = new Map<string, EligibilityResult[]>()

    for (const shift of shiftInstances) {
      const eligible = await this.eligibility.calculateEligibility(shift, residents, options)
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
