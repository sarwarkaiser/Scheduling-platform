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
    options: EligibilityOptions
  ): Promise<EligibilityResult[]> {
    const results: EligibilityResult[] = []

    // Get all residents in the program
    const residents = await prisma.resident.findMany({
      where: {
        programId: options.programId,
        active: true,
      },
      include: {
        callPools: {
          include: {
            callPool: true,
          },
        },
        rotationBlocks: true,
        availabilities: true,
      },
    })

    for (const resident of residents) {
      const reasons: string[] = []
      let eligible = true

      // Check call pool membership
      if (shiftInstance.callPoolId) {
        const inCallPool = resident.callPools.some(
          (cp: { callPoolId: string; active: boolean }) => cp.callPoolId === shiftInstance.callPoolId && cp.active
        )
        if (!inCallPool) {
          eligible = false
          reasons.push('Not in required call pool')
        }
      }

      // Check rotation block
      const inRotation = resident.rotationBlocks.some((rb: { startDate: Date; endDate: Date; siteId: string; serviceId: string }) => {
        const shiftDate = new Date(shiftInstance.date)
        return (
          shiftDate >= rb.startDate &&
          shiftDate <= rb.endDate &&
          (!shiftInstance.siteId || rb.siteId === shiftInstance.siteId) &&
          (!shiftInstance.serviceId || rb.serviceId === shiftInstance.serviceId)
        )
      })
      if (!inRotation) {
        eligible = false
        reasons.push('Not in rotation for this site/service')
      }

      // Check availability (vacation, leave, etc.)
      const unavailable = resident.availabilities.some((av: { startDate: Date; endDate: Date; type: string; approved: boolean }) => {
        const shiftDate = new Date(shiftInstance.date)
        return (
          shiftDate >= av.startDate &&
          shiftDate <= av.endDate &&
          av.approved &&
          (av.type === 'vacation' || av.type === 'leave' || av.type === 'unavailable')
        )
      })
      if (unavailable) {
        eligible = false
        reasons.push('Unavailable (vacation/leave)')
      }

      // Check post-call protection
      const postCall = resident.availabilities.some((av: { startDate: Date; endDate: Date; type: string; approved: boolean }) => {
        const shiftDate = new Date(shiftInstance.date)
        return (
          shiftDate >= av.startDate &&
          shiftDate <= av.endDate &&
          av.type === 'post_call_protection' &&
          av.approved
        )
      })
      if (postCall) {
        eligible = false
        reasons.push('Post-call protection period')
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
