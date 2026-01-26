import { Request, Response } from "express";
import prisma from "../utils/prisma";
import * as stockAdjustmentService from "../services/stockAdjustment.service";

// ------------------------------
// SUPPLIERS
// ------------------------------

export const createSupplier = async (req: Request, res: Response) => {
  try {
    const { suppliername, contact, country } = req.body;
    const companyId = req.user?.companyId;

    if (!companyId) {
      res.status(400).json({ error: "Company ID is missing" });
      return;
    }

    if (!suppliername || !contact || !country) {
      res.status(400).json({ error: "All fields are required" });
      return;
    }

    // Check for existing supplier with same name under the same company
    const existingSupplier = await prisma.supplier.findFirst({
      where: {
        suppliername: suppliername,
        companyId: companyId,
      },
    });

    if (existingSupplier) {
      res.status(409).json({
        error: "Supplier with this name already exists.",
      });
      return;
    }

    const supplier = await prisma.supplier.create({
      data: { suppliername, contact, country, companyId },
    });

    res.status(201).json(supplier);
    return;
  } catch (err) {
    console.error("Failed to create Supplier:", err);
    res.status(500).json({
      error: "Failed to create supplier",
      detail: err instanceof Error ? err.message : err,
    });
    return;
  }
};

export const getSuppliers = async (req: Request, res: Response) => {
  try {
    const companyId = req.user?.companyId;

    if (!companyId) {
      res.status(400).json({ error: "Company ID is missing" });
      return;
    }

    const suppliers = await prisma.supplier.findMany({
      where: { companyId },
      include: { SupplierItem: true },
    });

    res.json(suppliers);
  } catch (err) {
    console.error("Failed to fetch suppliers:", err);
    res.status(500).json({ error: "Failed to load suppliers" });
  }
};

export const getSupplierById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const companyId = req.user?.companyId;

    if (!companyId) {
      res.status(400).json({ error: "Company ID is missing" });
      return;
    }

    const supplier = await prisma.supplier.findFirst({
      where: { id, companyId },
      include: { SupplierItem: true },
    });

    if (!supplier) {
      res.status(404).json({ error: "Supplier not found" });
      return;
    }

    res.json(supplier);
  } catch (err) {
    console.error("Failed to fetch Supplier:", err);
    res.status(500).json({ error: "Failed to load supplier" });
  }
};

export const updateSupplier = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { suppliername, contact, country } = req.body;
    const companyId = req.user?.companyId;

    if (!companyId) {
      res.status(400).json({ error: "Company ID is missing" });
      return;
    }

    // Verify supplier belongs to company
    const existingSupplier = await prisma.supplier.findFirst({
      where: { id, companyId },
    });

    if (!existingSupplier) {
      res.status(404).json({ error: "Supplier not found" });
      return;
    }

    const supplier = await prisma.supplier.update({
      where: { id },
      data: { suppliername, contact, country },
    });

    res.json(supplier);
  } catch (err) {
    console.error("Failed to update Supplier:", err);
    res.status(400).json({ error: "Failed to update supplier", detail: err });
  }
};

export const deleteSupplier = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const companyId = req.user?.companyId;

    if (!companyId) {
      res.status(400).json({ error: "Company ID is missing" });
      return;
    }

    // Verify supplier belongs to company
    const existingSupplier = await prisma.supplier.findFirst({
      where: { id, companyId },
    });

    if (!existingSupplier) {
      res.status(404).json({ error: "Supplier not found" });
      return;
    }

    await prisma.supplier.delete({ where: { id } });

    res.json({ message: "Supplier deleted" });
  } catch (err) {
    console.error("Failed to delete Supplier:", err);
    res.status(400).json({ error: "Failed to delete supplier", detail: err });
  }
};

// ------------------------------
// SUPPLIER ITEMS
// ------------------------------

