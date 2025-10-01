"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDetailedSalesReport = exports.getSupplierReport = exports.getContainerReport = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const getContainerReport = async (containerId) => {
    const container = await prisma_1.default.container.findUnique({
        where: { id: containerId },
        include: {
            supplier: true,
            items: true,
        },
    });
    if (!container)
        throw new Error("Container not found");
    const itemSummary = container.items.map((item) => ({
        itemName: item.itemName,
        expected: item.quantity,
        received: item.receivedQty,
        sold: item.soldQty,
        remaining: item.receivedQty - item.soldQty,
    }));
    return {
        containerNo: container.containerNo,
        arrivalDate: container.arrivalDate,
        supplier: container.supplier?.suppliername || "N/A",
        itemSummary,
    };
};
exports.getContainerReport = getContainerReport;
const getSupplierReport = async (supplierId) => {
    const items = await prisma_1.default.containerItem.findMany({
        where: {
            container: {
                supplierId,
            },
        },
        include: {
            container: true,
        },
    });
    return {
        supplierId,
        items: items.map((item) => ({
            itemId: item.id,
            name: item.itemName,
            remaining: item.receivedQty - item.soldQty,
        })),
    };
};
exports.getSupplierReport = getSupplierReport;
const getDetailedSalesReport = async (startDate, endDate) => {
    const sales = await prisma_1.default.sale.findMany({
        where: {
            createdAt: {
                gte: new Date(startDate),
                lte: new Date(endDate),
            },
        },
        include: {
            items: true,
        },
    });
    const totalAmount = sales.reduce((sum, s) => sum + s.totalAmount, 0);
    const totalQty = sales.reduce((sum, s) => sum +
        s.items.reduce((qSum, i) => qSum + i.quantity, 0), 0);
    return {
        period: { startDate, endDate },
        totalAmount,
        totalQty,
        sales,
    };
};
exports.getDetailedSalesReport = getDetailedSalesReport;
