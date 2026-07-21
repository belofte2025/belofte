import { Request, Response } from "express";
import prisma from "../utils/prisma";

export const createCustomerDebt = async (req: Request, res: Response) => {
  try {
    const { customerId, amount, description, debtType, debtDate } = req.body;
    const companyId = req.user?.companyId;

    if (!customerId || !amount) {
      res.status(400).json({ error: "Customer ID and amount are required" });
      return;
    }

    if (!companyId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const debtData: any = {
      customerId,
      companyId,
      amount: parseFloat(amount),
      description: description || null,
      debtType: debtType || "manual",
      status: "unpaid",
    };

    if (debtDate) {
      debtData.createdAt = new Date(debtDate);
    }

    const debt = await prisma.customerDebt.create({
      data: debtData,
      include: { Customer: true },
    });

    await prisma.customer.update({
      where: { id: customerId },
      data: { balance: { increment: parseFloat(amount) } },
    });

    res.status(201).json(debt);
  } catch (error) {
    console.error("[customerDebt] CREATE error:", error);
    res.status(500).json({ error: "Failed to create debt entry" });
  }
};

export const bulkCreateCustomerDebts = async (req: Request, res: Response) => {
  try {
    const { debts } = req.body;
    const companyId = req.user?.companyId;

    if (!companyId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    if (!Array.isArray(debts) || debts.length === 0) {
      res.status(400).json({ error: "Debts array is required and must not be empty" });
      return;
    }

    for (const debt of debts) {
      if (!debt.customerId || !debt.amount) {
        res.status(400).json({ error: "Each debt must have customerId and amount" });
        return;
      }
    }

    const results = await prisma.$transaction(async (tx) => {
      const createdDebts = [];

      for (const debtData of debts) {
        const debt = await tx.customerDebt.create({
          data: {
            customerId: debtData.customerId,
            companyId,
            amount: parseFloat(debtData.amount),
            description: debtData.description || null,
            debtType: debtData.debtType || "manual",
            status: "unpaid",
          },
          include: { Customer: true },
        });

        await tx.customer.update({
          where: { id: debtData.customerId },
          data: { balance: { increment: parseFloat(debtData.amount) } },
        });

        createdDebts.push(debt);
      }

      return createdDebts;
    });

    res.status(201).json({
      message: `Successfully created ${results.length} debt entries`,
      debts: results,
    });
  } catch (error) {
    console.error("[customerDebt] BULK_CREATE error:", error);
    res.status(500).json({ error: "Failed to create bulk debt entries" });
  }
};

export const getCustomerDebts = async (req: Request, res: Response) => {
  try {
    const { customerId } = req.params;
    const companyId = req.user?.companyId;

    if (!companyId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const debts = await prisma.customerDebt.findMany({
      where: { customerId, companyId },
      include: { Customer: true },
      orderBy: { createdAt: "desc" },
    });

    res.json(debts);
  } catch (error) {
    console.error("[customerDebt] GET_CUSTOMER_DEBTS error:", error);
    res.status(500).json({ error: "Failed to fetch debts" });
  }
};

export const getAllDebts = async (req: Request, res: Response) => {
  try {
    const companyId = req.user?.companyId;

    if (!companyId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { status } = req.query;
    const where: any = { companyId };
    if (status && status !== "all") {
      where.status = status;
    }

    const debts = await prisma.customerDebt.findMany({
      where,
      include: { Customer: true },
      orderBy: { createdAt: "desc" },
    });

    res.json(debts);
  } catch (error) {
    console.error("[customerDebt] GET_ALL_DEBTS error:", error);
    res.status(500).json({ error: "Failed to fetch debts" });
  }
};

export const updateCustomerDebt = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { amount, description, status } = req.body;
    const companyId = req.user?.companyId;

    const result = await prisma.$transaction(async (tx) => {
      const oldDebt = await tx.customerDebt.findUnique({ where: { id } });

      if (!oldDebt) {
        return { error: "NOT_FOUND" };
      }

      if (companyId && oldDebt.companyId !== companyId) {
        return { error: "UNAUTHORIZED" };
      }

      const updateData: any = {};
      if (description !== undefined) updateData.description = description;
      if (status !== undefined) updateData.status = status;
      if (amount !== undefined) updateData.amount = parseFloat(amount);

      const debt = await tx.customerDebt.update({
        where: { id },
        data: updateData,
        include: { Customer: true },
      });

      const newAmount = amount !== undefined ? parseFloat(amount) : oldDebt.amount;
      const newStatus = status !== undefined ? status : oldDebt.status;

      const oldAffectsBalance = oldDebt.status !== "paid";
      const newAffectsBalance = newStatus !== "paid";

      let balanceChange = 0;
      if (oldAffectsBalance && newAffectsBalance) {
        balanceChange = newAmount - oldDebt.amount;
      } else if (oldAffectsBalance && !newAffectsBalance) {
        balanceChange = -oldDebt.amount;
      } else if (!oldAffectsBalance && newAffectsBalance) {
        balanceChange = newAmount;
      }

      if (balanceChange !== 0) {
        await tx.customer.update({
          where: { id: oldDebt.customerId },
          data: { balance: { increment: balanceChange } },
        });
      }

      return { debt };
    });

    if (result.error === "NOT_FOUND") {
      res.status(404).json({ error: "Debt not found" });
      return;
    }
    if (result.error === "UNAUTHORIZED") {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    res.json(result.debt);
  } catch (error) {
    console.error("[customerDebt] UPDATE error:", error);
    res.status(500).json({ error: "Failed to update debt" });
  }
};

export const deleteCustomerDebt = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const companyId = req.user?.companyId;

    const debt = await prisma.customerDebt.findUnique({ where: { id } });

    if (!debt) {
      res.status(404).json({ error: "Debt not found" });
      return;
    }

    if (companyId && debt.companyId !== companyId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    await prisma.customerDebt.delete({ where: { id } });

    if (debt.status !== "paid") {
      await prisma.customer.update({
        where: { id: debt.customerId },
        data: { balance: { decrement: debt.amount } },
      });
    }

    res.json({ message: "Debt deleted successfully" });
  } catch (error) {
    console.error("[customerDebt] DELETE error:", error);
    res.status(500).json({ error: "Failed to delete debt" });
  }
};

export const markDebtAsPaid = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const companyId = req.user?.companyId;

    const debt = await prisma.customerDebt.findUnique({ where: { id } });

    if (!debt) {
      res.status(404).json({ error: "Debt not found" });
      return;
    }

    if (companyId && debt.companyId !== companyId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    if (debt.status === "paid") {
      res.json(debt);
      return;
    }

    const [updatedDebt] = await prisma.$transaction([
      // Mark the debt as paid
      prisma.customerDebt.update({
        where: { id },
        data: { status: "paid" },
        include: { Customer: true },
      }),
      // Create a CustomerPayment credit so the statement shows the settlement
      prisma.customerPayment.create({
        data: {
          customerId: debt.customerId,
          companyId: debt.companyId,
          amount: debt.amount,
          paymentType: "DEBT_SETTLEMENT",
          note: `Debt settled: ${debt.description || debt.debtType.replace("_", " ")}`,
        },
      }),
      // Decrement the customer balance
      prisma.customer.update({
        where: { id: debt.customerId },
        data: { balance: { decrement: debt.amount } },
      }),
    ]);

    res.json(updatedDebt);
  } catch (error) {
    console.error("[customerDebt] MARK_PAID error:", error);
    res.status(500).json({ error: "Failed to mark debt as paid" });
  }
};
