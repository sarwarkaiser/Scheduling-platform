// Validation module - runs constraint evaluation

import type { Assignment, ConstraintViolation, ScheduleState } from '@/lib/types/scheduling'
import { constraintRegistry } from '../constraints'
import { prisma } from '@/lib/prisma'

export class ValidationModule {
  async validate(
    assignments: Assignment[],
    scheduleState: ScheduleState
  ): Promise<ConstraintViolation[]> {
    const violations: ConstraintViolation[] = []

    // Get all active rule sets for the program
    const programId = assignments[0]?.residentId
      ? (await prisma.resident.findUnique({
        where: { id: assignments[0].residentId },
        select: { programId: true },
      }))?.programId
      : null

    if (!programId) return violations

    const ruleSets = await prisma.ruleSet.findMany({
      where: {
        OR: [{ programId }, { programId: null }],
        active: true,
      },
      include: {
        constraints: {
          where: { active: true },
        },
      },
      orderBy: { priority: 'desc' },
    })

    // Evaluate constraints for each assignment
    for (const assignment of assignments) {
      const shift = scheduleState.shiftInstances.find(
        s => s.id === assignment.shiftInstanceId
      )
      if (!shift) continue

      for (const ruleSet of ruleSets) {
        for (const constraintDef of ruleSet.constraints) {
          const plugin =
            constraintRegistry.get(constraintDef.pluginType) ||
            (constraintDef.pluginType === 'min_rest_between_shifts'
              ? constraintRegistry.get('min_rest_between')
              : undefined)
          if (!plugin) continue

          const result = plugin.evaluate({
            scheduleState,
            residentId: assignment.residentId,
            shiftInstanceId: shift.id,
            assignmentId: assignment.id,
            parameters: constraintDef.parameters as Record<string, unknown>,
          })

          if (result.violated) {
            violations.push({
              type: constraintDef.type as "hard" | "soft",
              severity: result.severity,
              message: result.message,
              constraintId: constraintDef.id,
              residentId: assignment.residentId,
              shiftInstanceId: shift.id,
              assignmentId: assignment.id,
              metadata: result.metadata,
            })
          }
        }
      }
    }

    return violations
  }
}
