import axios from "axios";

interface WAMessage {
  to: string;
  message: string;
}

interface WAResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  provider: string;
}

class WhatsAppService {
  private provider: string;
  private apiUrl: string;
  private apiKey: string;
  private from: string;

  constructor() {
    this.provider = process.env.WHATSAPP_PROVIDER || "wati";
    this.apiUrl   = process.env.WHATSAPP_API_URL || "";
    this.apiKey   = process.env.WHATSAPP_API_KEY || "";
    this.from     = process.env.WHATSAPP_FROM || "";
  }

  async sendMessage({ to, message }: WAMessage): Promise<WAResponse> {
    // Meta only needs apiKey + from (phone number ID); others also need apiUrl
    const metaReady = this.provider === "meta" && this.apiKey && this.from;
    const otherReady = this.provider !== "meta" && this.apiUrl && this.apiKey;
    if (!metaReady && !otherReady) {
      return { success: false, error: "WhatsApp not configured", provider: this.provider };
    }

    const phone = this.formatPhone(to);
    if (!phone) {
      return { success: false, error: "Invalid phone number", provider: this.provider };
    }

    try {
      if (this.provider === "meta")   return await this.sendViaMeta(phone, message);
      if (this.provider === "wati")   return await this.sendViaWati(phone, message);
      if (this.provider === "twilio") return await this.sendViaTwilio(phone, message);
      return { success: false, error: "Unknown WhatsApp provider", provider: this.provider };
    } catch (err) {
      console.error("WhatsApp send error:", err);
      return {
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
        provider: this.provider,
      };
    }
  }

  private formatPhone(phone: string): string | null {
    let cleaned = phone.replace(/\D/g, "");
    if (cleaned.startsWith("0")) cleaned = "233" + cleaned.substring(1);
    else if (!cleaned.startsWith("233")) cleaned = "233" + cleaned;
    return cleaned.length === 12 ? cleaned : null;
  }

  private async sendViaMeta(to: string, message: string): Promise<WAResponse> {
    // Meta WhatsApp Cloud API
    // WHATSAPP_FROM = Phone Number ID (numeric ID from Meta Business Suite)
    // WHATSAPP_API_KEY = permanent access token
    const url = `https://graph.facebook.com/v20.0/${this.from}/messages`;
    const res = await axios.post(
      url,
      {
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { preview_url: false, body: message },
      },
      {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        timeout: 30000,
      }
    );
    const msgId: string | undefined = res.data?.messages?.[0]?.id;
    return { success: !!msgId, messageId: msgId, provider: "meta" };
  }

  private async sendViaWati(to: string, message: string): Promise<WAResponse> {
    const res = await axios.post(
      `${this.apiUrl}/api/v1/sendSessionMessage/${to}`,
      { messageText: message },
      { headers: { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json" }, timeout: 30000 }
    );
    return {
      success: res.data?.result === true,
      messageId: res.data?.id,
      provider: "wati",
    };
  }

  // Twilio WhatsApp API
  private async sendViaTwilio(to: string, message: string): Promise<WAResponse> {
    const [accountSid, authToken] = this.apiKey.split(":");
    const res = await axios.post(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      new URLSearchParams({
        From: `whatsapp:+${this.from}`,
        To: `whatsapp:+${to}`,
        Body: message,
      }),
      { auth: { username: accountSid, password: authToken }, timeout: 30000 }
    );
    return {
      success: ["queued", "sent", "delivered"].includes(res.data?.status),
      messageId: res.data?.sid,
      provider: "twilio",
    };
  }
}

export default new WhatsAppService();
