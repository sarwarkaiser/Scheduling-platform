// Post-Call Protection Constraint (Canadian 14-hour rule)

import { BaseConstraint, ConstraintContext, ConstraintResult } from '../types'

export class PostCallProtectionPlugin extends BaseConstraint {
  id = 'post_call_protection'
  name = 'Post-Call Protection'
  defaultConfig = {
    hours: 14,
  }

  async validate(context: ConstraintContext, config: any): Promise<ConstraintResult> {
    const { resident, shift, assignments } = context
    const { hours } = config

    // Find recent call shifts (24h or night shifts)
    const recentCallShifts = assignments.filter(a => {
      const duration = (a.shiftInstance.endTime.getTime() - a.shiftInstance.startTime.getTime()) / (1000 * 60 * 60)
      return duration >= 12 // 12+ hour shifts count as call
    })

    // Check if any recent call shift is within the protection period
    for (const callShift of recentCallShifts) {
      const callEnd = new Date(callShift.shiftInstance.endTime)
      const proposedStart = new Date(shift.startTime)
      
      const hoursSinceCallEnd = (proposedStart.getTime() - callEnd.getTime()) / (1000 * 60 * 60)
      
      if (hoursSinceCallEnd >= 0 && hoursSinceCallEnd < hours) {
        return {
          success: false,
          reason: `Post-call protection violation. Only ${hoursSinceCallEnd.toFixed(1)} hours since last call ended (requires ${hours}h)`,
        }
      }
    }

    return { success: true }
  }
}
