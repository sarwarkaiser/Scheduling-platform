// Max Hours Per Week Constraint (ACGME 80-hour rule)

import { BaseConstraint, ConstraintContext, ConstraintResult } from '../types'

export class MaxHoursPerWeekPlugin extends BaseConstraint {
  id = 'max_hours_per_week'
  name = 'Maximum Hours Per Week'
  defaultConfig = {
    maxHours: 80,
    averagingPeriod: 4, // weeks
  }

  async validate(context: ConstraintContext, config: any): Promise<ConstraintResult> {
    const { resident, shift, assignments, periodStart, periodEnd } = context
    const { maxHours, averagingPeriod } = config

    // Calculate total hours in the averaging period
    const now = new Date(shift.date)
    const periodStartCalc = new Date(now)
    periodStartCalc.setDate(periodStartCalc.getDate() - (averagingPeriod * 7))

    const shiftsInPeriod = assignments.filter(a => {
      const shiftDate = new Date(a.shiftInstance.date)
      return shiftDate >= periodStartCalc && shiftDate <= now
    })

    // Calculate total hours (approximate from shift duration)
    const totalHours = shiftsInPeriod.reduce((sum, a) => {
      const duration = (a.shiftInstance.endTime.getTime() - a.shiftInstance.startTime.getTime()) / (1000 * 60 * 60)
      return sum + duration
    }, 0)

    // Calculate proposed shift hours
    const proposedDuration = (shift.endTime.getTime() - shift.startTime.getTime()) / (1000 * 60 * 60)
    const newTotal = totalHours + proposedDuration

    if (newTotal > maxHours) {
      return {
        success: false,
        reason: `Adding this shift would exceed ${maxHours} hours/week (averaged over ${averagingPeriod} weeks). Current: ${totalHours.toFixed(1)}h, Proposed: ${newTotal.toFixed(1)}h`,
      }
    }

    return { success: true }
  }
}
