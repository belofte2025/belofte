"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getInventoryReport_22 = exports.getInventoryReport = exports.getInventoryBySupplier = exports.getInventoryByContainer = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const getInventoryByContainer = async (containerId) => {
    // Get container items
    const items = await prisma_1.default.containerItem.findMany({
        where: { containerId },
        include: {
            container: {
                select: {
                    containerNo: true,
                    companyId: true,
                },
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
                select: { suppliername: true },
            },
        },
    });
    if (containers.length === 0) {
        return [];
    }
    // Get all company IDs from these containers
    const companyIds = [...new Set(containers.map((c) => c.companyId))];
    // Get all container IDs for this supplier
    const containerIds = containers.map((c) => c.id);
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
    const containerSaleItems = await prisma_1.default.saleItem.findMany({
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
    // Get all supplierItems for this supplier
    const supplierItemIds = await prisma_1.default.supplierItem.findMany({
        where: { supplierId: supplierId },
        select: { id: true, itemName: true },
    });
    const supplierItemIdList = supplierItemIds.map((si) => si.id);
    // Get all regular sale items where sourceId points to this supplier's supplierItems
    const regularSaleItems = await prisma_1.default.saleItem.findMany({
        where: {
            sale: {
                companyId: { in: companyIds },
                sourceType: "regular",
                sourceId: { in: supplierItemIdList },
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
    // Combine both sale types
    const allSaleItems = [...containerSaleItems, ...regularSaleItems];
    // Build summary by item name
    const summaryMap = {};
    // Aggregate received quantities
    allContainerItems.forEach((item) => {
        if (!summaryMap[item.itemName]) {
            summaryMap[item.itemName] = {
                received: 0,
                sold: 0,
                companyIds: [],
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
    // Sort items alphabetically by item name
    return Object.entries(summaryMap)
        .map(([itemName, data]) => ({
        itemName,
        supplierName: containers[0]?.supplier.suppliername || "Unknown",
        received: data.received,
        sold: data.sold,
        available: data.received - data.sold,
    }))
        .sort((a, b) => a.itemName.localeCompare(b.itemName));
};
exports.getInventoryBySupplier = getInventoryBySupplier;
const getInventoryReport = async (companyId) => {
    // 1. Run all initial queries in parallel
    const [allContainerItems, containerSaleItems, regularSaleItems] = await Promise.all([
        prisma_1.default.containerItem.findMany({
            where: {
                container: { companyId },
            },
            include: {
                container: {
                    include: {
                        supplier: true,
                    },
                },
            },
        }),
        prisma_1.default.saleItem.findMany({
            where: {
                sale: {
                    companyId,
                    sourceType: "container",
                },
            },
            select: {
                itemName: true,
                quantity: true,
                sale: {
                    select: { sourceId: true },
                },
            },
        }),
        prisma_1.default.saleItem.findMany({
            where: {
                sale: {
                    companyId,
                    sourceType: "regular",
                },
            },
            select: {
                itemName: true,
                quantity: true,
                sale: {
                    select: { sourceId: true },
                },
            },
        }),
    ]);
    // 2. Batch fetch all supplier items in ONE query (fixes N+1 problem)
    const supplierItemIds = [
        ...new Set(regularSaleItems
            .map((item) => item.sale.sourceId)
            .filter((id) => id !== null)),
    ];
    const supplierItems = supplierItemIds.length > 0
        ? await prisma_1.default.supplierItem.findMany({
            where: { id: { in: supplierItemIds } },
            include: { supplier: true },
        })
        : [];
    // 3. Create lookup maps for O(1) access
    const supplierItemMap = new Map(supplierItems.map((item) => [item.id, item]));
    // Pre-index regular sales by supplier name
    const regularSalesBySupplier = new Map();
    for (const saleItem of regularSaleItems) {
        if (saleItem.sale.sourceId) {
            const supplierItem = supplierItemMap.get(saleItem.sale.sourceId);
            if (supplierItem) {
                const supplierName = supplierItem.supplier.suppliername;
                if (!regularSalesBySupplier.has(supplierName)) {
                    regularSalesBySupplier.set(supplierName, new Map());
                }
                const itemSales = regularSalesBySupplier.get(supplierName);
                itemSales.set(saleItem.itemName, (itemSales.get(saleItem.itemName) || 0) + saleItem.quantity);
            }
        }
    }
    // Pre-index container sales by itemName + sourceId for O(1) lookup
    const containerSalesIndex = new Map();
    for (const sale of containerSaleItems) {
        const key = `${sale.itemName}-${sale.sale.sourceId}`;
        containerSalesIndex.set(key, (containerSalesIndex.get(key) || 0) + (sale.quantity || 0));
    }
    const inventoryMap = new Map();
    for (const item of allContainerItems) {
        const key = `${item.itemName}-${item.container.supplier.suppliername}`;
        const existing = inventoryMap.get(key);
        if (existing) {
            existing.received += item.quantity;
            existing.containerIds.add(item.containerId);
        }
        else {
            inventoryMap.set(key, {
                itemName: item.itemName,
                supplierName: item.container.supplier.suppliername,
                received: item.quantity,
                containerIds: new Set([item.containerId]),
            });
        }
    }
    // 5. Calculate final values in a single pass
    const inventoryArray = Array.from(inventoryMap.values()).map((item) => {
        // Sum container sales using pre-indexed data
        let containerSoldQty = 0;
        for (const containerId of item.containerIds) {
            const key = `${item.itemName}-${containerId}`;
            containerSoldQty += containerSalesIndex.get(key) || 0;
        }
        // Get regular sales (already aggregated by supplier + item)
        const supplierSales = regularSalesBySupplier.get(item.supplierName);
        const regularSoldQty = supplierSales?.get(item.itemName) || 0;
        const sold = containerSoldQty + regularSoldQty;
        const available = item.received - sold;
        return {
            itemName: item.itemName,
            supplierName: item.supplierName,
            available,
        };
    });
    // Sort by supplier name (alphabetically), then by item name (alphabetically)
    inventoryArray.sort((a, b) => {
        const supplierCompare = a.supplierName.localeCompare(b.supplierName);
        if (supplierCompare !== 0) {
            return supplierCompare;
        }
        return a.itemName.localeCompare(b.itemName);
    });
    return inventoryArray;
};
exports.getInventoryReport = getInventoryReport;
const getInventoryReport_22 = async (companyId) => {
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
    // Get all container sale items for this company
    const containerSaleItems = await prisma_1.default.saleItem.findMany({
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
    // Get all regular sale items for this company
    const regularSaleItems = await prisma_1.default.saleItem.findMany({
        where: {
            sale: {
                companyId: companyId,
                sourceType: "regular",
            },
        },
        include: {
            sale: {
                select: {
                    sourceId: true,
                },
            },
        },
    });
    // For regular sales, we need to map sourceId to supplier via supplierItem
    const regularSalesBySupplier = {};
    for (const saleItem of regularSaleItems) {
        if (saleItem.sale.sourceId) {
            const supplierItem = await prisma_1.default.supplierItem.findUnique({
                where: { id: saleItem.sale.sourceId },
                include: { supplier: true },
            });
            if (supplierItem) {
                const supplierName = supplierItem.supplier.suppliername;
                if (!regularSalesBySupplier[supplierName]) {
                    regularSalesBySupplier[supplierName] = [];
                }
                regularSalesBySupplier[supplierName].push({
                    itemName: saleItem.itemName,
                    quantity: saleItem.quantity,
                    containerId: "", // Regular sales don't have containerIds, we'll handle this separately
                });
            }
        }
    }
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
        // Count container sales from THIS supplier's containers
        const containerSales = containerSaleItems.filter((s) => s.itemName === inventoryItem.itemName &&
            inventoryItem.containerIds.includes(s.sale.sourceId));
        const containerSoldQty = containerSales.reduce((sum, s) => sum + (s.quantity || 0), 0);
        // Count regular sales for this supplier
        const regularSales = regularSalesBySupplier[inventoryItem.supplierName] || [];
        const regularSoldQty = regularSales
            .filter((s) => s.itemName === inventoryItem.itemName)
            .reduce((sum, s) => sum + (s.quantity || 0), 0);
        const totalSoldQty = containerSoldQty + regularSoldQty;
        inventoryItem.sold = totalSoldQty;
        inventoryItem.available = inventoryItem.received - totalSoldQty;
        inventoryItem.totalValue =
            inventoryItem.available * inventoryItem.unitPrice;
    });
    // Convert map to array and remove containerIds before returning
    const inventoryArray = Array.from(inventoryMap.values()).map((item) => ({
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
exports.getInventoryReport_22 = getInventoryReport_22;
