import { Request, Response } from "express";
import prisma from "../utils/prisma";
import { nextWaybillNumber } from "../services/accounting/accounts";
import { WaybillStatus } from "@prisma/client";

export const getWaybills = async (req: Request, res: Response) => {
  const companyId = req.user?.companyId;
  if (!companyId) { res.status(400).json({ error: "Company ID missing" }); return; }
  const { status, customerId, page = "1", limit = "50" } = req.query;
  try {
    const where: any = { companyId };
    if (status) where.status = status as WaybillStatus;
    if (customerId) where.customerId = customerId as string;
    const pageNum = parseInt(page as string), limitNum = parseInt(limit as string);
    const [waybills, total] = await Promise.all([
      prisma.waybill.findMany({
        where,
        include: { Customer: { select: { customerName: true } }, _count: { select: { Items: true } } },
        orderBy: { createdAt: "desc" },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      }),
      prisma.waybill.count({ where }),
    ]);
    res.json({ waybills, pagination: { currentPage: pageNum, totalPages: Math.ceil(total / limitNum), totalCount: total } });
  } catch { res.status(500).json({ error: "Failed to fetch waybills" }); }
};

export const getWaybill = async (req: Request, res: Response) => {
  const companyId = req.user?.companyId;
  const { id } = req.params;
  if (!companyId) { res.status(400).json({ error: "Company ID missing" }); return; }
  try {
    const waybill = await prisma.waybill.findFirst({
      where: { id, companyId },
      include: { Customer: true, Items: true },
    });
    if (!waybill) { res.status(404).json({ error: "Waybill not found" }); return; }
    res.json(waybill);
  } catch { res.status(500).json({ error: "Failed to fetch waybill" }); }
};

export const createWaybill = async (req: Request, res: Response) => {
  const companyId = req.user?.companyId;
  if (!companyId) { res.status(400).json({ error: "Company ID missing" }); return; }
  const { customerId, saleId, invoiceId, issueDate, deliveryDate, deliveredTo, driverName, vehicleNo, notes, items = [] } = req.body;
  try {
    const waybillNumber = await nextWaybillNumber(prisma as any, companyId);
    const waybill = await prisma.waybill.create({
      data: {
        companyId, waybillNumber,
        customerId: customerId || undefined,
        saleId: saleId || undefined,
        invoiceId: invoiceId || undefined,
        issueDate: issueDate ? new Date(issueDate) : new Date(),
        deliveryDate: deliveryDate ? new Date(deliveryDate) : undefined,
        deliveredTo, driverName, vehicleNo, notes,
        Items: {
          create: items.map((i: any) => ({
            itemName: i.itemName,
            quantity: parseInt(i.quantity),
            unit: i.unit || undefined,
          })),
        },
      },
      include: { Items: true, Customer: { select: { customerName: true } } },
    });
    res.status(201).json(waybill);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to create waybill", detail: err.message });
  }
};

export const updateWaybillStatus = async (req: Request, res: Response) => {
  const companyId = req.user?.companyId;
  const { id } = req.params;
  const { status } = req.body;
  if (!companyId) { res.status(400).json({ error: "Company ID missing" }); return; }
  try {
    const waybill = await prisma.waybill.findFirst({ where: { id, companyId } });
    if (!waybill) { res.status(404).json({ error: "Waybill not found" }); return; }
    const updated = await prisma.waybill.update({ where: { id }, data: { status: status as WaybillStatus } });
    res.json(updated);
  } catch { res.status(500).json({ error: "Failed to update waybill status" }); }
};
