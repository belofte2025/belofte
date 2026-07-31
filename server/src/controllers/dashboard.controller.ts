import { Request, Response } from "express";
import prisma from "../utils/prisma";

export const getDashboardStats = async (req: Request, res: Response) => {
  const companyId = req.user?.companyId;
  if (!companyId) { res.status(400).json({ error: "Company ID missing" }); return; }

  try {
    const now = new Date();
    const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
    const todayEnd   = new Date(now); todayEnd.setHours(23, 59, 59, 999);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      todaySales,
      monthSales,
      customerCount,
      creditBalance,
      recentSales,
      containersInTransit,
      lowStockCount,
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
    ]);

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
        createdAt: s.createdAt,
      })),
    });
  } catch (err) {
    console.error("Dashboard stats error:", err);
    res.status(500).json({ error: "Failed to fetch dashboard stats" });
  }
};
