// API route for swap requests

import { NextRequest, NextResponse } from 'next/server'
import { SwapWorkflowModule } from '@/lib/modules/workflow/swap'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { requesterId, assignmentId, targetId, targetAssignmentId, reason } = body

    if (!requesterId || !assignmentId) {
      return NextResponse.json(
        { error: 'Missing required fields: requesterId, assignmentId' },
        { status: 400 }
      )
    }

    const swapModule = new SwapWorkflowModule()
    const swapRequest = await swapModule.createSwapRequest({
      requesterId,
      assignmentId,
      targetId,
      targetAssignmentId,
      reason,
    })

    return NextResponse.json({
      id: swapRequest.id,
      status: swapRequest.status,
      preCheckPassed: swapRequest.preCheckPassed,
    })
  } catch (error) {
    console.error('Swap request error:', error)
    return NextResponse.json(
      { error: 'Failed to create swap request', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const programId = searchParams.get('programId')
    const status = searchParams.get('status')

    // This would fetch swap requests from database
    // Simplified for now
    return NextResponse.json({
      swaps: [],
      message: 'Swap requests endpoint - implement database query',
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch swap requests' },
      { status: 500 }
    )
  }
}
