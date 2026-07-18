import { Request, Response } from "express";
import prisma from "../utils/prisma";
import { seedDefaultAccounts } from "../services/accounting/seedAccounts";
import { assertBalanced, nextEntryNumber } from "../services/accounting/accounts";
import { JournalSource, JournalEntryStatus, AccountType, NormalBalance } from "@prisma/client";

// ── Chart of Accounts ─────────────────────────────────────────────────────────

export const getAccounts = async (req: Request, res: Response) => {
  const companyId = req.user?.companyId;
  if (!companyId) { res.status(400).json({ error: "Company ID missing" }); return; }
  try {
    const accounts = await prisma.account.findMany({
      where: { companyId },
      orderBy: [{ type: "asc" }, { code: "asc" }],
    });
    res.json(accounts);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch accounts" });
  }
};

export const createAccount = async (req: Request, res: Response) => {
  const companyId = req.user?.companyId;
  if (!companyId) { res.status(400).json({ error: "Company ID missing" }); return; }
  const { code, name, type, normalBalance, parentId, description } = req.body;
  if (!code || !name || !type || !normalBalance) {
    res.status(400).json({ error: "code, name, type, normalBalance are required" }); return;
  }
  try {
    const account = await prisma.account.create({
      data: { companyId, code, name, type: type as AccountType, normalBalance: normalBalance as NormalBalance, parentId, description },
    });
    res.status(201).json(account);
  } catch (err: any) {
    if (err.code === "P2002") { res.status(409).json({ error: "Account code already exists" }); return; }
    res.status(500).json({ error: "Failed to create account" });
  }
};

export const updateAccount = async (req: Request, res: Response) => {
  const companyId = req.user?.companyId;
  const { id } = req.params;
  if (!companyId) { res.status(400).json({ error: "Company ID missing" }); return; }
  try {
    const account = await prisma.account.findFirst({ where: { id, companyId } });
    if (!account) { res.status(404).json({ error: "Account not found" }); return; }
    const { name, description, isActive, parentId } = req.body;
    const updated = await prisma.account.update({ where: { id }, data: { name, description, isActive, parentId } });
    res.json(updated);
  } catch {
    res.status(500).json({ error: "Failed to update account" });
  }
};

export const seedAccounts = async (req: Request, res: Response) => {
  const companyId = req.user?.companyId;
  if (!companyId) { res.status(400).json({ error: "Company ID missing" }); return; }
  try {
    const result = await seedDefaultAccounts(companyId);
    // Also enable accounting for this company
    await prisma.company.update({ where: { id: companyId }, data: { enableAccounting: true } });
    res.json({ message: "Default chart of accounts seeded", ...result });
  } catch (err) {
    res.status(500).json({ error: "Failed to seed accounts" });
  }
};

// ── Journal Entries ───────────────────────────────────────────────────────────

export const getJournalEntries = async (req: Request, res: Response) => {
  const companyId = req.user?.companyId;
  if (!companyId) { res.status(400).json({ error: "Company ID missing" }); return; }
  const { startDate, endDate, source, status, page = "1", limit = "50" } = req.query;
  try {
    const where: any = { companyId };
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate as string);
      if (endDate) {
        const end = new Date(endDate as string);
        end.setDate(end.getDate() + 1);
        where.date.lt = end;
      }
    }
    if (source) where.source = source as JournalSource;
    if (status) where.status = status as JournalEntryStatus;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const [entries, total] = await Promise.all([
      prisma.journalEntry.findMany({
        where,
        include: {
          PostedBy: { select: { userName: true } },
          _count: { select: { lines: true } },
        },
        orderBy: { date: "desc" },
        skip,
        take: limitNum,
      }),
      prisma.journalEntry.count({ where }),
    ]);

    res.json({
      entries,
      pagination: { currentPage: pageNum, totalPages: Math.ceil(total / limitNum), totalCount: total },
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch journal entries" });
  }
};

