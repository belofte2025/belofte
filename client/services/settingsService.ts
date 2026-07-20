import api from "@/lib/api";

export interface NotificationSettings {
  notificationsEnabled: boolean;
  notificationChannel: "SMS" | "WHATSAPP";
}

export const getNotificationSettings = async (): Promise<NotificationSettings> => {
  const res = await api.get("/settings/notifications");
  return res.data;
};

export const updateNotificationSettings = async (data: Partial<NotificationSettings>): Promise<NotificationSettings> => {
  const res = await api.put("/settings/notifications", data);
  return res.data;
};
