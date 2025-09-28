import { Request, Response } from "express";
import prisma from "../utils/prisma";
import * as XLSX from "xlsx";
import type { Customer, CustomerPayment } from "@prisma/client";

export const createCustomer = async (req: Request, res: Response) => {
  try {
    const { customerName, phone } = req.body;
    const companyId = req.user?.companyId;

    if (!companyId) {
      res.status(400).json({ error: "Company ID missing" });
      return;
    }

    // Check for duplicates by name and phone within the same company
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        customerName: customerName,
        phone: phone,
        companyId: companyId,
      },
    });

    if (existingCustomer) {
      res.status(409).json({
        error: "Customer already exists with this name and phone number.",
      });
      return;
    }

    const customer = await prisma.customer.create({
      data: { customerName, phone, companyId },
    });

    res.status(201).json(customer);
    return;
  } catch (err) {
    console.error("Customer creation error:", err);
    res.status(500).json({
      error: "Failed to create customer",
      detail: err instanceof Error ? err.message : err,
    });
    return;
  }
};

// GET /customers
export const getCustomers = async (req: Request, res: Response) => {
  const companyId = req.user?.companyId;
  if (!companyId) res.status(400).json({ error: "Company ID is required" });

  try {
    // Get all customers for this company
    const customers = await prisma.customer.findMany({
      where: { companyId },
      select: {
        id: true,
        customerName: true,
        phone: true,
        sale: {
          where: { saleType: "credit" },
          select: { totalAmount: true },
        },
        custpayment: {
          select: { amount: true },
        },
      },
      orderBy: { customerName: "asc" },
    });

    // Calculate balance dynamically
    const enrichedCustomers = customers.map((customer: {
      id: string;
      customerName: string;
      phone: string;
      sale: { totalAmount: number }[];
      custpayment: { amount: number }[];
    }) => {
      const totalCredit = customer.sale.reduce(
        (sum: number, s: { totalAmount: number }) => sum + s.totalAmount,
        0
      );
      const totalPayments = customer.custpayment.reduce(
        (sum: number, p: { amount: number }) => sum + p.amount,
        0
      );
      const balance = totalCredit - totalPayments;

      return {
        id: customer.id,
        name: customer.customerName,
        phone: customer.phone,
        balance,
      };
    });

    res.json(enrichedCustomers);
  } catch (err) {
    console.error("Failed to fetch customers with balances", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getCustomerById = async (req: Request, res: Response) => {
  try {
    const companyId = req.user?.companyId;
    const { id } = req.params;

    const customer = await prisma.customer.findFirst({
      where: { id, companyId },
    });

    if (!customer) {
      res.status(404).json({ error: "Customer not found" });
      return;
    }

    res.json(customer);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch customer", detail: err });
  }
};
export const updateCustomer = async (req: Request, res: Response) => {
  try {
    const companyId = req.user?.companyId;
    const { id } = req.params;
    const { customerName, phone } = req.body;

    const customer = await prisma.customer.findFirst({
      where: { id, companyId },
    });

    if (!customer) {
      res.status(404).json({ error: "Customer not found" });
      return;
    }

    const updated = await prisma.customer.update({
      where: { id },
      data: { customerName, phone },
    });

    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: "Failed to update customer", detail: err });
  }
};
// Record a customer payment
export const createCustomerPayment = async (req: Request, res: Response) => {
  try {
    const { amount, note } = req.body;
    const { id: customerId } = req.params;
    const companyId = req.user?.companyId;

    if (!amount || isNaN(amount)) {
      res.status(400).json({ error: "Invalid or missing amount." });
      return;
    }

    if (!companyId) {
      res.status(400).json({ error: "Company ID is required." });
      return;
    }

    const payment = await prisma.customerPayment.create({
      data: {
        amount,
        note,
        customerId,
        companyId, // Now companyId is guaranteed to be string
      },
    });

    // Update customer balance
    await prisma.customer.update({
      where: { id: customerId },
      data: {
        balance: {
          decrement: parseFloat(amount),
        },
      },
    });

    res.status(201).json(payment);
    return;
  } catch (error) {
    console.error("Error recording payment:", error);
    res.status(500).json({ error: "Internal server error." });
    return;
  }
};

// List payments for a customer
export const getCustomerPayments = async (req: Request, res: Response) => {
  try {
    const { id: customerId } = req.params;
    const companyId = req.user?.companyId;

    const payments = await prisma.customerPayment.findMany({
      where: {
        customerId,
        companyId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json(payments);
    return;
  } catch (error) {
    console.error("Error fetching payments:", error);
    res.status(500).json({ error: "Internal server error." });
    return;
  }
};
// customer.controller.ts
export const getCustomerStatement = async (req: Request, res: Response) => {
  try {
    const customerId = req.params.id;
    const companyId = req.user?.companyId;

    const sales = await prisma.sale.findMany({
      where: { customerId, companyId, saleType: "credit" },
      select: {
        id: true,
        createdAt: true,
        totalAmount: true,
        items: true,
      },
    });

    const payments = await prisma.customerPayment.findMany({
      where: { customerId, companyId },
      select: {
        id: true,
        createdAt: true,
        amount: true,
        note: true,
      },
    });

    const statement = [
      ...sales.map((s: {
        id: string;
        createdAt: Date;
        totalAmount: number;
        items: { quantity: number; itemName: string }[];
      }) => ({
        id: s.id,
        date: s.createdAt.toISOString().split("T")[0],
        type: "sale",
        description: s.items
          .map((i: { quantity: number; itemName: string }) => `${i.quantity}x ${i.itemName}`)
          .join(", "),
        amount: s.totalAmount,
      })),
      ...payments.map((p: {
        id: string;
        createdAt: Date;
        amount: number;
        note: string | null;
      }) => ({
        id: p.id,
        date: p.createdAt.toISOString().split("T")[0],
        type: "payment",
        description: p.note || "Payment received",
        amount: p.amount,
      })),
    ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    res.json(statement);
  } catch (err) {
    console.error("Statement fetch error:", err);
    res.status(500).json({ error: "Internal error" });
  }
};
