// Min Days Off Per Week Constraint

import { BaseConstraint, ConstraintContext, ConstraintResult } from '../types'

export class MinDaysOffPerWeekPlugin extends BaseConstraint {
  id = 'min_days_off_per_week'
  name = 'Minimum Days Off Per Week'
  defaultConfig = {
    minDays: 1,
  }

  async validate(context: ConstraintContext, config: any): Promise<ConstraintResult> {
    const { resident, shift, assignments } = context
    const { minDays } = config

    // Get the week of the proposed shift
    const proposedDate = new Date(shift.date)
    const dayOfWeek = proposedDate.getDay() // 0 = Sunday
    const weekStart = new Date(proposedDate)
    weekStart.setDate(weekStart.getDate() - dayOfWeek) // Start of week (Sunday)
    weekStart.setHours(0, 0, 0, 0)
    
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 6) // End of week (Saturday)
    weekEnd.setHours(23, 59, 59, 999)

    // Count days with shifts in this week
    const daysWithShifts = new Set<string>()
    
    assignments.forEach(a => {
      const aDate = new Date(a.shiftInstance.date)
      if (aDate >= weekStart && aDate <= weekEnd) {
        daysWithShifts.add(aDate.toDateString())
      }
    })

    // Add proposed shift
    daysWithShifts.add(proposedDate.toDateString())

    const daysWorking = daysWithShifts.size
    const daysOff = 7 - daysWorking

    if (daysOff < minDays) {
      return {
        success: false,
        reason: `Minimum ${minDays} day(s) off per week required. This would leave only ${daysOff} day(s) off`,
      }
    }

    return { success: true }
  }
}
