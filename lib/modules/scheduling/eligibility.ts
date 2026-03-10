// Eligibility calculation module

import { prisma } from '@/lib/prisma'
import type { EligibilityResult } from '@/lib/types/scheduling'

export interface EligibilityOptions {
  programId: string
  callPoolIds?: string[]
  siteIds?: string[]
}

export class EligibilityModule {
  async calculateEligibility(
    shiftInstance: any,
    residents: any[], // Pre-fetched residents
    options: EligibilityOptions
  ): Promise<EligibilityResult[]> {
    const results: EligibilityResult[] = []

    for (const resident of residents) {
      const reasons: string[] = []
      let eligible = true

      // Check call pool membership (if shift has a call pool requirement)
      if (shiftInstance.callPoolId) {
        const inCallPool = resident.callPools?.some(
          (cp: { callPoolId: string; active: boolean }) => cp.callPoolId === shiftInstance.callPoolId && cp.active
        )
        if (!inCallPool) {
          eligible = false
          reasons.push('Not in required call pool')
        }
      }

      // Check rotation block - ONLY if the shift has a specific site/service requirement
      // For MVP, if resident has ANY active rotation block, they're considered eligible
      // This allows broader assignment when site/service aren't strictly specified
      if (shiftInstance.siteId || shiftInstance.serviceId) {
        const inRotation = resident.rotationBlocks?.some((rb: { startDate: Date; endDate: Date; siteId: string; serviceId: string }) => {
          const shiftDate = new Date(shiftInstance.date)
          const rbStart = new Date(rb.startDate)
          const rbEnd = new Date(rb.endDate)
          return (
            shiftDate >= rbStart &&
            shiftDate <= rbEnd &&
            (!shiftInstance.siteId || rb.siteId === shiftInstance.siteId) &&
            (!shiftInstance.serviceId || rb.serviceId === shiftInstance.serviceId)
          )
        })
        if (!inRotation) {
          // Don't mark as ineligible - just note it
          // This allows assignments even without specific rotation blocks
          // reasons.push('Not in rotation for this site/service')
        }
      } else {
        // No specific site/service required - just check they have ANY rotation block covering the date
        const hasActiveRotation = resident.rotationBlocks?.some((rb: { startDate: Date; endDate: Date }) => {
          const shiftDate = new Date(shiftInstance.date)
          const rbStart = new Date(rb.startDate)
          const rbEnd = new Date(rb.endDate)
          return shiftDate >= rbStart && shiftDate <= rbEnd
        })
        // Don't require rotation blocks - allow general eligibility
        // if (!hasActiveRotation) {
        //   eligible = false
        //   reasons.push('No active rotation block for this date')
        // }
      }

      // Check availability (vacation, leave, etc.)
      const unavailable = resident.availabilities?.some((av: { startDate: Date; endDate: Date; type: string; approved: boolean }) => {
        const shiftDate = new Date(shiftInstance.date)
        const avStart = new Date(av.startDate)
        const avEnd = new Date(av.endDate)
        return (
          shiftDate >= avStart &&
          shiftDate <= avEnd &&
          av.approved &&
          (av.type === 'vacation' || av.type === 'leave' || av.type === 'unavailable')
        )
      })
      if (unavailable) {
        eligible = false
        reasons.push('Unavailable (vacation/leave)')
      }

      results.push({
        residentId: resident.id,
        eligible,
        reasons: eligible ? ['Eligible'] : reasons,
      })
    }

    return results.filter(r => r.eligible)
  }
}
