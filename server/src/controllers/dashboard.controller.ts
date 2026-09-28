import { Request, Response } from "express";
import prisma from "../utils/prisma";

const LOW_STOCK_THRESHOLD = 10;
const TREND_DAYS = 14;

export const getDashboardStats = async (req: Request, res: Response) => {
  const companyId = req.user?.companyId;
  if (!companyId) { res.status(400).json({ error: "Company ID missing" }); return; }

  try {
    const now = new Date();
    const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
    const todayEnd   = new Date(now); todayEnd.setHours(23, 59, 59, 999);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const trendStart = new Date(todayStart);
    trendStart.setDate(trendStart.getDate() - (TREND_DAYS - 1));

    const [
      todaySales,
      monthSales,
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
      // Today's sales
      prisma.sale.aggregate({
        where: { companyId, createdAt: { gte: todayStart, lte: todayEnd } },
        _sum: { totalAmount: true },
        _count: { id: true },
      }),
      // This month's sales
      prisma.sale.aggregate({
        where: { companyId, createdAt: { gte: monthStart } },
        _sum: { totalAmount: true },
        _count: { id: true },
      }),
      // Total customers
      prisma.customer.count({ where: { companyId } }),
      // Outstanding credit (positive balance = customer owes us)
      prisma.customer.aggregate({
        where: { companyId, balance: { gt: 0 } },
        _sum: { balance: true },
        _count: { id: true },
      }),
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
        where: { companyId, createdAt: { gte: monthStart } },
        _sum: { totalAmount: true },
        _count: { id: true },
      }),
      // Daily sales totals for the trend chart
      prisma.$queryRaw<{ day: Date; total: string; count: string }[]>`
        SELECT date_trunc('day', "createdAt") as day,
               SUM("totalAmount") as total,
               COUNT(*) as count
        FROM "Sale"
        WHERE "companyId" = ${companyId} AND "createdAt" >= ${trendStart}
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
      // Top-selling items this month by units sold
      prisma.saleItem.groupBy({
        by: ["itemName"],
        where: { Sale: { companyId, createdAt: { gte: monthStart } } },
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: "desc" } },
        take: 5,
      }),
    ]);

    // ── Payment method breakdown ──
    const paymentMethods: Record<string, { total: number; count: number }> = {};
    for (const g of paymentMethodGroups) {
      const key = g.saleType?.toLowerCase() === "credit" ? "CREDIT" : (g.paymentMethod || "CASH");
      if (!paymentMethods[key]) paymentMethods[key] = { total: 0, count: 0 };
      paymentMethods[key].total += g._sum.totalAmount ?? 0;
      paymentMethods[key].count += g._count.id;
    }

    // ── Sales trend, filled for days with no sales ──
    const trendMap = new Map<string, { total: number; count: number }>();
    for (const row of trendRows) {
      const key = new Date(row.day).toISOString().slice(0, 10);
      trendMap.set(key, { total: parseFloat(row.total) || 0, count: parseInt(row.count, 10) || 0 });
    }
    const salesTrend: { date: string; total: number; count: number }[] = [];
    for (let i = 0; i < TREND_DAYS; i++) {
      const d = new Date(trendStart);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      const entry = trendMap.get(key) ?? { total: 0, count: 0 };
      salesTrend.push({ date: key, ...entry });
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

    res.json({
      today: {
        salesTotal: todaySales._sum.totalAmount ?? 0,
        salesCount: todaySales._count.id,
      },
      thisMonth: {
        salesTotal: monthSales._sum.totalAmount ?? 0,
        salesCount: monthSales._count.id,
      },
      customers: {
        total: customerCount,
        withCredit: creditBalance._count.id,
        outstandingCredit: creditBalance._sum.balance ?? 0,
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
