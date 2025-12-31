
import { ConstraintPlugin, ConstraintContext, ConstraintResult } from '../types'

export const MaxConsecutiveShiftsPlugin: ConstraintPlugin = {
    id: 'max_consecutive_shifts',
    name: 'Max Consecutive Shifts',
    description: 'Limits the number of consecutive days a resident can be assigned.',
    defaultConfig: {
        limit: 6,
        softLimit: 5,
        softPenalty: 50
    },

    validate(context: ConstraintContext, config: any): ConstraintResult {
        const { resident, shift, assignments } = context
        const limit = config.limit || 6
        const shiftDate = new Date(shift.date)

        // Find consecutive shifts backwards from current shift
        let consecutiveCount = 0
        let checkDate = new Date(shiftDate)
        checkDate.setDate(checkDate.getDate() - 1)

        // Helper to check if resident has assignment on a specific date
        const hasAssignmentOnDate = (date: Date) => {
            return assignments.some(a =>
                a.residentId === resident.id &&
                new Date((a as any).date || (a as any).shiftInstance?.date).toDateString() === date.toDateString()
            )
        }

        // Checking backwards
        while (consecutiveCount < limit + 1) { // Check slightly beyond to be safe
            if (hasAssignmentOnDate(checkDate)) {
                consecutiveCount++
                checkDate.setDate(checkDate.getDate() - 1)
            } else {
                break
            }
        }

        // Checking forwards (if we are filling gaps, though usually we fill chronologically)
        // For greedy scheduler, we mostly look backwards.

        if (consecutiveCount >= limit) {
            return {
                success: false,
                reason: `Exceeds max consecutive shifts (${limit})`
            }
        }

        // Soft limit check
        if (config.softLimit && consecutiveCount >= config.softLimit) {
            return {
                success: true,
                penalty: config.softPenalty || 50,
                reason: `Reaches soft consecutive limit (${config.softLimit})`
            }
        }

        return { success: true }
    }
}
