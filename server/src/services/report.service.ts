import prisma from "../utils/prisma";

export const getContainerReport = async (containerId: string, companyId: string) => {
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
      remaining: item.quantity - item.soldQty,
    })
  );

  return {
    containerNo: container.containerNo,
    arrivalDate: container.arrivalDate,
    supplier: container.supplier?.suppliername || "N/A",
    itemSummary,
  };
};
export const getSupplierReport = async (supplierId: string, companyId: string) => {
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
        quantity: number;
        soldQty: number;
      }) => ({
        itemId: item.id,
        name: item.itemName,
        remaining: item.quantity - item.soldQty,
      })
    ),
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
      items: true,
      customer: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Transform sales to include customer name
  const transformedSales = sales.map((sale) => ({
    id: sale.id,
    saleType: sale.saleType,
    customerName: sale.customer?.customerName || "Walk-in",
    totalAmount: sale.totalAmount,
    createdAt: sale.createdAt,
    items: sale.items,
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
      items: true,
      customer: {
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
      customer: {
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
    customerName: sale.customer?.customerName || "Walk-in",
    customerPhone: sale.customer?.phone || "N/A",
    amount: sale.totalAmount,
    itemCount: sale.items.length,
    items: sale.items.map((item) => ({
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
    customerName: payment.customer?.customerName || "Unknown",
    customerPhone: payment.customer?.phone || "N/A",
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