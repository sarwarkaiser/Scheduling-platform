// Constraint plugin types

export interface ConstraintPlugin {
  id: string
  name: string
  type: 'hard' | 'soft'
  evaluate: (context: ConstraintContext) => ConstraintResult
  explain: (result: ConstraintResult) => string
}

export interface ConstraintContext {
  scheduleState: import('./scheduling').ScheduleState
  residentId?: string
  shiftInstanceId?: string
  assignmentId?: string
  parameters: Record<string, unknown>
}

export interface ConstraintResult {
  violated: boolean
  severity: number // 0.0 to 1.0
  message: string
  metadata?: Record<string, unknown>
}

export interface ConstraintDefinition {
  id: string
  ruleSetId: string
  name: string
  type: 'hard' | 'soft'
  pluginType: string
  parameters: Record<string, unknown>
  weight?: number
  scope: ConstraintScope
}

export interface ConstraintScope {
  programId?: string
  siteId?: string
  serviceId?: string
  callPoolId?: string
  programYearId?: string
}

export interface RuleSet {
  id: string
  name: string
  description?: string
  scope: ConstraintScope
  priority: number
  constraints: ConstraintDefinition[]
  active: boolean
}
