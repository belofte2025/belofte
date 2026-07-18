import { Request, Response } from "express";
import prisma from "../utils/prisma";
import { postCustomerPaymentJournal } from "../services/accounting/journalEngine";

export const recordCustomerPayment = async (req: Request, res: Response) => {
  const { customerId, amount, note, paymentType, paymentDate } = req.body;
  const companyId = req.user?.companyId;
  if (!companyId) {
    res.status(400).json({ error: "Company ID missing" });
    return;
  }
  try {
    const paymentData: any = {
      customerId,
      amount,
      note,
      paymentType,
      companyId
    };

    // If a custom payment date is provided, use it
    if (paymentDate) {
      paymentData.createdAt = new Date(paymentDate);
    }

    const payment = await prisma.customerPayment.create({
      data: paymentData,
    });

    // Post accounting journal if enabled (non-fatal)
    try {
      const company = await prisma.company.findUnique({ where: { id: companyId }, select: { enableAccounting: true } });
      if (company?.enableAccounting && req.user?.id) {
        await postCustomerPaymentJournal(prisma as any, payment, companyId, req.user.id);
      }
    } catch (journalErr) {
      console.error("Payment journal failed (non-fatal):", journalErr);
    }

    res.status(201).json(payment);
  } catch (err) {
    res.status(500).json({ error: "Failed to record payment", detail: err });
  }
};

export const updateCustomerPayment = async (req: Request, res: Response) => {
  const paymentId = req.params.id;
  const { amount, note, paymentType, paymentDate } = req.body;
  const companyId = req.user?.companyId;

  try {
    // Check if payment exists
    const existingPayment = await prisma.customerPayment.findUnique({
      where: { id: paymentId },
    });

    if (!existingPayment) {
      res.status(404).json({ error: "Payment not found" });
      return;
    }

    // Verify company ownership
    if (companyId && existingPayment.companyId !== companyId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    // Calculate balance adjustment
    const amountDiff = (amount !== undefined ? parseFloat(amount) : existingPayment.amount) - existingPayment.amount;

    // Build update data
    const updateData: any = {};
    if (amount !== undefined) updateData.amount = parseFloat(amount);
    if (note !== undefined) updateData.note = note;
    if (paymentType !== undefined) updateData.paymentType = paymentType;
    if (paymentDate) updateData.createdAt = new Date(paymentDate);

    // Update the payment
    const updatedPayment = await prisma.customerPayment.update({
      where: { id: paymentId },
      data: updateData,
    });

    // Adjust customer balance if amount changed
    if (amountDiff !== 0) {
      await prisma.customer.update({
        where: { id: existingPayment.customerId },
        data: {
          balance: {
            decrement: amountDiff, // If payment increased, balance decreases more
          },
        },
      });
    }

    res.json(updatedPayment);
    return;
  } catch (error) {
    console.error("Failed to update payment:", error);
    res.status(500).json({ error: "Failed to update payment" });
    return;
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
          Customer: {
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