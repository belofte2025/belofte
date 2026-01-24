import prisma from "../utils/prisma";

export const getInventoryByContainer = async (containerId: string) => {
  // Get container items
  const items = await prisma.containerItem.findMany({
    where: { containerId },
    include: {
      Container: {
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

  const companyId = items[0].Container.companyId;

  // Get all sale items for this specific container
  const allSaleItems = await prisma.saleItem.findMany({
    where: {
      Sale: {
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
    const relatedSales = allSaleItems.filter(
      (s) => s.itemName === item.itemName
    );

    const soldQty = relatedSales.reduce((sum, s) => sum + (s.quantity || 0), 0);

    return {
      itemName: item.itemName,
      containerNo: item.Container.containerNo,
      received: item.quantity,
      sold: soldQty,
      remaining: item.quantity - soldQty,
      unitPrice: item.unitPrice,
    };
  });
};

export const getInventoryBySupplier = async (supplierId: string) => {
  // Get all containers for this supplier
  const containers = await prisma.container.findMany({
    where: { supplierId },
    include: {
      ContainerItem: true,
      Supplier: {
        select: { suppliername: true },
      },
    },
  });

  if (containers.length === 0) {
    return [];
  }

  // Get all company IDs from these containers
  const companyIds: string[] = [...new Set(containers.map((c) => c.companyId))];

  // Get all container IDs for this supplier
  const containerIds: string[] = containers.map((c) => c.id);

  // Get all container items for this supplier
  const allContainerItems = await prisma.containerItem.findMany({
    where: {
      Container: {
        supplierId: supplierId,
      },
    },
    include: {
      Container: {
        select: {
          companyId: true,
        },
      },
    },
  });

  // Get all stock adjustments for this supplier
  const stockAdjustments = await prisma.stockAdjustment.findMany({
    where: {
      supplierId: supplierId,
      companyId: { in: companyIds },
    },
    select: {
      itemName: true,
      adjustmentQty: true,
    },
  });

  // Get all sale items for these companies WHERE sourceId is one of this supplier's containers
  const containerSaleItems = await prisma.saleItem.findMany({
    where: {
      Sale: {
        companyId: { in: companyIds },
        sourceType: "container",
        sourceId: { in: containerIds },
      },
    },
    select: {
      itemName: true,
      quantity: true,
      Sale: {
        select: {
          companyId: true,
          sourceId: true,
        },
      },
    },
  });

  // Get all supplierItems for this supplier
  const supplierItemIds = await prisma.supplierItem.findMany({
    where: { supplierId: supplierId },
    select: { id: true, itemName: true },
  });

  const supplierItemIdList: string[] = supplierItemIds.map((si) => si.id);

  // Get all regular sale items where sourceId points to this supplier's supplierItems
  const regularSaleItems = await prisma.saleItem.findMany({
    where: {
      Sale: {
        companyId: { in: companyIds },
        sourceType: "regular",
        sourceId: { in: supplierItemIdList },
      },
    },
    select: {
      itemName: true,
      quantity: true,
      Sale: {
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
  const summaryMap: Record<
    string,
    {
      received: number;
      sold: number;
      adjustments: number;
      companyIds: string[];
    }
  > = {};

  // Aggregate received quantities
  allContainerItems.forEach((item) => {
    if (!summaryMap[item.itemName]) {
      summaryMap[item.itemName] = {
        received: 0,
        sold: 0,
        adjustments: 0,
        companyIds: [],
      };
    }
    summaryMap[item.itemName].received += item.quantity;
    if (
      !summaryMap[item.itemName].companyIds.includes(item.Container.companyId)
    ) {
      summaryMap[item.itemName].companyIds.push(item.Container.companyId);
    }
  });

  // Aggregate stock adjustments
  stockAdjustments.forEach((adj) => {
    if (!summaryMap[adj.itemName]) {
      summaryMap[adj.itemName] = {
        received: 0,
        sold: 0,
        adjustments: 0,
        companyIds: [],
      };
    }
    summaryMap[adj.itemName].adjustments += adj.adjustmentQty;
  });

  // Calculate sold quantities - now filtered by supplier's containers
  Object.keys(summaryMap).forEach((itemName) => {
    const relatedSales = allSaleItems.filter(
      (s) =>
        s.itemName === itemName &&
        summaryMap[itemName].companyIds.includes(s.Sale.companyId) &&
        containerIds.includes(s.Sale.sourceId)
    );

    const soldQty = relatedSales.reduce((sum, s) => sum + (s.quantity || 0), 0);

    summaryMap[itemName].sold = soldQty;
  });

  // Sort items alphabetically by item name
  return Object.entries(summaryMap)
    .map(([itemName, data]) => ({
      itemName,
      supplierName: containers[0]?.Supplier.suppliername || "Unknown",
      received: data.received,
      sold: data.sold,
      available: data.received - data.sold + data.adjustments,
    }))
    .sort((a, b) => a.itemName.localeCompare(b.itemName));
};

export const getInventoryReport = async (companyId: string) => {
  // 1. Run all initial queries in parallel
  const [allContainerItems, containerSaleItems, regularSaleItems, stockAdjustments] =
    await Promise.all([
      prisma.containerItem.findMany({
        where: {
          Container: { companyId },
        },
        include: {
          Container: {
            include: {
              Supplier: true,
            },
          },
        },
      }),

      prisma.saleItem.findMany({
        where: {
          Sale: {
            companyId,
            sourceType: "container",
          },
        },
        select: {
          itemName: true,
          quantity: true,
          Sale: {
            select: { sourceId: true },
          },
        },
      }),

      prisma.saleItem.findMany({
        where: {
          Sale: {
            companyId,
            sourceType: "regular",
          },
        },
        select: {
          itemName: true,
          quantity: true,
          Sale: {
            select: { sourceId: true },
          },
        },
      }),

      prisma.stockAdjustment.findMany({
        where: {
          companyId,
        },
        select: {
          itemName: true,
          adjustmentQty: true,
          Supplier: {
            select: {
              suppliername: true,
            },
          },
        },
      }),
    ]);

  // 2. Batch fetch all supplier items in ONE query (fixes N+1 problem)
  const supplierItemIds = [
    ...new Set(
      regularSaleItems
        .map((item) => item.Sale.sourceId)
        .filter((id): id is string => id !== null)
    ),
  ];

  const supplierItems =
    supplierItemIds.length > 0
      ? await prisma.supplierItem.findMany({
          where: { id: { in: supplierItemIds } },
          include: { Supplier: true },
        })
      : [];

  // 3. Create lookup maps for O(1) access
  const supplierItemMap = new Map(supplierItems.map((item) => [item.id, item]));

  // Pre-index regular sales by supplier name
  const regularSalesBySupplier = new Map<string, Map<string, number>>();

  for (const saleItem of regularSaleItems) {
    if (saleItem.Sale.sourceId) {
      const supplierItem = supplierItemMap.get(saleItem.Sale.sourceId);
      if (supplierItem) {
        const supplierName = supplierItem.Supplier.suppliername;

        if (!regularSalesBySupplier.has(supplierName)) {
          regularSalesBySupplier.set(supplierName, new Map());
        }

        const itemSales = regularSalesBySupplier.get(supplierName)!;
        itemSales.set(
          saleItem.itemName,
          (itemSales.get(saleItem.itemName) || 0) + saleItem.quantity
        );
      }
    }
  }

  // Pre-index container sales by itemName + sourceId for O(1) lookup
  const containerSalesIndex = new Map<string, number>();

  for (const sale of containerSaleItems) {
    const key = `${sale.itemName}-${sale.Sale.sourceId}`;
    containerSalesIndex.set(
      key,
      (containerSalesIndex.get(key) || 0) + (sale.quantity || 0)
    );
  }

  // Pre-index stock adjustments by itemName + supplierName for O(1) lookup
  const adjustmentsBySupplierItem = new Map<string, number>();

  for (const adj of stockAdjustments) {
    const key = `${adj.itemName}-${adj.Supplier.suppliername}`;
    adjustmentsBySupplierItem.set(
      key,
      (adjustmentsBySupplierItem.get(key) || 0) + adj.adjustmentQty
    );
  }

  // 4. Build inventory with Set for O(1) container lookups
  type InventoryItem = {
    itemName: string;
    supplierName: string;
    received: number;
    containerIds: Set<string>;
  };

  const inventoryMap = new Map<string, InventoryItem>();

  for (const item of allContainerItems) {
    const key = `${item.itemName}-${item.Container.Supplier.suppliername}`;

    const existing = inventoryMap.get(key);
    if (existing) {
      existing.received += item.quantity;
      existing.containerIds.add(item.containerId);
    } else {
      inventoryMap.set(key, {
        itemName: item.itemName,
        supplierName: item.Container.Supplier.suppliername,
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

    // Get stock adjustments (already aggregated by supplier + item)
    const adjustmentKey = `${item.itemName}-${item.supplierName}`;
    const totalAdjustments = adjustmentsBySupplierItem.get(adjustmentKey) || 0;

    const sold = containerSoldQty + regularSoldQty;
    const available = item.received - sold + totalAdjustments;

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

export const getInventoryReport_22 = async (companyId: string) => {
  // Fetch all container items with their containers and suppliers
  const allContainerItems = await prisma.containerItem.findMany({
    where: {
      Container: {
        companyId,
      },
    },
    include: {
      Container: {
        include: {
          Supplier: true,
        },
      },
    },
  });

  // Get all container sale items for this company
  const containerSaleItems = await prisma.saleItem.findMany({
    where: {
      Sale: {
        companyId: companyId,
        sourceType: "container",
      },
    },
    select: {
      itemName: true,
      quantity: true,
      Sale: {
        select: {
          sourceId: true,
        },
      },
    },
  });

  // Get all regular sale items for this company
  const regularSaleItems = await prisma.saleItem.findMany({
    where: {
      Sale: {
        companyId: companyId,
        sourceType: "regular",
      },
    },
    include: {
      Sale: {
        select: {
          sourceId: true,
        },
      },
    },
  });

  // For regular sales, we need to map sourceId to supplier via supplierItem
  const regularSalesBySupplier: Record<
    string,
    { itemName: string; quantity: number; containerId: string }[]
  > = {};

  for (const saleItem of regularSaleItems) {
    if (saleItem.Sale.sourceId) {
      const supplierItem = await prisma.supplierItem.findUnique({
        where: { id: saleItem.Sale.sourceId },
        include: { Supplier: true },
      });

      if (supplierItem) {
        const supplierName = supplierItem.Supplier.suppliername;
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

  // Define the inventory item type
  type InventoryItem = {
    itemName: string;
    supplierName: string;
    received: number;
    sold: number;
    available: number;
    unitPrice: number;
    totalValue: number;
    containerIds: string[];
  };

  // Group by item name and supplier
  const inventoryMap = new Map<string, InventoryItem>();

  allContainerItems.forEach((item: any) => {
    // Key: itemName-supplierName
    const key = `${item.itemName}-${item.Container.Supplier.suppliername}`;

    if (inventoryMap.has(key)) {
      const existing = inventoryMap.get(key)!;
      existing.received += item.quantity;
      if (!existing.containerIds.includes(item.containerId)) {
        existing.containerIds.push(item.containerId);
      }
    } else {
      inventoryMap.set(key, {
        itemName: item.itemName,
        supplierName: item.Container.Supplier.suppliername,
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
    const containerSales = containerSaleItems.filter(
      (s) =>
        s.itemName === inventoryItem.itemName &&
        inventoryItem.containerIds.includes(s.Sale.sourceId)
    );

    const containerSoldQty = containerSales.reduce(
      (sum, s) => sum + (s.quantity || 0),
      0
    );

    // Count regular sales for this supplier
    const regularSales =
      regularSalesBySupplier[inventoryItem.supplierName] || [];
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
