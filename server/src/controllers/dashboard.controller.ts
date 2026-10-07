import { Request, Response } from "express";
import prisma from "../utils/prisma";
import { computeCompanyReceivables } from "../services/customerBalance.service";

const LOW_STOCK_THRESHOLD = 10;
// Beyond this many days the trend is bucketed by month instead of by day, so a
// wide custom range does not render hundreds of bars.
const MAX_DAILY_TREND_DAYS = 92;

const startOfDay = (d: Date) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const endOfDay   = (d: Date) => { const x = new Date(d); x.setHours(23, 59, 59, 999); return x; };

type ResolvedPeriod = { key: string; label: string; start: Date; end: Date };

/**
 * Resolves the dashboard reporting window from the query string. Falls back to
 * the current month when the period is missing or a custom range is unusable.
 */
const resolvePeriod = (query: Request["query"]): ResolvedPeriod => {
  const now = new Date();
  const key = String(query.period ?? "month").toLowerCase();

  if (key === "custom") {
    const rawStart = query.startDate ? new Date(String(query.startDate)) : null;
    const rawEnd   = query.endDate   ? new Date(String(query.endDate))   : null;
    if (rawStart && rawEnd && !isNaN(rawStart.getTime()) && !isNaN(rawEnd.getTime())) {
      // Tolerate the dates arriving the wrong way round.
      const [from, to] = rawStart <= rawEnd ? [rawStart, rawEnd] : [rawEnd, rawStart];
      return { key: "custom", label: "Custom Range", start: startOfDay(from), end: endOfDay(to) };
    }
  }

  if (key === "today") {
    return { key: "today", label: "Today", start: startOfDay(now), end: endOfDay(now) };
  }

  if (key === "last30") {
    const start = startOfDay(now);
    start.setDate(start.getDate() - 29);
    return { key: "last30", label: "Last 30 Days", start, end: endOfDay(now) };
  }

  return {
    key: "month",
    label: "This Month",
    start: new Date(now.getFullYear(), now.getMonth(), 1),
    end: endOfDay(now),
  };
};

