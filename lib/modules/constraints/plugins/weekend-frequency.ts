// Weekend Frequency Constraint (Soft)

import { BaseConstraint, ConstraintContext, ConstraintResult } from '../types'

export class WeekendFrequencyPlugin extends BaseConstraint {
  id = 'weekend_frequency'
  name = 'Weekend Frequency'
  defaultConfig = {
    maxWeekends: 3,
    period: 'month',
  }

  async validate(context: ConstraintContext, config: any): Promise<ConstraintResult> {
    const { resident, shift, assignments } = context
    const { maxWeekends, period } = config

    const shiftDate = new Date(shift.date)
    const dayOfWeek = shiftDate.getDay()
    
    // Check if this is a weekend shift (Saturday=6, Sunday=0)
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6

    if (!isWeekend) {
      return { success: true }
    }

    // Calculate period
    const periodStart = new Date(shiftDate)
    if (period === 'month') {
      periodStart.setDate(1)
      periodStart.setHours(0, 0, 0, 0)
    } else if (period === 'week') {
      periodStart.setDate(periodStart.getDate() - dayOfWeek)
      periodStart.setHours(0, 0, 0, 0)
    }

    // Count weekend shifts in period
    const weekendShiftsInPeriod = assignments.filter(a => {
      const aDate = new Date(a.shiftInstance.date)
      if (aDate < periodStart || aDate > shiftDate) return false
      
      const aDay = aDate.getDay()
      return aDay === 0 || aDay === 6
    }).length

    if (weekendShiftsInPeriod >= maxWeekends) {
      return {
        success: false,
        penalty: 2.0, // Soft constraint - add penalty
        reason: `Exceeds maximum ${maxWeekends} weekends per ${period} (${weekendShiftsInPeriod} assigned)`,
      }
    }

    return { success: true }
  }
}
