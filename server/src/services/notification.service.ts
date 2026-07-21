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

      const sends: Promise<{ success: boolean; messageId?: string; error?: string; provider: string }>[] = [];
      if (channel === "SMS" || channel === "BOTH") {
        sends.push(smsService.sendSMS({ to: payload.phone, message: payload.message }));
      }
      if (channel === "WHATSAPP" || channel === "BOTH") {
        sends.push(whatsAppService.sendMessage({ to: payload.phone, message: payload.message }));
      }

      const results = await Promise.allSettled(sends);
      const succeeded = results.filter((r) => r.status === "fulfilled" && r.value.success);
      const firstResult = results[0]?.status === "fulfilled" ? results[0].value : { success: false, provider: channel, error: "send failed" };

      await prisma.sMSLog.create({
        data: {
          companyId: payload.companyId,
          customerId: payload.customerId,
          recipient: payload.phone,
          message: payload.message,
          status: succeeded.length > 0 ? "sent" : "failed",
          provider: channel,
          messageId: firstResult.messageId ?? null,
          error: succeeded.length === 0 ? (firstResult.error ?? "All channels failed") : null,
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
