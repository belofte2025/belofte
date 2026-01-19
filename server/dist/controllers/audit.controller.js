"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEntityAuditHistory = exports.getAuditStats = exports.getAuditLogs = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
/**
 * Get audit logs filtered by company and optional criteria
 */
const getAuditLogs = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        const { userId, actionType, entityType, from, to, limit = '100', offset = '0' } = req.query;
        const where = {
            user: {
                companyId, // Only show logs for users in the same company
            },
        };
        if (userId)
            where.userId = userId;
        if (actionType)
            where.actionType = actionType;
        if (entityType)
            where.entityType = entityType;
        if (from || to) {
            where.timestamp = {};
            if (from)
                where.timestamp.gte = new Date(from);
            if (to)
                where.timestamp.lte = new Date(to);
        }
        const [logs, total] = await Promise.all([
            prisma_1.default.auditLog.findMany({
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
                take: parseInt(limit),
                skip: parseInt(offset),
            }),
            prisma_1.default.auditLog.count({ where }),
        ]);
        res.json({
            logs,
            pagination: {
                total,
                limit: parseInt(limit),
                offset: parseInt(offset),
                hasMore: total > parseInt(offset) + parseInt(limit),
            }
        });
    }
    catch (error) {
        console.error('Error fetching audit logs:', error);
        res.status(500).json({ error: 'Failed to fetch audit logs' });
    }
};
exports.getAuditLogs = getAuditLogs;
/**
 * Get audit log statistics
 */
const getAuditStats = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        const { from, to } = req.query;
        const where = {
            user: {
                companyId,
            },
        };
        if (from || to) {
            where.timestamp = {};
            if (from)
                where.timestamp.gte = new Date(from);
            if (to)
                where.timestamp.lte = new Date(to);
        }
        // Get counts by action type
        const actionCounts = await prisma_1.default.auditLog.groupBy({
            by: ['actionType'],
            where,
            _count: {
                actionType: true,
            },
        });
        // Get counts by entity type
        const entityCounts = await prisma_1.default.auditLog.groupBy({
            by: ['entityType'],
            where,
            _count: {
                entityType: true,
            },
        });
        // Get most active users
        const activeUsers = await prisma_1.default.auditLog.groupBy({
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
        const users = await prisma_1.default.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, userName: true, email: true },
        });
        const activeUsersWithDetails = activeUsers.map(au => ({
            ...users.find(u => u.id === au.userId),
            activityCount: au._count.userId,
        }));
        // Get total logs
        const totalLogs = await prisma_1.default.auditLog.count({ where });
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
    }
    catch (error) {
        console.error('Error fetching audit stats:', error);
        res.status(500).json({ error: 'Failed to fetch audit statistics' });
    }
};
exports.getAuditStats = getAuditStats;
/**
 * Get audit history for a specific entity
 */
const getEntityAuditHistory = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        const { entityType, entityId } = req.params;
        if (!entityType || !entityId) {
            res.status(400).json({ error: 'entityType and entityId are required' });
            return;
        }
        const logs = await prisma_1.default.auditLog.findMany({
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
    }
    catch (error) {
        console.error('Error fetching entity audit history:', error);
        res.status(500).json({ error: 'Failed to fetch audit history' });
    }
};
exports.getEntityAuditHistory = getEntityAuditHistory;
