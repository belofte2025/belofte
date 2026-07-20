import { Request, Response } from "express";
import prisma from "../utils/prisma";

export const getNotificationSettings = async (req: Request, res: Response) => {
  const companyId = req.user?.companyId;
  if (!companyId) { res.status(400).json({ error: "Company ID missing" }); return; }

  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { notificationsEnabled: true, notificationChannel: true },
  });

  if (!company) { res.status(404).json({ error: "Company not found" }); return; }

  res.json({
    notificationsEnabled: company.notificationsEnabled,
    notificationChannel: company.notificationChannel,
  });
};

export const updateNotificationSettings = async (req: Request, res: Response) => {
  const companyId = req.user?.companyId;
  if (!companyId) { res.status(400).json({ error: "Company ID missing" }); return; }

  const { notificationsEnabled, notificationChannel } = req.body;

  const update: Record<string, unknown> = {};
  if (typeof notificationsEnabled === "boolean") update.notificationsEnabled = notificationsEnabled;
  if (notificationChannel === "SMS" || notificationChannel === "WHATSAPP") update.notificationChannel = notificationChannel;

  const company = await prisma.company.update({
    where: { id: companyId },
    data: update,
    select: { notificationsEnabled: true, notificationChannel: true },
  });

  res.json(company);
};
