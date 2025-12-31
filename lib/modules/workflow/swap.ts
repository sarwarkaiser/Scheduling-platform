// Swap workflow module

import { prisma } from '@/lib/prisma'
import { ValidationModule } from '../scheduling/validation'
import type { ScheduleState } from '@/lib/types/scheduling'
import { ConstraintManager } from '../constraints/manager'
import { MaxConsecutiveShiftsPlugin } from '../constraints/plugins/max-consecutive'

export interface SwapRequestInput {
  requesterId: string
  assignmentId: string
  targetId?: string
  targetAssignmentId?: string
  reason?: string
}

export class SwapWorkflowModule {
  private validation: ValidationModule
  private constraints: ConstraintManager

  constructor() {
    this.validation = new ValidationModule()
    this.constraints = new ConstraintManager()
    this.constraints.register(MaxConsecutiveShiftsPlugin)
  }

  async createSwapRequest(input: SwapRequestInput) {
    // Get the assignment
    const assignment = await prisma.assignment.findUnique({
      where: { id: input.assignmentId },
      include: {
        resident: {
          include: { program: true },
        },
        shiftInstance: true,
      },
    })

    if (!assignment) {
      throw new Error('Assignment not found')
    }

    // Pre-check constraints
    const preCheckResults = await this.preCheckSwap(input)

    // Create swap request
    const swapRequest = await prisma.swapRequest.create({
      data: {
        programId: assignment.resident.programId,
        requesterId: input.requesterId,
        targetId: input.targetId,
        assignmentId: input.assignmentId,
        targetAssignmentId: input.targetAssignmentId,
        reason: input.reason,
        preCheckPassed: preCheckResults.passed,
        preCheckResults: preCheckResults as any,
        status: 'pending',
      },
    })

    // Create approval chain
    await this.createApprovalChain(swapRequest.id, assignment.resident.programId)

    return swapRequest
  }