export const getJournalEntry = async (req: Request, res: Response) => {
  const companyId = req.user?.companyId;
  const { id } = req.params;
  if (!companyId) { res.status(400).json({ error: "Company ID missing" }); return; }
  try {
    const entry = await prisma.journalEntry.findFirst({
      where: { id, companyId },
      include: {
        lines: { include: { Account: { select: { code: true, name: true } } } },
        PostedBy: { select: { userName: true } },
        ReversalOf: { select: { entryNumber: true } },
        Reversals: { select: { entryNumber: true, id: true } },
      },
    });
    if (!entry) { res.status(404).json({ error: "Journal entry not found" }); return; }
    res.json(entry);
  } catch {
    res.status(500).json({ error: "Failed to fetch journal entry" });
  }
};

export const createManualJournal = async (req: Request, res: Response) => {
  const companyId = req.user?.companyId;
  const postedById = req.user?.id;
  if (!companyId || !postedById) { res.status(400).json({ error: "Missing auth context" }); return; }

  const { date, description, lines } = req.body;
  if (!description || !lines || !Array.isArray(lines) || lines.length < 2) {
    res.status(400).json({ error: "description and at least 2 lines required" }); return;
  }

  try {
    const parsedLines = lines.map((l: any) => ({
      accountId: l.accountId,
      debit: parseFloat(l.debit) || 0,
      credit: parseFloat(l.credit) || 0,
      description: l.description,
    }));
    assertBalanced(parsedLines);

    const entryNumber = await nextEntryNumber(prisma as any, companyId);
    const entry = await prisma.journalEntry.create({
      data: {
        companyId,
        entryNumber,
        date: date ? new Date(date) : new Date(),
        description,
        source: JournalSource.MANUAL,
        postedById,
        lines: { create: parsedLines },
      },
      include: { lines: true },
    });
    res.status(201).json(entry);
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Failed to create journal entry" });
  }
};

export const reverseJournalEntry = async (req: Request, res: Response) => {
  const companyId = req.user?.companyId;
  const postedById = req.user?.id;
  const { id } = req.params;
  if (!companyId || !postedById) { res.status(400).json({ error: "Missing auth context" }); return; }
  try {
    const original = await prisma.journalEntry.findFirst({
      where: { id, companyId },
      include: { lines: true },
    });
    if (!original) { res.status(404).json({ error: "Journal entry not found" }); return; }
    if (original.status !== "POSTED") { res.status(400).json({ error: "Only POSTED entries can be reversed" }); return; }

    const entryNumber = await nextEntryNumber(prisma as any, companyId);

    const [reversal] = await prisma.$transaction([
      prisma.journalEntry.create({
        data: {
          companyId,
          entryNumber,
          date: new Date(),
          description: `Reversal of ${original.entryNumber}: ${original.description}`,
          source: original.source,
          reversalOfId: original.id,
          postedById,
          lines: {
            create: original.lines.map(l => ({
              accountId: l.accountId,
              debit: l.credit,
              credit: l.debit,
              description: l.description,
            })),
          },
        },
      }),
      prisma.journalEntry.update({ where: { id }, data: { status: JournalEntryStatus.REVERSED } }),
    ]);

    res.status(201).json(reversal);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to reverse journal entry" });
  }
};

// ── Ledger Transfers ──────────────────────────────────────────────────────────

export const getLedgerTransfers = async (req: Request, res: Response) => {
  const companyId = req.user?.companyId;
  if (!companyId) { res.status(400).json({ error: "Company ID missing" }); return; }
  const { page = "1", limit = "50" } = req.query;
  const pageNum = parseInt(page as string), limitNum = parseInt(limit as string);
  try {
    const [transfers, total] = await Promise.all([
      prisma.ledgerTransfer.findMany({
        where: { companyId },
        include: {
          DebitCustomer: { select: { customerName: true } },
          CreditCustomer: { select: { customerName: true } },
          DebitSupplier: { select: { suppliername: true } },
          CreditSupplier: { select: { suppliername: true } },
          DebitAccount: { select: { code: true, name: true } },
          CreditAccount: { select: { code: true, name: true } },
        },
        orderBy: { date: "desc" },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      }),
      prisma.ledgerTransfer.count({ where: { companyId } }),
    ]);
    res.json({ transfers, pagination: { currentPage: pageNum, totalPages: Math.ceil(total / limitNum), totalCount: total } });
  } catch {
    res.status(500).json({ error: "Failed to fetch transfers" });
  }
};