export const getDashboardStats = async (req: Request, res: Response) => {
  const companyId = req.user?.companyId;
  if (!companyId) { res.status(400).json({ error: "Company ID missing" }); return; }

  try {
    const period = resolvePeriod(req.query);
    const periodRange = { gte: period.start, lte: period.end };

    const spanDays = Math.ceil((period.end.getTime() - period.start.getTime()) / 86_400_000);
    const trendUnit: "day" | "month" = spanDays > MAX_DAILY_TREND_DAYS ? "month" : "day";

    const [
      periodSales,
      customerCount,
      creditBalance,
      recentSales,
      containersInTransit,
      lowStockCount,
      paymentMethodGroups,
      trendRows,
      receivedByItem,
      soldByItem,
      adjustmentsByItem,
      topItemsRaw,
    ] = await Promise.all([
      // Sales across the selected period
      prisma.sale.aggregate({
        where: { companyId, createdAt: periodRange },
        _sum: { totalAmount: true },
        _count: { id: true },
      }),
      // Total customers
      prisma.customer.count({ where: { companyId } }),
      // Outstanding credit, derived from transactions rather than the stored
      // Customer.balance column, which is never raised by a credit sale.
      computeCompanyReceivables(companyId),
      // Recent 5 sales
      prisma.sale.findMany({
        where: { companyId },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { Customer: { select: { customerName: true } } },
      }),
      // Containers in transit (pre-warehouse)
      prisma.container.count({
        where: { companyId, status: { in: ["Pending", "Shipped", "Arrived"] } },
      }),
      // Containers with stock (proxy for whether there's any inventory)
      prisma.container.count({
        where: { companyId, status: { in: ["Received", "Incomplete", "Done"] } },
      }),
      // This month's sales grouped by type/payment method
      prisma.sale.groupBy({
        by: ["saleType", "paymentMethod"],
        where: { companyId, createdAt: periodRange },
        _sum: { totalAmount: true, amountPaid: true },
        _count: { id: true },
      }),
      // Sales totals per bucket for the trend chart, over the selected period
      trendUnit === "month"
        ? prisma.$queryRaw<{ day: Date; total: string; count: string }[]>`
            SELECT date_trunc('month', "createdAt") as day,
                   SUM("totalAmount") as total,
                   COUNT(*) as count
            FROM "Sale"
            WHERE "companyId" = ${companyId}
              AND "createdAt" >= ${period.start} AND "createdAt" <= ${period.end}
            GROUP BY day
            ORDER BY day ASC
          `
        : prisma.$queryRaw<{ day: Date; total: string; count: string }[]>`
            SELECT date_trunc('day', "createdAt") as day,
                   SUM("totalAmount") as total,
                   COUNT(*) as count
            FROM "Sale"
            WHERE "companyId" = ${companyId}
              AND "createdAt" >= ${period.start} AND "createdAt" <= ${period.end}
            GROUP BY day
            ORDER BY day ASC
          `,
      // Stock inputs for low-stock detection, company-wide
      prisma.containerItem.groupBy({
        by: ["itemName"],
        where: { Container: { companyId } },
        _sum: { quantity: true },
      }),
      prisma.saleItem.groupBy({
        by: ["itemName"],
        where: { Sale: { companyId } },
        _sum: { quantity: true },
      }),
      prisma.stockAdjustment.groupBy({
        by: ["itemName"],
        where: { companyId },
        _sum: { adjustmentQty: true },
      }),
      // Top-selling items in the selected period by units sold
      prisma.saleItem.groupBy({
        by: ["itemName"],
        where: { Sale: { companyId, createdAt: periodRange } },
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: "desc" } },
        take: 5,
      }),
    ]);

    // ── Payment method breakdown ──
    // A part-paid credit sale is split: the deposit counts under the method that
    // took it, only the unpaid remainder counts as CREDIT. Buckets therefore sum
    // to total sales rather than double-counting a deposit.
    const paymentMethods: Record<string, { total: number; count: number }> = {};
    const addTo = (key: string, amount: number, count: number) => {
      if (amount <= 0 && count === 0) return;
      if (!paymentMethods[key]) paymentMethods[key] = { total: 0, count: 0 };
      paymentMethods[key].total += amount;
      paymentMethods[key].count += count;
    };

    for (const g of paymentMethodGroups) {
      const total = g._sum.totalAmount ?? 0;
      const paid = g._sum.amountPaid ?? 0;
      const method = g.paymentMethod || "CASH";

      if (g.saleType?.toLowerCase() === "credit") {
        addTo("CREDIT", total - paid, g._count.id);
        addTo(method, paid, 0);
      } else {
        addTo(method, total, g._count.id);
      }
    }

    // ── Sales trend, filled so buckets with no sales still appear ──
    const trendMap = new Map<string, { total: number; count: number }>();
    for (const row of trendRows) {
      const key = new Date(row.day).toISOString().slice(0, 10);
      trendMap.set(key, { total: parseFloat(row.total) || 0, count: parseInt(row.count, 10) || 0 });
    }

    const salesTrend: { date: string; total: number; count: number }[] = [];
    const cursor = trendUnit === "month"
      ? new Date(period.start.getFullYear(), period.start.getMonth(), 1)
      : startOfDay(period.start);

    while (cursor <= period.end) {
      const key = cursor.toISOString().slice(0, 10);
      salesTrend.push({ date: key, ...(trendMap.get(key) ?? { total: 0, count: 0 }) });
      if (trendUnit === "month") cursor.setMonth(cursor.getMonth() + 1);
      else cursor.setDate(cursor.getDate() + 1);
    }

    // ── Low stock (company-wide, across all suppliers) ──
    const receivedMap = new Map(receivedByItem.map((r) => [r.itemName, r._sum.quantity ?? 0]));
    const soldMap = new Map(soldByItem.map((r) => [r.itemName, r._sum.quantity ?? 0]));
    const adjMap = new Map(adjustmentsByItem.map((r) => [r.itemName, r._sum.adjustmentQty ?? 0]));

    const lowStockItems = Array.from(receivedMap.entries())
      .map(([itemName, received]) => {
        const sold = soldMap.get(itemName) ?? 0;
        const adjustments = adjMap.get(itemName) ?? 0;
        const available = received - sold + adjustments;
        return { itemName, available };
      })
      .filter((i) => i.available <= LOW_STOCK_THRESHOLD)
      .sort((a, b) => a.available - b.available)
      .slice(0, 8);

    // ── Top-selling items ──
    const topItems = topItemsRaw.map((r) => ({
      itemName: r.itemName,
      quantitySold: r._sum.quantity ?? 0,
    }));

    // Paid is every method bucket except the unpaid credit remainder, so the two
    // always add back up to the period's total sales.
    const creditTotal = paymentMethods.CREDIT?.total ?? 0;
    const periodTotal = periodSales._sum.totalAmount ?? 0;

    res.json({
      period: {
        key: period.key,
        label: period.label,
        startDate: period.start.toISOString(),
        endDate: period.end.toISOString(),
        trendUnit,
        salesTotal: periodTotal,
        salesCount: periodSales._count.id,
        paidTotal: periodTotal - creditTotal,
        creditTotal,
      },
      customers: {
        total: customerCount,
        withCredit: creditBalance.customersOwing,
        outstandingCredit: creditBalance.total,
      },
      containers: {
        inTransit: containersInTransit,
        inStock: lowStockCount,
      },
      recentSales: recentSales.map((s) => ({
        id: s.id,
        customerName: s.Customer?.customerName ?? "Walk-in",
        totalAmount: s.totalAmount,
        saleType: s.saleType,
        paymentMethod: s.paymentMethod,
        createdAt: s.createdAt,
      })),
      paymentMethods,
      salesTrend,
      lowStockItems,
      topItems,
    });
  } catch (err) {
    console.error("Dashboard stats error:", err);
    res.status(500).json({ error: "Failed to fetch dashboard stats" });
  }
};
