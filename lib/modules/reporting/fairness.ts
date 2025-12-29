// Fairness scoring and reporting module

import { prisma } from '@/lib/prisma'
import type { Assignment } from '@/lib/types/scheduling'

export interface FairnessCalculationOptions {
  programId: string
  periodStart: Date
  periodEnd: Date
}

export class FairnessModule {
  async calculateFairnessStats(
    options: FairnessCalculationOptions
  ): Promise<void> {
    const residents = await prisma.resident.findMany({
      where: {
        programId: options.programId,
        active: true,
      },
    })

    // Get all assignments in the period
    const assignments = await prisma.assignment.findMany({
      where: {
        resident: {
          programId: options.programId,
        },
        assignedAt: {
          gte: options.periodStart,
          lte: options.periodEnd,
        },
      },
      include: {
        shiftInstance: {
          include: {
            shiftTemplate: {
              include: {
                shiftType: true,
              },
            },
          },
        },
        site: true,
      },
    })

    // Get fairness metrics for the program
    const metrics = await prisma.fairnessMetric.findMany({
      where: {
        programId: options.programId,
        active: true,
      },
    })

    // Calculate stats per resident
    for (const resident of residents) {
      const residentAssignments = assignments.filter(
        (a: { residentId: string }) => a.residentId === resident.id
      )

      let totalPoints = 0
      let nightsCount = 0
      let weekendsCount = 0
      let holidaysCount = 0
      let siteTravelCount = 0
      let backupCount = 0

      const sitesVisited = new Set<string>()

      for (const assignment of residentAssignments) {
        const shiftType = assignment.shiftInstance.shiftTemplate.shiftType
        const shiftDate = new Date(assignment.shiftInstance.date)

        // Calculate points based on shift type
        totalPoints += shiftType.pointsWeight || 1.0

        // Count nights (shifts starting after 6 PM or ending before 6 AM)
        const startHour = shiftDate.getHours()
        const endHour = new Date(assignment.shiftInstance.endTime).getHours()
        if (startHour >= 18 || endHour < 6) {
          nightsCount++
        }

        // Count weekends
        const dayOfWeek = shiftDate.getDay()
        if (dayOfWeek === 0 || dayOfWeek === 6) {
          weekendsCount++
        }

        // Count holidays (simplified - would need holiday calendar)
        // holidaysCount += this.isHoliday(shiftDate) ? 1 : 0

        // Track site visits
        if (assignment.siteId) {
          sitesVisited.add(assignment.siteId)
        }

        // Count backup shifts
        if (assignment.role === 'Backup') {
          backupCount++
        }
      }

      siteTravelCount = sitesVisited.size

      // Upsert fairness stats
      await prisma.fairnessStats.upsert({
        where: {
          residentId_periodStart_periodEnd: {
            residentId: resident.id,
            periodStart: options.periodStart,
            periodEnd: options.periodEnd,
          },
        },
        update: {
          totalPoints,
          nightsCount,
          weekendsCount,
          holidaysCount,
          siteTravelCount,
          backupCount,
          calculatedAt: new Date(),
        },
        create: {
          residentId: resident.id,
          periodStart: options.periodStart,
          periodEnd: options.periodEnd,
          totalPoints,
          nightsCount,
          weekendsCount,
          holidaysCount,
          siteTravelCount,
          backupCount,
        },
      })
    }
  }

  async getFairnessReport(programId: string, periodStart: Date, periodEnd: Date) {
    const stats = await prisma.fairnessStats.findMany({
      where: {
        resident: {
          programId,
        },
        periodStart: { lte: periodEnd },
        periodEnd: { gte: periodStart },
      },
      include: {
        resident: {
          include: {
            user: true,
            programYear: true,
          },
        },
      },
    })

    // Calculate averages and variances
    const avgPoints = stats.reduce((sum: number, s: { totalPoints: number }) => sum + s.totalPoints, 0) / stats.length || 0
    const avgNights = stats.reduce((sum: number, s: { nightsCount: number }) => sum + s.nightsCount, 0) / stats.length || 0
    const avgWeekends = stats.reduce((sum: number, s: { weekendsCount: number }) => sum + s.weekendsCount, 0) / stats.length || 0

    return {
      stats,
      averages: {
        points: avgPoints,
        nights: avgNights,
        weekends: avgWeekends,
      },
      outliers: stats.filter((s: { totalPoints: number }) => {
        const pointsVariance = Math.abs(s.totalPoints - avgPoints) / avgPoints
        return pointsVariance > 0.2 // More than 20% variance
      }),
    }
  }
}
