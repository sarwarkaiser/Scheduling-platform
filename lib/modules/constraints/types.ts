
import type { ShiftInstance, Assignment, Resident } from '@/lib/types/scheduling'

export interface ConstraintResult {
    success: boolean
    penalty?: number // For soft constraints
    reason?: string
}

export interface ConstraintContext {
    resident: Resident
    shift: ShiftInstance
    assignments: Assignment[] // All assignments made so far
    periodStart: Date
    periodEnd: Date
    history?: Assignment[] // Previous period assignments (optional)
}

export interface ConstraintPlugin {
    id: string
    name: string
    description: string
    defaultConfig?: any

    validate(context: ConstraintContext, config?: any): Promise<ConstraintResult> | ConstraintResult
}
