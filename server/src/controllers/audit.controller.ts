import { Request, Response } from "express";
import prisma from "../utils/prisma";

/**
 * Get audit logs filtered by company and optional criteria
 */
export const getAuditLogs = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const companyId = req.user!.companyId;
    const {
      userId,
      actionType,
      entityType,
      from,
      to,
      limit = '100',
      offset = '0'
    } = req.query;

    const where: any = {
      user: {
        companyId, // Only show logs for users in the same company
      },
    };

    if (userId) where.userId = userId as string;
    if (actionType) where.actionType = actionType as string;
    if (entityType) where.entityType = entityType as string;

    if (from || to) {
      where.timestamp = {};
      if (from) where.timestamp.gte = new Date(from as string);
      if (to) where.timestamp.lte = new Date(to as string);
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              userName: true,
              email: true,
              company: {
                select: {
                  companyName: true
                }
              }
            }
          }
        },
        orderBy: { timestamp: "desc" },
        take: parseInt(limit as string),
        skip: parseInt(offset as string),
      }),
      prisma.auditLog.count({ where }),
    ]);

    res.json({
      logs,
      pagination: {
        total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        hasMore: total > parseInt(offset as string) + parseInt(limit as string),
      }
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
};

/**
 * Get audit log statistics
 */
export const getAuditStats = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const companyId = req.user!.companyId;
    const { from, to } = req.query;

    const where: any = {
      user: {
        companyId,
      },
    };

    if (from || to) {
      where.timestamp = {};
      if (from) where.timestamp.gte = new Date(from as string);
      if (to) where.timestamp.lte = new Date(to as string);
    }

    // Get counts by action type
    const actionCounts = await prisma.auditLog.groupBy({
      by: ['actionType'],
      where,
      _count: {
        actionType: true,
      },
    });

    // Get counts by entity type
    const entityCounts = await prisma.auditLog.groupBy({
      by: ['entityType'],
      where,
      _count: {
        entityType: true,
      },
    });

    // Get most active users
    const activeUsers = await prisma.auditLog.groupBy({
      by: ['userId'],
      where,
      _count: {
        userId: true,
      },
      orderBy: {
        _count: {
          userId: 'desc',
        },
      },
      take: 10,
    });

    // Enrich user data
    const userIds = activeUsers.map(u => u.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, userName: true, email: true },
    });

    const activeUsersWithDetails = activeUsers.map(au => ({
      ...users.find(u => u.id === au.userId),
      activityCount: au._count.userId,
    }));

    // Get total logs
    const totalLogs = await prisma.auditLog.count({ where });

    res.json({
      totalLogs,
      actionCounts: actionCounts.map(ac => ({
        action: ac.actionType,
        count: ac._count.actionType,
      })),
      entityCounts: entityCounts.map(ec => ({
        entity: ec.entityType,
        count: ec._count.entityType,
      })),
      activeUsers: activeUsersWithDetails,
    });
  } catch (error) {
    console.error('Error fetching audit stats:', error);
    res.status(500).json({ error: 'Failed to fetch audit statistics' });
  }
};

/**
 * Get audit history for a specific entity
 */
export const getEntityAuditHistory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const companyId = req.user!.companyId;
    const { entityType, entityId } = req.params;

    if (!entityType || !entityId) {
      res.status(400).json({ error: 'entityType and entityId are required' });
      return;
    }

    const logs = await prisma.auditLog.findMany({
      where: {
        entityType,
        entityId,
        user: {
          companyId, // Only show logs for users in the same company
        },
      },
      include: {
        user: {
          select: {
            userName: true,
            email: true,
          },
        },
      },
      orderBy: { timestamp: 'desc' },
    });

    res.json(logs);
  } catch (error) {
    console.error('Error fetching entity audit history:', error);
    res.status(500).json({ error: 'Failed to fetch audit history' });
  }
};
