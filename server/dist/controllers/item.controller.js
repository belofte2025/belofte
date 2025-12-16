"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mergeDuplicateItems = exports.getSupplierItemStatistics = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
/**
 * Get item statistics for a supplier
 * Used for deduplication - shows all items with their usage counts
 */
const getSupplierItemStatistics = async (req, res) => {
    try {
        const { supplierId } = req.params;
        // Get all container items for this supplier with aggregated data
        const items = await prisma_1.default.containerItem.groupBy({
            by: ["itemName"],
            where: {
                container: {
                    supplierId,
                },
            },
            _sum: {
                quantity: true,
                receivedQty: true,
                soldQty: true,
            },
            _count: {
                id: true,
            },
        });
        // For each unique item name, get additional statistics
        const itemStatistics = await Promise.all(items.map(async (item) => {
            // Get total sales count for this supplier
            // First get all container IDs for this supplier
            const supplierContainers = await prisma_1.default.container.findMany({
                where: { supplierId },
                select: { id: true },
            });
            const containerIds = supplierContainers.map((c) => c.id);
            const salesCount = await prisma_1.default.saleItem.count({
                where: {
                    itemName: item.itemName,
                    sale: {
                        sourceType: "container",
                        sourceId: { in: containerIds },
                    },
                },
            });
            // Get a sample ID for this item name (we'll use the first one)
            const sampleItem = await prisma_1.default.containerItem.findFirst({
                where: {
                    itemName: item.itemName,
                    container: {
                        supplierId,
                    },
                },
                select: {
                    id: true,
                },
            });
            return {
                id: sampleItem?.id || "",
                itemName: item.itemName,
                totalQuantity: item._sum.quantity || 0,
                totalReceived: item._sum.receivedQty || 0,
                totalSales: item._sum.soldQty || 0,
                containerCount: item._count.id,
                transactionCount: salesCount,
            };
        }));
        // Sort by item name for easier duplicate detection
        itemStatistics.sort((a, b) => a.itemName.localeCompare(b.itemName));
        res.json(itemStatistics);
    }
    catch (error) {
        console.error("Error fetching item statistics:", error);
        res.status(500).json({ message: "Failed to fetch item statistics" });
    }
};
exports.getSupplierItemStatistics = getSupplierItemStatistics;
/**
 * Merge duplicate items
 * Updates all references to duplicate items to point to the master item
 */
const mergeDuplicateItems = async (req, res) => {
    try {
        const { supplierId, mergeGroups } = req.body;
        if (!supplierId || !mergeGroups || !Array.isArray(mergeGroups)) {
            res.status(400).json({
                message: "Invalid request. supplierId and mergeGroups are required",
            });
            return;
        }
        let totalMerged = 0;
        // Process each merge group in a transaction
        for (const group of mergeGroups) {
            const { masterName, duplicateNames } = group;
            if (!masterName || !duplicateNames || duplicateNames.length === 0) {
                continue;
            }
            await prisma_1.default.$transaction(async (tx) => {
                // Update all container items with duplicate names to use master name
                await tx.containerItem.updateMany({
                    where: {
                        itemName: { in: duplicateNames },
                        container: { supplierId },
                    },
                    data: {
                        itemName: masterName,
                    },
                });
                // Update all sale items with duplicate names
                // First get container IDs for this supplier
                const containers = await tx.container.findMany({
                    where: { supplierId },
                    select: { id: true },
                });
                const containerIds = containers.map((c) => c.id);
                await tx.saleItem.updateMany({
                    where: {
                        itemName: { in: duplicateNames },
                        sale: {
                            sourceType: "container",
                            sourceId: { in: containerIds },
                        },
                    },
                    data: {
                        itemName: masterName,
                    },
                });
                // Delete duplicate supplier items, keeping only the master
                await tx.supplierItem.deleteMany({
                    where: {
                        supplierId: supplierId,
                        itemName: { in: duplicateNames },
                    },
                });
                totalMerged += duplicateNames.length;
            });
        }
        res.json({
            message: "Duplicates merged successfully",
            mergedCount: totalMerged,
        });
    }
    catch (error) {
        console.error("Error merging duplicates:", error);
        res.status(500).json({
            message: error.message || "Failed to merge duplicate items",
        });
    }
};
exports.mergeDuplicateItems = mergeDuplicateItems;
