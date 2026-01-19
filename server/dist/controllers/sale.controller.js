"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchSalesByItem = exports.deleteSaleById = exports.listSales = exports.updateSaleTotalAmount = exports.updateSale = exports.getSaleById = exports.getSalesByCustomerId = exports.getContainerItemsBySupplier = exports.getSales = exports.recordSale = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const auditLogger_1 = require("../utils/auditLogger");
const recordSale = async (req, res) => {
    const { saleType, sourceType, sourceId, customerId, items, saleDate, discountType, discountValue } = req.body;
    const companyId = req.user?.companyId;
    const userPermissions = req.user?.permissions || [];
    const canEditPrice = userPermissions.includes("sales.edit_price");
    if (!companyId) {
        res.status(400).json({ error: "Company ID missing" });
        return;
    }
    try {
        // If user cannot edit prices, validate that submitted prices match current prices
        if (!canEditPrice) {
            // Get all supplier items for the company to check current prices
            const itemNames = items.map((i) => i.itemName);
            const supplierItems = await prisma_1.default.supplierItem.findMany({
                where: {
                    itemName: { in: itemNames },
                    supplier: { companyId },
                },
                select: {
                    itemName: true,
                    price: true,
                },
            });
            // Create a map of item prices
            const priceMap = new Map(supplierItems.map((item) => [item.itemName, item.price]));
            // Check if any submitted price differs from current price
            for (const item of items) {
                const currentPrice = priceMap.get(item.itemName);
                if (currentPrice !== undefined && item.unitPrice !== currentPrice) {
                    res.status(403).json({
                        error: "Forbidden: You don't have permission to modify prices",
                        detail: `Item "${item.itemName}" has a different price than the current price. Contact an admin or manager to override prices.`,
                    });
                    return;
                }
            }
        }
        // Calculate subtotal (sum of all items before discount)
        const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
        // Calculate discount amount
        let discountAmount = 0;
        if (discountType && discountValue > 0) {
            if (discountType === "percentage") {
                discountAmount = (subtotal * discountValue) / 100;
            }
            else if (discountType === "amount") {
                discountAmount = discountValue;
            }
        }
        // Calculate final total after discount
        const totalAmount = Math.max(0, subtotal - discountAmount);
        const sale = await prisma_1.default.sale.create({
            data: {
                saleType,
                sourceType,
                sourceId,
                customerId,
                companyId,
                subtotal,
                discountType: discountType || null,
                discountValue: discountValue || 0,
                totalAmount,
                createdAt: saleDate ? new Date(saleDate) : new Date(),
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
        orderBy: { createdAt: "desc" },
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
        // Transform to match frontend expectations
        const transformedSales = sales.map((sale) => ({
            id: sale.id,
            saleDate: sale.createdAt,
            totalAmount: sale.totalAmount,
            saleType: sale.saleType,
            items: sale.items,
        }));
        res.json(transformedSales);
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
            return; // ADD THIS RETURN STATEMENT
        }
        res.json(sale);
        return; // OPTIONAL: Add this for consistency
    }
    catch (error) {
        console.error("Error fetching sale:", error);
        res.status(500).json({ error: "Internal server error" });
        return; // OPTIONAL: Add this for consistency
    }
};
exports.getSaleById = getSaleById;
// Update sale and items
const updateSale = async (req, res) => {
    const { id } = req.params;
    const { saleType, items, saleDate } = req.body;
    const userId = req.user?.id;
    try {
        const updateData = {
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
        };
        // If a sale date is provided, update createdAt
        if (saleDate) {
            updateData.createdAt = new Date(saleDate);
        }
        await prisma_1.default.sale.update({
            where: { id },
            data: updateData,
        });
        // Log the update to audit trail
        if (userId) {
            const changes = [];
            if (saleType)
                changes.push(`Type: ${saleType}`);
            if (saleDate)
                changes.push(`Date: ${saleDate}`);
            if (items)
                changes.push(`Items: ${items.length} items`);
            await (0, auditLogger_1.logUpdate)(userId, auditLogger_1.EntityType.SALE, id, id, `Updated sale - ${changes.join(', ')}`);
        }
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
// GET /sales/list
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
        // FIXED: Return customer object instead of just customerName string
        const response = sales.map((sale) => ({
            id: sale.id,
            saleType: sale.saleType,
            sourceType: sale.sourceType,
            customer: {
                customerName: sale.customer.customerName,
            },
            totalAmount: sale.totalAmount,
            createdAt: sale.createdAt,
            items: sale.items.map((i) => ({
                itemName: i.itemName,
                quantity: i.quantity,
                unitPrice: i.unitPrice,
            })),
        }));
        res.json(response);
        return;
    }
    catch (error) {
        console.error("Failed to list sales", error);
        res.status(500).json({ error: "Internal Server Error" });
        return;
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
// GET /sales/search/by-item - Search sales by item name
const searchSalesByItem = async (req, res) => {
    try {
        const companyId = req.user?.companyId;
        const { itemName, startDate, endDate, saleType } = req.query;
        if (!itemName) {
            res.status(400).json({ error: "itemName query parameter is required" });
            return;
        }
        const whereClause = {
            companyId,
            items: {
                some: {
                    itemName: {
                        contains: itemName,
                        mode: 'insensitive'
                    }
                }
            }
        };
        if (saleType) {
            whereClause.saleType = saleType;
        }
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
            orderBy: { createdAt: 'desc' }
        });
        // Format response to match frontend expectations
        const response = sales.map((sale) => ({
            id: sale.id,
            saleType: sale.saleType,
            sourceType: sale.sourceType,
            customer: {
                customerName: sale.customer.customerName,
            },
            totalAmount: sale.totalAmount,
            createdAt: sale.createdAt,
            items: sale.items.map((i) => ({
                itemName: i.itemName,
                quantity: i.quantity,
                unitPrice: i.unitPrice,
            })),
        }));
        res.json(response);
        return;
    }
    catch (error) {
        console.error("Failed to search sales by item", error);
        res.status(500).json({ error: "Internal Server Error" });
        return;
    }
};
exports.searchSalesByItem = searchSalesByItem;
