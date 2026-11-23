import { settleSales } from "./saleSettlement.service";
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

  const PRE_WAREHOUSE = ["Pending", "Shipped", "Arrived"];
  if (PRE_WAREHOUSE.includes(container.status)) {
    return {
      containerNo: container.containerNo,
      arrivalDate: container.arrivalDate,
      supplier: container.Supplier?.suppliername || "N/A",
      status: container.status,
      itemSummary: container.ContainerItem.map((item: any) => ({
        itemName: item.itemName,
        expected: item.quantity,
        received: 0,
        sold: 0,
        remaining: 0,
      })),
    };
  }

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

  // What this supplier still holds of these items, counted the way the
  // inventory report counts it. The page presents "remaining" as stock on
  // hand, so deducting only this container's own sales overstated it: the same
  // item also sells through regular sales, and damage or loss is recorded as an
  // adjustment, and neither touches this container's rows.
  const itemNames = container.ContainerItem.map((i: { itemName: string }) => i.itemName);
  const supplierId = container.supplierId;

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

  const supplierSales = await prisma.saleItem.findMany({
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

  const tally = <T>(rows: T[], name: (r: T) => string, qty: (r: T) => number) => {
    const m: Record<string, number> = {};
    for (const r of rows) m[name(r)] = (m[name(r)] || 0) + (qty(r) || 0);
    return m;
  };
  const supReceived = tally(supplierContainerItems, r => r.itemName, r => r.quantity);
  const supSold     = tally(supplierSales,          r => r.itemName, r => r.quantity);
  const supAdj      = tally(adjustments,            r => r.itemName, r => r.adjustmentQty);

  const itemSummary = container.ContainerItem.map(
    (item: {
      itemName: any;
      quantity: any;
      receivedQty: number;
    }) => {
      const soldQty = soldMap[item.itemName] || 0;
      const fromThisContainer = item.quantity - soldQty;
      const supplierAvailable =
        (supReceived[item.itemName] || 0) -
        (supSold[item.itemName] || 0) +
        (supAdj[item.itemName] || 0);
      return {
        itemName: item.itemName,
        expected: item.quantity,
        received: item.receivedQty,
        sold: soldQty,
        // Capped by both: never more than this container brought and still has
        // unsold, and never more than the supplier actually holds.
        remaining: Math.max(0, Math.min(fromThisContainer, supplierAvailable)),
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
        status: { in: ["Received", "Incomplete", "Done"] },
      },
    },
    select: { id: true, itemName: true, quantity: true, containerId: true },
  });

  // Get container IDs for this supplier
  const containerIds = [...new Set(items.map((item) => item.containerId))];

  const supplierItems = await prisma.supplierItem.findMany({
    where: { supplierId, Supplier: { companyId } },
    select: { id: true },
  });
  const supplierItemIds = supplierItems.map(({ id }) => id);

  const soldItems = await prisma.saleItem.groupBy({
    by: ["itemName"],
    where: {
      Sale: { companyId },
      OR: [
        { Sale: { sourceType: "container", sourceId: { in: containerIds } } },
        { Sale: { sourceType: "regular" }, supplierItemId: { in: supplierItemIds } },
        // Sales recorded before supplierItemId was added used the sale source.
        {
          supplierItemId: null,
          Sale: { sourceType: "regular", sourceId: { in: supplierItemIds } },
        },
      ],
    },
    _sum: { quantity: true },
  });
  const soldByName = new Map(soldItems.map(({ itemName, _sum }) => [itemName, _sum.quantity ?? 0]));

  const receivedByName = new Map<string, { id: string; quantity: number }>();
  for (const item of items) {
    const received = receivedByName.get(item.itemName);
    if (received) {
      received.quantity += item.quantity;
    } else {
      receivedByName.set(item.itemName, { id: item.id, quantity: item.quantity });
    }
  }

  return {
    supplierId,
    items: Array.from(receivedByName, ([itemName, data]) => {
      const sold = soldByName.get(itemName) ?? 0;
      return {
        itemId: data.id,
        name: itemName,
        totalQuantity: data.quantity,
        sold,
        remaining: data.quantity - sold,
      };
    }),
  };
};

