import prisma from "../utils/prisma";

export const getInventoryByContainer = async (containerId: string) => {
  const items = await prisma.containerItem.findMany({
    where: { containerId },
    include: {
      container: { select: { containerNo: true } },
    },
  });

  return items.map(
    (item: {
      itemName: any;
      container: { containerNo: any };
      quantity: any;
      receivedQty: number;
      soldQty: any;
    }) => {
      return {
        itemName: item.itemName,
        containerNo: item.container.containerNo,
        expected: item.quantity,
        received: item.receivedQty,
        sold: item.soldQty || 0, // optional field if tracked
        remaining: item.receivedQty - (item.soldQty || 0),
      };
    }
  );
};

export const getInventoryBySupplier = async (supplierId: string) => {
  const containers = await prisma.container.findMany({
    where: { supplierId },
    include: {
      items: true,
    },
  });

  const summaryMap: Record<string, { received: number; sold: number }> = {};

  containers.forEach(
    (c: {
      items: { itemName: string | number; receivedQty: number; soldQty: any }[];
    }) =>
      c.items.forEach(
        (i: {
          itemName: string | number;
          receivedQty: number;
          soldQty: any;
        }) => {
          const current = summaryMap[i.itemName] || { received: 0, sold: 0 };
          current.received += i.receivedQty;
          current.sold += i.soldQty || 0;
          summaryMap[i.itemName] = current;
        }
      )
  );

  return Object.entries(summaryMap).map(([itemName, data]) => ({
    itemName,
    totalReceived: data.received,
    totalSold: data.sold,
    remaining: data.received - data.sold,
  }));
};

export const getInventoryReport = async (companyId: string) => {
  // Fetch all container items with their containers and suppliers
  const containerItems = await prisma.containerItem.findMany({
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

  // Group by item name and supplier to aggregate quantities
  const inventoryMap = new Map<string, {
    id: string;
    itemName: string;
    supplierName: string;
    totalOrdered: number;
    totalReceived: number;
    totalSold: number;
    available: number;
    unitPrice: number;
  }>();

  containerItems.forEach((item: any) => {
    const key = `${item.itemName}-${item.container.supplier.suppliername}`;
    
    if (inventoryMap.has(key)) {
      const existing = inventoryMap.get(key)!;
      existing.totalOrdered += item.quantity;
      existing.totalReceived += item.receivedQty;
      existing.totalSold += item.soldQty;
      existing.available += (item.receivedQty - item.soldQty);
    } else {
      inventoryMap.set(key, {
        id: item.id,
        itemName: item.itemName,
        supplierName: item.container.supplier.suppliername,
        totalOrdered: item.quantity,
        totalReceived: item.receivedQty,
        totalSold: item.soldQty,
        available: item.receivedQty - item.soldQty,
        unitPrice: item.unitPrice,
      });
    }
  });

  // Convert map to array and calculate total values
  const inventoryArray = Array.from(inventoryMap.values()).map(item => ({
    ...item,
    totalValue: item.available * item.unitPrice,
  }));

  return inventoryArray;
};
