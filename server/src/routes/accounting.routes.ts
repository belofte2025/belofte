import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import {
  getAccounts, createAccount, updateAccount, seedAccounts,
  getJournalEntries, getJournalEntry, createManualJournal, reverseJournalEntry,
  getLedgerTransfers, createLedgerTransfer,
  getTrialBalance, getIncomeStatement, getBalanceSheet, getGeneralLedger,
  runAccountingBackfill,
} from "../controllers/accounting.controller";
import { getInvoices, getInvoice, createInvoice, updateInvoiceStatus, recordInvoicePayment, deleteInvoice } from "../controllers/invoice.controller";
import { getExpenses, getExpense, createExpense, deleteExpense } from "../controllers/expense.controller";
import { getWaybills, getWaybill, createWaybill, updateWaybillStatus } from "../controllers/waybill.controller";

const router = Router();
router.use(authenticate);

// Chart of Accounts
router.get("/accounts",             getAccounts);
router.post("/accounts",            createAccount);
router.put("/accounts/:id",         updateAccount);
router.post("/seed-accounts",       seedAccounts);

// Journal Entries
router.get("/journal",              getJournalEntries);
router.get("/journal/:id",          getJournalEntry);
router.post("/journal",             createManualJournal);
router.post("/journal/:id/reverse", reverseJournalEntry);

// Ledger Transfers
router.get("/transfers",            getLedgerTransfers);
router.post("/transfers",           createLedgerTransfer);

// Invoices
router.get("/invoices",                    getInvoices);
router.get("/invoices/:id",                getInvoice);
router.post("/invoices",                   createInvoice);
router.put("/invoices/:id/status",         updateInvoiceStatus);
router.post("/invoices/:id/payment",       recordInvoicePayment);
router.delete("/invoices/:id",             deleteInvoice);

// Expenses
router.get("/expenses",             getExpenses);
router.get("/expenses/:id",         getExpense);
router.post("/expenses",            createExpense);
router.delete("/expenses/:id",      deleteExpense);

// Waybills
router.get("/waybills",             getWaybills);
router.get("/waybills/:id",         getWaybill);
router.post("/waybills",            createWaybill);
router.put("/waybills/:id/status",  updateWaybillStatus);

// Reports
router.get("/reports/trial-balance",     getTrialBalance);
router.get("/reports/income-statement",  getIncomeStatement);
router.get("/reports/balance-sheet",     getBalanceSheet);
router.get("/reports/ledger/:accountId", getGeneralLedger);

// Backfill
router.post("/backfill", runAccountingBackfill);

export default router;
