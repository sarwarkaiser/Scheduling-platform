// Core scheduling types

export interface ScheduleState {
  assignments: Assignment[]
  shiftInstances: ShiftInstance[]
  residents: Resident[]
  periodStart: Date
  periodEnd: Date
}

export interface Assignment {
  id: string
  shiftInstanceId: string
  residentId: string
  siteId: string
  role: string
  status: 'assigned' | 'swapped' | 'overridden'
  explanation?: string
  assignedBy?: string
  assignedAt: Date
}

export interface ShiftInstance {
  id: string
  shiftTemplateId: string
  date: Date
  startTime: Date
  endTime: Date
  siteId?: string
  status: 'draft' | 'published' | 'locked'
  coverageRequirements: CoverageRequirement[]
}

export interface CoverageRequirement {
  role: string
  count: number
  shiftTypeId?: string
  priority: number
}

export interface Resident {
  id: string
  userId: string
  programId: string
  programYearId?: string
  active: boolean
  partTime: boolean
}

export interface EligibilityResult {
  residentId: string
  eligible: boolean
  reasons: string[]
  score?: number
}

export interface ConstraintViolation {
  type: 'hard' | 'soft'
  severity: number
  message: string
  constraintId: string
  residentId?: string
  shiftInstanceId?: string
  assignmentId?: string
  metadata?: Record<string, unknown>
}

export interface SolverResult {
  assignments: Assignment[]
  violations: ConstraintViolation[]
  score: number
  explanations: AssignmentExplanation[]
  unassignedShifts: UnassignedShift[]
}

export interface AssignmentExplanation {
  assignmentId: string
  reasons: string[]
  score: number
}

export interface UnassignedShift {
  shiftInstanceId: string
  reasons: string[]
  eligibleResidents: string[]
}
