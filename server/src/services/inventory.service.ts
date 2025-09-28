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
