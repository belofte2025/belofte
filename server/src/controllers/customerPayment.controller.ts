import { Request, Response } from "express";
import prisma from "../utils/prisma";

export const recordCustomerPayment = async (req: Request, res: Response) => {
  const { customerId, amount, note, paymentType } = req.body;
  const companyId = req.user?.companyId;
  if (!companyId) {
    res.status(400).json({ error: "Company ID missing" });
    return;
  }
  try {
    const payment = await prisma.customerPayment.create({
      data: { customerId, amount, note, paymentType, companyId },
    });
    res.status(201).json(payment);
  } catch (err) {
    res.status(500).json({ error: "Failed to record payment", detail: err });
  }
};

// GET CUSTOMER STATEMENT - NOW INCLUDES DEBTS
export const getCustomerStatement = async (req: Request, res: Response) => {
  try {
    const customerId = req.params.id;
    const companyId = req.user?.companyId;

    // Fetch credit sales
    const sales = await prisma.sale.findMany({
      where: { customerId, companyId, saleType: "credit" },
      select: {
        id: true,
        createdAt: true,
        totalAmount: true,
        items: true,
      },
    });

    // Fetch payments
    const payments = await prisma.customerPayment.findMany({
      where: { customerId, companyId },
      select: {
        id: true,
        createdAt: true,
        amount: true,
        note: true,
      },
    });

    // Fetch debts
    const debts = await prisma.customerDebt.findMany({
      where: { customerId, companyId },
      select: {
        id: true,
        createdAt: true,
        amount: true,
        description: true,
        debtType: true,
        status: true,
      },
    });

    // Combine all transactions into a unified statement
    const statementItems = [
      // Credit sales (increase balance)
      ...sales.map((s) => ({
        id: s.id,
        date: s.createdAt.toISOString().split("T")[0],
        timestamp: s.createdAt,
        type: "credit_sale" as const,
        description: s.items
          .map(
            (i: { quantity: number; itemName: string }) =>
              `${i.quantity}x ${i.itemName}`
          )
          .join(", "),
        debit: s.totalAmount, // Amount owed (increases balance)
        credit: 0,
        status: "completed",
      })),

      // Payments (decrease balance)
      ...payments.map((p) => ({
        id: p.id,
        date: p.createdAt.toISOString().split("T")[0],
        timestamp: p.createdAt,
        type: "payment" as const,
        description: p.note || "Payment received",
        debit: 0,
        credit: p.amount, // Payment received (decreases balance)
        status: "completed",
      })),

      // Debts (increase balance)
      ...debts.map((d) => ({
        id: d.id,
        date: d.createdAt.toISOString().split("T")[0],
        timestamp: d.createdAt,
        type: "debt" as const,
        description: d.description || `${d.debtType.replace("_", " ")} debt`,
        debit: d.status !== "paid" ? d.amount : 0, // Only unpaid debts affect balance
        credit: d.status === "paid" ? d.amount : 0, // Paid debts shown as credit
        status: d.status,
      })),
    ].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    // Calculate running balance for each transaction
    let runningBalance = 0;
    const statement = statementItems.map((item) => {
      runningBalance = runningBalance + item.debit - item.credit;
      return {
        ...item,
        balance: runningBalance,
      };
    });

    // Calculate summary
    const totalDebits = statement.reduce((sum, item) => sum + item.debit, 0);
    const totalCredits = statement.reduce((sum, item) => sum + item.credit, 0);
    const currentBalance = totalDebits - totalCredits;

    res.json({
      statement,
      summary: {
        totalDebits,
        totalCredits,
        currentBalance,
        totalTransactions: statement.length,
      },
    });
  } catch (err) {
    console.error("Statement fetch error:", err);
    res.status(500).json({ error: "Internal error" });
  }
};

export const deleteCustomerPayment = async (req: Request, res: Response) => {
  const paymentId = req.params.id;

  try {
    // Check if payment exists
    const existingPayment = await prisma.customerPayment.findUnique({
      where: { id: paymentId },
    });

    if (!existingPayment) {
      res.status(404).json({ error: "Payment not found" });
      return;
    }

    // Delete the payment
    await prisma.customerPayment.delete({
      where: { id: paymentId },
    });

    res.json({ message: "Payment deleted successfully" });
    return;
  } catch (error) {
    console.error("Failed to delete payment:", error);
    res.status(500).json({ error: "Failed to delete payment" });
    return;
  }
};
export const getCustomerPayments = async (req: Request, res: Response) => {
  const { id } = req.params;
  const companyId = req.user?.companyId;

  if (!companyId) {
    res.status(400).json({ error: "Missing company context." });
    return;
  }

  try {
    const payments = await prisma.customerPayment.findMany({
      where: {
        customerId: id,
        companyId,
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(payments);
  } catch (error) {
    console.error("Error fetching customer payments:", error);
    res.status(500).json({ error: "Failed to fetch customer payments" });
  }
};

// GET ALL PAYMENTS WITH DATE FILTERING AND PAGINATION
export const getAllCustomerPayments = async (req: Request, res: Response) => {
  const companyId = req.user?.companyId;

  if (!companyId) {
    res.status(400).json({ error: "Company ID missing" });
    return;
  }

  try {
    // Extract query parameters
    const {
      startDate,
      endDate,
      customerId,
      paymentType,
      page = "1",
      limit = "50",
    } = req.query;

    // Build filter conditions
    const where: any = {
      companyId,
    };

    // Date filtering
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate as string);
      }
      if (endDate) {
        // Add 1 day and set to start of day to include the entire end date
        const endDateTime = new Date(endDate as string);
        endDateTime.setDate(endDateTime.getDate() + 1);
        endDateTime.setHours(0, 0, 0, 0);
        where.createdAt.lt = endDateTime;
      }
    }

    // Customer filtering
    if (customerId) {
      where.customerId = customerId as string;
    }

    // Payment type filtering
    if (paymentType) {
      where.paymentType = paymentType as string;
    }

    // Pagination
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Fetch payments with customer details
    const [payments, totalCount] = await Promise.all([
      prisma.customerPayment.findMany({
        where,
        include: {
          customer: {
            select: {
              id: true,
              customerName: true,
              phone: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limitNum,
      }),
      prisma.customerPayment.count({ where }),
    ]);

    // Calculate summary statistics
    const summary = await prisma.customerPayment.aggregate({
      where,
      _sum: {
        amount: true,
      },
      _count: true,
    });

    res.json({
      payments,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalCount / limitNum),
        totalCount,
        limit: limitNum,
      },
      summary: {
        totalAmount: summary._sum.amount || 0,
        totalPayments: summary._count,
      },
    });
  } catch (error) {
    console.error("Error fetching all payments:", error);
    res.status(500).json({ error: "Failed to fetch payments" });
  }
};