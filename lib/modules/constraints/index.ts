// Constraint module exports

export * from './base'
export * from './plugins/maxShiftsPerPeriod'
export * from './plugins/minRestBetween'
export * from './plugins/noConsecutive24h'
export { constraintRegistry } from './base'

// Register default constraints
import { constraintRegistry } from './base'
import { MaxShiftsPerPeriodConstraint } from './plugins/maxShiftsPerPeriod'
import { MinRestBetweenShiftsConstraint } from './plugins/minRestBetween'
import { NoConsecutive24hConstraint } from './plugins/noConsecutive24h'

// Initialize default constraints
constraintRegistry.register(new MaxShiftsPerPeriodConstraint())
constraintRegistry.register(new MinRestBetweenShiftsConstraint())
constraintRegistry.register(new NoConsecutive24hConstraint())
