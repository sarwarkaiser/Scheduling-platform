// Base constraint plugin interface and registry

import type { ConstraintPlugin, ConstraintContext, ConstraintResult, ConstraintDefinition } from '@/lib/types/constraints'
import type { ScheduleState } from '@/lib/types/scheduling'

export abstract class BaseConstraint implements ConstraintPlugin {
  abstract id: string
  abstract name: string
  abstract type: 'hard' | 'soft'

  abstract evaluate(context: ConstraintContext): ConstraintResult
  abstract explain(result: ConstraintResult): string

  protected matchesScope(
    definition: ConstraintDefinition,
    residentId: string,
    scheduleState: ScheduleState
  ): boolean {
    // Check if constraint scope matches
    // This is a simplified version - full implementation would check program, site, service, etc.
    return true
  }
}

// Constraint registry
export class ConstraintRegistry {
  private plugins: Map<string, BaseConstraint> = new Map()

  register(plugin: BaseConstraint): void {
    this.plugins.set(plugin.id, plugin)
  }

  get(id: string): BaseConstraint | undefined {
    return this.plugins.get(id)
  }

  getAll(): BaseConstraint[] {
    return Array.from(this.plugins.values())
  }

  getByType(type: 'hard' | 'soft'): BaseConstraint[] {
    return Array.from(this.plugins.values()).filter(p => p.type === type)
  }
}

export const constraintRegistry = new ConstraintRegistry()
