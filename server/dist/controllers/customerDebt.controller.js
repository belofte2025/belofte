"use strict";
// server\src\controllers\customerDebt.controller.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.markDebtAsPaid = exports.deleteCustomerDebt = exports.updateCustomerDebt = exports.getAllDebts = exports.getCustomerDebts = exports.bulkCreateCustomerDebts = exports.createCustomerDebt = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
// Create a new debt entry
const createCustomerDebt = async (req, res) => {
    console.log("[customerDebt.controller] CREATE - Request body:", req.body);
    console.log("[customerDebt.controller] CREATE - User:", {
        userId: req.user?.id,
        companyId: req.user?.companyId,
    });
    try {
        const { customerId, amount, description, debtType, companyId, debtDate } = req.body;
        if (!customerId || !amount) {
            console.log("[customerDebt.controller] CREATE - Bad request: Missing customerId or amount");
            res.status(400).json({ error: "Customer ID and amount are required" });
            return;
        }
        // TEMPORARY: Get companyId from customer if not provided
        let finalCompanyId = companyId || req.user?.companyId;
        if (!finalCompanyId) {
            console.log("[customerDebt.controller] CREATE - Getting companyId from customer");
            const customer = await prisma_1.default.customer.findUnique({
                where: { id: customerId },
                select: { companyId: true },
            });
            finalCompanyId = customer?.companyId;
        }
        if (!finalCompanyId) {
            console.log("[customerDebt.controller] CREATE - Error: No companyId found");
            res.status(400).json({ error: "Could not determine company ID" });
            return;
        }
        console.log("[customerDebt.controller] CREATE - Creating debt:", {
            customerId,
            amount,
            debtType,
            companyId: finalCompanyId,
            debtDate,
        });
        const debtData = {
            customerId,
            companyId: finalCompanyId,
            amount: parseFloat(amount),
            description: description || null,
            debtType: debtType || "manual",
            status: "unpaid",
        };
        // If a custom debt date is provided, use it
        if (debtDate) {
            debtData.createdAt = new Date(debtDate);
        }
        const debt = await prisma_1.default.customerDebt.create({
            data: debtData,
            include: {
                customer: true,
            },
        });
        console.log("[customerDebt.controller] CREATE - Debt created:", debt.id);
        // Update customer balance (only unpaid debts affect balance)
        await prisma_1.default.customer.update({
            where: { id: customerId },
            data: {
                balance: {
                    increment: parseFloat(amount),
                },
            },
        });
        console.log("[customerDebt.controller] CREATE - Customer balance updated");
        res.status(201).json(debt);
    }
    catch (error) {
        console.error("[customerDebt.controller] CREATE - Error:", error);
        res.status(500).json({ error: "Failed to create debt entry" });
    }
};
exports.createCustomerDebt = createCustomerDebt;
// Bulk create debts for multiple customers
const bulkCreateCustomerDebts = async (req, res) => {
    try {
        const { debts } = req.body;
        const companyId = req.user?.companyId;
        if (!companyId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }
        if (!Array.isArray(debts) || debts.length === 0) {
            res
                .status(400)
                .json({ error: "Debts array is required and must not be empty" });
            return;
        }
        // Validate all entries
        for (const debt of debts) {
            if (!debt.customerId || !debt.amount) {
                res
                    .status(400)
                    .json({ error: "Each debt must have customerId and amount" });
                return;
            }
        }
        // Create all debts in a transaction
        const results = await prisma_1.default.$transaction(async (tx) => {
            const createdDebts = [];
            for (const debtData of debts) {
                const debt = await tx.customerDebt.create({
                    data: {
                        customerId: debtData.customerId,
                        companyId,
                        amount: parseFloat(debtData.amount),
                        description: debtData.description || null,
                        debtType: debtData.debtType || "manual",
                        status: "unpaid",
                    },
                    include: {
                        customer: true,
                    },
                });
                // Update customer balance
                await tx.customer.update({
                    where: { id: debtData.customerId },
                    data: {
                        balance: {
                            increment: parseFloat(debtData.amount),
                        },
                    },
                });
                createdDebts.push(debt);
            }
            return createdDebts;
        });
        res.status(201).json({
            message: `Successfully created ${results.length} debt entries`,
            debts: results,
        });
    }
    catch (error) {
        console.error("Error creating bulk debts:", error);
        res.status(500).json({ error: "Failed to create bulk debt entries" });
    }
};
exports.bulkCreateCustomerDebts = bulkCreateCustomerDebts;
// Get all debts for a customer
const getCustomerDebts = async (req, res) => {
    console.log("[customerDebt.controller] GET_CUSTOMER_DEBTS - Customer ID:", req.params.customerId);
    console.log("[customerDebt.controller] GET_CUSTOMER_DEBTS - User:", {
        userId: req.user?.id,
        companyId: req.user?.companyId,
    });
    try {
        const { customerId } = req.params;
        // TEMPORARY: For testing without authentication, fetch all debts for customer
        console.log("[customerDebt.controller] GET_CUSTOMER_DEBTS - Fetching debts for customer (NO AUTH):", { customerId });
        const debts = await prisma_1.default.customerDebt.findMany({
            where: {
                customerId,
            },
            include: {
                customer: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        });
        console.log("[customerDebt.controller] GET_CUSTOMER_DEBTS - Found debts:", debts.length);
        res.json(debts);
    }
    catch (error) {
        console.error("[customerDebt.controller] GET_CUSTOMER_DEBTS - Error:", error);
        res.status(500).json({ error: "Failed to fetch debts" });
    }
};
exports.getCustomerDebts = getCustomerDebts;
// Get all debts for the company
const getAllDebts = async (req, res) => {
    try {
        const companyId = req.user?.companyId;
        if (!companyId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }
        const { status } = req.query;
        const where = { companyId };
        if (status && status !== "all") {
            where.status = status;
        }
        const debts = await prisma_1.default.customerDebt.findMany({
            where,
            include: {
                customer: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        });
        res.json(debts);
    }
    catch (error) {
        console.error("Error fetching debts:", error);
        res.status(500).json({ error: "Failed to fetch debts" });
    }
};
exports.getAllDebts = getAllDebts;
// Update debt (amount, status, description)
const updateCustomerDebt = async (req, res) => {
    console.log("[customerDebt.controller] UPDATE - Debt ID:", req.params.id);
    console.log("[customerDebt.controller] UPDATE - Request body:", req.body);
    try {
        const { id } = req.params;
        const { amount, description, status } = req.body;
        // Get the old debt to calculate balance change
        const oldDebt = await prisma_1.default.customerDebt.findUnique({
            where: { id },
        });
        if (!oldDebt) {
            console.log("[customerDebt.controller] UPDATE - Debt not found:", id);
            res.status(404).json({ error: "Debt not found" });
            return;
        }
        console.log("[customerDebt.controller] UPDATE - Old debt:", oldDebt);
        // MULTI-TENANT SECURITY: Verify company ownership
        const companyId = req.user?.companyId;
        if (companyId && oldDebt.companyId !== companyId) {
            console.log("[customerDebt.controller] UPDATE - Unauthorized: Wrong company");
            res.status(401).json({ error: "Unauthorized" });
            return;
        }
        const updateData = {};
        if (description !== undefined)
            updateData.description = description;
        if (status !== undefined)
            updateData.status = status;
        if (amount !== undefined)
            updateData.amount = parseFloat(amount);
        console.log("[customerDebt.controller] UPDATE - Update data:", updateData);
        const debt = await prisma_1.default.customerDebt.update({
            where: { id },
            data: updateData,
            include: {
                customer: true,
            },
        });
        console.log("[customerDebt.controller] UPDATE - Debt updated successfully");
        // Calculate balance change based on status transitions
        let balanceChange = 0;
        const newAmount = amount !== undefined ? parseFloat(amount) : oldDebt.amount;
        const newStatus = status !== undefined ? status : oldDebt.status;
        // Determine if old debt affected balance
        const oldAffectsBalance = oldDebt.status !== "paid";
        // Determine if new debt affects balance
        const newAffectsBalance = newStatus !== "paid";
        if (oldAffectsBalance && newAffectsBalance) {
            // Both unpaid: adjust by amount difference
            balanceChange = newAmount - oldDebt.amount;
        }
        else if (oldAffectsBalance && !newAffectsBalance) {
            // Was unpaid, now paid: remove old amount
            balanceChange = -oldDebt.amount;
        }
        else if (!oldAffectsBalance && newAffectsBalance) {
            // Was paid, now unpaid: add new amount
            balanceChange = newAmount;
        }
        // If both paid: no balance change (balanceChange stays 0)
        if (balanceChange !== 0) {
            await prisma_1.default.customer.update({
                where: { id: oldDebt.customerId },
                data: {
                    balance: {
                        increment: balanceChange,
                    },
                },
            });
            console.log("[customerDebt.controller] UPDATE - Balance updated by:", balanceChange);
        }
        else {
            console.log("[customerDebt.controller] UPDATE - No balance change needed");
        }
        res.json(debt);
    }
    catch (error) {
        console.error("[customerDebt.controller] UPDATE - Error:", error);
        res.status(500).json({ error: "Failed to update debt" });
    }
};
exports.updateCustomerDebt = updateCustomerDebt;
// Delete a debt entry
const deleteCustomerDebt = async (req, res) => {
    console.log("[customerDebt.controller] DELETE - Debt ID:", req.params.id);
    try {
        const { id } = req.params;
        const debt = await prisma_1.default.customerDebt.findUnique({
            where: { id },
        });
        if (!debt) {
            console.log("[customerDebt.controller] DELETE - Debt not found:", id);
            res.status(404).json({ error: "Debt not found" });
            return;
        }
        console.log("[customerDebt.controller] DELETE - Found debt:", {
            id: debt.id,
            amount: debt.amount,
            status: debt.status,
        });
        // MULTI-TENANT SECURITY: Verify company ownership
        const companyId = req.user?.companyId;
        if (companyId && debt.companyId !== companyId) {
            console.log("[customerDebt.controller] DELETE - Unauthorized: Wrong company");
            res.status(401).json({ error: "Unauthorized" });
            return;
        }
        // Delete the debt
        await prisma_1.default.customerDebt.delete({
            where: { id },
        });
        console.log("[customerDebt.controller] DELETE - Debt deleted");
        // Only decrement balance if the debt was unpaid
        if (debt.status !== "paid") {
            await prisma_1.default.customer.update({
                where: { id: debt.customerId },
                data: {
                    balance: {
                        decrement: debt.amount,
                    },
                },
            });
            console.log("[customerDebt.controller] DELETE - Customer balance updated (decremented by", debt.amount, ")");
        }
        else {
            console.log("[customerDebt.controller] DELETE - Debt was paid, balance unchanged");
        }
        res.json({ message: "Debt deleted successfully" });
    }
    catch (error) {
        console.error("[customerDebt.controller] DELETE - Error:", error);
        res.status(500).json({ error: "Failed to delete debt" });
    }
};
exports.deleteCustomerDebt = deleteCustomerDebt;
// Mark debt as paid
const markDebtAsPaid = async (req, res) => {
    console.log("[customerDebt.controller] MARK_PAID - Debt ID:", req.params.id);
    try {
        const { id } = req.params;
        const debt = await prisma_1.default.customerDebt.findUnique({
            where: { id },
        });
        if (!debt) {
            console.log("[customerDebt.controller] MARK_PAID - Debt not found:", id);
            res.status(404).json({ error: "Debt not found" });
            return;
        }
        console.log("[customerDebt.controller] MARK_PAID - Found debt:", {
            id: debt.id,
            status: debt.status,
            amount: debt.amount,
        });
        // MULTI-TENANT SECURITY: Verify company ownership
        const companyId = req.user?.companyId;
        if (companyId && debt.companyId !== companyId) {
            console.log("[customerDebt.controller] MARK_PAID - Unauthorized: Wrong company");
            res.status(401).json({ error: "Unauthorized" });
            return;
        }
        // Check if already paid
        if (debt.status === "paid") {
            console.log("[customerDebt.controller] MARK_PAID - Debt already paid");
            res.json(debt);
            return;
        }
        const updatedDebt = await prisma_1.default.customerDebt.update({
            where: { id },
            data: {
                status: "paid",
            },
            include: {
                customer: true,
            },
        });
        console.log("[customerDebt.controller] MARK_PAID - Debt marked as paid, updating customer balance");
        // Decrease customer balance (only if it was unpaid)
        await prisma_1.default.customer.update({
            where: { id: debt.customerId },
            data: {
                balance: {
                    decrement: debt.amount,
                },
            },
        });
        console.log("[customerDebt.controller] MARK_PAID - Customer balance updated (decremented by", debt.amount, ")");
        res.json(updatedDebt);
    }
    catch (error) {
        console.error("[customerDebt.controller] MARK_PAID - Error:", error);
        res.status(500).json({ error: "Failed to mark debt as paid" });
    }
};
exports.markDebtAsPaid = markDebtAsPaid;
