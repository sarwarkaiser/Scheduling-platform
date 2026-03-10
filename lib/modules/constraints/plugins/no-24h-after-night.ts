// No 24h Call After Night Shift

import { BaseConstraint, ConstraintContext, ConstraintResult } from '../types'

export class No24hAfterNightPlugin extends BaseConstraint {
  id = 'no_24h_after_night'
  name = 'No 24 Hour Call After Night Shift'
  defaultConfig = {}

  async validate(context: ConstraintContext, config: any): Promise<ConstraintResult> {
    const { resident, shift, assignments } = context

    // Check if proposed shift is a 24h call
    const proposedDuration = (shift.endTime.getTime() - shift.startTime.getTime()) / (1000 * 60 * 60)
    const is24hShift = proposedDuration >= 23 // ~24 hours

    if (!is24hShift) {
      return { success: true }
    }

    // Check for night shifts in the previous 24 hours
    const proposedStart = new Date(shift.startTime)
    const previousDayStart = new Date(proposedStart)
    previousDayStart.setDate(previousDayStart.getDate() - 1)
    previousDayStart.setHours(16, 0, 0, 0) // 4pm previous day

    const previousDayEnd = new Date(proposedStart)
    previousDayEnd.setHours(23, 59, 59, 999)

    const hasNightShiftBefore = assignments.some(a => {
      const aStart = new Date(a.shiftInstance.startTime)
      const aEnd = new Date(a.shiftInstance.endTime)
      
      // Check if previous shift was a night shift (started evening, ended morning)
      const wasNight = aStart.getHours() >= 16 || aEnd.getHours() <= 8
      
      // Check if it was the day before
      const isPreviousDay = aStart >= previousDayStart && aStart <= previousDayEnd
      
      return wasNight && isPreviousDay
    })

    if (hasNightShiftBefore) {
      return {
        success: false,
        reason: 'Cannot schedule 24h call the day after a night shift',
      }
    }

    return { success: true }
  }
}
