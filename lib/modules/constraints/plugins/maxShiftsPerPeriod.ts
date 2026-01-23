// Max shifts per period constraint

import { BaseConstraint } from '../base'
import type { ConstraintContext, ConstraintResult } from '@/lib/types/constraints'
import { differenceInDays } from 'date-fns'

export class MaxShiftsPerPeriodConstraint extends BaseConstraint {
  id = 'max_shifts_per_period'
  name = 'Max Shifts Per Period'
  type = 'hard' as const

  evaluate(context: ConstraintContext): ConstraintResult {
    const { scheduleState, residentId, parameters } = context

    if (!residentId) {
      return {
        violated: false,
        severity: 0,
        message: 'No resident specified',
      }
    }

    const periodAlias = (parameters.period as string | undefined)?.toLowerCase()
    const periodDays =
      (parameters.periodDays as number | undefined) ||
      (periodAlias === 'month' ? 30 : periodAlias === 'week' ? 7 : undefined) ||
      7
    const maxShifts = (parameters.maxShifts as number | undefined) || (parameters.max as number | undefined) || 5

    // Count shifts for this resident in the period
    const residentAssignments = scheduleState.assignments.filter(
      a => a.residentId === residentId
    )

    // Group by period windows
    const violations: ConstraintResult[] = []

    for (const assignment of residentAssignments) {
      const shiftInstance = scheduleState.shiftInstances.find(
        s => s.id === assignment.shiftInstanceId
      )
      if (!shiftInstance) continue

      const periodStart = new Date(shiftInstance.date)
      periodStart.setDate(periodStart.getDate() - periodDays)

      const shiftsInPeriod = residentAssignments.filter(a => {
        const shift = scheduleState.shiftInstances.find(s => s.id === a.shiftInstanceId)
        if (!shift) return false
        const shiftDate = new Date(shift.date)
        return shiftDate >= periodStart && shiftDate <= shiftInstance.date
      }).length

      if (shiftsInPeriod > maxShifts) {
        violations.push({
          violated: true,
          severity: 1.0,
          message: `Resident has ${shiftsInPeriod} shifts in ${periodDays} days, exceeding maximum of ${maxShifts}`,
          metadata: {
            periodDays,
            maxShifts,
            actualShifts: shiftsInPeriod,
            periodStart: periodStart.toISOString(),
            periodEnd: shiftInstance.date.toISOString(),
          },
        })
      }
    }

    if (violations.length > 0) {
      return violations[0] // Return first violation
    }

    return {
      violated: false,
      severity: 0,
      message: 'Within shift limits',
    }
  }

  explain(result: ConstraintResult): string {
    if (result.violated) {
      return result.message
    }
    return 'Resident is within shift limits for the period'
  }
}