export const addSupplierItem = async (req: Request, res: Response) => {
  try {
    const { supplierId } = req.params;
    const { itemName, price, alias } = req.body;
    const companyId = req.user?.companyId;

    if (!companyId) {
      res.status(400).json({ error: "Company ID is missing" });
      return;
    }

    // Verify supplier belongs to company
    const supplier = await prisma.supplier.findFirst({
      where: { id: supplierId, companyId },
    });

    if (!supplier) {
      res.status(404).json({ error: "Supplier not found" });
      return;
    }

    const item = await prisma.supplierItem.create({
      data: {
        supplierId,
        itemName,
        alias,
        price,
      },
    });

    res.status(201).json(item);
  } catch (err) {
    console.error("Failed to add supplier item:", err);
    res.status(400).json({ error: "Failed to add supplier item", detail: err });
  }
};

export const addMultipleSupplierItems = async (req: Request, res: Response) => {
  try {
    const { supplierId } = req.params;
    const { items } = req.body; // [{ itemName, price }, ...]
    const companyId = req.user?.companyId;

    if (!companyId) {
      res.status(400).json({ error: "Company ID is missing" });
      return;
    }

    // Verify supplier belongs to company
    const supplier = await prisma.supplier.findFirst({
      where: { id: supplierId, companyId },
    });

    if (!supplier) {
      res.status(404).json({ error: "Supplier not found" });
      return;
    }

    const created = await prisma.supplierItem.createMany({
      data: items.map((item: any) => ({ ...item, supplierId })),
    });

    res.status(201).json({ count: created.count });
  } catch (err) {
    console.error("Failed to add multiple supplier SaleItem:", err);
    res.status(400).json({ error: "Failed to add items", detail: err });
  }
};

export const getSupplierItems = async (req: Request, res: Response) => {
  try {
    const { id: supplierId } = req.params;
    const companyId = req.user?.companyId;

    if (!companyId) {
      res.status(400).json({ error: "Company ID is missing" });
      return;
    }

    const supplier = await prisma.supplier.findFirst({
      where: { id: supplierId, companyId },
    });

    if (!supplier) {
      res.status(404).json({ error: "Supplier not found" });
      return;
    }

    const items = await prisma.supplierItem.findMany({
      where: { supplierId },
      select: {
        id: true,
        itemName: true,
        alias: true,
        price: true,
      },
      orderBy: { itemName: "asc" },
    });

    res.json(items);
  } catch (err) {
    console.error("Error fetching supplier SaleItem:", err);
    res.status(500).json({ error: "Failed to fetch supplier items" });
  }
};

export const updateSupplierItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { itemName, price, alias } = req.body;
    const companyId = req.user?.companyId;

    if (!companyId) {
      res.status(400).json({ error: "Company ID is missing" });
      return;
    }

    // Verify item's supplier belongs to company
    const existingItem = await prisma.supplierItem.findFirst({
      where: {
        id,
        Supplier: {
          companyId,
        },
      },
    });

    if (!existingItem) {
      res.status(404).json({ error: "Supplier item not found" });
      return;
    }

    const item = await prisma.supplierItem.update({
      where: { id },
      data: { itemName, price, alias },
    });

    res.json(item);
  } catch (err) {
    console.error("Failed to update supplier item:", err);
    res.status(400).json({ error: "Failed to update item", detail: err });
  }
};

export const deleteSupplierItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const companyId = req.user?.companyId;

    if (!companyId) {
      res.status(400).json({ error: "Company ID is missing" });
      return;
    }

    // Verify item's supplier belongs to company
    const existingItem = await prisma.supplierItem.findFirst({
      where: {
        id,
        Supplier: {
          companyId,
        },
      },
    });

    if (!existingItem) {
      res.status(404).json({ error: "Supplier item not found" });
      return;
    }

    await prisma.supplierItem.delete({ where: { id } });

    res.json({ message: "Item deleted" });
  } catch (err) {
    console.error("Failed to delete supplier item:", err);
    res.status(400).json({ error: "Failed to delete item", detail: err });
  }
};