export const getDetailedSalesReport = async (
startDate: string, endDate: string, companyId: string) => {
  const sales = await prisma.sale.findMany({
    where: {
      companyId,
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

  // How much of each credit sale has actually been settled. A payment is
  // recorded against the customer rather than an invoice, so without this a
  // credit sale reports its full value as outstanding however much has since
  // been paid — a half-paid invoice looked identical to an untouched one.
  const settlements = await settleSales(
    sales.map((s) => s.id),
    companyId
  );

  const transformedSales = sales.map((sale) => {
    const settlement = settlements.get(sale.id);
    const isCredit = sale.saleType?.toLowerCase() === "credit";

    // A cash sale was settled when it was made.
    const settledAmount = isCredit
      ? settlement?.settled ?? sale.amountPaid ?? 0
      : sale.totalAmount;
    const outstanding = Math.max(0, sale.totalAmount - settledAmount);

    return {
      id: sale.id,
      saleType: sale.saleType,
      paymentMethod: sale.paymentMethod,
      customerName: sale.Customer?.customerName || "Walk-in",
      totalAmount: sale.totalAmount,
      amountPaid: sale.amountPaid,
      /** Deposit plus any later payments that reach this invoice. */
      settledAmount,
      outstanding,
      /** "paid" | "part-paid" | "unpaid" — cash sales are always paid. */
      settlementStatus: isCredit ? settlement?.status ?? "unpaid" : "paid",
      createdAt: sale.createdAt,
      items: sale.SaleItem,
    };
  });

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

/**
 * Get detailed transaction history for a specific item from a supplier
 * Shows all inwards (containers), sales, and adjustments with running balance
 * Helps identify why an item has negative stock
 */
export const getItemTransactionHistory = async (
  supplierId: string,
  itemName: string,
  companyId: string
) => {
  // Get supplier info
  const supplier = await prisma.supplier.findFirst({
    where: { id: supplierId, companyId },
    select: { id: true, suppliername: true, country: true },
  });

  if (!supplier) {
    throw new Error("Supplier not found");
  }

  // Every container receipt for this item, whatever the container's status.
  //
  // This used to count only warehouse-received containers, but the sales side
  // was not filtered to match: a regular sale was counted from the supplier and
  // item alone, so goods received on a container still marked Pending were sold
  // out of a balance that never had them added. The result was a history that
  // ran negative. The rest of the app — the inventory report, the sale-time
  // stock check, the dashboard and both sale screens — counts all containers,
  // because containers predating the status lifecycle are all left at Pending.
  const containerItems = await prisma.containerItem.findMany({
    where: {
      itemName,
      Container: {
        supplierId,
        companyId,
      },
    },
    include: {
      Container: {
        select: {
          id: true,
          containerNo: true,
          arrivalDate: true,
          status: true,
          createdAt: true,
        },
      },
    },
  });

  const containerIds = containerItems.map((ci) => ci.Container.id);

  // Every supplier item of this supplier, not only those named for this item:
  // a regular sale's lines are attributed individually, and a line's supplier
  // item is the one it was picked from.
  const supplierItemIdsForSupplier = (
    await prisma.supplierItem.findMany({ where: { supplierId }, select: { id: true } })
  ).map((i) => i.id);

  // Fetch all sales for this item - both container and regular
  const [containerSales, regularSales] = await Promise.all([
    // Container sales
    prisma.sale.findMany({
      where: {
        sourceType: "container",
        sourceId: { in: containerIds },
        companyId,
      },
      include: {
        SaleItem: {
          where: { itemName },
        },
        Customer: {
          select: {
            customerName: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    }),

    // Regular sales from supplier items.
    //
    // Matched against every supplier item of this supplier, not just the ones
    // named for this item. A regular sale carries a single sourceId — the
    // supplier item of its first line — while its lines may name several
    // different items, so keying on the sourceId's own name dropped the rest.
    // The line-level filter below still restricts this to the item in question.
    prisma.sale.findMany({
      where: {
        sourceType: "regular",
        companyId,
        SaleItem: {
          some: {
            itemName,
            // The line's own supplier item decides which supplier it came out
            // of; sourceId is used only for rows written before that column.
            OR: [
              { supplierItemId: { in: supplierItemIdsForSupplier } },
              {
                supplierItemId: null,
                Sale: { sourceId: { in: supplierItemIdsForSupplier } },
              },
            ],
          },
        },
      },
      include: {
        SaleItem: {
          where: {
            itemName,
            OR: [
              { supplierItemId: { in: supplierItemIdsForSupplier } },
              {
                supplierItemId: null,
                Sale: { sourceId: { in: supplierItemIdsForSupplier } },
              },
            ],
          },
        },
        Customer: {
          select: {
            customerName: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    }),
  ]);

  // Fetch all stock adjustments for this item
  const adjustments = await prisma.stockAdjustment.findMany({
    where: {
      supplierId,
      itemName,
      companyId,
    },
    include: {
      User: {
        select: {
          userName: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  // Build unified transaction list with running balance
  interface Transaction {
    id: string;
    date: Date;
    type: "inward" | "sale" | "adjustment";
    description: string;
    reference: string;
    quantity: number;
    balance: number;
    details?: any;
  }

  const transactions: Transaction[] = [];
  let runningBalance = 0;

  // Add all inwards (container receipts)
  containerItems.forEach((item) => {
    runningBalance += item.quantity;
    transactions.push({
      id: item.id,
      date: item.Container.createdAt,
      type: "inward",
      description: `Container Receipt: ${item.Container.containerNo}`,
      reference: item.Container.containerNo,
      quantity: item.quantity,
      balance: runningBalance,
      details: {
        containerId: item.Container.id,
        containerNo: item.Container.containerNo,
        arrivalDate: item.Container.arrivalDate,
        status: item.Container.status,
      },
    });
  });

  // Add all sales (both container and regular)
  [...containerSales, ...regularSales].forEach((sale) => {
    sale.SaleItem.forEach((saleItem) => {
      runningBalance -= saleItem.quantity;
      transactions.push({
        id: sale.id,
        date: sale.createdAt,
        type: "sale",
        description: `Sale to ${sale.Customer?.customerName || "Walk-in"} (${sale.sourceType})`,
        reference: sale.id.substring(0, 8),
        quantity: -saleItem.quantity,
        balance: runningBalance,
        details: {
          saleId: sale.id,
          customerName: sale.Customer?.customerName || "Walk-in",
          saleType: sale.saleType,
          sourceType: sale.sourceType,
          unitPrice: saleItem.unitPrice,
          totalAmount: saleItem.quantity * saleItem.unitPrice,
        },
      });
    });
  });

  // Add all adjustments
  adjustments.forEach((adj) => {
    runningBalance += adj.adjustmentQty;
    transactions.push({
      id: adj.id,
      date: adj.createdAt,
      type: "adjustment",
      description: `${adj.adjustmentType.toUpperCase()}: ${adj.reason || "No reason provided"}`,
      reference: adj.adjustmentType,
      quantity: adj.adjustmentQty,
      balance: runningBalance,
      details: {
        adjustmentType: adj.adjustmentType,
        reason: adj.reason,
        notes: adj.notes,
        createdBy: adj.User.userName,
      },
    });
  });

  // Sort all transactions by date
  transactions.sort((a, b) => a.date.getTime() - b.date.getTime());

  // Recalculate running balance in chronological order
  runningBalance = 0;
  transactions.forEach((txn) => {
    runningBalance += txn.quantity;
    txn.balance = runningBalance;
  });

  // Calculate summary
  const totalInward = containerItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalSold = [...containerSales, ...regularSales].reduce(
    (sum, sale) => sum + sale.SaleItem.reduce((s, item) => s + item.quantity, 0),
    0
  );
  const totalAdjustments = adjustments.reduce((sum, adj) => sum + adj.adjustmentQty, 0);
  const currentBalance = totalInward - totalSold + totalAdjustments;

  // Find when balance went negative
  const negativePoints = transactions.filter((txn) => txn.balance < 0);

  return {
    supplier: {
      id: supplier.id,
      name: supplier.suppliername,
      country: supplier.country,
    },
    itemName,
    summary: {
      totalInward,
      totalSold,
      totalAdjustments,
      currentBalance,
      hasNegativeStock: currentBalance < 0,
      negativeOccurrences: negativePoints.length,
      firstNegativeDate: negativePoints.length > 0 ? negativePoints[0].date : null,
    },
    transactions,
    negativePoints: negativePoints.map((txn) => ({
      date: txn.date,
      balance: txn.balance,
      transaction: txn.description,
    })),
  };
};