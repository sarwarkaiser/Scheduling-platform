// Max Nights Per Month Constraint

import { BaseConstraint, ConstraintContext, ConstraintResult } from '../types'

export class MaxNightsPerMonthPlugin extends BaseConstraint {
  id = 'max_nights_per_month'
  name = 'Maximum Nights Per Month'
  defaultConfig = {
    maxNights: 8,
  }

  async validate(context: ConstraintContext, config: any): Promise<ConstraintResult> {
    const { resident, shift, assignments } = context
    const { maxNights } = config

    // Count night shifts in the same month
    const shiftMonth = new Date(shift.date).getMonth()
    const shiftYear = new Date(shift.date).getFullYear()

    const nightsInMonth = assignments.filter(a => {
      const aDate = new Date(a.shiftInstance.date)
      if (aDate.getMonth() !== shiftMonth || aDate.getFullYear() !== shiftYear) return false
      
      // Check if it's a night shift (starts afternoon/evening, ends morning)
      const startHour = a.shiftInstance.startTime.getHours()
      const endHour = a.shiftInstance.endTime.getHours()
      return startHour >= 16 || endHour <= 8 // Starts after 4pm or ends before 8am
    }).length

    // Check if proposed shift is a night shift
    const proposedStartHour = shift.startTime.getHours()
    const proposedEndHour = shift.endTime.getHours()
    const isNightShift = proposedStartHour >= 16 || proposedEndHour <= 8

    if (isNightShift && nightsInMonth >= maxNights) {
      return {
        success: false,
        reason: `Maximum ${maxNights} night shifts per month already reached (${nightsInMonth} assigned)`,
      }
    }

    return { success: true }
  }
}
