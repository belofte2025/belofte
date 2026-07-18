import { Request, Response } from "express";
import prisma from "../utils/prisma";
import { postExpenseJournal } from "../services/accounting/journalEngine";
import { nextExpenseNumber } from "../services/accounting/accounts";

export const getExpenses = async (req: Request, res: Response) => {
  const companyId = req.user?.companyId;
  if (!companyId) { res.status(400).json({ error: "Company ID missing" }); return; }
  const { startDate, endDate, accountId, page = "1", limit = "50" } = req.query;
  try {
    const where: any = { companyId };
    if (accountId) where.accountId = accountId as string;
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate as string);
      if (endDate) { const e = new Date(endDate as string); e.setDate(e.getDate() + 1); where.date.lt = e; }
    }
    const pageNum = parseInt(page as string), limitNum = parseInt(limit as string);
    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        include: {
          ExpenseAccount:  { select: { code: true, name: true } },
          PaymentAccount:  { select: { code: true, name: true } },
          PostedBy:        { select: { userName: true } },
        },
        orderBy: { date: "desc" },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      }),
      prisma.expense.count({ where }),
    ]);
    const summary = await prisma.expense.aggregate({ where, _sum: { amount: true } });
    res.json({
      expenses,
      pagination: { currentPage: pageNum, totalPages: Math.ceil(total / limitNum), totalCount: total },
      totalAmount: summary._sum.amount ?? 0,
    });
  } catch { res.status(500).json({ error: "Failed to fetch expenses" }); }
};

export const getExpense = async (req: Request, res: Response) => {
  const companyId = req.user?.companyId;
  const { id } = req.params;
  if (!companyId) { res.status(400).json({ error: "Company ID missing" }); return; }
  try {
    const expense = await prisma.expense.findFirst({
      where: { id, companyId },
      include: {
        ExpenseAccount:  { select: { code: true, name: true } },
        PaymentAccount:  { select: { code: true, name: true } },
        PostedBy:        { select: { userName: true } },
        JournalEntries:  { select: { entryNumber: true, status: true } },
      },
    });
    if (!expense) { res.status(404).json({ error: "Expense not found" }); return; }
    res.json(expense);
  } catch { res.status(500).json({ error: "Failed to fetch expense" }); }
};

export const createExpense = async (req: Request, res: Response) => {
  const companyId  = req.user?.companyId;
  const postedById = req.user?.id;
  if (!companyId || !postedById) { res.status(400).json({ error: "Missing auth context" }); return; }
  const { date, description, amount, accountId, paymentAccountId, reference } = req.body;
  if (!description || !amount || !accountId || !paymentAccountId) {
    res.status(400).json({ error: "description, amount, accountId, paymentAccountId required" }); return;
  }
  try {
    const expenseNumber = await nextExpenseNumber(prisma as any, companyId);
    const expense = await prisma.expense.create({
      data: {
        companyId, expenseNumber, description,
        amount: parseFloat(amount),
        accountId, paymentAccountId, reference,
        postedById,
        date: date ? new Date(date) : new Date(),
      },
      include: { ExpenseAccount: true, PaymentAccount: true },
    });

    // Post journal
    try {
      const company = await prisma.company.findUnique({ where: { id: companyId }, select: { enableAccounting: true } });
      if (company?.enableAccounting) {
        await postExpenseJournal(prisma as any, expense, companyId, postedById);
      }
    } catch (journalErr) { console.error("Expense journal failed (non-fatal):", journalErr); }

    res.status(201).json(expense);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to create expense", detail: err.message });
  }
};

export const deleteExpense = async (req: Request, res: Response) => {
  const companyId = req.user?.companyId;
  const { id } = req.params;
  if (!companyId) { res.status(400).json({ error: "Company ID missing" }); return; }
  try {
    const expense = await prisma.expense.findFirst({ where: { id, companyId } });
    if (!expense) { res.status(404).json({ error: "Expense not found" }); return; }
    await prisma.expense.delete({ where: { id } });
    res.json({ message: "Expense deleted" });
  } catch { res.status(500).json({ error: "Failed to delete expense" }); }
};
