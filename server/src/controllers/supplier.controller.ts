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
