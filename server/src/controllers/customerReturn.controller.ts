import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { nextReturnNumber } from "../services/accounting/accounts";
import { postCustomerReturnJournal } from "../services/accounting/journalEngine";

const prisma = new PrismaClient();

export const createCustomerReturn = async (req: Request, res: Response) => {
  try {
    const companyId = req.user?.companyId;
    const userId = req.user?.id;
    if (!companyId || !userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { customerId, saleId, items, note } = req.body;

    if (!customerId || !items?.length) {
      res.status(400).json({ error: "customerId and items are required" });
      return;
    }

    const customer = await prisma.customer.findFirst({ where: { id: customerId, companyId } });
    if (!customer) {
      res.status(404).json({ error: "Customer not found" });
      return;
    }

    let saleType = "credit";
    if (saleId) {
      const sale = await prisma.sale.findFirst({ where: { id: saleId, companyId }, select: { saleType: true } });
      if (!sale) {
        res.status(404).json({ error: "Sale not found" });
        return;
      }
      saleType = sale.saleType;
    }

    const totalAmount = items.reduce(
      (s: number, i: { quantity: number; unitPrice: number }) => s + i.quantity * i.unitPrice,
      0
    );

    const result = await prisma.$transaction(async (tx) => {
      const returnNo = await nextReturnNumber(tx as any, companyId);

      const returnRecord = await tx.customerReturn.create({
        data: {
          returnNo,
          customerId,
          companyId,
          saleId: saleId || null,
          totalAmount,
          note: note || null,
          Items: {
            createMany: {
              data: items.map((i: any) => ({
                itemName: i.itemName,
                quantity: i.quantity,
                unitPrice: i.unitPrice,
                costPrice: i.costPrice ?? 0,
              })),
            },
          },
        },
        include: { Items: true },
      });

      // Reduce customer balance (they owe less / get a credit)
      await tx.customer.update({
        where: { id: customerId },
        data: { balance: { decrement: totalAmount } },
      });

      const company = await tx.company.findUnique({
        where: { id: companyId },
        select: { enableAccounting: true },
      });

      if (company?.enableAccounting) {
        await postCustomerReturnJournal(
          tx as any,
          { id: returnRecord.id, totalAmount, companyId, createdAt: returnRecord.createdAt, saleType },
          returnRecord.Items,
          companyId,
          userId
        );
      }

      return returnRecord;
    });

    res.status(201).json(result);
  } catch (err) {
    console.error("createCustomerReturn error:", err);
    res.status(500).json({ error: "Failed to create customer return" });
  }
};

export const getCustomerReturns = async (req: Request, res: Response) => {
  try {
    const companyId = req.user?.companyId;
    const { customerId } = req.params;

    const returns = await prisma.customerReturn.findMany({
      where: { customerId, companyId },
      include: {
        Items: true,
        Sale: { select: { id: true, createdAt: true, totalAmount: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(returns);
  } catch {
    res.status(500).json({ error: "Failed to fetch customer returns" });
  }
};

export const getCompanyReturns = async (req: Request, res: Response) => {
  try {
    const companyId = req.user?.companyId;

    const returns = await prisma.customerReturn.findMany({
      where: { companyId },
      include: {
        Customer: { select: { customerName: true } },
        Items: true,
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(returns);
  } catch {
    res.status(500).json({ error: "Failed to fetch returns" });
  }
};
