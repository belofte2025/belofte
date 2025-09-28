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

export const getCustomerStatement = async (req: Request, res: Response) => {
  const { id } = req.params; // customerId

  const sales = await prisma.sale.findMany({
    where: { customerId: id },
    select: {
      createdAt: true,
      totalAmount: true,
      saleType: true,
      id: true,
    },
  });

  const payments = await prisma.customerPayment.findMany({
    where: { customerId: id },
    select: {
      createdAt: true,
      amount: true,
      note: true,
      id: true,
    },
  });

  // Merge & sort by date
  const timeline = [
    ...sales.map((s: { createdAt: any; totalAmount: any; saleType: any }) => ({
      type: "sale",
      date: s.createdAt,
      amount: s.totalAmount,
      detail: `Sale (${s.saleType})`,
    })),
    ...payments.map((p: { createdAt: any; amount: any; note: any }) => ({
      type: "payment",
      date: p.createdAt,
      amount: p.amount,
      detail: `Payment${p.note ? ` - ${p.note}` : ""}`,
    })),
  ].sort((a, b) => a.date.getTime() - b.date.getTime());

  // Running balance
  let balance = 0;
  const statement = timeline.map((t) => {
    balance += t.type === "sale" ? t.amount : -t.amount;
    return { ...t, balance };
  });

  res.json(statement);
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