  async preCheckSwap(input: SwapRequestInput) {
    // Get both assignments
    const sourceAssignment = await prisma.assignment.findUnique({
      where: { id: input.assignmentId },
      include: {
        shiftInstance: true,
        resident: true,
      },
    })

    if (!sourceAssignment) {
      return { passed: false, errors: ['Source assignment not found'] }
    }

    if (!input.targetId && !input.targetAssignmentId) {
      return { passed: false, errors: ['Target resident or assignment required'] }
    }

    // If target assignment specified, validate the swap
    if (input.targetAssignmentId) {
      const targetAssignment = await prisma.assignment.findUnique({
        where: { id: input.targetAssignmentId },
        include: {
          shiftInstance: true,
          resident: true,
        },
      })

      if (!targetAssignment) {
        return { passed: false, errors: ['Target assignment not found'] }
      }

      // Check if residents are in same program
      if (sourceAssignment.resident.programId !== targetAssignment.resident.programId) {
        return { passed: false, errors: ['Residents must be in same program'] }
      }

      // Fetch relevant assignments for context (e.g. +/- 14 days)
      const bufferStart = new Date(sourceAssignment.shiftInstance?.date || new Date())
      bufferStart.setDate(bufferStart.getDate() - 14)
      const bufferEnd = new Date(sourceAssignment.shiftInstance?.date || new Date())
      bufferEnd.setDate(bufferEnd.getDate() + 14)

      const contextAssignments = await prisma.assignment.findMany({
        where: {
          residentId: { in: [sourceAssignment.residentId, targetAssignment.residentId] },
          shiftInstance: {
            date: {
              gte: bufferStart,
              lte: bufferEnd
            }
          },
          status: 'assigned'
        },
        include: { shiftInstance: true }
      })

      // Build schedule state for validation
      // We cast to any because we are building a partial state sufficient for validation
      const scheduleState: ScheduleState = {
        assignments: contextAssignments as any,
        shiftInstances: contextAssignments.map(a => a.shiftInstance) as any,
        residents: [sourceAssignment.resident, targetAssignment.resident] as any,
        periodStart: bufferStart,
        periodEnd: bufferEnd,
      }

      // Fetch and apply active constraints for the program
      const ruleSets = await prisma.ruleSet.findMany({
        where: {
          programId: sourceAssignment.resident.programId,
          active: true
        },
        include: {
          constraints: {
            where: { active: true }
          }
        }
      })

      // Configure manager with DB rules
      for (const ruleSet of ruleSets) {
        for (const constraint of ruleSet.constraints) {
          this.constraints.configure(constraint.pluginType, constraint.parameters)
        }
      }

      // Simulate swap
      // The swapped assignments technically need to match Assignment interface
      const swappedAssignments = [
        { ...sourceAssignment, residentId: targetAssignment.residentId, resident: targetAssignment.resident },
        { ...targetAssignment, residentId: sourceAssignment.residentId, resident: sourceAssignment.resident },
      ]

      // Validate constraints (Legacy)
      const violations = await this.validation.validate(swappedAssignments as any, scheduleState)

      // Validate constraints (New Plugin System)
      const constraintViolations: string[] = [];

      // Check for source resident (who is taking target's assignment)
      const sourceCheck = await this.constraints.validateAll({
        resident: sourceAssignment.resident as any,
        shift: targetAssignment.shiftInstance as any,
        assignments: [...swappedAssignments, ...scheduleState.assignments.filter(a => ![sourceAssignment.id, targetAssignment.id].includes(a.id))].filter(a => a.residentId === sourceAssignment.resident.id) as any,
        periodStart: scheduleState.periodStart,
        periodEnd: scheduleState.periodEnd
      })
      if (!sourceCheck.success && sourceCheck.reason) constraintViolations.push(`Source: ${sourceCheck.reason}`);

      // Check for target resident (who is taking source's assignment)
      const targetCheck = await this.constraints.validateAll({
        resident: targetAssignment.resident as any,
        shift: sourceAssignment.shiftInstance as any,
        assignments: [...swappedAssignments, ...scheduleState.assignments.filter(a => ![sourceAssignment.id, targetAssignment.id].includes(a.id))].filter(a => a.residentId === targetAssignment.resident.id) as any,
        periodStart: scheduleState.periodStart,
        periodEnd: scheduleState.periodEnd
      })
      if (!targetCheck.success && targetCheck.reason) constraintViolations.push(`Target: ${targetCheck.reason}`);


      const hardViolations = violations.filter(v => v.type === 'hard')

      if (hardViolations.length > 0 || constraintViolations.length > 0) {
        return {
          passed: false,
          errors: [...hardViolations.map(v => v.message), ...constraintViolations],
          violations: hardViolations,
        }
      }

      return {
        passed: true,
        warnings: violations.filter(v => v.type === 'soft').map(v => v.message),
      }
    } else if (input.targetId) {
      // Give Away / Pick Up Scenario
      // Source resident gives assignment to Target resident (who has no assignment to swap back)

      const targetResident = await prisma.resident.findUnique({ where: { id: input.targetId } })
      if (!targetResident) return { passed: false, errors: ['Target resident not found'] }

      // 1. Fetch context for both
      const bufferStart = new Date(sourceAssignment.shiftInstance?.date || new Date())
      bufferStart.setDate(bufferStart.getDate() - 14)
      const bufferEnd = new Date(sourceAssignment.shiftInstance?.date || new Date())
      bufferEnd.setDate(bufferEnd.getDate() + 14)

      const contextAssignments = await prisma.assignment.findMany({
        where: {
          residentId: { in: [sourceAssignment.residentId, targetResident.id] },
          shiftInstance: {
            date: { gte: bufferStart, lte: bufferEnd }
          },
          status: 'assigned'
        },
        include: { shiftInstance: true }
      })

      // 2. Load constraints
      const ruleSets = await prisma.ruleSet.findMany({
        where: {
          programId: sourceAssignment.resident.programId,
          active: true
        },
        include: { constraints: { where: { active: true } } }
      })

      for (const ruleSet of ruleSets) {
        for (const constraint of ruleSet.constraints) {
          this.constraints.configure(constraint.pluginType, constraint.parameters)
        }
      }

      const constraintViolations: string[] = []

      // 3. Validate Target (Taking the shift)
      // They get sourceAssignment.shiftInstance
      const targetCheck = await this.constraints.validateAll({
        resident: targetResident as any,
        shift: sourceAssignment.shiftInstance as any,
        // Context: Their existing assignments + New Assignment
        assignments: [...contextAssignments.filter(a => a.residentId === targetResident.id), { ...sourceAssignment, residentId: targetResident.id }] as any,
        periodStart: bufferStart,
        periodEnd: bufferEnd
      })

      if (!targetCheck.success && targetCheck.reason) constraintViolations.push(`Target: ${targetCheck.reason}`)

      if (constraintViolations.length > 0) {
        return { passed: false, errors: constraintViolations }
      }

      return { passed: true }
    }

    // Open swap - just check if requester can be swapped out
    return { passed: true }
  }

