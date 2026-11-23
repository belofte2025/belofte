import { Request, Response } from "express";
import prisma from "../utils/prisma";

export const getContainers = async (req: Request, res: Response) => {
  try {
    const companyId = req.user?.companyId;

    if (!companyId) {
      res.status(400).json({ error: "Company ID is required" });
      return;
    }

    const containers = await prisma.container.findMany({
      where: {
        companyId,
      },
      include: {
        Supplier: {
          select: { id: true, suppliername: true, country: true }, // Avoid exposing all supplier data
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(containers);
    return;
  } catch (error) {
    console.error("Error fetching containers:", error);
    res.status(500).json({ error: "Internal server error" });
    return;
  }
};

export const createContainer = async (req: Request, res: Response) => {
  try {
    const { containerNo, arrivalDate, year, supplierId, items, initialStatus } = req.body;
    const companyId = req.user!.companyId;

    // Resolve canonical names (case-insensitive + alias match) and upsert SupplierItems
    const nameMap = await upsertSupplierItems(supplierId, items);

    const validStatuses = ["Pending", "Received"];
    const status = validStatuses.includes(initialStatus) ? initialStatus : "Pending";

    const container = await prisma.container.create({
      data: {
        containerNo,
        arrivalDate: new Date(arrivalDate),
        year,
        supplierId,
        companyId,
        status,
        ContainerItem: {
          create: items.map((item: { itemName: string; quantity: number; unitPrice: number }) => ({
            itemName: nameMap.get(item.itemName) ?? item.itemName.trim(),
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          })),
        },
      },
    });

    res.status(201).json(container);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "Failed to create container", detail: err });
  }
};

export const getContainerById = async (req: Request, res: Response) => {
  const { id } = req.params;
  const companyId = req.user?.companyId;

  const container = await prisma.container.findUnique({
    where: { id },
    include: { ContainerItem: true, Supplier: true },
  });

  if (!container || container.companyId !== companyId) {
    res.status(404).json({ error: "Container not found" });
    return;
  }

  res.json(container);
};

async function verifyContainerOwnership(id: string, companyId: string | undefined): Promise<boolean> {
  if (!companyId) return false;
  const container = await prisma.container.findUnique({ where: { id }, select: { companyId: true } });
  return container?.companyId === companyId;
}

export const markContainerAsShipped = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    if (!await verifyContainerOwnership(id, req.user?.companyId)) {
      res.status(404).json({ error: "Container not found" });
      return;
    }
    await prisma.container.update({ where: { id }, data: { status: "Shipped" } });
    res.json({ message: "Container marked as shipped" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to mark container as shipped" });
  }
};

export const markContainerAsArrived = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    if (!await verifyContainerOwnership(id, req.user?.companyId)) {
      res.status(404).json({ error: "Container not found" });
      return;
    }
    await prisma.container.update({ where: { id }, data: { status: "Arrived" } });
    res.json({ message: "Container marked as arrived at port" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to mark container as arrived" });
  }
};

export const receiveContainerWithVerification = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { nameCorrections } = req.body as { nameCorrections?: Record<string, string> };
  try {
    if (!await verifyContainerOwnership(id, req.user?.companyId)) {
      res.status(404).json({ error: "Container not found" });
      return;
    }
    await prisma.$transaction(async (tx) => {
      for (const [oldName, newName] of Object.entries(nameCorrections || {})) {
        if (oldName !== newName) {
          await tx.containerItem.updateMany({
            where: { containerId: id, itemName: oldName },
            data: { itemName: newName },
          });
        }
      }
      await tx.container.update({ where: { id }, data: { status: "Received" } });
    });
    res.json({ message: "Container received and item names verified" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to receive container" });
  }
};

export const markContainerAsReceived = async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!await verifyContainerOwnership(id, req.user?.companyId)) {
    res.status(404).json({ error: "Container not found" });
    return;
  }
  await prisma.container.update({ where: { id }, data: { status: "Received" } });
  res.json({ message: "Container marked as received" });
};

export const markContainerAsIncomplete = async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!await verifyContainerOwnership(id, req.user?.companyId)) {
    res.status(404).json({ error: "Container not found" });
    return;
  }
  await prisma.container.update({ where: { id }, data: { status: "Incomplete" } });
  res.json({ message: "Container marked as offload Incomplete" });
};

