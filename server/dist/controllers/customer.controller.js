"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCustomerStatement = exports.getCustomerPayments = exports.createCustomerPayment = exports.updateCustomer = exports.getCustomerById = exports.getCustomers = exports.createCustomer = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
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
// GET /customers
const getCustomers = async (req, res) => {
    const companyId = req.user?.companyId;
    if (!companyId)
        res.status(400).json({ error: "Company ID is required" });
    try {
        // Get all customers for this company
        const customers = await prisma_1.default.customer.findMany({
            where: { companyId },
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
            },
            orderBy: { customerName: "asc" },
        });
        // Calculate balance dynamically
        const enrichedCustomers = customers.map((customer) => {
            const totalCredit = customer.sale.reduce((sum, s) => sum + s.totalAmount, 0);
            const totalPayments = customer.custpayment.reduce((sum, p) => sum + p.amount, 0);
            const balance = totalCredit - totalPayments;
            return {
                id: customer.id,
                name: customer.customerName,
                phone: customer.phone,
                balance,
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
                companyId, // Now companyId is guaranteed to be string
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
// customer.controller.ts
const getCustomerStatement = async (req, res) => {
    try {
        const customerId = req.params.id;
        const companyId = req.user?.companyId;
        const sales = await prisma_1.default.sale.findMany({
            where: { customerId, companyId, saleType: "credit" },
            select: {
                id: true,
                createdAt: true,
                totalAmount: true,
                items: true,
            },
        });
        const payments = await prisma_1.default.customerPayment.findMany({
            where: { customerId, companyId },
            select: {
                id: true,
                createdAt: true,
                amount: true,
                note: true,
            },
        });
        const statement = [
            ...sales.map((s) => ({
                id: s.id,
                date: s.createdAt.toISOString().split("T")[0],
                type: "sale",
                description: s.items
                    .map((i) => `${i.quantity}x ${i.itemName}`)
                    .join(", "),
                amount: s.totalAmount,
            })),
            ...payments.map((p) => ({
                id: p.id,
                date: p.createdAt.toISOString().split("T")[0],
                type: "payment",
                description: p.note || "Payment received",
                amount: p.amount,
            })),
        ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        res.json(statement);
    }
    catch (err) {
        console.error("Statement fetch error:", err);
        res.status(500).json({ error: "Internal error" });
    }
};
exports.getCustomerStatement = getCustomerStatement;
