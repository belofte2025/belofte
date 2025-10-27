import { Request, Response } from "express";
import smsService from "../services/sms.service";
import prisma from "../utils/prisma";

// Send single SMS
export const sendSingleSMS = async (req: Request, res: Response) => {
  try {
    const { to, message } = req.body;
    const companyId = req.user?.companyId;

    if (!companyId) {
      res.status(400).json({ error: "Company ID required" });
      return;
    }

    if (!to || !message) {
      res.status(400).json({ error: "Phone number and message required" });
      return;
    }

    // Validate message length
    const validation = smsService.validateMessageLength(message);
    if (validation.smsCount > 1) {
      console.warn(`Message will be sent as ${validation.smsCount} SMS parts`);
    }

    const result = await smsService.sendSMS({ to, message });

    // Log SMS in database
    await prisma.sMSLog.create({
      data: {
        companyId,
        recipient: to,
        message,
        status: result.success ? "sent" : "failed",
        provider: result.provider,
        messageId: result.messageId || result.jobId,
        error: result.error,
      },
    });

    res.json(result);
  } catch (error) {
    console.error("SMS send error:", error);
    res.status(500).json({ error: "Failed to send SMS" });
  }
};

// Send payment confirmation SMS
export const sendPaymentConfirmationSMS = async (
  req: Request,
  res: Response
) => {
  try {
    const { customerId, amount, balance } = req.body;
    const companyId = req.user?.companyId;

    console.log("📧 Payment SMS Request:", { customerId, amount, balance, companyId });

    if (!companyId) {
      res.status(400).json({ error: "Company ID required" });
      return;
    }

    if (!customerId || amount === undefined || balance === undefined) {
      res.status(400).json({ error: "customerId, amount, and balance are required" });
      return;
    }

    // Get customer details
    const customer = await prisma.customer.findFirst({
      where: { 
        id: customerId, 
        companyId 
      },
    });

    console.log("👤 Customer found:", customer ? { 
      id: customer.id, 
      name: customer.customerName, 
      phone: customer.phone 
    } : "NOT FOUND");

    if (!customer) {
      res.status(404).json({ error: "Customer not found" });
      return;
    }

    if (!customer.phone || customer.phone.trim() === "") {
      res.status(400).json({ error: "Customer has no phone number" });
      return;
    }

    // Generate message
    const message = smsService.generatePaymentConfirmation(
      customer.customerName,
      amount,
      balance
    );

    console.log("💬 Generated message:", message);
    console.log("📱 Sending to:", customer.phone);

    // Send SMS
    const result = await smsService.sendSMS({
      to: customer.phone,
      message,
    });

    console.log("📤 SMS Result:", result);

    // Log SMS
    await prisma.sMSLog.create({
      data: {
        companyId,
        recipient: customer.phone,
        message,
        status: result.success ? "sent" : "failed",
        provider: result.provider,
        messageId: result.messageId || result.jobId,
        error: result.error,
        customerId,
      },
    });

    res.json(result);
  } catch (error) {
    console.error("❌ Payment SMS error:", error);
    res.status(500).json({ 
      error: "Failed to send payment SMS",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
};

// Send debt reminder to multiple customers
export const sendBulkDebtReminders = async (req: Request, res: Response) => {
  try {
    const companyId = req.user?.companyId;

    if (!companyId) {
      res.status(400).json({ error: "Company ID required" });
      return;
    }

    // Get all customers with unpaid debts
    const customers = await prisma.customer.findMany({
      where: {
        companyId,
        phone: { not: "" },
        debts: {
          some: {
            status: { in: ["unpaid", "partial"] },
          },
        },
      },
      include: {
        debts: {
          where: {
            status: { in: ["unpaid", "partial"] },
          },
        },
      },
    });

    const results = [];

    for (const customer of customers) {
      const totalDebt = customer.debts.reduce((sum, d) => sum + d.amount, 0);
      const message = smsService.generateDebtReminder(
        customer.customerName,
        totalDebt
      );

      const result = await smsService.sendSMS({
        to: customer.phone,
        message,
      });

      // Log SMS
      await prisma.sMSLog.create({
        data: {
          companyId,
          recipient: customer.phone,
          message,
          status: result.success ? "sent" : "failed",
          provider: result.provider,
          messageId: result.messageId || result.jobId,
          error: result.error,
          customerId: customer.id,
        },
      });

      results.push({
        customer: customer.customerName,
        phone: customer.phone,
        success: result.success,
        error: result.error,
      });

      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    res.json({
      total: results.length,
      sent: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
    });
  } catch (error) {
    console.error("Bulk SMS error:", error);
    res.status(500).json({ error: "Failed to send bulk SMS" });
  }
};

// Get SMS logs
export const getSMSLogs = async (req: Request, res: Response) => {
  try {
    const companyId = req.user?.companyId;
    const { page = 1, limit = 50 } = req.query;

    if (!companyId) {
      res.status(400).json({ error: "Company ID required" });
      return;
    }

    const logs = await prisma.sMSLog.findMany({
      where: { companyId },
      include: {
        customer: {
          select: {
            customerName: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    });

    const total = await prisma.sMSLog.count({
      where: { companyId },
    });

    res.json({
      logs,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error("SMS logs error:", error);
    res.status(500).json({ error: "Failed to fetch SMS logs" });
  }
};