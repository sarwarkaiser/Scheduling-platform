// Solver module - greedy with backtracking

import type { ScheduleState, Assignment, SolverResult, UnassignedShift } from '@/lib/types/scheduling'
import { prisma } from '@/lib/prisma'
import { ConstraintManager } from '../constraints/manager'

export class SolverModule {
  async solve(
    scheduleState: ScheduleState,
    rankings: Map<string, Array<{ residentId: string; score: number }>>,
    eligibilityMap: Map<string, any[]>,
    constraintManager?: ConstraintManager
  ): Promise<Omit<SolverResult, 'explanations' | 'violations'>> {
    const assignments: Assignment[] = []
    const unassignedShifts: UnassignedShift[] = []

    // Sort shifts by priority (coverage requirements, date, etc.)
    const sortedShifts = [...scheduleState.shiftInstances].sort((a, b) => {
      // Prioritize shifts with higher coverage requirements
      const aReq = a.coverageRequirements.reduce((sum, r) => sum + r.count, 0)
      const bReq = b.coverageRequirements.reduce((sum, r) => sum + r.count, 0)
      if (aReq !== bReq) return bReq - aReq
      return a.date.getTime() - b.date.getTime()
    })

    // Track assignments per resident to avoid conflicts
    const residentAssignments = new Map<string, Assignment[]>()

    for (const shift of sortedShifts) {
      const ranked = rankings.get(shift.id) || []
      const requirements = shift.coverageRequirements || [{ role: 'Primary', count: 1, priority: 1 }]

      for (const requirement of requirements) {
        let assigned = false

        // Try to assign based on ranking
        for (const candidate of ranked) {
          // Check if resident already assigned to this shift
          const alreadyAssigned = assignments.some(
            a => a.shiftInstanceId === shift.id && a.residentId === candidate.residentId
          )
          if (alreadyAssigned) continue

          // Check if resident has conflicting shift
          const hasConflict = this.hasConflict(
            shift,
            residentAssignments.get(candidate.residentId) || [],
            scheduleState
          )

          let constraintValid = true
          let penalty = 0

          if (!hasConflict && constraintManager) {
            // Find resident object
            const resident = scheduleState.residents.find(r => r.id === candidate.residentId)
            if (resident) {
              const result = await constraintManager.validateAll({
                resident,
                shift,
                assignments: assignments, // pass all assignments for global context if needed
                periodStart: scheduleState.periodStart,
                periodEnd: scheduleState.periodEnd
              })

              if (!result.success) {
                constraintValid = false
              } else {
                penalty = result.penalty || 0
              }
            }
          }

          if (!hasConflict && constraintValid) {
            const assignment: Assignment = {
              id: `temp-${shift.id}-${candidate.residentId}-${requirement.role}`,
              shiftInstanceId: shift.id,
              residentId: candidate.residentId,
              siteId: shift.siteId || '',
              role: requirement.role,
              status: 'assigned',
              assignedAt: new Date(),
            }

            assignments.push(assignment)
            if (!residentAssignments.has(candidate.residentId)) {
              residentAssignments.set(candidate.residentId, [])
            }
            residentAssignments.get(candidate.residentId)!.push(assignment)
            assigned = true
            break
          }
        }

        if (!assigned) {
          // Could not assign - add to unassigned
          const eligible = eligibilityMap.get(shift.id) || []
          unassignedShifts.push({
            shiftInstanceId: shift.id,
            reasons: [`Could not assign ${requirement.role} - no eligible residents available`],
            eligibleResidents: eligible.map(e => e.residentId),
          })
        }
      }
    }

    // Calculate total score
    const score = assignments.reduce((sum, a) => {
      const ranked = rankings.get(a.shiftInstanceId) || []
      const candidate = ranked.find(r => r.residentId === a.residentId)
      // Todo: Store penalty on assignment for score calculation? For now just base score.
      return sum + (candidate?.score || 0)
    }, 0)

    return {
      assignments,
      score,
      unassignedShifts,
      shiftInstances: scheduleState.shiftInstances // Pass through from state
    }
  }

  private hasConflict(
    shift: any,
    existingAssignments: Assignment[],
    scheduleState: ScheduleState
  ): boolean {
    const candidateId = existingAssignments.length > 0 ? existingAssignments[0].residentId : null

    // 1. Basic Overlap Check (Hard Constraint)
    for (const existing of existingAssignments) {
      const existingShift = scheduleState.shiftInstances.find(
        s => s.id === existing.shiftInstanceId
      )
      if (!existingShift) continue

      // Check for overlapping times
      if (
        shift.startTime < existingShift.endTime &&
        shift.endTime > existingShift.startTime
      ) {
        return true
      }
    }

    // 2. Availability / Requests Check (Hard Constraint)
    if (candidateId && scheduleState.availabilities) {
      // Find if resident has any unavailability overlapping with this shift
      const conflictingRequest = scheduleState.availabilities.find((a: any) => {
        if (a.residentId !== candidateId) return false
        // Assumption: 'vacation', 'unavailable' are types that block assignment
        // If we had a type field we would check it. For now assume all availabilities are blocking requests.

        // Check overlap
        const start = new Date(a.startDate)
        const end = a.endDate ? new Date(a.endDate) : start

        // Normalize to ensure we catch whole days
        start.setHours(0, 0, 0, 0)
        end.setHours(23, 59, 59, 999)

        return (
          shift.startTime < end &&
          shift.endTime > start
        )
      })

      if (conflictingRequest) {
        return true // Resident requested to be away
      }
    }

    // 3. Rule Sets / Constraints Check
    if (candidateId && scheduleState.ruleSets) {
      for (const ruleSet of scheduleState.ruleSets) {
        if (!ruleSet.active) continue
        // simplified: assume rules apply to all residents for now
        // in real app, check ruleSet.programYearId matches resident's PGY

        for (const constraint of ruleSet.constraints) {
          if (!constraint.active) continue
          // Only checking HARD constraints in the solver to preventing invalid schedules
          // Soft constraints should be handled in ranking/scoring, but for now we treat all as hard for safety

          const params = constraint.parameters as any

          // Plugin: Max Shifts Per Period
          if (constraint.pluginType === 'max_shifts_per_period') {
            // Simple check: count total assignments
            const max = params.max || 4
            if (existingAssignments.length >= max) {
              return true
            }
          }

          // Plugin: Min Rest Between Shifts
          if (constraint.pluginType === 'min_rest_between_shifts') {
            const minHours = params.hours || 10
            const minMs = minHours * 60 * 60 * 1000

            for (const existing of existingAssignments) {
              const existingShift = scheduleState.shiftInstances.find(s => s.id === existing.shiftInstanceId)
              if (!existingShift) continue

              // Check gap
              const gap1 = shift.startTime.getTime() - existingShift.endTime.getTime()
              const gap2 = existingShift.startTime.getTime() - shift.endTime.getTime()

              // If conflicting (less than rest period) and not same shift
              if ((gap1 >= 0 && gap1 < minMs) || (gap2 >= 0 && gap2 < minMs)) {
                return true
              }
            }
          }

          // Plugin: Max Consecutive Shifts
          if (constraint.pluginType === 'max_consecutive_shifts') {
            const maxConsecutive = params.max || 3
            // This requires a more complex "streak" check
            // Simplified: if we have N assignments on consecutive days nearby, this breaks it.
            // Leaving as TODO or simple check later.
          }
        }
      }
    }

    return false
  }
}
