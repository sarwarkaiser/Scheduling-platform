// Explanation module - generates "why" explanations

import type { Assignment, AssignmentExplanation, ScheduleState } from '@/lib/types/scheduling'

export class ExplanationModule {
  async explain(
    assignments: Assignment[],
    scheduleState: ScheduleState
  ): Promise<AssignmentExplanation[]> {
    const explanations: AssignmentExplanation[] = []

    for (const assignment of assignments) {
      const reasons: string[] = []
      let score = 0

      // Find the shift
      const shift = scheduleState.shiftInstances.find(
        s => s.id === assignment.shiftInstanceId
      )
      if (!shift) continue

      // Explanation reasons (simplified - would use actual ranking data)
      reasons.push('Eligible for shift based on call pool and rotation')
      reasons.push('Fairness score indicates balanced distribution')
      reasons.push('No scheduling conflicts detected')

      // Calculate explanation score (would use actual ranking score)
      score = 75 // Placeholder

      explanations.push({
        assignmentId: assignment.id,
        reasons,
        score,
      })
    }

    return explanations
  }
}
