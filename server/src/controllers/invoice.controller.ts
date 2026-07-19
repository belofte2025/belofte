import { Request, Response } from "express";
import prisma from "../utils/prisma";
import { postInvoiceJournal, lookupItemCosts } from "../services/accounting/journalEngine";
import { nextInvoiceNumber } from "../services/accounting/accounts";
import { InvoiceStatus } from "@prisma/client";

export const getInvoices = async (req: Request, res: Response) => {
  const companyId = req.user?.companyId;
  if (!companyId) { res.status(400).json({ error: "Company ID missing" }); return; }
  const { status, customerId, startDate, endDate, page = "1", limit = "50" } = req.query;
  try {
    const where: any = { companyId };
    if (status) where.status = status as InvoiceStatus;
    if (customerId) where.customerId = customerId as string;
    if (startDate || endDate) {
      where.issueDate = {};
      if (startDate) where.issueDate.gte = new Date(startDate as string);
      if (endDate) { const e = new Date(endDate as string); e.setDate(e.getDate() + 1); where.issueDate.lt = e; }
    }
    const pageNum = parseInt(page as string), limitNum = parseInt(limit as string);
    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: { Customer: { select: { customerName: true, phone: true } }, _count: { select: { Items: true } } },
        orderBy: { createdAt: "desc" },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      }),
      prisma.invoice.count({ where }),
    ]);
    const summary = await prisma.invoice.aggregate({ where, _sum: { totalAmount: true, paidAmount: true } });
    res.json({
      invoices,
      pagination: { currentPage: pageNum, totalPages: Math.ceil(total / limitNum), totalCount: total },
      summary: { totalValue: summary._sum.totalAmount ?? 0, totalPaid: summary._sum.paidAmount ?? 0 },
    });
  } catch { res.status(500).json({ error: "Failed to fetch invoices" }); }
};

export const getInvoice = async (req: Request, res: Response) => {
  const companyId = req.user?.companyId;
  const { id } = req.params;
  if (!companyId) { res.status(400).json({ error: "Company ID missing" }); return; }
  try {
    const invoice = await prisma.invoice.findFirst({
      where: { id, companyId },
      include: {
        Customer: true,
        Items: true,
        JournalEntries: { select: { entryNumber: true, status: true, date: true } },
      },
    });
    if (!invoice) { res.status(404).json({ error: "Invoice not found" }); return; }
    res.json(invoice);
  } catch { res.status(500).json({ error: "Failed to fetch invoice" }); }
};

export const createInvoice = async (req: Request, res: Response) => {
  const companyId = req.user?.companyId;
  const postedById = req.user?.id;
  if (!companyId || !postedById) { res.status(400).json({ error: "Missing auth context" }); return; }
  const { customerId, issueDate, dueDate, notes, terms, items, discountValue = 0 } = req.body;
  if (!customerId || !items?.length) { res.status(400).json({ error: "customerId and items required" }); return; }
  try {
    const invoiceNumber = await nextInvoiceNumber(prisma as any, companyId);
    const subtotal = items.reduce((s: number, i: any) => s + i.quantity * i.unitPrice, 0);
    const totalAmount = Math.max(0, subtotal - parseFloat(discountValue));

    // Look up purchase costs at invoice creation time so COGS is frozen
    const costMap = await lookupItemCosts(prisma as any, companyId, items.map((i: any) => i.itemName));

    const invoice = await prisma.invoice.create({
      data: {
        companyId, customerId, invoiceNumber,
        issueDate: issueDate ? new Date(issueDate) : new Date(),
        dueDate: dueDate ? new Date(dueDate) : undefined,
        notes, terms, subtotal, discountValue: parseFloat(discountValue), totalAmount,
        Items: {
          create: items.map((i: any) => ({
            itemName: i.itemName,
            quantity: parseInt(i.quantity),
            unitPrice: parseFloat(i.unitPrice),
            total: parseInt(i.quantity) * parseFloat(i.unitPrice),
            costPrice: costMap.get(i.itemName) ?? 0,
          })),
        },
      },
      include: { Items: true },
    });

    // Post journal if accounting enabled
    try {
      const company = await prisma.company.findUnique({ where: { id: companyId }, select: { enableAccounting: true } });
      if (company?.enableAccounting) {
        await postInvoiceJournal(prisma as any, { ...invoice, issueDate: invoice.issueDate }, invoice.Items, companyId, postedById);
      }
    } catch (journalErr) { console.error("Invoice journal failed (non-fatal):", journalErr); }

    res.status(201).json(invoice);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to create invoice", detail: err.message });
  }
};

export const updateInvoiceStatus = async (req: Request, res: Response) => {
  const companyId = req.user?.companyId;
  const { id } = req.params;
  const { status } = req.body;
  if (!companyId) { res.status(400).json({ error: "Company ID missing" }); return; }
  try {
    const invoice = await prisma.invoice.findFirst({ where: { id, companyId } });
    if (!invoice) { res.status(404).json({ error: "Invoice not found" }); return; }
    const updated = await prisma.invoice.update({ where: { id }, data: { status: status as InvoiceStatus } });
    res.json(updated);
  } catch { res.status(500).json({ error: "Failed to update invoice status" }); }
};

export const recordInvoicePayment = async (req: Request, res: Response) => {
  const companyId = req.user?.companyId;
  const { id } = req.params;
  const { amount, paymentType, depositAccountCode, note, paymentDate } = req.body;
  if (!companyId) { res.status(400).json({ error: "Company ID missing" }); return; }
  try {
    const invoice = await prisma.invoice.findFirst({ where: { id, companyId } });
    if (!invoice) { res.status(404).json({ error: "Invoice not found" }); return; }

    const paidAmount = invoice.paidAmount + parseFloat(amount);
    const newStatus: InvoiceStatus = paidAmount >= invoice.totalAmount ? "PAID"
      : paidAmount > 0 ? "PARTIAL" : invoice.status;

    const [updatedInvoice, payment] = await prisma.$transaction([
      prisma.invoice.update({ where: { id }, data: { paidAmount, status: newStatus } }),
      prisma.customerPayment.create({
        data: {
          customerId: invoice.customerId,
          companyId,
          amount: parseFloat(amount),
          note,
          paymentType,
          depositAccountCode,
          createdAt: paymentDate ? new Date(paymentDate) : new Date(),
        },
      }),
    ]);

    res.json({ invoice: updatedInvoice, payment });
  } catch { res.status(500).json({ error: "Failed to record payment" }); }
};

export const deleteInvoice = async (req: Request, res: Response) => {
  const companyId = req.user?.companyId;
  const { id } = req.params;
  if (!companyId) { res.status(400).json({ error: "Company ID missing" }); return; }
  try {
    const invoice = await prisma.invoice.findFirst({ where: { id, companyId } });
    if (!invoice) { res.status(404).json({ error: "Invoice not found" }); return; }
    if (invoice.status === "PAID") { res.status(400).json({ error: "Cannot delete a paid invoice. Void it instead." }); return; }
    await prisma.invoice.delete({ where: { id } });
    res.json({ message: "Invoice deleted" });
  } catch { res.status(500).json({ error: "Failed to delete invoice" }); }
};
