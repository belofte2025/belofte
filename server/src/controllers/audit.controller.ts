import { Request, Response } from "express";
import prisma from "../utils/prisma";

export const getAuditLogs = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { userId, actionType, from, to } = req.query;

  const where: any = {};

  if (userId) where.userId = userId;
  if (actionType) where.actionType = actionType;
  if (from || to) {
    where.timestamp = {};
    if (from) where.timestamp.gte = new Date(from as string);
    if (to) where.timestamp.lte = new Date(to as string);
  }

  const logs = await prisma.auditLog.findMany({
    where,
    include: { user: { select: { userName: true, email: true } } },
    orderBy: { timestamp: "desc" },
  });

  res.json(logs);
};
