"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteSaleById = exports.listSales = exports.updateSaleTotalAmount = exports.updateSale = exports.getSaleById = exports.getSalesByCustomerId = exports.getContainerItemsBySupplier = exports.getSales = exports.recordSale = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const recordSale = async (req, res) => {
    const { saleType, sourceType, sourceId, customerId, items } = req.body;
    const companyId = req.user?.companyId;
    if (!companyId) {
        res.status(400).json({ error: "Company ID missing" });
        return;
    }
    const totalAmount = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
    try {
        const sale = await prisma_1.default.sale.create({
            data: {
                saleType,
                sourceType,
                sourceId,
                customerId,
                companyId,
                totalAmount,
                items: {
                    createMany: {
                        data: items.map((i) => ({
                            itemName: i.itemName,
                            quantity: i.quantity,
                            unitPrice: i.unitPrice,
                        })),
                    },
                },
            },
        });
        res.status(201).json(sale);
    }
    catch (err) {
        res.status(400).json({ error: "Failed to record sale", detail: err });
        console.log(err);
    }
};
exports.recordSale = recordSale;
const getSales = async (req, res) => {
    const companyId = req.user?.companyId;
    const sales = await prisma_1.default.sale.findMany({
        where: { companyId },
        include: { items: true, customer: true },
    });
    res.json(sales);
};
exports.getSales = getSales;
const getContainerItemsBySupplier = async (req, res) => {
    const { id: supplierId } = req.params;
    if (!supplierId) {
        res.status(400).json({ error: "Supplier ID is required" });
        return;
    }
    try {
        const containers = await prisma_1.default.container.findMany({
            where: { supplierId },
            include: {
                items: true,
            },
        });
        const allItems = containers.flatMap((c) => c.items.map((i) => ({
            id: i.id,
            itemName: i.itemName,
            available: i.quantity - i.soldQty,
            unitPrice: i.unitPrice,
            containerId: c.id,
            containerNo: c.containerNo,
        })));
        res.json(allItems);
        return;
    }
    catch (error) {
        console.error("Error fetching container items:", error);
        res.status(500).json({ error: "Internal server error" });
        return;
    }
};
exports.getContainerItemsBySupplier = getContainerItemsBySupplier;
// controller/sales.controller.ts
const getSalesByCustomerId = async (req, res) => {
    const { id } = req.params;
    try {
        const sales = await prisma_1.default.sale.findMany({
            where: { customerId: id },
            include: { items: true },
            orderBy: { createdAt: "desc" },
        });
        res.json(sales);
    }
    catch (error) {
        console.error("Error fetching sales by customer:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
exports.getSalesByCustomerId = getSalesByCustomerId;
// Get a specific sale by ID
const getSaleById = async (req, res) => {
    const { id } = req.params;
    try {
        const sale = await prisma_1.default.sale.findUnique({
            where: { id },
            include: {
                items: true,
                customer: true,
            },
        });
        if (!sale) {
            res.status(404).json({ error: "Sale not found" });
        }
        res.json(sale);
    }
    catch (error) {
        console.error("Error fetching sale:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
exports.getSaleById = getSaleById;
// Update sale and items
const updateSale = async (req, res) => {
    const { id } = req.params;
    const { saleType, items } = req.body;
    try {
        await prisma_1.default.sale.update({
            where: { id },
            data: {
                saleType,
                items: {
                    deleteMany: {},
                    createMany: {
                        data: items.map((item) => ({
                            itemName: item.itemName,
                            quantity: item.quantity,
                            unitPrice: item.unitPrice,
                        })),
                    },
                },
            },
        });
        res.json({ message: "Sale updated successfully" });
    }
    catch (error) {
        console.error("Error updating sale:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
exports.updateSale = updateSale;
const updateSaleTotalAmount = async (req, res) => {
    const { id } = req.params;
    const { totalAmount } = req.body;
    try {
        const sale = await prisma_1.default.sale.update({
            where: { id },
            data: { totalAmount },
        });
        res.json(sale);
    }
    catch (error) {
        console.error("Error updating sale:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
exports.updateSaleTotalAmount = updateSaleTotalAmount;
// GET /sales
const listSales = async (req, res) => {
    try {
        const companyId = req.user?.companyId;
        const { startDate, endDate } = req.query;
        const whereClause = {
            companyId,
        };
        if (startDate || endDate) {
            whereClause.createdAt = {};
            if (startDate) {
                whereClause.createdAt.gte = new Date(startDate);
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999); // include entire end day
                whereClause.createdAt.lte = end;
            }
        }
        const sales = await prisma_1.default.sale.findMany({
            where: whereClause,
            include: {
                items: true,
                customer: true,
            },
            orderBy: { createdAt: "desc" },
        });
        const response = sales.map((sale) => ({
            id: sale.id,
            saleType: sale.saleType,
            sourceType: sale.sourceType,
            customerName: sale.customer.customerName,
            totalAmount: sale.totalAmount,
            createdAt: sale.createdAt,
            items: sale.items.map((i) => ({
                itemName: i.itemName,
                quantity: i.quantity,
                unitPrice: i.unitPrice,
            })),
        }));
        res.json(response);
    }
    catch (error) {
        console.error("Failed to list sales", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};
exports.listSales = listSales;
// DELETE /sales/:id
const deleteSaleById = async (req, res) => {
    const { id } = req.params;
    const companyId = req.user?.companyId;
    try {
        // Optional: validate ownership
        const sale = await prisma_1.default.sale.findUnique({
            where: { id },
        });
        if (!sale || sale.companyId !== companyId) {
            res.status(404).json({ error: "Sale not found" });
            return;
        }
        // Delete related sale items first
        await prisma_1.default.saleItem.deleteMany({
            where: { saleId: id },
        });
        // Then delete the sale
        await prisma_1.default.sale.delete({
            where: { id },
        });
        res.json({ message: "Sale deleted successfully." });
    }
    catch (error) {
        console.error("Failed to delete sale", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};
exports.deleteSaleById = deleteSaleById;
