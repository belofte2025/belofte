import prisma from "../utils/prisma";

export const getContainerReport = async (containerId: string) => {
  const container = await prisma.container.findUnique({
    where: { id: containerId },
    include: {
      supplier: true,
      items: true,
    },
  });

  if (!container) throw new Error("Container not found");

  const itemSummary = container.items.map(
    (item: {
      itemName: any;
      quantity: any;
      receivedQty: number;
      soldQty: number;
    }) => ({
      itemName: item.itemName,
      expected: item.quantity,
      received: item.receivedQty,
      sold: item.soldQty,
      remaining: item.receivedQty - item.soldQty,
    })
  );

  return {
    containerNo: container.containerNo,
    arrivalDate: container.arrivalDate,
    supplier: container.supplier?.suppliername || "N/A",
    itemSummary,
  };
};
export const getSupplierReport = async (supplierId: string) => {
  const items = await prisma.containerItem.findMany({
    where: {
      container: {
        supplierId,
      },
    },
    include: {
      container: true,
    },
  });

  return {
    supplierId,
    items: items.map(
      (item: {
        id: any;
        itemName: any;
        receivedQty: number;
        soldQty: number;
      }) => ({
        itemId: item.id,
        name: item.itemName,
        remaining: item.receivedQty - item.soldQty,
      })
    ),
  };
};

export const getDetailedSalesReport = async (
  startDate: string,
  endDate: string
) => {
  const sales = await prisma.sale.findMany({
    where: {
      createdAt: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },
    },
    include: {
      items: true,
    },
  });

  const totalAmount = sales.reduce(
    (sum: any, s: { totalAmount: any }) => sum + s.totalAmount,
    0
  );
  const totalQty = sales.reduce(
    (sum: any, s: { items: any[] }) =>
      sum +
      s.items.reduce((qSum: any, i: { quantity: any }) => qSum + i.quantity, 0),
    0
  );

  return {
    period: { startDate, endDate },
    totalAmount,
    totalQty,
    sales,
  };
};
