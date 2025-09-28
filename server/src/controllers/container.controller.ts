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
        supplier: {
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
    const { containerNo, arrivalDate, year, supplierId, items } = req.body;
    const companyId = req.user!.companyId;

    await upsertSupplierItems(supplierId, items); // Ensure SupplierItems are updated

    const container = await prisma.container.create({
      data: {
        containerNo,
        arrivalDate: new Date(arrivalDate),
        year,
        supplierId,
        companyId,
        items: {
          create: items.map((item: { itemName: string; quantity: number; unitPrice: number }) => ({
            itemName: item.itemName,
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
  const container = await prisma.container.findUnique({
    where: { id },
    include: { items: true, supplier: true },
  });

  if (!container) {
    res.status(404).json({ error: "Container not found" });
    return;
  }

  res.json(container);
};

export const markContainerAsReceived = async (req: Request, res: Response) => {
  const { id } = req.params;

  await prisma.container.update({
    where: { id },
    data: { status: "Received" },
  });

  res.json({ message: "Container marked as received" });
};

export const markContainerAsIncomplete = async (
  req: Request,
  res: Response
) => {
  const { id } = req.params;

  await prisma.container.update({
    where: { id },
    data: { status: "Incomplete" },
  });

  res.json({ message: "Container marked as offload Incomplete" });
};

export const markContainerAsDone = async (req: Request, res: Response) => {
  const { id } = req.params;

  await prisma.container.update({
    where: { id },
    data: { status: "Done" },
  });

  res.json({ message: "Container marked as offload done" });
};
// DELETE a container
export const deleteContainer = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    // Delete container items first due to foreign key constraint
    await prisma.containerItem.deleteMany({ where: { containerId: id } });

    // Delete the container itself
    await prisma.container.delete({ where: { id } });

    res.json({ message: "Container deleted successfully" });
  } catch (error) {
    console.error(error);
    res
      .status(400)
      .json({ error: "Failed to delete container", detail: error });
  }
};

// UPDATE received quantities for container items
export const updateReceivedQuantities = async (req: Request, res: Response) => {
  const { id } = req.params; // container ID
  const { items } = req.body; // expected: [{ itemId, receivedQty }, ...]

  try {
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

  const updates = items.map((item: { id: string; receivedQty: number }) =>
    prisma.containerItem.update({
      where: { id: item.id },
      data: {
        receivedQty: item.receivedQty,
      },
    })
  );

  await Promise.all(updates);

  await prisma.container.update({
    where: { id: containerId },
    data: { status: "Done" },
  });

  res.json({ success: true });
};
export const saveOffloadData = async (req: Request, res: Response) => {
  try {
    const { containerId, items, isComplete } = req.body;

    for (const item of items) {
      await prisma.containerItem.updateMany({
        where: { containerId, itemName: item.itemName },
        data: {
          receivedQty: item.receivedQty,
        },
      });
    }

    await prisma.container.update({
      where: { id: containerId },
      data: {
        status: isComplete ? "Done" : "Received",
      },
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
      include: { supplier: true },
    });

    if (!container) {
      res.status(404).json({ error: "Container not found" });
      return;
    }

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
      include: { items: true },
    });

    // Step 4: Aggregate sold quantities
    const soldMap: Record<string, number> = {};
    sales.forEach((sale: { items: { itemName: string; quantity: number }[] }) => {
      sale.items.forEach((item: { itemName: string; quantity: number }) => {
        soldMap[item.itemName] = (soldMap[item.itemName] || 0) + item.quantity;
      });
    });

    // Step 5: Fetch supplier items ONLY for this container's supplier
    const supplierItems = await prisma.supplierItem.findMany({
      where: { supplierId: container.supplierId },
      select: { itemName: true },
    });

    const supplierItemNames = new Set(
      supplierItems.map((item: { itemName: string }) => item.itemName)
    );

    // Step 6: Final result
    const result = containerItems.map((item: { id: string; itemName: string; quantity: number; receivedQty: number; unitPrice: number }) => {
      const soldQty = soldMap[item.itemName] || 0;
      const remainingQty = (item.quantity || 0) - soldQty;
      const isMatched = supplierItemNames.has(item.itemName);
      const supplierName = isMatched
        ? container.supplier.suppliername
        : "Unknown";

      return {
        id: item.id,
        itemName: item.itemName,
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
        supplier: true,
        items: true,
      },
    });

    if (!container) {
      res.status(404).json({ message: "Container not found" });
      return;
    }

    const containerItems = container.items;

    // Get sales and sale items from this container
    const sales = await prisma.sale.findMany({
      where: {
        sourceId: containerId,
        sourceType: "container",
      },
      include: {
        items: true,
      },
    });

    // Flatten and group sale items by itemName
    const soldItemMap: Record<
      string,
      { soldQty: number; totalAmount: number }
    > = {};

    for (const sale of sales) {
      for (const item of sale.items) {
        if (!soldItemMap[item.itemName]) {
          soldItemMap[item.itemName] = { soldQty: 0, totalAmount: 0 };
        }
        soldItemMap[item.itemName].soldQty += item.quantity;
        soldItemMap[item.itemName].totalAmount +=
          item.quantity * item.unitPrice;
      }
    }

    const itemReport = containerItems.map((item: { itemName: string; quantity: number; receivedQty: number; unitPrice: number }) => {
      const soldData = soldItemMap[item.itemName] || {
        soldQty: 0,
        totalAmount: 0,
      };
      const remainingQty = item.quantity - soldData.soldQty;

      return {
        itemName: item.itemName,
        expectedQty: item.quantity,
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
      companyName: container.supplier.suppliername,
      items: itemReport.filter((i: { soldQty: number }) => i.soldQty > 0), // optional: filter only sold
      totalSales,
    });
    return;
  } catch (error) {
    console.error("Error generating container item report:", error);
    res.status(500).json({ message: "Internal server error" });
    return;
  }
};
const upsertSupplierItems = async (
  supplierId: string,
  items: { itemName: string; unitPrice: number }[]
) => {
  for (const item of items) {
    const existing = await prisma.supplierItem.findFirst({
      where: {
        supplierId,
        itemName: item.itemName,
      },
    });

    if (existing) {
      // Update price if different
      if (existing.price !== item.unitPrice) {
        await prisma.supplierItem.update({
          where: { id: existing.id },
          data: { price: item.unitPrice },
        });
      }
    } else {
      // Insert new item
      await prisma.supplierItem.create({
        data: {
          supplierId,
          itemName: item.itemName,
          price: item.unitPrice,
        },
      });
    }
  }
};
