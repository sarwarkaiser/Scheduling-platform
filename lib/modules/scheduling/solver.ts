// Solver module - greedy with backtracking

import type { ScheduleState, Assignment, SolverResult, UnassignedShift } from '@/lib/types/scheduling'
import { prisma } from '@/lib/prisma'

export class SolverModule {
  async solve(
    scheduleState: ScheduleState,
    rankings: Map<string, Array<{ residentId: string; score: number }>>,
    eligibilityMap: Map<string, any[]>
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

          if (!hasConflict) {
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
      return sum + (candidate?.score || 0)
    }, 0)

    return {
      assignments,
      score,
      unassignedShifts,
    }
  }

  private hasConflict(
    shift: any,
    existingAssignments: Assignment[],
    scheduleState: ScheduleState
  ): boolean {
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

      // Check for same day (if not allowed)
      const shiftDate = new Date(shift.date)
      const existingDate = new Date(existingShift.date)
      if (
        shiftDate.toDateString() === existingDate.toDateString() &&
        shift.id !== existingShift.id
      ) {
        return true
      }
    }

    return false
  }
}
