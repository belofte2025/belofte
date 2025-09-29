"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSalesSummaryBySupplier = exports.detailedSalesReport = exports.supplierReport = exports.getContainerReport = void 0;
const report_service_1 = require("../services/report.service");
const prisma_1 = __importDefault(require("../utils/prisma"));
const getContainerReport = async (req, res) => {
    try {
        const report = await (0, report_service_1.getContainerReport)(req.params.containerId);
        res.json(report);
    }
    catch (err) {
        res.status(500).json({ error: "Failed to generate container report" });
    }
};
exports.getContainerReport = getContainerReport;
const supplierReport = async (req, res) => {
    try {
        const report = await (0, report_service_1.getSupplierReport)(req.params.supplierId);
        res.json(report);
    }
    catch (err) {
        res.status(500).json({ error: "Failed to generate supplier report" });
    }
};
exports.supplierReport = supplierReport;
const detailedSalesReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const report = await (0, report_service_1.getDetailedSalesReport)(startDate, endDate);
        res.json(report);
    }
    catch (err) {
        res.status(500).json({ error: "Failed to generate detailed report" });
    }
};
exports.detailedSalesReport = detailedSalesReport;
const getSalesSummaryBySupplier = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        if (!startDate || !endDate) {
            res.status(400).json({ message: "Start and end dates are required." });
            return;
        }
        const start = new Date(startDate);
        const end = new Date(endDate);
        // Fetch sales with items and customer info
        const sales = await prisma_1.default.sale.findMany({
            where: {
                createdAt: {
                    gte: start,
                    lte: end,
                },
            },
            include: {
                items: true,
                customer: true,
            },
            orderBy: { createdAt: "asc" },
        });
        // Fetch supplier items with supplier names
        const supplierItems = await prisma_1.default.supplierItem.findMany({
            include: {
                supplier: true,
            },
        });
        // Build a map from itemName to supplierName
        const itemToSupplierMap = new Map();
        for (const si of supplierItems) {
            itemToSupplierMap.set(si.itemName.trim().toLowerCase(), si.supplier.suppliername);
        }
        // Attach supplier name to each sale item and enrich sale with customer name + sale type
        const enrichedSales = sales.map((sale) => ({
            saleId: sale.id,
            customerName: sale.customer?.customerName || "Walk-in",
            saleType: sale.saleType,
            createdAt: sale.createdAt,
            items: sale.items.map((item) => ({
                itemName: item.itemName,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                total: item.quantity * item.unitPrice,
                supplierName: itemToSupplierMap.get(item.itemName.trim().toLowerCase()) ||
                    "Unknown Supplier",
            })),
        }));
        res.json(enrichedSales);
        return;
    }
    catch (error) {
        console.error("Error fetching sales summary with supplier names:", error);
        res.status(500).json({ message: "Internal server error" });
        return;
    }
};
exports.getSalesSummaryBySupplier = getSalesSummaryBySupplier;
