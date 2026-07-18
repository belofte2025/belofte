import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import {
  getAccounts, createAccount, updateAccount, seedAccounts,
  getJournalEntries, getJournalEntry, createManualJournal, reverseJournalEntry,
  getLedgerTransfers, createLedgerTransfer,
  getTrialBalance, getIncomeStatement, getBalanceSheet, getGeneralLedger,
} from "../controllers/accounting.controller";

const router = Router();
router.use(authenticate);

// Chart of Accounts
router.get("/accounts",            getAccounts);
router.post("/accounts",           createAccount);
router.put("/accounts/:id",        updateAccount);
router.post("/seed-accounts",      seedAccounts);

// Journal Entries
router.get("/journal",             getJournalEntries);
router.get("/journal/:id",         getJournalEntry);
router.post("/journal",            createManualJournal);
router.post("/journal/:id/reverse", reverseJournalEntry);

// Ledger Transfers
router.get("/transfers",           getLedgerTransfers);
router.post("/transfers",          createLedgerTransfer);

// Reports
router.get("/reports/trial-balance",    getTrialBalance);
router.get("/reports/income-statement", getIncomeStatement);
router.get("/reports/balance-sheet",    getBalanceSheet);
router.get("/reports/ledger/:accountId", getGeneralLedger);

export default router;
