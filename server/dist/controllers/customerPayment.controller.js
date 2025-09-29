"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCustomerPayments = exports.deleteCustomerPayment = exports.getCustomerStatement = exports.recordCustomerPayment = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const recordCustomerPayment = async (req, res) => {
    const { customerId, amount, note, paymentType } = req.body;
    const companyId = req.user?.companyId;
    if (!companyId) {
        res.status(400).json({ error: "Company ID missing" });
        return;
    }
    try {
        const payment = await prisma_1.default.customerPayment.create({
            data: { customerId, amount, note, paymentType, companyId },
        });
        res.status(201).json(payment);
    }
    catch (err) {
        res.status(500).json({ error: "Failed to record payment", detail: err });
    }
};
exports.recordCustomerPayment = recordCustomerPayment;
const getCustomerStatement = async (req, res) => {
    const { id } = req.params; // customerId
    const sales = await prisma_1.default.sale.findMany({
        where: { customerId: id },
        select: {
            createdAt: true,
            totalAmount: true,
            saleType: true,
            id: true,
        },
    });
    const payments = await prisma_1.default.customerPayment.findMany({
        where: { customerId: id },
        select: {
            createdAt: true,
            amount: true,
            note: true,
            id: true,
        },
    });
    // Merge & sort by date
    const timeline = [
        ...sales.map((s) => ({
            type: "sale",
            date: s.createdAt,
            amount: s.totalAmount,
            detail: `Sale (${s.saleType})`,
        })),
        ...payments.map((p) => ({
            type: "payment",
            date: p.createdAt,
            amount: p.amount,
            detail: `Payment${p.note ? ` - ${p.note}` : ""}`,
        })),
    ].sort((a, b) => a.date.getTime() - b.date.getTime());
    // Running balance
    let balance = 0;
    const statement = timeline.map((t) => {
        balance += t.type === "sale" ? t.amount : -t.amount;
        return { ...t, balance };
    });
    res.json(statement);
};
exports.getCustomerStatement = getCustomerStatement;
const deleteCustomerPayment = async (req, res) => {
    const paymentId = req.params.id;
    try {
        // Check if payment exists
        const existingPayment = await prisma_1.default.customerPayment.findUnique({
            where: { id: paymentId },
        });
        if (!existingPayment) {
            res.status(404).json({ error: "Payment not found" });
            return;
        }
        // Delete the payment
        await prisma_1.default.customerPayment.delete({
            where: { id: paymentId },
        });
        res.json({ message: "Payment deleted successfully" });
        return;
    }
    catch (error) {
        console.error("Failed to delete payment:", error);
        res.status(500).json({ error: "Failed to delete payment" });
        return;
    }
};
exports.deleteCustomerPayment = deleteCustomerPayment;
const getCustomerPayments = async (req, res) => {
    const { id } = req.params;
    const companyId = req.user?.companyId;
    if (!companyId) {
        res.status(400).json({ error: "Missing company context." });
        return;
    }
    try {
        const payments = await prisma_1.default.customerPayment.findMany({
            where: {
                customerId: id,
                companyId,
            },
            orderBy: { createdAt: "desc" },
        });
        res.json(payments);
    }
    catch (error) {
        console.error("Error fetching customer payments:", error);
        res.status(500).json({ error: "Failed to fetch customer payments" });
    }
};
exports.getCustomerPayments = getCustomerPayments;
