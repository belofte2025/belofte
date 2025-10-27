import axios from "axios";

// SMS Provider Configuration
interface SMSConfig {
  provider: "nalo" | "mnotify";
  apiUrl: string;
  username: string;
  password: string;
  apiKey: string;
  senderId: string;
}

// SMS Message Interface
interface SMSMessage {
  to: string; // Phone number
  message: string;
  senderId?: string;
}

// SMS Response Interface
interface SMSResponse {
  success: boolean;
  messageId?: string;
  jobId?: string;
  error?: string;
  provider: string;
}

// Nalo SMS API Response
interface NaloAPIResponse {
  status: string;
  job_id?: string;
  msisdn?: string;
  code?: string;
  message?: string;
}

// mNotify API Response
interface MNotifyAPIResponse {
  code: string;
  id?: string;
  message?: string;
}

class SMSService {
  private config: SMSConfig;

  constructor() {
    this.config = {
      provider: (process.env.SMS_PROVIDER as "nalo" | "mnotify") || "nalo",
      apiUrl: process.env.SMS_API_URL || "https://sms.nalosolutions.com/smsbackend/Resl_Nalo/send-message/",
      username: process.env.SMS_USERNAME || "",
      password: process.env.SMS_PASSWORD || "",
      apiKey: process.env.SMS_API_KEY || "",
      senderId: process.env.SMS_SENDER_ID || "YourApp",
    };
  }

  // Main send method - routes to appropriate provider
  async sendSMS(message: SMSMessage): Promise<SMSResponse> {
    try {
      // Validate configuration
      if (this.config.provider === "nalo" && (!this.config.username || !this.config.password)) {
        return {
          success: false,
          error: "Nalo SMS credentials not configured",
          provider: this.config.provider,
        };
      }

      if (this.config.provider === "mnotify" && !this.config.apiKey) {
        return {
          success: false,
          error: "mNotify API key not configured",
          provider: this.config.provider,
        };
      }

      // Validate phone number
      const formattedPhone = this.formatPhoneNumber(message.to);

      if (!formattedPhone) {
        return {
          success: false,
          error: "Invalid phone number format",
          provider: this.config.provider,
        };
      }

      // Route to appropriate provider
      switch (this.config.provider) {
        case "nalo":
          return await this.sendViaNalo(
            formattedPhone, 
            message.message,
            message.senderId || this.config.senderId
          );

        case "mnotify":
          return await this.sendViaMNotify(formattedPhone, message.message);
          
        default:
          return {
            success: false,
            error: "Invalid SMS provider",
            provider: this.config.provider,
          };
      }
    } catch (error) {
      console.error("SMS sending error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        provider: this.config.provider,
      };
    }
  }

  // Format phone number to international format
  private formatPhoneNumber(phone: string): string | null {
    // Remove all non-numeric characters
    let cleaned = phone.replace(/\D/g, "");

    // Ghana specific formatting
    if (cleaned.startsWith("0")) {
      cleaned = "233" + cleaned.substring(1);
    } else if (!cleaned.startsWith("233")) {
      cleaned = "233" + cleaned;
    }

    // Validate Ghana phone number (233 + 9 digits = 12 digits total)
    if (cleaned.length === 12 && cleaned.startsWith("233")) {
      return cleaned;
    }

    return null;
  }

  // ============================================
  // NALO IMPLEMENTATION
  // ============================================
  private async sendViaNalo(
    to: string,
    message: string,
    senderId: string
  ): Promise<SMSResponse> {
    try {
      const payload = {
        username: this.config.username,
        password: this.config.password,
        msisdn: to,
        message: message,
        sender_id: senderId,
      };

      const response = await axios.post<NaloAPIResponse>(
        this.config.apiUrl,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
          },
          timeout: 30000, // 30 second timeout
        }
      );

      // Check response status
      const statusCode = response.data.status || response.data.code;

      // Success response: status code 1701
      if (statusCode === "1701") {
        return {
          success: true,
          messageId: response.data.job_id,
          jobId: response.data.job_id,
          provider: "nalo",
        };
      }

