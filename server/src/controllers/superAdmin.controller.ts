import { Request, Response } from "express";
import bcrypt from "bcrypt";
import prisma from "../utils/prisma";
import { generateToken } from "../utils/jwt";

// ── Login ─────────────────────────────────────────────────────────────────────

export const superAdminLogin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const saEmail = process.env.SUPERADMIN_EMAIL;
    const saPassword = process.env.SUPERADMIN_PASSWORD;

    if (!saEmail || !saPassword) {
      res.status(503).json({ error: "Super admin is not configured on this server" });
      return;
    }

    if (email !== saEmail || password !== saPassword) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const token = generateToken({
      userId: "superadmin",
      companyId: "",
      userName: "Super Admin",
      email: saEmail,
      role: "superadmin",
      isSuperAdmin: true,
    });

    res.json({
      token,
      user: { email: saEmail, userName: "Super Admin", role: "superadmin", isSuperAdmin: true },
    });
  } catch (err) {
    res.status(500).json({ error: "Login failed" });
  }
};

// ── Platform Stats ────────────────────────────────────────────────────────────

export const getPlatformStats = async (_req: Request, res: Response) => {
  try {
    const [companies, users, customers, sales, totalRevenue] = await Promise.all([
      prisma.company.count(),
      prisma.user.count(),
      prisma.customer.count(),
      prisma.sale.count(),
      prisma.sale.aggregate({ _sum: { totalAmount: true } }),
    ]);

    const suspended = await prisma.company.count({ where: { suspended: true } });

    res.json({
      companies,
      users,
      customers,
      sales,
      suspended,
      totalRevenue: totalRevenue._sum.totalAmount ?? 0,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch platform stats" });
  }
};

// ── All Companies ─────────────────────────────────────────────────────────────

export const getAllCompanies = async (_req: Request, res: Response) => {
  try {
    const companies = await prisma.company.findMany({
      include: {
        _count: {
          select: {
            User: true,
            Customer: true,
            Sale: true,
            Container: true,
            Supplier: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Aggregate revenue per company
    const revenueRows = await prisma.sale.groupBy({
      by: ["companyId"],
      _sum: { totalAmount: true },
    });
    const revenueMap = new Map(
      revenueRows.map((r) => [r.companyId, r._sum.totalAmount ?? 0])
    );

    const result = companies.map((c) => ({
      ...c,
      totalRevenue: revenueMap.get(c.id) ?? 0,
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch companies" });
  }
};

// ── Single Company Detail ─────────────────────────────────────────────────────

export const getCompanyDetail = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        User: {
          select: {
            id: true,
            userName: true,
            email: true,
            createdAt: true,
            Role: { select: { name: true } },
          },
          orderBy: { createdAt: "asc" },
        },
        _count: {
          select: {
            Customer: true,
            Sale: true,
            Container: true,
            Supplier: true,
          },
        },
      },
    });

    if (!company) {
      res.status(404).json({ error: "Company not found" });
      return;
    }

    const [revenue, recentSales] = await Promise.all([
      prisma.sale.aggregate({
        where: { companyId: id },
        _sum: { totalAmount: true },
      }),
      prisma.sale.findMany({
        where: { companyId: id },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          totalAmount: true,
          saleType: true,
          createdAt: true,
          Customer: { select: { customerName: true } },
        },
      }),
    ]);

    res.json({
      ...company,
      totalRevenue: revenue._sum.totalAmount ?? 0,
      recentSales,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch company detail" });
  }
};

// ── Suspend / Unsuspend ───────────────────────────────────────────────────────

export const toggleSuspend = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { suspended } = req.body as { suspended: boolean };
  try {
    const company = await prisma.company.update({
      where: { id },
      data: { suspended },
    });
    res.json(company);
  } catch (err) {
    res.status(400).json({ error: "Failed to update company status" });
  }
};

// ── Impersonate ───────────────────────────────────────────────────────────────
// Issues a short-lived JWT scoped to that company so the super-admin can
// browse the app as that tenant's admin without knowing their password.

export const impersonateCompany = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const adminUser = await prisma.user.findFirst({
      where: { companyId: id },
      include: {
        Role: {
          include: {
            RolePermission: { include: { Permission: true } },
          },
        },
        Company: { select: { companyName: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    if (!adminUser) {
      res.status(404).json({ error: "No users found in this company" });
      return;
    }

    const permissions = adminUser.Role?.RolePermission.map((rp) => rp.Permission.code) ?? [];

    const token = generateToken({
      userId: adminUser.id,
      companyId: adminUser.companyId,
      userName: adminUser.userName,
      email: adminUser.email,
      role: adminUser.Role?.name ?? "Admin",
      roleId: adminUser.roleId,
      permissions,
    });

    res.json({
      token,
      user: {
        id: adminUser.id,
        userName: adminUser.userName,
        email: adminUser.email,
        role: adminUser.Role?.name ?? "Admin",
        roleId: adminUser.roleId,
        permissions,
        companyId: adminUser.companyId,
        company: adminUser.Company,
      },
    });
  } catch (err) {
    res.status(500).json({ error: "Impersonation failed" });
  }
};
