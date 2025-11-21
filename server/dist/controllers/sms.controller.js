"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSMSLogs = exports.sendBulkDebtReminders = exports.sendPaymentConfirmationSMS = exports.sendSingleSMS = void 0;
const sms_service_1 = __importDefault(require("../services/sms.service"));
const prisma_1 = __importDefault(require("../utils/prisma"));
// Send single SMS
const sendSingleSMS = async (req, res) => {
    try {
        const { to, message } = req.body;
        const companyId = req.user?.companyId;
        if (!companyId) {
            res.status(400).json({ error: "Company ID required" });
            return;
        }
        if (!to || !message) {
            res.status(400).json({ error: "Phone number and message required" });
            return;
        }
        // Get company name for sender ID
        const company = await prisma_1.default.company.findUnique({
            where: { id: companyId },
            select: { companyName: true },
        });
        // Validate message length
        const validation = sms_service_1.default.validateMessageLength(message);
        if (validation.smsCount > 1) {
            console.warn(`Message will be sent as ${validation.smsCount} SMS parts`);
        }
        const result = await sms_service_1.default.sendSMS({
            to,
            message,
            senderId: company?.companyName,
        });
        // Log SMS in database
        await prisma_1.default.sMSLog.create({
            data: {
                companyId,
                recipient: to,
                message,
                status: result.success ? "sent" : "failed",
                provider: result.provider,
                messageId: result.messageId || result.jobId,
                error: result.error,
            },
        });
        res.json(result);
    }
    catch (error) {
        console.error("SMS send error:", error);
        res.status(500).json({ error: "Failed to send SMS" });
    }
};
exports.sendSingleSMS = sendSingleSMS;
// Send payment confirmation SMS
const sendPaymentConfirmationSMS = async (req, res) => {
    try {
        const { customerId, amount, balance } = req.body;
        const companyId = req.user?.companyId;
        console.log("📧 Payment SMS Request:", { customerId, amount, balance, companyId });
        if (!companyId) {
            res.status(400).json({ error: "Company ID required" });
            return;
        }
        if (!customerId || amount === undefined || balance === undefined) {
            res.status(400).json({ error: "customerId, amount, and balance are required" });
            return;
        }
        // Get customer details
        const customer = await prisma_1.default.customer.findFirst({
            where: {
                id: customerId,
                companyId
            },
        });
        console.log("👤 Customer found:", customer ? {
            id: customer.id,
            name: customer.customerName,
            phone: customer.phone
        } : "NOT FOUND");
        if (!customer) {
            res.status(404).json({ error: "Customer not found" });
            return;
        }
        if (!customer.phone || customer.phone.trim() === "") {
            res.status(400).json({ error: "Customer has no phone number" });
            return;
        }
        // Get company name for sender ID
        const company = await prisma_1.default.company.findUnique({
            where: { id: companyId },
            select: { companyName: true },
        });
        // Generate message
        const message = sms_service_1.default.generatePaymentConfirmation(customer.customerName, amount, balance);
        console.log("💬 Generated message:", message);
        console.log("📱 Sending to:", customer.phone);
        // Send SMS
        const result = await sms_service_1.default.sendSMS({
            to: customer.phone,
            message,
            senderId: company?.companyName,
        });
        console.log("📤 SMS Result:", result);
        // Log SMS
        await prisma_1.default.sMSLog.create({
            data: {
                companyId,
                recipient: customer.phone,
                message,
                status: result.success ? "sent" : "failed",
                provider: result.provider,
                messageId: result.messageId || result.jobId,
                error: result.error,
                customerId,
            },
        });
        res.json(result);
    }
    catch (error) {
        console.error("❌ Payment SMS error:", error);
        res.status(500).json({
            error: "Failed to send payment SMS",
            details: error instanceof Error ? error.message : "Unknown error"
        });
    }
};
exports.sendPaymentConfirmationSMS = sendPaymentConfirmationSMS;
// Send debt reminder to multiple customers
const sendBulkDebtReminders = async (req, res) => {
    try {
        const companyId = req.user?.companyId;
        if (!companyId) {
            res.status(400).json({ error: "Company ID required" });
            return;
        }
        // Get company name for sender ID
        const company = await prisma_1.default.company.findUnique({
            where: { id: companyId },
            select: { companyName: true },
        });
        // Get all customers with unpaid debts
        const customers = await prisma_1.default.customer.findMany({
            where: {
                companyId,
                phone: { not: "" },
                debts: {
                    some: {
                        status: { in: ["unpaid", "partial"] },
                    },
                },
            },
            include: {
                debts: {
                    where: {
                        status: { in: ["unpaid", "partial"] },
                    },
                },
            },
        });
        const results = [];
        for (const customer of customers) {
            const totalDebt = customer.debts.reduce((sum, d) => sum + d.amount, 0);
            const message = sms_service_1.default.generateDebtReminder(customer.customerName, totalDebt);
            const result = await sms_service_1.default.sendSMS({
                to: customer.phone,
                message,
                senderId: company?.companyName,
            });
            // Log SMS
            await prisma_1.default.sMSLog.create({
                data: {
                    companyId,
                    recipient: customer.phone,
                    message,
                    status: result.success ? "sent" : "failed",
                    provider: result.provider,
                    messageId: result.messageId || result.jobId,
                    error: result.error,
                    customerId: customer.id,
                },
            });
            results.push({
                customer: customer.customerName,
                phone: customer.phone,
                success: result.success,
                error: result.error,
            });
            // Small delay to avoid rate limiting
            await new Promise((resolve) => setTimeout(resolve, 500));
        }
        res.json({
            total: results.length,
            sent: results.filter((r) => r.success).length,
            failed: results.filter((r) => !r.success).length,
            results,
        });
    }
    catch (error) {
        console.error("Bulk SMS error:", error);
        res.status(500).json({ error: "Failed to send bulk SMS" });
    }
};
exports.sendBulkDebtReminders = sendBulkDebtReminders;
// Get SMS logs
const getSMSLogs = async (req, res) => {
    try {
        const companyId = req.user?.companyId;
        const { page = 1, limit = 50 } = req.query;
        if (!companyId) {
            res.status(400).json({ error: "Company ID required" });
            return;
        }
        const logs = await prisma_1.default.sMSLog.findMany({
            where: { companyId },
            include: {
                customer: {
                    select: {
                        customerName: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
            skip: (Number(page) - 1) * Number(limit),
            take: Number(limit),
        });
        const total = await prisma_1.default.sMSLog.count({
            where: { companyId },
        });
        res.json({
            logs,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                pages: Math.ceil(total / Number(limit)),
            },
        });
    }
    catch (error) {
        console.error("SMS logs error:", error);
        res.status(500).json({ error: "Failed to fetch SMS logs" });
    }
};
exports.getSMSLogs = getSMSLogs;
