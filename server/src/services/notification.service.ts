import prisma from "../utils/prisma";
import smsService from "./sms.service";
import whatsAppService from "./whatsapp.service";

interface SendPayload {
  companyId: string;
  customerId: string;
  customerName: string;
  phone: string;
  message: string;
}

class NotificationService {
  async send(payload: SendPayload): Promise<void> {
    try {
      const company = await prisma.company.findUnique({
        where: { id: payload.companyId },
        select: { notificationsEnabled: true, notificationChannel: true },
      });

      if (!company?.notificationsEnabled) return;

      const channel = (company.notificationChannel || "SMS").toUpperCase();
      let result: { success: boolean; messageId?: string; error?: string; provider: string };

      if (channel === "WHATSAPP") {
        result = await whatsAppService.sendMessage({ to: payload.phone, message: payload.message });
      } else {
        result = await smsService.sendSMS({ to: payload.phone, message: payload.message });
      }

      await prisma.sMSLog.create({
        data: {
          companyId: payload.companyId,
          customerId: payload.customerId,
          recipient: payload.phone,
          message: payload.message,
          status: result.success ? "sent" : "failed",
          provider: result.provider || channel,
          messageId: result.messageId ?? null,
          error: result.error ?? null,
        },
      });
    } catch (err) {
      console.error("Notification service error (non-fatal):", err);
    }
  }

  saleMessage(customerName: string, itemCount: number, total: number, balance?: number): string {
    let msg = `Dear ${customerName}, your purchase of ${itemCount} item(s) totaling GHS ${total.toFixed(2)} has been processed.`;
    if (balance !== undefined && balance > 0) {
      msg += ` Outstanding balance: GHS ${balance.toFixed(2)}.`;
    }
    msg += " Thank you!";
    return msg;
  }

  paymentMessage(customerName: string, amount: number, balance: number): string {
    const dir = balance > 0 ? `Outstanding balance: GHS ${balance.toFixed(2)}.` : "Your account is now settled.";
    return `Dear ${customerName}, payment of GHS ${amount.toFixed(2)} received. ${dir} Thank you!`;
  }
}

export default new NotificationService();
