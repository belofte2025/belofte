"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllCustomerPayments = exports.getCustomerPayments = exports.deleteCustomerPayment = exports.getCustomerStatement = exports.recordCustomerPayment = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const recordCustomerPayment = async (req, res) => {
    const { customerId, amount, note, paymentType, paymentDate } = req.body;
    const companyId = req.user?.companyId;
    if (!companyId) {
        res.status(400).json({ error: "Company ID missing" });
        return;
    }
    try {
        const paymentData = {
            customerId,
            amount,
            note,
            paymentType,
            companyId
        };
        // If a custom payment date is provided, use it
        if (paymentDate) {
            paymentData.createdAt = new Date(paymentDate);
        }
        const payment = await prisma_1.default.customerPayment.create({
            data: paymentData,
        });
        res.status(201).json(payment);
    }
    catch (err) {
        res.status(500).json({ error: "Failed to record payment", detail: err });
    }
};
exports.recordCustomerPayment = recordCustomerPayment;
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
// GET ALL PAYMENTS WITH DATE FILTERING AND PAGINATION
const getAllCustomerPayments = async (req, res) => {
    const companyId = req.user?.companyId;
    if (!companyId) {
        res.status(400).json({ error: "Company ID missing" });
        return;
    }
    try {
        // Extract query parameters
        const { startDate, endDate, customerId, paymentType, page = "1", limit = "50", } = req.query;
        // Build filter conditions
        const where = {
            companyId,
        };
        // Date filtering
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) {
                where.createdAt.gte = new Date(startDate);
            }
            if (endDate) {
                // Add 1 day and set to start of day to include the entire end date
                const endDateTime = new Date(endDate);
                endDateTime.setDate(endDateTime.getDate() + 1);
                endDateTime.setHours(0, 0, 0, 0);
                where.createdAt.lt = endDateTime;
            }
        }
        // Customer filtering
        if (customerId) {
            where.customerId = customerId;
        }
        // Payment type filtering
        if (paymentType) {
            where.paymentType = paymentType;
        }
        // Pagination
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        // Fetch payments with customer details
        const [payments, totalCount] = await Promise.all([
            prisma_1.default.customerPayment.findMany({
                where,
                include: {
                    customer: {
                        select: {
                            id: true,
                            customerName: true,
                            phone: true,
                        },
                    },
                },
                orderBy: { createdAt: "desc" },
                skip,
                take: limitNum,
            }),
            prisma_1.default.customerPayment.count({ where }),
        ]);
        // Calculate summary statistics
        const summary = await prisma_1.default.customerPayment.aggregate({
            where,
            _sum: {
                amount: true,
            },
            _count: true,
        });
        res.json({
            payments,
            pagination: {
                currentPage: pageNum,
                totalPages: Math.ceil(totalCount / limitNum),
                totalCount,
                limit: limitNum,
            },
            summary: {
                totalAmount: summary._sum.amount || 0,
                totalPayments: summary._count,
            },
        });
    }
    catch (error) {
        console.error("Error fetching all payments:", error);
        res.status(500).json({ error: "Failed to fetch payments" });
    }
};
exports.getAllCustomerPayments = getAllCustomerPayments;
