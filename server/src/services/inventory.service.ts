import prisma from "../utils/prisma";

export const getInventoryByContainer = async (containerId: string) => {
  // Get container items
  const items = await prisma.containerItem.findMany({
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

  // Get all sale items for this company
  const allSaleItems = await prisma.saleItem.findMany({
    where: {
      sale: {
        companyId: companyId,
      },
    },
    select: {
      itemName: true,
      quantity: true,
    },
  });

  return items.map((item) => {
    // Find all sales for this item name in the company
    const relatedSales = allSaleItems.filter(
      (s) => s.itemName === item.itemName
    );

    const soldQty = relatedSales.reduce(
      (sum, s) => sum + (s.quantity || 0),
      0
    );

    return {
      itemName: item.itemName,
      containerNo: item.container.containerNo,
      received: item.receivedQty,
      sold: soldQty,
      remaining: item.receivedQty - soldQty,
      unitPrice: item.unitPrice,
    };
  });
};

export const getInventoryBySupplier = async (supplierId: string) => {
  // Get all containers for this supplier
  const containers = await prisma.container.findMany({
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

  // Get all container items for this supplier
  const allContainerItems = await prisma.containerItem.findMany({
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

  // Get all sale items for these companies
  const allSaleItems = await prisma.saleItem.findMany({
    where: {
      sale: {
        companyId: { in: companyIds },
      },
    },
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

  // Build summary by item name
  const summaryMap: Record<string, { 
    received: number; 
    sold: number;
    companyIds: string[];
  }> = {};

  // Aggregate received quantities
  allContainerItems.forEach((item) => {
    if (!summaryMap[item.itemName]) {
      summaryMap[item.itemName] = { 
        received: 0, 
        sold: 0,
        companyIds: []
      };
    }
    summaryMap[item.itemName].received += item.receivedQty;
    if (!summaryMap[item.itemName].companyIds.includes(item.container.companyId)) {
      summaryMap[item.itemName].companyIds.push(item.container.companyId);
    }
  });

  // Calculate sold quantities
  Object.keys(summaryMap).forEach((itemName) => {
    const relatedSales = allSaleItems.filter(
      (s) => s.itemName === itemName && 
             summaryMap[itemName].companyIds.includes(s.sale.companyId)
    );

    const soldQty = relatedSales.reduce(
      (sum, s) => sum + (s.quantity || 0),
      0
    );

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

export const getInventoryReport = async (companyId: string) => {
  // Fetch all container items with their containers and suppliers
  const allContainerItems = await prisma.containerItem.findMany({
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
  const allSaleItems = await prisma.saleItem.findMany({
    where: {
      sale: {
        companyId: companyId,
      },
    },
    select: {
      itemName: true,
      quantity: true,
    },
  });

  // Define the inventory item type
  type InventoryItem = {
    itemName: string;
    supplierName: string;
    received: number;
    sold: number;
    available: number;
    unitPrice: number;
    totalValue: number;
  };

  // Group by item name and supplier
  const inventoryMap = new Map<string, InventoryItem>();

  allContainerItems.forEach((item: any) => {
    // Key: itemName-supplierName
    const key = `${item.itemName}-${item.container.supplier.suppliername}`;
    
    if (inventoryMap.has(key)) {
      const existing = inventoryMap.get(key)!;
      existing.received += item.receivedQty;
    } else {
      inventoryMap.set(key, {
        itemName: item.itemName,
        supplierName: item.container.supplier.suppliername,
        received: item.receivedQty,
        sold: 0, // Will calculate next
        available: 0, // Will calculate after sold
        unitPrice: item.unitPrice,
        totalValue: 0, // Will calculate after available
      });
    }
  });

  // Now calculate sold quantities for each item
  inventoryMap.forEach((inventoryItem, key) => {
    const relatedSales = allSaleItems.filter(
      (s) => s.itemName === inventoryItem.itemName
    );

    const soldQty = relatedSales.reduce(
      (sum, s) => sum + (s.quantity || 0),
      0
    );

    inventoryItem.sold = soldQty;
    inventoryItem.available = inventoryItem.received - soldQty;
    inventoryItem.totalValue = inventoryItem.available * inventoryItem.unitPrice;
  });

  // Convert map to array
  const inventoryArray = Array.from(inventoryMap.values());

  return inventoryArray;
};