// Swap workflow module

import { prisma } from '@/lib/prisma'
import { ValidationModule } from '../scheduling/validation'
import type { ScheduleState } from '@/lib/types/scheduling'

export interface SwapRequestInput {
  requesterId: string
  assignmentId: string
  targetId?: string
  targetAssignmentId?: string
  reason?: string
}

export class SwapWorkflowModule {
  private validation: ValidationModule

  constructor() {
    this.validation = new ValidationModule()
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

  private async preCheckSwap(input: SwapRequestInput) {
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

      // Build schedule state for validation
      const scheduleState: ScheduleState = {
        assignments: [sourceAssignment, targetAssignment],
        shiftInstances: [sourceAssignment.shiftInstance, targetAssignment.shiftInstance],
        residents: [sourceAssignment.resident, targetAssignment.resident],
        periodStart: new Date(),
        periodEnd: new Date(),
      }

      // Simulate swap
      const swappedAssignments = [
        { ...sourceAssignment, residentId: targetAssignment.residentId },
        { ...targetAssignment, residentId: sourceAssignment.residentId },
      ]

      // Validate constraints
      const violations = await this.validation.validate(swappedAssignments as any, scheduleState)

      const hardViolations = violations.filter(v => v.type === 'hard')
      if (hardViolations.length > 0) {
        return {
          passed: false,
          errors: hardViolations.map(v => v.message),
          violations: hardViolations,
        }
      }

      return {
        passed: true,
        warnings: violations.filter(v => v.type === 'soft').map(v => v.message),
      }
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