  private async createApprovalChain(swapRequestId: string, programId: string) {
    // Get program to determine approval chain
    const program = await prisma.program.findUnique({
      where: { id: programId },
    })

    if (!program) return

    // Default approval chain: chief, admin
    const approvals = [
      { approverRole: 'chief', status: 'pending' as const },
      { approverRole: 'admin', status: 'pending' as const },
    ]

    for (const approval of approvals) {
      await prisma.swapApproval.create({
        data: {
          swapRequestId,
          ...approval,
        },
      })
    }
  }

  async approveSwap(swapRequestId: string, approverRole: string, approverId: string, comment?: string) {
    // Find the approval
    const approval = await prisma.swapApproval.findFirst({
      where: {
        swapRequestId,
        approverRole,
        status: 'pending',
      },
    })

    if (!approval) {
      throw new Error('Approval not found')
    }

    // Update approval
    await prisma.swapApproval.update({
      where: { id: approval.id },
      data: {
        status: 'approved',
        approverId,
        comment,
        approvedAt: new Date(),
      },
    })

    // Check if all approvals are complete
    const swapRequest = await prisma.swapRequest.findUnique({
      where: { id: swapRequestId },
      include: {
        approvals: true,
      },
    })

    if (!swapRequest) return

    const allApproved = swapRequest.approvals.every((a: { status: string }) => a.status === 'approved')
    if (allApproved) {
      // Execute the swap
      await this.executeSwap(swapRequestId)
    }
  }

  private async executeSwap(swapRequestId: string) {
    const swapRequest = await prisma.swapRequest.findUnique({
      where: { id: swapRequestId },
      include: {
        assignment: true,
        target: true,
      },
    })

    if (!swapRequest || !swapRequest.targetId) {
      throw new Error('Swap request or target not found')
    }

    // If target assignment specified, swap both
    if (swapRequest.targetAssignmentId) {
      // Swap both assignments
      await prisma.assignment.update({
        where: { id: swapRequest.assignmentId },
        data: {
          residentId: swapRequest.targetId,
          status: 'swapped',
        },
      })

      await prisma.assignment.update({
        where: { id: swapRequest.targetAssignmentId },
        data: {
          residentId: swapRequest.requesterId,
          status: 'swapped',
        },
      })
    } else {
      // Open swap - just remove the assignment
      await prisma.assignment.update({
        where: { id: swapRequest.assignmentId },
        data: {
          residentId: swapRequest.targetId,
          status: 'swapped',
        },
      })
    }

    // Update swap request status
    await prisma.swapRequest.update({
      where: { id: swapRequestId },
      data: {
        status: 'approved',
        approvedAt: new Date(),
      },
    })

    // Recalculate fairness stats
    // This would trigger a background job in production
  }
}