      // Error responses
      const errorMessage = this.getErrorMessage(statusCode || "");
      return {
        success: false,
        error: errorMessage,
        provider: "nalo",
      };
    } catch (error: unknown) {
      console.error("Nalo SMS API error:", error);

      // Handle axios errors
      if (axios.isAxiosError(error) && error.response) {
        const statusCode =
          error.response.data?.code || error.response.data?.status;
        const errorMessage =
          this.getErrorMessage(statusCode || "") ||
          error.response.data?.message;

        return {
          success: false,
          error: errorMessage || "SMS API request failed",
          provider: "nalo",
        };
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : "Network error",
        provider: "nalo",
      };
    }
  }

  // Get user-friendly error message based on status code
  private getErrorMessage(statusCode: string): string {
    const errorMessages: { [key: string]: string } = {
      "1701": "Success",
      "1702": "Invalid URL - Missing required parameters",
      "1703": "Invalid username or password",
      "1704": "Invalid message type",
      "1705": "Invalid message content",
      "1706": "Invalid phone number",
      "1707": "Invalid sender ID",
      "1708": "Invalid delivery report setting",
      "1709": "User validation failed",
      "1710": "Internal server error",
      "1025": "Insufficient credit",
      "1026": "Insufficient reseller credit",
    };

    return (
      errorMessages[statusCode] || `Unknown error (Code: ${statusCode})`
    );
  }

  // ============================================
  // MNOTIFY IMPLEMENTATION (Ghana)
  // ============================================
  private async sendViaMNotify(
    to: string,
    message: string
  ): Promise<SMSResponse> {
    try {
      const response = await axios.get<MNotifyAPIResponse>(
        "https://apps.mnotify.net/smsapi",
        {
          params: {
            key: this.config.apiKey,
            to: to,
            msg: message,
            sender_id: this.config.senderId,
          },
          timeout: 30000, // 30 second timeout
        }
      );

      // mNotify success code is "1000"
      const isSuccess = response.data.code === "1000";

      return {
        success: isSuccess,
        messageId: response.data.id,
        error: !isSuccess ? response.data.message || "SMS sending failed" : undefined,
        provider: "mnotify",
      };
    } catch (error: unknown) {
      console.error("mNotify SMS API error:", error);

      if (axios.isAxiosError(error) && error.response) {
        return {
          success: false,
          error: error.response.data?.message || "SMS API request failed",
          provider: "mnotify",
        };
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : "Network error",
        provider: "mnotify",
      };
    }
  }

  // ============================================
  // TEMPLATE MESSAGES
  // ============================================
  generatePaymentConfirmation(
    customerName: string,
    amount: number,
    balance: number
  ): string {
    return `Dear ${customerName}, your payment of GHS ${amount.toFixed(
      2
    )} has been received. Current Balance: GHS ${balance.toFixed(
      2
    )}. Thank you for your business!`;
  }

  generateDebtReminder(customerName: string, balance: number): string {
    return `Dear ${customerName}, this is a reminder that you have an outstanding balance of GHS ${balance.toFixed(
      2
    )}. Please contact us to settle your account. Thank you.`;
  }

  generateSaleNotification(
    customerName: string,
    items: string,
    total: number
  ): string {
    return `Dear ${customerName}, your order for ${items} totaling GHS ${total.toFixed(
      2
    )} has been processed. Thank you!`;
  }

  generateCustomMessage(customerName: string, message: string): string {
    return `Dear ${customerName}, ${message}`;
  }

  // Validate message length (160 chars for single SMS)
  validateMessageLength(message: string): {
    valid: boolean;
    length: number;
    smsCount: number;
  } {
    const length = message.length;
    const smsCount = Math.ceil(length / 160);

    return {
      valid: length <= 160, // Warn if more than 1 SMS
      length,
      smsCount,
    };
  }
}

// Export singleton instance
export default new SMSService();