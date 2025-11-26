"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCustomerStatement = exports.getCustomerPayments = exports.createCustomerPayment = exports.updateCustomer = exports.getCustomerByIdBal = exports.getCustomerById = exports.getCustomers = exports.createCustomer = exports.checkCustomerName = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const checkCustomerName = async (req, res) => {
    try {
        const { customerName } = req.query;
        const companyId = req.user?.companyId;
        if (!companyId) {
            res.status(400).json({ error: "Company ID missing" });
            return;
        }
        if (!customerName || typeof customerName !== "string") {
            res.status(400).json({ error: "Customer name is required" });
            return;
        }
        // Find customers with similar names (case-insensitive)
        const similarCustomers = await prisma_1.default.customer.findMany({
            where: {
                companyId,
                customerName: {
                    contains: customerName,
                    mode: "insensitive",
                },
            },
            select: {
                id: true,
                customerName: true,
                phone: true,
            },
            take: 5,
        });
        res.json({ similarCustomers });
    }
    catch (err) {
        console.error("Check customer name error:", err);
        res.status(500).json({ error: "Failed to check customer name" });
    }
};
exports.checkCustomerName = checkCustomerName;
const createCustomer = async (req, res) => {
    try {
        const { customerName, phone } = req.body;
        const companyId = req.user?.companyId;
        if (!companyId) {
            res.status(400).json({ error: "Company ID missing" });
            return;
        }
        // Check for duplicates by name and phone within the same company
        const existingCustomer = await prisma_1.default.customer.findFirst({
            where: {
                customerName: customerName,
                phone: phone,
                companyId: companyId,
            },
        });
        if (existingCustomer) {
            res.status(409).json({
                error: "Customer already exists with this name and phone number.",
            });
            return;
        }
        const customer = await prisma_1.default.customer.create({
            data: { customerName, phone, companyId },
        });
        res.status(201).json(customer);
        return;
    }
    catch (err) {
        console.error("Customer creation error:", err);
        res.status(500).json({
            error: "Failed to create customer",
            detail: err instanceof Error ? err.message : err,
        });
        return;
    }
};
exports.createCustomer = createCustomer;
// GET /customers - NOW INCLUDES DEBTS IN BALANCE
const getCustomers = async (req, res) => {
    const companyId = req.user?.companyId;
    if (!companyId) {
        res.status(400).json({ error: "Company ID is required" });
        return;
    }
    try {
        // Get all customers for this company with their related data
        const customers = await prisma_1.default.customer.findMany({
            where: { companyId },
            select: {
                id: true,
                customerName: true,
                phone: true,
                balance: true,
                sale: {
                    where: { saleType: "credit" },
                    select: { totalAmount: true },
                },
                custpayment: {
                    select: { amount: true },
                },
                debts: {
                    where: {
                        OR: [{ status: "unpaid" }, { status: "partial" }],
                    },
                    select: { amount: true, status: true },
                },
            },
            orderBy: { customerName: "asc" },
        });
        // Calculate accurate balance for each customer
        const enrichedCustomers = customers.map((customer) => {
            // Calculate total credit sales
            const totalCreditSales = customer.sale.reduce((sum, s) => sum + s.totalAmount, 0);
            // Calculate total payments
            const totalPayments = customer.custpayment.reduce((sum, p) => sum + p.amount, 0);
            // Calculate total unpaid debts
            const totalUnpaidDebts = customer.debts.reduce((sum, d) => sum + d.amount, 0);
            // Calculate the actual balance
            // Balance = Credit Sales + Unpaid Debts - Payments
            const calculatedBalance = totalCreditSales + totalUnpaidDebts - totalPayments;
            return {
                id: customer.id,
                name: customer.customerName,
                phone: customer.phone,
                balance: calculatedBalance,
            };
        });
        res.json(enrichedCustomers);
    }
    catch (err) {
        console.error("Failed to fetch customers with balances", err);
        res.status(500).json({ error: "Internal server error" });
    }
};
exports.getCustomers = getCustomers;
const getCustomerById = async (req, res) => {
    try {
        const companyId = req.user?.companyId;
        const { id } = req.params;
        const customer = await prisma_1.default.customer.findFirst({
            where: { id, companyId },
            include: {
                debts: {
                    where: { status: { not: "paid" } },
                },
            },
        });
        if (!customer) {
            res.status(404).json({ error: "Customer not found" });
            return;
        }
        res.json(customer);
    }
    catch (err) {
        res.status(500).json({ error: "Failed to fetch customer", detail: err });
    }
};
exports.getCustomerById = getCustomerById;
const getCustomerByIdBal = async (req, res) => {
    try {
        const companyId = req.user?.companyId;
        const { id } = req.params;
        if (!companyId) {
            res.status(400).json({ error: "Company ID is required" });
            return;
        }
        const customer = await prisma_1.default.customer.findFirst({
            where: { id, companyId },
            select: {
                id: true,
                customerName: true,
                phone: true,
                sale: {
                    where: { saleType: "credit" },
                    select: { totalAmount: true },
                },
                custpayment: {
                    select: { amount: true },
                },
                debts: {
                    where: {
                        OR: [{ status: "unpaid" }, { status: "partial" }],
                    },
                    select: { amount: true, status: true },
                },
            },
        });
        if (!customer) {
            res.status(404).json({ error: "Customer not found" });
            return;
        }
        // Calculate balance (same as getCustomers)
        const totalCreditSales = customer.sale.reduce((sum, s) => sum + s.totalAmount, 0);
        const totalPayments = customer.custpayment.reduce((sum, p) => sum + p.amount, 0);
        const totalUnpaidDebts = customer.debts.reduce((sum, d) => sum + d.amount, 0);
        const calculatedBalance = totalCreditSales + totalUnpaidDebts - totalPayments;
        res.json({
            id: customer.id,
            name: customer.customerName,
            phone: customer.phone,
            balance: calculatedBalance,
        });
    }
    catch (err) {
        console.error("Failed to fetch customer:", err);
        res.status(500).json({ error: "Failed to fetch customer", detail: err });
    }
};
exports.getCustomerByIdBal = getCustomerByIdBal;
const updateCustomer = async (req, res) => {
    try {
        const companyId = req.user?.companyId;
        const { id } = req.params;
        const { customerName, phone } = req.body;
        const customer = await prisma_1.default.customer.findFirst({
            where: { id, companyId },
        });
        if (!customer) {
            res.status(404).json({ error: "Customer not found" });
            return;
        }
        const updated = await prisma_1.default.customer.update({
            where: { id },
            data: { customerName, phone },
        });
        res.json(updated);
    }
    catch (err) {
        res.status(400).json({ error: "Failed to update customer", detail: err });
    }
};
exports.updateCustomer = updateCustomer;
// Record a customer payment
const createCustomerPayment = async (req, res) => {
    try {
        const { amount, note } = req.body;
        const { id: customerId } = req.params;
        const companyId = req.user?.companyId;
        if (!amount || isNaN(amount)) {
            res.status(400).json({ error: "Invalid or missing amount." });
            return;
        }
        if (!companyId) {
            res.status(400).json({ error: "Company ID is required." });
            return;
        }
        const payment = await prisma_1.default.customerPayment.create({
            data: {
                amount,
                note,
                customerId,
                companyId,
            },
        });
        // Update customer balance
        await prisma_1.default.customer.update({
            where: { id: customerId },
            data: {
                balance: {
                    decrement: parseFloat(amount),
                },
            },
        });
        res.status(201).json(payment);
        return;
    }
    catch (error) {
        console.error("Error recording payment:", error);
        res.status(500).json({ error: "Internal server error." });
        return;
    }
};
exports.createCustomerPayment = createCustomerPayment;
// List payments for a customer
const getCustomerPayments = async (req, res) => {
    try {
        const { id: customerId } = req.params;
        const companyId = req.user?.companyId;
        const payments = await prisma_1.default.customerPayment.findMany({
            where: {
                customerId,
                companyId,
            },
            orderBy: {
                createdAt: "desc",
            },
        });
        res.json(payments);
        return;
    }
    catch (error) {
        console.error("Error fetching payments:", error);
        res.status(500).json({ error: "Internal server error." });
        return;
    }
};
exports.getCustomerPayments = getCustomerPayments;
// GET CUSTOMER STATEMENT - NOW INCLUDES DEBTS
const getCustomerStatement = async (req, res) => {
    try {
        const customerId = req.params.id;
        const companyId = req.user?.companyId;
        // Fetch credit sales
        const sales = await prisma_1.default.sale.findMany({
            where: { customerId, companyId, saleType: "credit" },
            select: {
                id: true,
                createdAt: true,
                totalAmount: true,
                items: true,
            },
        });
        // Fetch payments
        const payments = await prisma_1.default.customerPayment.findMany({
            where: { customerId, companyId },
            select: {
                id: true,
                createdAt: true,
                amount: true,
                note: true,
            },
        });
        // Fetch debts
        const debts = await prisma_1.default.customerDebt.findMany({
            where: { customerId, companyId },
            select: {
                id: true,
                createdAt: true,
                amount: true,
                description: true,
                debtType: true,
                status: true,
            },
        });
        // Combine all transactions into a unified statement
        const statementItems = [
            // Credit sales (increase balance)
            ...sales.map((s) => ({
                id: s.id,
                date: s.createdAt.toISOString().split("T")[0],
                timestamp: s.createdAt,
                type: "credit_sale",
                description: s.items
                    .map((i) => `${i.quantity}x ${i.itemName}`)
                    .join(", "),
                debit: s.totalAmount, // Amount owed (increases balance)
                credit: 0,
                status: "completed",
            })),
            // Payments (decrease balance)
            ...payments.map((p) => ({
                id: p.id,
                date: p.createdAt.toISOString().split("T")[0],
                timestamp: p.createdAt,
                type: "payment",
                description: p.note || "Payment received",
                debit: 0,
                credit: p.amount, // Payment received (decreases balance)
                status: "completed",
            })),
            // Debts (increase balance)
            ...debts.map((d) => ({
                id: d.id,
                date: d.createdAt.toISOString().split("T")[0],
                timestamp: d.createdAt,
                type: "debt",
                description: d.description || `${d.debtType.replace("_", " ")} debt`,
                debit: d.status !== "paid" ? d.amount : 0, // Only unpaid debts affect balance
                credit: d.status === "paid" ? d.amount : 0, // Paid debts shown as credit
                status: d.status,
            })),
        ].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
        // Calculate running balance for each transaction
        let runningBalance = 0;
        const statement = statementItems.map((item) => {
            runningBalance = runningBalance + item.debit - item.credit;
            return {
                ...item,
                balance: runningBalance,
            };
        });
        // Calculate summary
        const totalDebits = statement.reduce((sum, item) => sum + item.debit, 0);
        const totalCredits = statement.reduce((sum, item) => sum + item.credit, 0);
        const currentBalance = totalDebits - totalCredits;
        res.json({
            statement,
            summary: {
                totalDebits,
                totalCredits,
                currentBalance,
                totalTransactions: statement.length,
            },
        });
    }
    catch (err) {
        console.error("Statement fetch error:", err);
        res.status(500).json({ error: "Internal error" });
    }
};
exports.getCustomerStatement = getCustomerStatement;
