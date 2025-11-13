"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getInventoryReport = exports.getInventoryBySupplier = exports.getInventoryByContainer = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const getInventoryByContainer = async (containerId) => {
    // Get container items
    const items = await prisma_1.default.containerItem.findMany({
        where: { containerId },
        include: {
            container: {
                select: {
                    containerNo: true,
                    companyId: true
                }
            },
        },
    });
    if (items.length === 0) {
        return [];
    }
    const companyId = items[0].container.companyId;
    // Get all sale items for this specific container
    const allSaleItems = await prisma_1.default.saleItem.findMany({
        where: {
            sale: {
                companyId: companyId,
                sourceType: "container",
                sourceId: containerId,
            },
        },
        select: {
            itemName: true,
            quantity: true,
        },
    });
    return items.map((item) => {
        // Find all sales for this item name from THIS container
        const relatedSales = allSaleItems.filter((s) => s.itemName === item.itemName);
        const soldQty = relatedSales.reduce((sum, s) => sum + (s.quantity || 0), 0);
        return {
            itemName: item.itemName,
            containerNo: item.container.containerNo,
            received: item.quantity,
            sold: soldQty,
            remaining: item.quantity - soldQty,
            unitPrice: item.unitPrice,
        };
    });
};
exports.getInventoryByContainer = getInventoryByContainer;
const getInventoryBySupplier = async (supplierId) => {
    // Get all containers for this supplier
    const containers = await prisma_1.default.container.findMany({
        where: { supplierId },
        include: {
            items: true,
            supplier: {
                select: { suppliername: true }
            }
        },
    });
    if (containers.length === 0) {
        return [];
    }
    // Get all company IDs from these containers
    const companyIds = [...new Set(containers.map(c => c.companyId))];
    // Get all container IDs for this supplier
    const containerIds = containers.map(c => c.id);
    // Get all container items for this supplier
    const allContainerItems = await prisma_1.default.containerItem.findMany({
        where: {
            container: {
                supplierId: supplierId,
            },
        },
        include: {
            container: {
                select: {
                    companyId: true,
                },
            },
        },
    });
    // Get all sale items for these companies WHERE sourceId is one of this supplier's containers
    const allSaleItems = await prisma_1.default.saleItem.findMany({
        where: {
            sale: {
                companyId: { in: companyIds },
                sourceType: "container",
                sourceId: { in: containerIds },
            },
        },
        select: {
            itemName: true,
            quantity: true,
            sale: {
                select: {
                    companyId: true,
                    sourceId: true,
                },
            },
        },
    });
    // Build summary by item name
    const summaryMap = {};
    // Aggregate received quantities
    allContainerItems.forEach((item) => {
        if (!summaryMap[item.itemName]) {
            summaryMap[item.itemName] = {
                received: 0,
                sold: 0,
                companyIds: []
            };
        }
        summaryMap[item.itemName].received += item.quantity;
        if (!summaryMap[item.itemName].companyIds.includes(item.container.companyId)) {
            summaryMap[item.itemName].companyIds.push(item.container.companyId);
        }
    });
    // Calculate sold quantities - now filtered by supplier's containers
    Object.keys(summaryMap).forEach((itemName) => {
        const relatedSales = allSaleItems.filter((s) => s.itemName === itemName &&
            summaryMap[itemName].companyIds.includes(s.sale.companyId) &&
            containerIds.includes(s.sale.sourceId));
        const soldQty = relatedSales.reduce((sum, s) => sum + (s.quantity || 0), 0);
        summaryMap[itemName].sold = soldQty;
    });
    return Object.entries(summaryMap).map(([itemName, data]) => ({
        itemName,
        supplierName: containers[0]?.supplier.suppliername || "Unknown",
        received: data.received,
        sold: data.sold,
        available: data.received - data.sold,
    }));
};
exports.getInventoryBySupplier = getInventoryBySupplier;
const getInventoryReport = async (companyId) => {
    // Fetch all container items with their containers and suppliers
    const allContainerItems = await prisma_1.default.containerItem.findMany({
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
    // Get all sale items for this company
    const allSaleItems = await prisma_1.default.saleItem.findMany({
        where: {
            sale: {
                companyId: companyId,
                sourceType: "container",
            },
        },
        select: {
            itemName: true,
            quantity: true,
            sale: {
                select: {
                    sourceId: true,
                },
            },
        },
    });
    // Group by item name and supplier
    const inventoryMap = new Map();
    allContainerItems.forEach((item) => {
        // Key: itemName-supplierName
        const key = `${item.itemName}-${item.container.supplier.suppliername}`;
        if (inventoryMap.has(key)) {
            const existing = inventoryMap.get(key);
            existing.received += item.quantity;
            if (!existing.containerIds.includes(item.containerId)) {
                existing.containerIds.push(item.containerId);
            }
        }
        else {
            inventoryMap.set(key, {
                itemName: item.itemName,
                supplierName: item.container.supplier.suppliername,
                received: item.quantity,
                sold: 0, // Will calculate next
                available: 0, // Will calculate after sold
                unitPrice: item.unitPrice,
                totalValue: 0, // Will calculate after available
                containerIds: [item.containerId],
            });
        }
    });
    // Now calculate sold quantities for each item + supplier combination
    inventoryMap.forEach((inventoryItem, key) => {
        // Only count sales from THIS supplier's containers
        const relatedSales = allSaleItems.filter((s) => s.itemName === inventoryItem.itemName &&
            inventoryItem.containerIds.includes(s.sale.sourceId));
        const soldQty = relatedSales.reduce((sum, s) => sum + (s.quantity || 0), 0);
        inventoryItem.sold = soldQty;
        inventoryItem.available = inventoryItem.received - soldQty;
        inventoryItem.totalValue = inventoryItem.available * inventoryItem.unitPrice;
    });
    // Convert map to array and remove containerIds before returning
    const inventoryArray = Array.from(inventoryMap.values()).map(item => ({
        itemName: item.itemName,
        supplierName: item.supplierName,
        received: item.received,
        sold: item.sold,
        available: item.available,
        unitPrice: item.unitPrice,
        totalValue: item.totalValue,
    }));
    return inventoryArray;
};
exports.getInventoryReport = getInventoryReport;
