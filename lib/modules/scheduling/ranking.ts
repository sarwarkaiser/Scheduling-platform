// Candidate ranking module

import { prisma } from '@/lib/prisma'
import type { EligibilityResult } from '@/lib/types/scheduling'

export interface RankingOptions {
  programId: string
}

export class RankingModule {
  async rankCandidates(
    shiftInstance: any,
    eligible: EligibilityResult[],
    options: RankingOptions
  ): Promise<Array<{ residentId: string; score: number }>> {
    const rankings: Array<{ residentId: string; score: number }> = []

    // Get fairness stats for residents
    const residentIds = eligible.map(e => e.residentId)
    const fairnessStats = await prisma.fairnessStats.findMany({
      where: {
        residentId: { in: residentIds },
        periodStart: { lte: shiftInstance.date },
        periodEnd: { gte: shiftInstance.date },
      },
    })

    const statsMap = new Map(fairnessStats.map((s: { residentId: string }) => [s.residentId, s]))

    // Get preferences
    const preferences = await prisma.preference.findMany({
      where: {
        residentId: { in: residentIds },
        active: true,
        AND: [
          {
            OR: [
              { startDate: null },
              { startDate: { lte: shiftInstance.date } },
            ],
          },
          {
            OR: [
              { endDate: null },
              { endDate: { gte: shiftInstance.date } },
            ],
          },
        ],
      },
    })

    const prefsMap = new Map<string, typeof preferences>()
    for (const pref of preferences) {
      if (!prefsMap.has(pref.residentId)) {
        prefsMap.set(pref.residentId, [])
      }
      prefsMap.get(pref.residentId)!.push(pref)
    }

    for (const candidate of eligible) {
      let score = 100 // Base score

      // Fairness deficit (lower points = higher priority)
      const stats = statsMap.get(candidate.residentId) as { totalPoints: number; weekendsCount: number; nightsCount: number } | undefined
      if (stats) {
        // Give priority to residents with fewer points
        const totalCount = (stats.weekendsCount || 0) + (stats.nightsCount || 0) || 1
        const avgPoints = stats.totalPoints / totalCount
        score += (100 - avgPoints) * 0.3 // Weight fairness
      }

      // Preference matching
      const residentPrefs = prefsMap.get(candidate.residentId) || []
      for (const pref of residentPrefs) {
        if (pref.type === 'avoid_day') {
          const dayOfWeek = new Date(shiftInstance.date).getDay()
          if (pref.target === dayOfWeek.toString()) {
            score -= pref.weight * 20 // Penalty for avoided days
          }
        } else if (pref.type === 'prefer_call_type') {
          if (pref.target === shiftInstance.shiftTypeId) {
            score += pref.weight * 10 // Bonus for preferred types
          }
        }
      }

      // Weekend/holiday balancing
      const date = new Date(shiftInstance.date)
      const isWeekend = date.getDay() === 0 || date.getDay() === 6
      if (isWeekend && stats) {
        // Prioritize residents with fewer weekends
        score += (10 - (stats.weekendsCount || 0)) * 2
      }

      rankings.push({
        residentId: candidate.residentId,
        score: Math.max(0, score), // Ensure non-negative
      })
    }

    // Sort by score (descending)
    return rankings.sort((a, b) => b.score - a.score)
  }
}
