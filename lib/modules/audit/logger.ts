// Audit logging module

import { prisma } from '@/lib/prisma'

export interface AuditLogInput {
  userId?: string
  action: string
  entityType: string
  entityId: string
  changes?: Record<string, unknown>
  metadata?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
}

export class AuditLogger {
  async log(input: AuditLogInput): Promise<void> {
    await prisma.auditLog.create({
      data: {
        userId: input.userId,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        changes: input.changes as any,
        metadata: input.metadata as any,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
      },
    })
  }

  async getLogs(
    entityType?: string,
    entityId?: string,
    userId?: string,
    limit = 100
  ) {
    return prisma.auditLog.findMany({
      where: {
        ...(entityType && { entityType }),
        ...(entityId && { entityId }),
        ...(userId && { userId }),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
  }
}

export const auditLogger = new AuditLogger()
