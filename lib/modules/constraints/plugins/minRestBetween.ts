// Minimum rest between shifts constraint

import { BaseConstraint } from '../base'
import type { ConstraintContext, ConstraintResult } from '@/lib/types/constraints'
import { differenceInHours } from 'date-fns'

export class MinRestBetweenShiftsConstraint extends BaseConstraint {
  id = 'min_rest_between'
  name = 'Minimum Rest Between Shifts'
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

    const minRestHours =
      (parameters.minRestHours as number | undefined) ||
      (parameters.hours as number | undefined) ||
      12

    const residentAssignments = scheduleState.assignments
      .filter(a => a.residentId === residentId)
      .map(a => {
        const shift = scheduleState.shiftInstances.find(s => s.id === a.shiftInstanceId)
        return shift ? { assignment: a, shift } : null
      })
      .filter((s): s is NonNullable<typeof s> => s !== null)
      .sort((a, b) => a.shift.startTime.getTime() - b.shift.startTime.getTime())

    // Check consecutive shifts
    for (let i = 0; i < residentAssignments.length - 1; i++) {
      const current = residentAssignments[i]
      const next = residentAssignments[i + 1]

      const restHours = differenceInHours(next.shift.startTime, current.shift.endTime)

      if (restHours < minRestHours) {
        return {
          violated: true,
          severity: 1.0,
          message: `Insufficient rest: ${restHours} hours between shifts (minimum: ${minRestHours} hours)`,
          metadata: {
            restHours,
            minRestHours,
            currentShiftEnd: current.shift.endTime.toISOString(),
            nextShiftStart: next.shift.startTime.toISOString(),
          },
        }
      }
    }

    return {
      violated: false,
      severity: 0,
      message: 'Sufficient rest between shifts',
    }
  }

  explain(result: ConstraintResult): string {
    if (result.violated) {
      return result.message
    }
    return 'Resident has sufficient rest between all shifts'
  }
}