export const createLedgerTransfer = async (req: Request, res: Response) => {
  const companyId = req.user?.companyId;
  const postedById = req.user?.id;
  if (!companyId || !postedById) { res.status(400).json({ error: "Missing auth context" }); return; }

  const { amount, description, date, debitPartyType, debitCustomerId, debitSupplierId, debitAccountId, creditPartyType, creditCustomerId, creditSupplierId, creditAccountId } = req.body;
  if (!amount || !description || !debitPartyType || !creditPartyType) {
    res.status(400).json({ error: "amount, description, debitPartyType, creditPartyType required" }); return;
  }
  try {
    const transfer = await prisma.ledgerTransfer.create({
      data: {
        companyId, amount: parseFloat(amount), description,
        date: date ? new Date(date) : new Date(),
        debitPartyType, debitCustomerId, debitSupplierId, debitAccountId,
        creditPartyType, creditCustomerId, creditSupplierId, creditAccountId,
        postedById,
      },
    });
    res.status(201).json(transfer);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to create transfer" });
  }
};

// ── Reports ───────────────────────────────────────────────────────────────────

export const getTrialBalance = async (req: Request, res: Response) => {
  const companyId = req.user?.companyId;
  if (!companyId) { res.status(400).json({ error: "Company ID missing" }); return; }
  const { asOf } = req.query;
  const asOfDate = asOf ? new Date(asOf as string) : new Date();
  try {
    const accounts = await prisma.account.findMany({
      where: { companyId, isActive: true },
      include: {
        JournalLines: {
          include: {
            JournalEntry: { select: { date: true, status: true } },
          },
        },
      },
      orderBy: [{ type: "asc" }, { code: "asc" }],
    });

    const rows = accounts.map(acc => {
      let debit = 0, credit = 0;
      for (const line of acc.JournalLines) {
        if (line.JournalEntry.status === "VOID") continue;
        if (line.JournalEntry.date > asOfDate) continue;
        debit  += line.debit;
        credit += line.credit;
      }
      return { id: acc.id, code: acc.code, name: acc.name, type: acc.type, normalBalance: acc.normalBalance, debit, credit, balance: acc.normalBalance === "DEBIT" ? debit - credit : credit - debit };
    }).filter(r => r.debit !== 0 || r.credit !== 0);

    const totalDebit  = rows.reduce((s, r) => s + r.debit,  0);
    const totalCredit = rows.reduce((s, r) => s + r.credit, 0);
    res.json({ rows, totalDebit, totalCredit, asOf: asOfDate });
  } catch {
    res.status(500).json({ error: "Failed to generate trial balance" });
  }
};

export const getIncomeStatement = async (req: Request, res: Response) => {
  const companyId = req.user?.companyId;
  if (!companyId) { res.status(400).json({ error: "Company ID missing" }); return; }
  const { startDate, endDate } = req.query;
  const start = startDate ? new Date(startDate as string) : new Date(new Date().getFullYear(), 0, 1);
  const end   = endDate   ? new Date(endDate   as string) : new Date();
  try {
    const accounts = await prisma.account.findMany({
      where: { companyId, isActive: true, type: { in: ["REVENUE", "COGS", "EXPENSE"] } },
      include: {
        JournalLines: {
          where: { JournalEntry: { date: { gte: start, lte: end }, status: { not: "VOID" } } },
        },
      },
      orderBy: [{ type: "asc" }, { code: "asc" }],
    });

    const revenue: any[] = [], cogs: any[] = [], expenses: any[] = [];
    for (const acc of accounts) {
      const dr = acc.JournalLines.reduce((s, l) => s + l.debit, 0);
      const cr = acc.JournalLines.reduce((s, l) => s + l.credit, 0);
      const balance = acc.normalBalance === "DEBIT" ? dr - cr : cr - dr;
      const row = { code: acc.code, name: acc.name, balance };
      if (acc.type === "REVENUE") revenue.push(row);
      else if (acc.type === "COGS") cogs.push(row);
      else expenses.push(row);
    }

    const totalRevenue  = revenue.reduce((s, r) => s + r.balance, 0);
    const totalCogs     = cogs.reduce((s, r) => s + r.balance, 0);
    const grossProfit   = totalRevenue - totalCogs;
    const totalExpenses = expenses.reduce((s, r) => s + r.balance, 0);
    const netIncome     = grossProfit - totalExpenses;

    res.json({ revenue, cogs, expenses, totalRevenue, totalCogs, grossProfit, totalExpenses, netIncome, startDate: start, endDate: end });
  } catch {
    res.status(500).json({ error: "Failed to generate income statement" });
  }
};

