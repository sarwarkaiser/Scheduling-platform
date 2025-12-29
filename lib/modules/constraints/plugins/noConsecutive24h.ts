// No consecutive 24h shifts constraint

import { BaseConstraint } from '../base'
import type { ConstraintContext, ConstraintResult } from '@/lib/types/constraints'
import { differenceInDays, differenceInHours } from 'date-fns'

export class NoConsecutive24hConstraint extends BaseConstraint {
  id = 'no_consecutive_24h'
  name = 'No Consecutive 24h Shifts'
  type = 'hard' as const

  evaluate(context: ConstraintContext): ConstraintResult {
    const { scheduleState, residentId } = context

    if (!residentId) {
      return {
        violated: false,
        severity: 0,
        message: 'No resident specified',
      }
    }

    // This would need shift type information to identify 24h shifts
    // For now, we'll check for shifts that span ~24 hours
    const residentAssignments = scheduleState.assignments
      .filter(a => a.residentId === residentId)
      .map(a => {
        const shift = scheduleState.shiftInstances.find(s => s.id === a.shiftInstanceId)
        return shift ? { assignment: a, shift } : null
      })
      .filter((s): s is NonNullable<typeof s> => s !== null)
      .sort((a, b) => a.shift.startTime.getTime() - b.shift.startTime.getTime())

    // Check for consecutive 24h shifts (shifts on consecutive days)
    for (let i = 0; i < residentAssignments.length - 1; i++) {
      const current = residentAssignments[i]
      const next = residentAssignments[i + 1]

      const daysBetween = differenceInDays(next.shift.date, current.shift.date)

      // If shifts are on consecutive days and each is ~24 hours
      const currentDuration = differenceInHours(current.shift.endTime, current.shift.startTime)
      const nextDuration = differenceInHours(next.shift.endTime, next.shift.startTime)

      if (daysBetween === 1 && currentDuration >= 20 && nextDuration >= 20) {
        return {
          violated: true,
          severity: 1.0,
          message: 'Consecutive 24-hour shifts are not allowed',
          metadata: {
            currentShiftDate: current.shift.date.toISOString(),
            nextShiftDate: next.shift.date.toISOString(),
            currentDuration,
            nextDuration,
          },
        }
      }
    }

    return {
      violated: false,
      severity: 0,
      message: 'No consecutive 24h shifts',
    }
  }

  explain(result: ConstraintResult): string {
    if (result.violated) {
      return result.message
    }
    return 'No consecutive 24-hour shifts detected'
  }
}
