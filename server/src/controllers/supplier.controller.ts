import { Request, Response } from "express";
import prisma from "../utils/prisma";

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
    console.error("Failed to create supplier:", err);
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
      include: { items: true },
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

    const supplier = await prisma.supplier.findFirst({
      where: { id, companyId },
      include: { items: true },
    });

    if (!supplier) {
      res.status(404).json({ error: "Supplier not found" });
      return;
    }

    res.json(supplier);
  } catch (err) {
    console.error("Failed to fetch supplier:", err);
    res.status(500).json({ error: "Failed to load supplier" });
  }
};

export const updateSupplier = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { suppliername, contact, country } = req.body;

    const supplier = await prisma.supplier.update({
      where: { id },
      data: { suppliername, contact, country },
    });

    res.json(supplier);
  } catch (err) {
    console.error("Failed to update supplier:", err);
    res.status(400).json({ error: "Failed to update supplier", detail: err });
  }
};

export const deleteSupplier = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.supplier.delete({ where: { id } });

    res.json({ message: "Supplier deleted" });
  } catch (err) {
    console.error("Failed to delete supplier:", err);
    res.status(400).json({ error: "Failed to delete supplier", detail: err });
  }
};

// ------------------------------
// SUPPLIER ITEMS
// ------------------------------

export const addSupplierItem = async (req: Request, res: Response) => {
  try {
    const { supplierId } = req.params;
    const { itemName, price } = req.body;

    const item = await prisma.supplierItem.create({
      data: {
        supplierId,
        itemName,
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

    const created = await prisma.supplierItem.createMany({
      data: items.map((item: any) => ({ ...item, supplierId })),
    });

    res.status(201).json({ count: created.count });
  } catch (err) {
    console.error("Failed to add multiple supplier items:", err);
    res.status(400).json({ error: "Failed to add items", detail: err });
  }
};

export const getSupplierItems = async (req: Request, res: Response) => {
  try {
    const { id: supplierId } = req.params;
    const companyId = req.user?.companyId;

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
        price: true,
      },
      orderBy: { itemName: "asc" },
    });

    res.json(items);
  } catch (err) {
    console.error("Error fetching supplier items:", err);
    res.status(500).json({ error: "Failed to fetch supplier items" });
  }
};

export const updateSupplierItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { itemName, price } = req.body;

    const item = await prisma.supplierItem.update({
      where: { id },
      data: { itemName, price },
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
    // Step 1: Fetch all supplier items with supplier info
    const supplierItems = await prisma.supplierItem.findMany({
      include: {
        supplier: true,
      },
    });

    // Step 2: Get all unique itemName/supplierId pairs
    const supplierItemMap = supplierItems.map((item: {
      id: string;
      itemName: string;
      supplierId: string;
      price: number;
      supplier: { suppliername: string } | null;
    }) => ({
      id: item.id,
      itemName: item.itemName,
      supplierId: item.supplierId,
      supplierName: item.supplier?.suppliername || "Unknown",
      price: item.price,
    }));

    // Step 3: Fetch all relevant container items in bulk
    const allContainerItems = await prisma.containerItem.findMany({
      include: {
        container: {
          select: {
            id: true,
            supplierId: true,
            companyId: true,
          },
        },
      },
    });

    // Step 4: Fetch all sale items in bulk
    const allSaleItems = await prisma.saleItem.findMany({
      select: {
        itemName: true,
        quantity: true,
        sale: {
          select: {
            companyId: true,
          },
        },
      },
    });

    // Step 5: Compute result per supplier item
    const result = supplierItemMap.map((sItem: {
      id: string;
      itemName: string;
      supplierId: string;
      supplierName: string;
      price: number;
    }) => {
      const relatedContainers = allContainerItems.filter(
        (c: {
          itemName: string;
          quantity: number;
          container: { supplierId: string; companyId: string } | null;
        }) =>
          c.itemName === sItem.itemName &&
          c.container?.supplierId === sItem.supplierId
      );

      const totalQty = relatedContainers.reduce(
        (sum: number, c: { quantity: number }) => sum + c.quantity,
        0
      );

      const relatedCompanyIds = relatedContainers.map(
        (c: { container: { companyId: string } | null }) => c.container?.companyId
      );

      const relatedSales = allSaleItems.filter(
        (s: {
          itemName: string;
          sale: { companyId: string };
        }) =>
          s.itemName === sItem.itemName &&
          relatedCompanyIds.includes(s.sale.companyId)
      );

      const soldQty = relatedSales.reduce(
        (sum: number, s: { quantity: number | null }) => sum + (s.quantity || 0),
        0
      );

      return {
        id: sItem.id,
        itemName: sItem.itemName,
        supplierName: sItem.supplierName,
        quantity: totalQty,
        soldQty,
        remainingQty: totalQty - soldQty,
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
    const { updates } = req.body; // [{ itemId, price }, ...]
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

    // Perform bulk updates
    const updatePromises = updates.map((update: { itemId: string; price: number }) =>
      prisma.supplierItem.update({
        where: { id: update.itemId },
        data: { price: update.price },
      })
    );

    const updatedItems = await Promise.all(updatePromises);

    res.json({
      message: `Updated ${updatedItems.length} item prices`,
      updatedItems,
    });
  } catch (error) {
    console.error("Failed to bulk update prices:", error);
    res.status(500).json({ error: "Failed to update prices", detail: error });
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
          container: {
            supplierId,
            companyId,
          },
        },
        include: {
          container: true,
        },
        orderBy: {
          container: {
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
        items: true,
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
      items: supplier.items.map(item => ({
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
        container: {
          supplierId,
          companyId,
        },
      },
      include: {
        container: {
          select: {
            id: true,
            containerNo: true,
            arrivalDate: true,
          },
        },
      },
      orderBy: {
        container: {
          arrivalDate: 'desc',
        },
      },
    });

    // Group by item name and get the latest entry for each
    const itemMap = new Map();
    containerItems.forEach(item => {
      if (!itemMap.has(item.itemName) || 
          new Date(item.container.arrivalDate) > new Date(itemMap.get(item.itemName).container.arrivalDate)) {
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
        id: item.container.id,
        containerNo: item.container.containerNo,
        arrivalDate: item.container.arrivalDate,
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