export const getBalanceSheet = async (req: Request, res: Response) => {
  const companyId = req.user?.companyId;
  if (!companyId) { res.status(400).json({ error: "Company ID missing" }); return; }
  const { asOf } = req.query;
  const asOfDate = asOf ? new Date(asOf as string) : new Date();
  try {
    const accounts = await prisma.account.findMany({
      where: { companyId, isActive: true, type: { in: ["ASSET", "LIABILITY", "EQUITY"] } },
      include: {
        JournalLines: {
          where: { JournalEntry: { date: { lte: asOfDate }, status: { not: "VOID" } } },
        },
      },
      orderBy: [{ type: "asc" }, { code: "asc" }],
    });

    const assets: any[] = [], liabilities: any[] = [], equity: any[] = [];
    for (const acc of accounts) {
      const dr = acc.JournalLines.reduce((s, l) => s + l.debit, 0);
      const cr = acc.JournalLines.reduce((s, l) => s + l.credit, 0);
      const balance = acc.normalBalance === "DEBIT" ? dr - cr : cr - dr;
      const row = { code: acc.code, name: acc.name, balance };
      if (acc.type === "ASSET") assets.push(row);
      else if (acc.type === "LIABILITY") liabilities.push(row);
      else equity.push(row);
    }

    const totalAssets      = assets.reduce((s, r) => s + r.balance, 0);
    const totalLiabilities = liabilities.reduce((s, r) => s + r.balance, 0);
    const totalEquity      = equity.reduce((s, r) => s + r.balance, 0);

    res.json({ assets, liabilities, equity, totalAssets, totalLiabilities, totalEquity, asOf: asOfDate });
  } catch {
    res.status(500).json({ error: "Failed to generate balance sheet" });
  }
};

export const getGeneralLedger = async (req: Request, res: Response) => {
  const companyId = req.user?.companyId;
  const { accountId } = req.params;
  const { startDate, endDate } = req.query;
  if (!companyId) { res.status(400).json({ error: "Company ID missing" }); return; }
  try {
    const account = await prisma.account.findFirst({ where: { id: accountId, companyId } });
    if (!account) { res.status(404).json({ error: "Account not found" }); return; }

    const where: any = { accountId };
    if (startDate || endDate) {
      where.JournalEntry = { date: {} };
      if (startDate) where.JournalEntry.date.gte = new Date(startDate as string);
      if (endDate)   where.JournalEntry.date.lte = new Date(endDate as string);
    }

    const lines = await prisma.journalLine.findMany({
      where,
      include: { JournalEntry: { select: { entryNumber: true, date: true, description: true, source: true, status: true } } },
      orderBy: { JournalEntry: { date: "asc" } },
    });

    let runningBalance = 0;
    const rows = lines.map(l => {
      const movement = account.normalBalance === "DEBIT" ? l.debit - l.credit : l.credit - l.debit;
      runningBalance += movement;
      return { id: l.id, date: l.JournalEntry.date, entryNumber: l.JournalEntry.entryNumber, description: l.description || l.JournalEntry.description, source: l.JournalEntry.source, status: l.JournalEntry.status, debit: l.debit, credit: l.credit, balance: runningBalance };
    });

    res.json({ account, rows });
  } catch {
    res.status(500).json({ error: "Failed to fetch general ledger" });
  }
};