export const getSupplierslist = async (req: Request, res: Response) => {
  try {
    const companyId = req.user?.companyId;

    if (!companyId) {
      res.status(400).json({ error: "Company ID is missing" });
      return;
    }

    const suppliers = await prisma.supplier.findMany({
      where: { companyId },
      orderBy: { suppliername: "asc" },
    });

    res.json(suppliers);
  } catch (err) {
    console.error("Failed to fetch suppliers:", err);
    res.status(500).json({ error: "Failed to load suppliers" });
  }
};

export const listSupplierItemsWithSales = async (
  req: Request,
  res: Response
) => {
  try {
    const companyId = req.user?.companyId;

    if (!companyId) {
      res.status(400).json({ error: "Company ID is missing" });
      return;
    }

    // Step 1: Fetch supplier items for this company only
    const supplierItems = await prisma.supplierItem.findMany({
      where: {
        Supplier: {
          companyId,
        },
      },
      include: {
        Supplier: true,
      },
    });

    // Step 2: Get all unique itemName/supplierId pairs
    const supplierItemMap = supplierItems.map((item: {
      id: string;
      itemName: string;
      alias?: string | null;
      supplierId: string;
      price: number;
      Supplier: { suppliername: string } | null;
    }) => ({
      id: item.id,
      itemName: item.itemName,
      alias: item.alias,
      supplierId: item.supplierId,
      supplierName: item.Supplier?.suppliername || "Unknown",
      price: item.price,
    }));

    // Step 3: Fetch container items for this company only
    const allContainerItems = await prisma.containerItem.findMany({
      where: {
        Container: {
          companyId,
        },
      },
      include: {
        Container: {
          select: {
            id: true,
            supplierId: true,
            companyId: true,
          },
        },
      },
    });

    // Step 4: Fetch sale items for this company only (with source info)
    const allSaleItems = await prisma.saleItem.findMany({
      where: {
        Sale: {
          companyId,
        },
      },
      select: {
        itemName: true,
        quantity: true,
        Sale: {
          select: {
            companyId: true,
            sourceType: true,
            sourceId: true,
          },
        },
      },
    });

    // Step 4b: Get all container IDs for this company grouped by supplier
    const allContainersBySupplierId: Record<string, string[]> = {};
    allContainerItems.forEach((item: any) => {
      const supplierId = item.Container?.supplierId;
      if (supplierId) {
        if (!allContainersBySupplierId[supplierId]) {
          allContainersBySupplierId[supplierId] = [];
        }
        if (!allContainersBySupplierId[supplierId].includes(item.Container.id)) {
          allContainersBySupplierId[supplierId].push(item.Container.id);
        }
      }
    });

    // Step 4c: Get all supplierItem IDs grouped by supplier
    const supplierItemIdsBySupplierId: Record<string, string[]> = {};
    supplierItems.forEach((item: any) => {
      if (!supplierItemIdsBySupplierId[item.supplierId]) {
        supplierItemIdsBySupplierId[item.supplierId] = [];
      }
      supplierItemIdsBySupplierId[item.supplierId].push(item.id);
    });

    // Step 4d: Get all stock adjustments for this company
    const allStockAdjustments = await prisma.stockAdjustment.findMany({
      where: { companyId },
      select: {
        itemName: true,
        supplierId: true,
        adjustmentQty: true,
      },
    });

    // Group adjustments by supplier + itemName
    const adjustmentsBySupplierItem: Record<string, number> = {};
    allStockAdjustments.forEach((adj) => {
      const key = `${adj.supplierId}-${adj.itemName}`;
      adjustmentsBySupplierItem[key] = (adjustmentsBySupplierItem[key] || 0) + adj.adjustmentQty;
    });

    // Step 5: Compute result per supplier item
    const result = supplierItemMap.map((sItem: {
      id: string;
      itemName: string;
      alias?: string | null;
      supplierId: string;
      supplierName: string;
      price: number;
    }) => {
      const relatedContainers = allContainerItems.filter(
        (c: {
          itemName: string;
          quantity: number;
          Container: { supplierId: string; companyId: string } | null;
        }) =>
          c.itemName === sItem.itemName &&
          c.Container?.supplierId === sItem.supplierId
      );

      const totalQty = relatedContainers.reduce(
        (sum: number, c: { quantity: number }) => sum + c.quantity,
        0
      );

      // Filter sales to only count those from THIS supplier
      const containerIds = allContainersBySupplierId[sItem.supplierId] || [];
      const supplierItemIds = supplierItemIdsBySupplierId[sItem.supplierId] || [];

      const relatedSales = allSaleItems.filter(
        (s: {
          itemName: string;
          Sale: { companyId: string; sourceType: string; sourceId: string };
        }) => {
          // Only count sales for this item name
          if (s.itemName !== sItem.itemName) return false;

          // For container sales: check if container belongs to this supplier
          if (s.Sale.sourceType === 'container') {
            return containerIds.includes(s.Sale.sourceId);
          }

          // For regular sales: check if supplierItem belongs to this supplier
          if (s.Sale.sourceType === 'regular') {
            return supplierItemIds.includes(s.Sale.sourceId);
          }

          return false;
        }
      );

      const soldQty = relatedSales.reduce(
        (sum: number, s: { quantity: number | null }) => sum + (s.quantity || 0),
        0
      );

      // Get stock adjustments for this supplier + item
      const adjustmentKey = `${sItem.supplierId}-${sItem.itemName}`;
      const totalAdjustments = adjustmentsBySupplierItem[adjustmentKey] || 0;

      return {
        id: sItem.id,
        itemName: sItem.itemName,
        alias: sItem.alias,
        supplierName: sItem.supplierName,
        quantity: totalQty,
        soldQty,
        remainingQty: totalQty - soldQty + totalAdjustments,
        price: sItem.price,
      };
    });

    res.json(result);
  } catch (error) {
    console.error("Error fetching supplier item sales summary:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ------------------------------
// BULK PRICE & QUANTITY MANAGEMENT
// ------------------------------

export const bulkUpdatePrices = async (req: Request, res: Response) => {
  try {
    const { supplierId } = req.params;
    const { updates } = req.body; // [{ itemId, price, alias? }, ...]
    const companyId = req.user?.companyId;

    if (!companyId) {
      res.status(400).json({ error: "Company ID is missing" });
      return;
    }

    // Verify supplier belongs to company
    const supplier = await prisma.supplier.findFirst({
      where: { id: supplierId, companyId },
    });

    if (!supplier) {
      res.status(404).json({ error: "Supplier not found" });
      return;
    }

    // Validate all items belong to the supplier
    const itemIds = updates.map((u: { itemId: string }) => u.itemId);
    const items = await prisma.supplierItem.findMany({
      where: {
        id: { in: itemIds },
        supplierId,
      },
    });

    if (items.length !== itemIds.length) {
      res.status(400).json({ error: "Some items don't belong to this supplier" });
      return;
    }

    // Perform bulk updates (price and optional alias)
    const updatePromises = updates.map((update: { itemId: string; price: number; alias?: string }) => {
      const data: { price: number; alias?: string | null } = { price: update.price };
      if (update.alias !== undefined) {
        data.alias = update.alias || null;
      }
      return prisma.supplierItem.update({
        where: { id: update.itemId },
        data,
      });
    });

    const updatedItems = await Promise.all(updatePromises);

    res.json({
      message: `Updated ${updatedItems.length} item(s)`,
      updatedItems,
    });
  } catch (error) {
    console.error("Failed to bulk update SaleItem:", error);
    res.status(500).json({ error: "Failed to update items", detail: error });
  }
};

export const bulkAdjustQuantities = async (req: Request, res: Response) => {
  try {
    const { supplierId } = req.params;
    const { adjustments } = req.body; // [{ itemName, quantityChange, reason? }, ...]
    const companyId = req.user?.companyId;

    if (!companyId) {
      res.status(400).json({ error: "Company ID is missing" });
      return;
    }

    // Verify supplier belongs to company
    const supplier = await prisma.supplier.findFirst({
      where: { id: supplierId, companyId },
    });

    if (!supplier) {
      res.status(404).json({ error: "Supplier not found" });
      return;
    }

    // For each adjustment, find the latest container items for this supplier/item combination
    const results = [];

    for (const adjustment of adjustments) {
      const { itemName, quantityChange, reason } = adjustment;

      // Find container items for this supplier and item
      const containerItems = await prisma.containerItem.findMany({
        where: {
          itemName,
          Container: {
            supplierId,
            companyId,
          },
        },
        include: {
          Container: true,
        },
        orderBy: {
          Container: {
            arrivalDate: 'desc',
          },
        },
      });

      if (containerItems.length === 0) {
        results.push({
          itemName,
          status: 'skipped',
          reason: 'No container items found for this supplier/item combination',
        });
        continue;
      }

      // Apply adjustment to the most recent container item
      const latestItem = containerItems[0];
      const newQuantity = Math.max(0, latestItem.quantity + quantityChange);

      const updatedItem = await prisma.containerItem.update({
        where: { id: latestItem.id },
        data: { quantity: newQuantity },
      });

      results.push({
        itemName,
        status: 'updated',
        oldQuantity: latestItem.quantity,
        newQuantity,
        quantityChange,
        reason: reason || 'Bulk adjustment',
        containerId: latestItem.containerId,
      });
    }

    res.json({
      message: `Processed ${adjustments.length} quantity adjustments`,
      results,
    });
  } catch (error) {
    console.error("Failed to bulk adjust quantities:", error);
    res.status(500).json({ error: "Failed to adjust quantities", detail: error });
  }
};

export const getSupplierItemsForPriceManagement = async (req: Request, res: Response) => {
  try {
    const { supplierId } = req.params;
    const companyId = req.user?.companyId;

    if (!companyId) {
      res.status(400).json({ error: "Company ID is missing" });
      return;
    }

    // Verify supplier belongs to company
    const supplier = await prisma.supplier.findFirst({
      where: { id: supplierId, companyId },
      include: {
        SupplierItem: true,
      },
    });

    if (!supplier) {
      res.status(404).json({ error: "Supplier not found" });
      return;
    }

    res.json({
      supplier: {
        id: supplier.id,
        name: supplier.suppliername,
        country: supplier.country,
      },
      items: supplier.SupplierItem.map((item: any) => ({
        id: item.id,
        itemName: item.itemName,
        price: item.price,
      })),
    });
  } catch (error) {
    console.error("Failed to fetch items for price management:", error);
    res.status(500).json({ error: "Failed to fetch items", detail: error });
  }
};

export const getSupplierItemsForQuantityManagement = async (req: Request, res: Response) => {
  try {
    const { supplierId } = req.params;
    const companyId = req.user?.companyId;

    if (!companyId) {
      res.status(400).json({ error: "Company ID is missing" });
      return;
    }

    // Get supplier items with their latest quantities from containers
    const supplier = await prisma.supplier.findFirst({
      where: { id: supplierId, companyId },
    });

    if (!supplier) {
      res.status(404).json({ error: "Supplier not found" });
      return;
    }

    // Get all container items for this supplier
    const containerItems = await prisma.containerItem.findMany({
      where: {
        Container: {
          supplierId,
          companyId,
        },
      },
      include: {
        Container: {
          select: {
            id: true,
            containerNo: true,
            arrivalDate: true,
          },
        },
      },
      orderBy: {
        Container: {
          arrivalDate: 'desc',
        },
      },
    });

    // Group by item name and get the latest entry for each
    const itemMap = new Map();
    containerItems.forEach(item => {
      if (!itemMap.has(item.itemName) ||
          new Date(item.Container.arrivalDate) > new Date(itemMap.get(item.itemName).Container.arrivalDate)) {
        itemMap.set(item.itemName, item);
      }
    });

    const items = Array.from(itemMap.values()).map(item => ({
      id: item.id,
      itemName: item.itemName,
      quantity: item.quantity,
      receivedQty: item.receivedQty,
      soldQty: item.soldQty,
      unitPrice: item.unitPrice,
      container: {
        id: item.Container.id,
        containerNo: item.Container.containerNo,
        arrivalDate: item.Container.arrivalDate,
      },
    }));

    res.json({
      supplier: {
        id: supplier.id,
        name: supplier.suppliername,
        country: supplier.country,
      },
      items,
    });
  } catch (error) {
    console.error("Failed to fetch items for quantity management:", error);
    res.status(500).json({ error: "Failed to fetch items", detail: error });
  }
};

export const getSupplierItemsForAliasManagement = async (req: Request, res: Response) => {
  try {
    const { supplierId } = req.params;
    const companyId = req.user?.companyId;

    if (!companyId) {
      res.status(400).json({ error: "Company ID is missing" });
      return;
    }

    // Verify supplier belongs to company
    const supplier = await prisma.supplier.findFirst({
      where: { id: supplierId, companyId },
      include: {
        SupplierItem: {
          orderBy: { itemName: 'asc' },
        },
      },
    });

    if (!supplier) {
      res.status(404).json({ error: "Supplier not found" });
      return;
    }

    res.json({
      supplier: {
        id: supplier.id,
        name: supplier.suppliername,
        country: supplier.country,
      },
      items: supplier.SupplierItem.map((item: any) => ({
        id: item.id,
        itemName: item.itemName,
        alias: item.alias,
        price: item.price,
      })),
    });
  } catch (error) {
    console.error("Failed to fetch items for alias management:", error);
    res.status(500).json({ error: "Failed to fetch items", detail: error });
  }
};

export const bulkUpdateAliases = async (req: Request, res: Response) => {
  try {
    const { supplierId } = req.params;
    const { updates } = req.body; // [{ itemId, alias }, ...]
    const companyId = req.user?.companyId;

    if (!companyId) {
      res.status(400).json({ error: "Company ID is missing" });
      return;
    }

    // Verify supplier belongs to company
    const supplier = await prisma.supplier.findFirst({
      where: { id: supplierId, companyId },
    });

    if (!supplier) {
      res.status(404).json({ error: "Supplier not found" });
      return;
    }

    // Validate all items belong to the supplier
    const itemIds = updates.map((u: { itemId: string }) => u.itemId);
    const items = await prisma.supplierItem.findMany({
      where: {
        id: { in: itemIds },
        supplierId,
      },
    });

    if (items.length !== itemIds.length) {
      res.status(400).json({ error: "Some items don't belong to this supplier" });
      return;
    }

    // Perform bulk alias updates
    const updatePromises = updates.map((update: { itemId: string; alias?: string }) => {
      return prisma.supplierItem.update({
        where: { id: update.itemId },
        data: { alias: update.alias || null },
      });
    });

    const updatedItems = await Promise.all(updatePromises);

    res.json({
      message: `Updated ${updatedItems.length} item alias(es)`,
      updatedItems,
    });
  } catch (error) {
    console.error("Failed to bulk update aliases:", error);
    res.status(500).json({ error: "Failed to update aliases", detail: error });
  }
};

// ------------------------------
// STOCK ADJUSTMENTS
// ------------------------------

export const createStockAdjustments = async (req: Request, res: Response) => {
  try {
    const { supplierId } = req.params;
    const { adjustments } = req.body;
    const companyId = req.user?.companyId;
    const userId = req.user?.id;

    if (!companyId || !userId) {
      res.status(400).json({ error: "Company ID or User ID is missing" });
      return;
    }

    if (!adjustments || !Array.isArray(adjustments) || adjustments.length === 0) {
      res.status(400).json({ error: "Adjustments array is required" });
      return;
    }

    // Validate adjustment structure
    for (const adj of adjustments) {
      if (!adj.itemName || adj.adjustmentQty === undefined || !adj.adjustmentType) {
        res.status(400).json({
          error: "Each adjustment must have itemName, adjustmentQty, and adjustmentType",
        });
        return;
      }
    }

    const result = await stockAdjustmentService.createStockAdjustments(
      supplierId,
      adjustments,
      userId,
      companyId
    );

    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }

    res.status(201).json({
      message: `Created ${result.adjustments?.length} adjustment(s)`,
      adjustments: result.adjustments,
    });
  } catch (error) {
    console.error("Failed to create stock adjustments:", error);
    res.status(500).json({
      error: "Failed to create stock adjustments",
      detail: error instanceof Error ? error.message : error,
    });
  }
};

export const getStockAdjustmentHistory = async (req: Request, res: Response) => {
  try {
    const { supplierId } = req.params;
    const { itemName, limit = "50", offset = "0" } = req.query;
    const companyId = req.user?.companyId;

    if (!companyId) {
      res.status(400).json({ error: "Company ID is missing" });
      return;
    }

    const result = await stockAdjustmentService.getAdjustmentHistory(
      supplierId,
      companyId,
      itemName as string | undefined,
      parseInt(limit as string),
      parseInt(offset as string)
    );

    res.json(result);
  } catch (error) {
    console.error("Failed to fetch adjustment history:", error);
    res.status(500).json({
      error: "Failed to fetch adjustment history",
      detail: error instanceof Error ? error.message : error,
    });
  }
};

export const getStockAdjustmentSummary = async (req: Request, res: Response) => {
  try {
    const { supplierId, itemName } = req.params;
    const companyId = req.user?.companyId;

    if (!companyId) {
      res.status(400).json({ error: "Company ID is missing" });
      return;
    }

    const result = await stockAdjustmentService.getAdjustmentSummary(
      supplierId,
      itemName,
      companyId
    );

    res.json(result);
  } catch (error) {
    console.error("Failed to fetch adjustment summary:", error);
    res.status(500).json({
      error: "Failed to fetch adjustment summary",
      detail: error instanceof Error ? error.message : error,
    });
  }
};

export const getSupplierStockWithAdjustments = async (req: Request, res: Response) => {
  try {
    const { supplierId } = req.params;
    const companyId = req.user?.companyId;

    if (!companyId) {
      res.status(400).json({ error: "Company ID is missing" });
      return;
    }

    // Verify supplier belongs to company
    const supplier = await prisma.supplier.findFirst({
      where: { id: supplierId, companyId },
    });

    if (!supplier) {
      res.status(404).json({ error: "Supplier not found" });
      return;
    }

    // Get inventory by supplier (now includes adjustments)
    const { getInventoryBySupplier } = await import("../services/inventory.service");
    const inventory = await getInventoryBySupplier(supplierId);

    // Get adjustment totals by item
    const adjustmentTotals = await stockAdjustmentService.getTotalAdjustmentsBySupplierId(
      supplierId,
      companyId
    );

    // Enhance inventory with adjustment details
    const enhancedInventory = inventory.map((item) => ({
      ...item,
      totalAdjustments: adjustmentTotals[item.itemName] || 0,
    }));

    res.json({
      supplier: {
        id: supplier.id,
        name: supplier.suppliername,
        country: supplier.country,
      },
      inventory: enhancedInventory,
    });
  } catch (error) {
    console.error("Failed to fetch supplier stock with adjustments:", error);
    res.status(500).json({
      error: "Failed to fetch supplier stock",
      detail: error instanceof Error ? error.message : error,
    });
  }
};
9