export const markContainerAsDone = async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!await verifyContainerOwnership(id, req.user?.companyId)) {
    res.status(404).json({ error: "Container not found" });
    return;
  }
  await prisma.container.update({ where: { id }, data: { status: "Done" } });
  res.json({ message: "Container marked as offload done" });
};
// DELETE a container
export const deleteContainer = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    if (!await verifyContainerOwnership(id, req.user?.companyId)) {
      res.status(404).json({ error: "Container not found" });
      return;
    }

    await prisma.containerItem.deleteMany({ where: { containerId: id } });
    await prisma.container.delete({ where: { id } });

    res.json({ message: "Container deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: "Failed to delete container", detail: error });
  }
};

// UPDATE received quantities for container items
export const updateReceivedQuantities = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { items } = req.body;

  try {
    if (!await verifyContainerOwnership(id, req.user?.companyId)) {
      res.status(404).json({ error: "Container not found" });
      return;
    }

    const updates = await Promise.all(
      items.map((item: { itemId: string; receivedQty: number }) =>
        prisma.containerItem.update({
          where: { id: item.itemId },
          data: { receivedQty: item.receivedQty },
        })
      )
    );

    res.json({ message: "Received quantities updated", updates });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "Failed to update quantities", detail: err });
  }
};

export const completeOffload = async (req: Request, res: Response) => {
  const containerId = req.params.id;
  const { items } = req.body;

  try {
    if (!await verifyContainerOwnership(containerId, req.user?.companyId)) {
      res.status(404).json({ error: "Container not found" });
      return;
    }

    await Promise.all(
      items.map((item: { id: string; receivedQty: number }) =>
        prisma.containerItem.update({
          where: { id: item.id },
          data: { receivedQty: item.receivedQty },
        })
      )
    );

    await prisma.container.update({
      where: { id: containerId },
      data: { status: "Done" },
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Offload error:", error);
    res.status(500).json({ error: "Failed to complete offload" });
  }
};

export const saveOffloadData = async (req: Request, res: Response) => {
  try {
    const { containerId, items, isComplete } = req.body;

    if (!await verifyContainerOwnership(containerId, req.user?.companyId)) {
      res.status(404).json({ error: "Container not found" });
      return;
    }

    for (const item of items) {
      await prisma.containerItem.updateMany({
        where: { containerId, itemName: item.itemName },
        data: { receivedQty: item.receivedQty },
      });
    }

    await prisma.container.update({
      where: { id: containerId },
      data: { status: isComplete ? "Done" : "Received" },
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Offload error:", error);
    res.status(500).json({ error: "Failed to save offload data" });
  }
};
export const getContainerItems = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const items = await prisma.containerItem.findMany({
      where: { containerId: id },
      orderBy: { itemName: "asc" },
    });

    res.json(items);
  } catch (err) {
    console.error("Failed to get container items", err);
    res.status(500).json({ error: "Failed to get container items" });
  }
};
// GET /api/containers/:id/summary
export const getOffloadSummary = async (req: Request, res: Response) => {
  const { id } = req.params;

  const items = await prisma.containerItem.findMany({
    where: { containerId: id },

    select: {
      id: true,
      itemName: true,
      quantity: true,
      receivedQty: true,
    },
  });

  res.json(
    items.map((item: { id: string; itemName: string; quantity: number; receivedQty: number }) => ({
      id: item.id,
      name: item.itemName,
      expected: item.quantity,
      received: item.receivedQty,
    }))
  );
};

export const listContainerItemsWithSales = async (
  req: Request,
  res: Response
) => {
  const { id: containerId } = req.params;
  if (!containerId) {
    res.status(400).json({ error: "Missing containerId" });
    return;
  }

  try {
    // Step 1: Get container and its supplier
    const container = await prisma.container.findUnique({
      where: { id: containerId },
      include: { Supplier: true },
    });

    if (!container) {
      res.status(404).json({ error: "Container not found" });
      return;
    }

    const PRE_WAREHOUSE = ["Pending", "Shipped", "Arrived"];
    const preWarehouse = PRE_WAREHOUSE.includes(container.status);

    // Step 2: Get container items
    const containerItems = await prisma.containerItem.findMany({
      where: { containerId },
    });

    // Step 3: Get sales for this container
    const sales = await prisma.sale.findMany({
      where: {
        sourceId: containerId,
        sourceType: "container",
      },
      include: { SaleItem: true },
    });

    // Step 4: Aggregate sold quantities
    const soldMap: Record<string, number> = {};
    sales.forEach((sale: { SaleItem: { itemName: string; quantity: number }[] }) => {
      sale.SaleItem.forEach((item: { itemName: string; quantity: number }) => {
        soldMap[item.itemName] = (soldMap[item.itemName] || 0) + item.quantity;
      });
    });

    // Step 5: Fetch supplier items ONLY for this container's supplier
    const supplierItems = await prisma.supplierItem.findMany({
      where: { supplierId: container.supplierId },
      select: { itemName: true, alias: true },
    });

    const supplierItemMap = new Map(
      supplierItems.map((item: { itemName: string; alias: string | null }) => [item.itemName, item.alias])
    );

    // Step 5b: Stock held by this supplier for these items, counted the same way
    // the inventory report and the stock adjustment screen count it: everything
    // received across all of the supplier's containers, less everything sold
    // through either sale route, plus stock adjustments.
    //
    // Deducting only this container's own sales is not enough. The same item
    // also sells through regular sales, and damage or loss is recorded as an
    // adjustment; neither touches this container's rows, so without them the
    // screen offers stock that is no longer there.
    const itemNames = containerItems.map((i: { itemName: string }) => i.itemName);
    const supplierId = container.supplierId;
    const companyId = container.companyId;

    const [supplierContainerItems, supplierItemIds, adjustments] = await Promise.all([
      prisma.containerItem.findMany({
        where: { itemName: { in: itemNames }, Container: { supplierId, companyId } },
        select: { itemName: true, quantity: true, containerId: true },
      }),
      prisma.supplierItem.findMany({ where: { supplierId }, select: { id: true } }),
      prisma.stockAdjustment.findMany({
        where: { supplierId, companyId, itemName: { in: itemNames } },
        select: { itemName: true, adjustmentQty: true },
      }),
    ]);

    const supplierContainerIds = [
      ...new Set(supplierContainerItems.map((ci: { containerId: string }) => ci.containerId)),
    ];

    const allSupplierSales = await prisma.saleItem.findMany({
      where: {
        itemName: { in: itemNames },
        OR: [
          { Sale: { companyId, sourceType: "container", sourceId: { in: supplierContainerIds } } },
          {
            Sale: { companyId, sourceType: "regular" },
            OR: [
              { supplierItemId: { in: supplierItemIds.map((s: { id: string }) => s.id) } },
              { supplierItemId: null, Sale: { sourceId: { in: supplierItemIds.map((s: { id: string }) => s.id) } } },
            ],
          },
        ],
      },
      select: { itemName: true, quantity: true },
    });

    const sum = <T>(rows: T[], name: (r: T) => string, qty: (r: T) => number) => {
      const m: Record<string, number> = {};
      for (const r of rows) m[name(r)] = (m[name(r)] || 0) + (qty(r) || 0);
      return m;
    };
    const receivedBySupplier = sum(supplierContainerItems, r => r.itemName, r => r.quantity);
    const soldBySupplier     = sum(allSupplierSales,       r => r.itemName, r => r.quantity);
    const adjBySupplier      = sum(adjustments,            r => r.itemName, r => r.adjustmentQty);

    // Step 6: Final result
    const result = containerItems.map((item: { id: string; itemName: string; quantity: number; receivedQty: number; unitPrice: number }) => {
      const soldQty = soldMap[item.itemName] || 0;
      const fromThisContainer = (item.quantity || 0) - soldQty;
      const supplierAvailable =
        (receivedBySupplier[item.itemName] || 0) -
        (soldBySupplier[item.itemName] || 0) +
        (adjBySupplier[item.itemName] || 0);
      // Capped by both: never more than this container brought in and is still
      // unsold, and never more than the supplier actually holds.
      const remainingQty = preWarehouse
        ? 0
        : Math.max(0, Math.min(fromThisContainer, supplierAvailable));
      const alias = supplierItemMap.get(item.itemName);
      const isMatched = supplierItemMap.has(item.itemName);
      const supplierName = isMatched
        ? container.Supplier.suppliername
        : "Unknown";

      return {
        id: item.id,
        itemName: item.itemName,
        alias: alias || null,
        expectedQty: item.quantity,
        receivedQty: item.receivedQty,
        soldQty,
        remainingQty,
        unitPrice: item.unitPrice,
        supplierName,
        containerNo: container.containerNo, // ✅ Added here
      };
    });

    res.json(result);
    return;
  } catch (error) {
    console.error("Error loading container items with sales:", error);
    res
      .status(500)
      .json({ error: "Failed to fetch container items with sales" });
    return;
  }
};

// Route: GET /api/containers/:id/summary
export const getContainerSalesSummary = async (req: Request, res: Response) => {
  try {
    const containerId = req.params.id;

    // Get container + items
    const container = await prisma.container.findUnique({
      where: { id: containerId },
      include: {
        Supplier: true,
        ContainerItem: true,
      },
    });

    if (!container) {
      res.status(404).json({ message: "Container not found" });
      return;
    }

    const containerItems = container.ContainerItem;

    // Get sales and sale items from this container
    const sales = await prisma.sale.findMany({
      where: {
        sourceId: containerId,
        sourceType: "container",
      },
      include: {
        SaleItem: true,
      },
    });

    // Flatten and group sale items by itemName; also tally credit vs cash
    const soldItemMap: Record<string, { soldQty: number; totalAmount: number }> = {};
    let creditSales = 0;
    let cashSales = 0;

    for (const sale of sales) {
      const saleTotal = sale.totalAmount ?? 0;
      if ((sale.saleType ?? "").toLowerCase() === "credit") {
        creditSales += saleTotal;
      } else {
        cashSales += saleTotal;
      }
      for (const item of sale.SaleItem) {
        if (!soldItemMap[item.itemName]) {
          soldItemMap[item.itemName] = { soldQty: 0, totalAmount: 0 };
        }
        soldItemMap[item.itemName].soldQty += item.quantity;
        soldItemMap[item.itemName].totalAmount += item.quantity * item.unitPrice;
      }
    }

    // Stock this supplier still holds of these items, counted as the inventory
    // report counts it. Deducting only this container's own sales overstated
    // "remaining": the same item also sells through regular sales, and damage
    // or loss is an adjustment, and neither touches this container's rows.
    const summaryItemNames = containerItems.map((i: { itemName: string }) => i.itemName);
    const summarySupplierId = container.supplierId;
    const summaryCompanyId = container.companyId;

    const [supCI, supSI, supAdj] = await Promise.all([
      prisma.containerItem.findMany({
        where: { itemName: { in: summaryItemNames }, Container: { supplierId: summarySupplierId, companyId: summaryCompanyId } },
        select: { itemName: true, quantity: true, containerId: true },
      }),
      prisma.supplierItem.findMany({ where: { supplierId: summarySupplierId }, select: { id: true } }),
      prisma.stockAdjustment.findMany({
        where: { supplierId: summarySupplierId, companyId: summaryCompanyId, itemName: { in: summaryItemNames } },
        select: { itemName: true, adjustmentQty: true },
      }),
    ]);

    const supCIds = [...new Set(supCI.map((c: { containerId: string }) => c.containerId))];
    const supSales = await prisma.saleItem.findMany({
      where: {
        itemName: { in: summaryItemNames },
        OR: [
          { Sale: { companyId: summaryCompanyId, sourceType: "container", sourceId: { in: supCIds } } },
          {
            Sale: { companyId: summaryCompanyId, sourceType: "regular" },
            OR: [
              { supplierItemId: { in: supSI.map((s: { id: string }) => s.id) } },
              { supplierItemId: null, Sale: { sourceId: { in: supSI.map((s: { id: string }) => s.id) } } },
            ],
          },
        ],
      },
      select: { itemName: true, quantity: true },
    });

    const roll = <T>(rows: T[], name: (r: T) => string, qty: (r: T) => number) => {
      const m: Record<string, number> = {};
      for (const r of rows) m[name(r)] = (m[name(r)] || 0) + (qty(r) || 0);
      return m;
    };
    const supplierReceived = roll(supCI,    r => r.itemName, r => r.quantity);
    const supplierSold     = roll(supSales, r => r.itemName, r => r.quantity);
    const supplierAdjusted = roll(supAdj,   r => r.itemName, r => r.adjustmentQty);

    const itemReport = containerItems.map((item: { itemName: string; quantity: number; receivedQty: number; unitPrice: number }) => {
      const soldData = soldItemMap[item.itemName] || { soldQty: 0, totalAmount: 0 };
      const fromThisContainer = item.quantity - soldData.soldQty;
      const supplierAvailable =
        (supplierReceived[item.itemName] || 0) -
        (supplierSold[item.itemName] || 0) +
        (supplierAdjusted[item.itemName] || 0);
      // Never more than this container still holds unsold, and never more than
      // the supplier actually has.
      const remainingQty = Math.max(0, Math.min(fromThisContainer, supplierAvailable));

      return {
        itemName: item.itemName,
        quantity: item.quantity,
        receivedQty: item.receivedQty,
        soldQty: soldData.soldQty,
        remainingQty,
        unitPrice: item.unitPrice,
        totalAmount: soldData.totalAmount,
      };
    });

    const totalSales = itemReport.reduce(
      (sum: number, item: { totalAmount: number }) => sum + item.totalAmount,
      0
    );

    res.json({
      id: container.id,
      containerNo: container.containerNo,
      arrivalDate: container.arrivalDate,
      companyName: container.Supplier.suppliername,
      containerItems: itemReport, // all items, including unsold (shows remaining stock)
      totalSales,
      creditSales,
      cashSales,
    });
    return;
  } catch (error) {
    console.error("Error generating container item report:", error);
    res.status(500).json({ message: "Internal server error" });
    return;
  }
};
// Returns a map of original input name → canonical SupplierItem name.
// Resolves case-insensitive exact matches and alias matches before creating new rows.
const upsertSupplierItems = async (
  supplierId: string,
  ContainerItem: { itemName: string; unitPrice: number; alias?: string }[]
): Promise<Map<string, string>> => {
  const nameMap = new Map<string, string>();

  for (const item of ContainerItem) {
    const inputName = item.itemName.trim();

    // 1. Case-insensitive exact match on itemName
    const ciMatch = await prisma.supplierItem.findFirst({
      where: { supplierId, itemName: { equals: inputName, mode: "insensitive" } },
    });
    if (ciMatch) {
      nameMap.set(item.itemName, ciMatch.itemName);
      if (ciMatch.price !== item.unitPrice) {
        await prisma.supplierItem.update({ where: { id: ciMatch.id }, data: { price: item.unitPrice } });
      }
      continue;
    }

    // 2. Alias match — the Excel name may be a registered alias for an existing item
    const aliasMatch = await prisma.supplierItem.findFirst({
      where: { supplierId, alias: { equals: inputName, mode: "insensitive" } },
    });
    if (aliasMatch) {
      nameMap.set(item.itemName, aliasMatch.itemName);
      if (aliasMatch.price !== item.unitPrice) {
        await prisma.supplierItem.update({ where: { id: aliasMatch.id }, data: { price: item.unitPrice } });
      }
      continue;
    }

    // 3. No match — create new SupplierItem using normalised (trimmed) name
    await prisma.supplierItem.create({
      data: {
        supplierId,
        itemName: inputName,
        alias: item.alias || null,
        price: item.unitPrice,
      },
    });
    nameMap.set(item.itemName, inputName);
  }

  return nameMap;
};
