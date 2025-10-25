"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getInventoryReport = exports.getInventoryBySupplier = exports.getInventoryByContainer = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const getInventoryByContainer = async (containerId) => {
    const items = await prisma_1.default.containerItem.findMany({
        where: { containerId },
        include: {
            container: { select: { containerNo: true } },
        },
    });
    return items.map((item) => {
        return {
            itemName: item.itemName,
            containerNo: item.container.containerNo,
            expected: item.quantity,
            received: item.receivedQty,
            sold: item.soldQty || 0, // optional field if tracked
            remaining: item.receivedQty - (item.soldQty || 0),
        };
    });
};
exports.getInventoryByContainer = getInventoryByContainer;
const getInventoryBySupplier = async (supplierId) => {
    const containers = await prisma_1.default.container.findMany({
        where: { supplierId },
        include: {
            items: true,
        },
    });
    const summaryMap = {};
    containers.forEach((c) => c.items.forEach((i) => {
        const current = summaryMap[i.itemName] || { received: 0, sold: 0 };
        current.received += i.receivedQty;
        current.sold += i.soldQty || 0;
        summaryMap[i.itemName] = current;
    }));
    return Object.entries(summaryMap).map(([itemName, data]) => ({
        itemName,
        totalReceived: data.received,
        totalSold: data.sold,
        remaining: data.received - data.sold,
    }));
};
exports.getInventoryBySupplier = getInventoryBySupplier;
const getInventoryReport = async (companyId) => {
    // Fetch all container items with their containers and suppliers
    const containerItems = await prisma_1.default.containerItem.findMany({
        where: {
            container: {
                companyId,
            },
        },
        include: {
            container: {
                include: {
                    supplier: true,
                },
            },
        },
    });
    // Group by item name and supplier to aggregate quantities
    const inventoryMap = new Map();
    containerItems.forEach((item) => {
        const key = `${item.itemName}-${item.container.supplier.suppliername}`;
        if (inventoryMap.has(key)) {
            const existing = inventoryMap.get(key);
            existing.totalOrdered += item.quantity;
            existing.totalReceived += item.receivedQty;
            existing.totalSold += item.soldQty;
            existing.available += (item.receivedQty - item.soldQty);
        }
        else {
            inventoryMap.set(key, {
                id: item.id,
                itemName: item.itemName,
                supplierName: item.container.supplier.suppliername,
                totalOrdered: item.quantity,
                totalReceived: item.receivedQty,
                totalSold: item.soldQty,
                available: item.receivedQty - item.soldQty,
                unitPrice: item.unitPrice,
            });
        }
    });
    // Convert map to array and calculate total values
    const inventoryArray = Array.from(inventoryMap.values()).map(item => ({
        ...item,
        totalValue: item.available * item.unitPrice,
    }));
    return inventoryArray;
};
exports.getInventoryReport = getInventoryReport;
