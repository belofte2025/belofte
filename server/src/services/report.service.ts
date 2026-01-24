import prisma from "../utils/prisma";

export const getContainerReport = async (containerId: string, companyId: string) => {
  const container = await prisma.container.findUnique({
    where: { id: containerId },
    include: {
      Supplier: true,
      ContainerItem: true,
    },
  });

  if (!container) throw new Error("Container not found");

  // Get sales for this container to calculate sold quantities
  const sales = await prisma.sale.findMany({
    where: {
      sourceId: containerId,
      sourceType: "container",
      companyId,
    },
    include: { SaleItem: true },
  });

  // Aggregate sold quantities by item name
  const soldMap: Record<string, number> = {};
  sales.forEach((sale) => {
    sale.SaleItem.forEach((saleItem) => {
      soldMap[saleItem.itemName] = (soldMap[saleItem.itemName] || 0) + saleItem.quantity;
    });
  });

  const itemSummary = container.ContainerItem.map(
    (item: {
      itemName: any;
      quantity: any;
      receivedQty: number;
    }) => {
      const soldQty = soldMap[item.itemName] || 0;
      return {
        itemName: item.itemName,
        expected: item.quantity,
        received: item.receivedQty,
        sold: soldQty,
        remaining: item.quantity - soldQty,
      };
    }
  );

  return {
    containerNo: container.containerNo,
    arrivalDate: container.arrivalDate,
    supplier: container.Supplier?.suppliername || "N/A",
    itemSummary,
  };
};
export const getSupplierReport = async (supplierId: string, companyId: string) => {
  const items = await prisma.containerItem.findMany({
    where: {
      Container: {
        supplierId,
        companyId,
      },
    },
    include: {
      Container: true,
    },
  });

  // Get container IDs for this supplier
  const containerIds = [...new Set(items.map((item) => item.containerId))];

  // Get all sales from these containers
  const containerSales = await prisma.sale.findMany({
    where: {
      sourceType: "container",
      sourceId: { in: containerIds },
      companyId,
    },
    include: { SaleItem: true },
  });

  // Get all supplier items for regular sales
  const supplierItems = await prisma.supplierItem.findMany({
    where: { supplierId },
    select: { id: true, itemName: true },
  });

  const supplierItemIds = supplierItems.map((si) => si.id);

  // Get regular sales from this supplier
  const regularSales = await prisma.sale.findMany({
    where: {
      sourceType: "regular",
      sourceId: { in: supplierItemIds },
      companyId,
    },
    include: { SaleItem: true },
  });

  // Aggregate sold quantities by item name across all sales
  const soldMap: Record<string, number> = {};

  [...containerSales, ...regularSales].forEach((sale) => {
    sale.SaleItem.forEach((saleItem) => {
      soldMap[saleItem.itemName] = (soldMap[saleItem.itemName] || 0) + saleItem.quantity;
    });
  });

  // Aggregate items by name and calculate totals
  const itemMap: Record<string, { id: string; quantity: number }> = {};

  items.forEach((item) => {
    if (!itemMap[item.itemName]) {
      itemMap[item.itemName] = {
        id: item.id,
        quantity: 0,
      };
    }
    itemMap[item.itemName].quantity += item.quantity;
  });

  return {
    supplierId,
    items: Object.entries(itemMap).map(([itemName, data]) => ({
      itemId: data.id,
      name: itemName,
      totalQuantity: data.quantity,
      sold: soldMap[itemName] || 0,
      remaining: data.quantity - (soldMap[itemName] || 0),
    })),
  };
};

export const getDetailedSalesReport = async (
startDate: string, endDate: string, companyId: string) => {
  const sales = await prisma.sale.findMany({
    where: {
      createdAt: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },
    },
    include: {
      SaleItem: true,
      Customer: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Transform sales to include customer name
  const transformedSales = sales.map((sale) => ({
    id: sale.id,
    saleType: sale.saleType,
    customerName: sale.Customer?.customerName || "Walk-in",
    totalAmount: sale.totalAmount,
    createdAt: sale.createdAt,
    items: sale.SaleItem,
  }));

  return transformedSales;
};


// ... existing services ...

export const getCashSalesAndPayments = async (
  startDate: string,
  endDate: string,
  companyId: string
) => {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  // Fetch all cash sales within date range
  const cashSales = await prisma.sale.findMany({
    where: {
      companyId,
      saleType: "cash",
      createdAt: {
        gte: start,
        lte: end,
      },
    },
    include: {
      SaleItem: true,
      Customer: {
        select: {
          id: true,
          customerName: true,
          phone: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Fetch all customer payments within date range
  const payments = await prisma.customerPayment.findMany({
    where: {
      companyId,
      createdAt: {
        gte: start,
        lte: end,
      },
    },
    include: {
      Customer: {
        select: {
          id: true,
          customerName: true,
          phone: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Calculate totals
  const totalCashSales = cashSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
  const totalPayments = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const totalRevenue = totalCashSales + totalPayments;

  // Format cash sales for display
  const formattedCashSales = cashSales.map((sale) => ({
    id: sale.id,
    type: "cash_sale",
    date: sale.createdAt,
    customerName: sale.Customer?.customerName || "Walk-in",
    customerPhone: sale.Customer?.phone || "N/A",
    amount: sale.totalAmount,
    itemCount: sale.SaleItem.length,
    items: sale.SaleItem.map((item) => ({
      itemName: item.itemName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      total: item.quantity * item.unitPrice,
    })),
    sourceType: sale.sourceType,
  }));

  // Format payments for display
  const formattedPayments = payments.map((payment) => ({
    id: payment.id,
    type: "payment",
    date: payment.createdAt,
    customerName: payment.Customer?.customerName || "Unknown",
    customerPhone: payment.Customer?.phone || "N/A",
    amount: payment.amount,
    paymentType: payment.paymentType || "cash",
    note: payment.note,
  }));

  // Combine and sort by date
  const allTransactions = [
    ...formattedCashSales,
    ...formattedPayments,
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return {
    transactions: allTransactions,
    summary: {
      totalCashSales,
      cashSalesCount: cashSales.length,
      totalPayments,
      paymentsCount: payments.length,
      totalRevenue,
      totalTransactions: cashSales.length + payments.length,
    },
    dateRange: {
      start: start.toISOString(),
      end: end.toISOString(),
    },
  };
};