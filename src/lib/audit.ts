import prisma from "@/lib/prisma";
import { AuditAction, AuditSeverity } from "@/generated/prisma";

export interface AuditLogData {
  action: AuditAction;
  resourceType: string;
  resourceId?: string;
  oldValues?: any;
  newValues?: any;
  severity?: AuditSeverity;
  metadata?: any;
  userId: string;
  userAgent?: string;
  ipAddress?: string;
}

export class AuditService {
  static async log(data: AuditLogData) {
    try {
      await prisma.auditLog.create({
        data: {
          action: data.action,
          entityType: data.resourceType,
          entityId: data.resourceId,
          severity: data.severity || AuditSeverity.INFO,
          oldValues: data.oldValues ? JSON.stringify(data.oldValues) : null,
          newValues: data.newValues ? JSON.stringify(data.newValues) : null,
          metadata: data.metadata ? JSON.stringify(data.metadata) : null,
          userId: data.userId,
          userAgent: data.userAgent,
          ipAddress: data.ipAddress,
        },
      });
    } catch (error) {
      console.error("Failed to create audit log:", error);
    }
  }

  static async getLogs(filters?: {
    userId?: string;
    action?: AuditAction;
    resourceType?: string;
    resourceId?: string;
    severity?: AuditSeverity;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }) {
    const {
      userId,
      action,
      resourceType,
      resourceId,
      severity,
      startDate,
      endDate,
      page = 1,
      limit = 50,
    } = filters || {};

    const where: any = {};

    if (userId) where.userId = userId;
    if (action) where.action = action;
    if (resourceType) where.entityType = resourceType;
    if (resourceId) where.entityId = resourceId;
    if (severity) where.severity = severity;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  static async getAuditSummary(startDate?: Date, endDate?: Date) {
    const where: any = {};
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [actionCounts, severityCounts, userActivity, resourceTypes] = await Promise.all([
      prisma.auditLog.groupBy({
        by: ["action"],
        where,
        _count: { action: true },
        orderBy: { _count: { action: "desc" } },
      }),
      prisma.auditLog.groupBy({
        by: ["severity"],
        where,
        _count: { severity: true },
      }),
      prisma.auditLog.groupBy({
        by: ["userId"],
        where,
        _count: { userId: true },
        orderBy: { _count: { userId: "desc" } },
        take: 10,
      }),
      prisma.auditLog.groupBy({
        by: ["entityType"],
        where,
        _count: { entityType: true },
        orderBy: { _count: { entityType: "desc" } },
      }),
    ]);

    return {
      actionCounts,
      severityCounts,
      userActivity,
      resourceTypes,
    };
  }
}