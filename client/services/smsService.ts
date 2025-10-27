import api from "@/lib/api";

export interface SMSResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  provider: string;
}

export interface BulkSMSResponse {
  total: number;
  sent: number;
  failed: number;
  results: Array<{
    customer: string;
    phone: string;
    success: boolean;
  }>;
}

export interface SMSLog {
  id: string;
  recipient: string;
  message: string;
  status: string;
  provider: string;
  messageId?: string;
  error?: string;
  createdAt: string;
  customer?: {
    customerName: string;
  };
}

export const sendSingleSMS = async (
  to: string,
  message: string
): Promise<SMSResponse> => {
  const response = await api.post(`/sms/send`, { to, message });
  return response.data;
};

export const sendPaymentConfirmationSMS = async (
  customerId: string,
  amount: number,
  balance: number
): Promise<SMSResponse> => {
  const response = await api.post("/sms/payment-confirmation", {
    customerId,
    amount,
    balance,
  });
  return response.data;
};

export const sendBulkDebtReminders = async (): Promise<BulkSMSResponse> => {
  const response = await api.post("/sms/bulk-debt-reminders");
  return response.data;
};

export const getSMSLogs = async (page = 1, limit = 50) => {
  const response = await api.get("/sms/logs", {
    params: { page, limit },
  });
  return response.data;
};
