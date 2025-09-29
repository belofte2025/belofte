"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAuditLogs = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const getAuditLogs = async (req, res) => {
    const { userId, actionType, from, to } = req.query;
    const where = {};
    if (userId)
        where.userId = userId;
    if (actionType)
        where.actionType = actionType;
    if (from || to) {
        where.timestamp = {};
        if (from)
            where.timestamp.gte = new Date(from);
        if (to)
            where.timestamp.lte = new Date(to);
    }
    const logs = await prisma_1.default.auditLog.findMany({
        where,
        include: { user: { select: { userName: true, email: true } } },
        orderBy: { timestamp: "desc" },
    });
    res.json(logs);
};
exports.getAuditLogs = getAuditLogs;
