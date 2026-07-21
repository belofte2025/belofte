"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { ArrowLeft, Bell, MessageSquare, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  getNotificationSettings,
  updateNotificationSettings,
  NotificationSettings,
} from "@/services/settingsService";

export default function NotificationsSettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<NotificationSettings>({
    notificationsEnabled: false,
    notificationChannel: "SMS",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getNotificationSettings()
      .then(setSettings)
      .catch(() => toast.error("Failed to load notification settings"))
      .finally(() => setLoading(false));
  }, []);

  const toggleEnabled = async () => {
    const next = !settings.notificationsEnabled;
    setSettings((s) => ({ ...s, notificationsEnabled: next }));
    setSaving(true);
    try {
      await updateNotificationSettings({ notificationsEnabled: next });
      toast.success(next ? "Notifications enabled" : "Notifications disabled");
    } catch {
      setSettings((s) => ({ ...s, notificationsEnabled: !next }));
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const setChannel = async (channel: "SMS" | "WHATSAPP" | "BOTH") => {
    if (channel === settings.notificationChannel) return;
    const prev = settings.notificationChannel;
    setSettings((s) => ({ ...s, notificationChannel: channel }));
    setSaving(true);
    try {
      await updateNotificationSettings({ notificationChannel: channel });
      toast.success(`Channel changed to ${channel}`);
    } catch {
      setSettings((s) => ({ ...s, notificationChannel: prev }));
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div className="page-header">
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.back()}
              className="icon-btn text-gray-400 hover:text-gray-700 hover:bg-gray-100"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1 className="page-title">Notification Settings</h1>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-blue-600" />
            <span className="ml-3 text-sm text-gray-500">Loading…</span>
          </div>
        ) : (
          <div className="space-y-4 max-w-xl">

            {/* Enable/Disable toggle */}
            <div className="card">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <Bell className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Customer Notifications</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Automatically notify customers when a sale is recorded or a payment is received.
                      Credit sale messages include the outstanding balance.
                    </p>
                  </div>
                </div>
                <button
                  onClick={toggleEnabled}
                  disabled={saving}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent
                    transition-colors duration-200 focus:outline-none disabled:opacity-50 ${
                    settings.notificationsEnabled ? "bg-blue-600" : "bg-gray-200"
                  }`}
                  style={settings.notificationsEnabled ? { background: "#0099d6" } : {}}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
                      settings.notificationsEnabled ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Channel selector */}
            <div className={`card transition-opacity duration-200 ${!settings.notificationsEnabled ? "opacity-40 pointer-events-none" : ""}`}>
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="w-4 h-4 text-gray-500" />
                <p className="text-sm font-semibold text-gray-900">Notification Channel</p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {(["SMS", "WHATSAPP", "BOTH"] as const).map((ch) => {
                  const active = settings.notificationChannel === ch;
                  const icons: Record<string, string> = { SMS: "📱", WHATSAPP: "💬", BOTH: "📲" };
                  const labels: Record<string, string> = { SMS: "SMS only", WHATSAPP: "WhatsApp only", BOTH: "Both" };
                  const sublabels: Record<string, string> = { SMS: "Text message", WHATSAPP: "WhatsApp", BOTH: "SMS + WhatsApp" };
                  return (
                    <button
                      key={ch}
                      onClick={() => setChannel(ch)}
                      disabled={saving}
                      className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-center transition-all duration-150 disabled:opacity-50 ${
                        active
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 bg-white hover:border-gray-300"
                      }`}
                      style={active ? { borderColor: "#0099d6", background: "#e0f7ff" } : {}}
                    >
                      <span className="text-2xl">{icons[ch]}</span>
                      <div>
                        <p className={`text-xs font-semibold ${active ? "text-blue-700" : "text-gray-700"}`}
                           style={active ? { color: "#007cb5" } : {}}>
                          {labels[ch]}
                        </p>
                        <p className="text-xs text-gray-500">{sublabels[ch]}</p>
                      </div>
                      {active && (
                        <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: "#0099d6" }} />
                      )}
                    </button>
                  );
                })}
              </div>

              {(settings.notificationChannel === "WHATSAPP" || settings.notificationChannel === "BOTH") && (
                <div className="mt-4 rounded-lg bg-amber-50 border border-amber-200 p-3">
                  <p className="text-xs text-amber-700 font-medium">WhatsApp requires configuration</p>
                  <p className="text-xs text-amber-600 mt-0.5">
                    Set <code className="font-mono bg-amber-100 px-1 rounded">WHATSAPP_PROVIDER</code>,{" "}
                    <code className="font-mono bg-amber-100 px-1 rounded">WHATSAPP_API_URL</code>,{" "}
                    <code className="font-mono bg-amber-100 px-1 rounded">WHATSAPP_API_KEY</code>, and{" "}
                    <code className="font-mono bg-amber-100 px-1 rounded">WHATSAPP_FROM</code> environment
                    variables on the server. Supported providers: WATI, Twilio.
                  </p>
                </div>
              )}

              {(settings.notificationChannel === "SMS" || settings.notificationChannel === "BOTH") && (
                <div className="mt-4 rounded-lg bg-gray-50 border border-gray-200 p-3">
                  <p className="text-xs text-gray-600">
                    SMS uses your configured provider (Nalo or mNotify). Set{" "}
                    <code className="font-mono bg-gray-100 px-1 rounded">SMS_PROVIDER</code> and credentials
                    in server environment variables.
                  </p>
                </div>
              )}
            </div>

            {/* What gets sent */}
            <div className="card">
              <p className="text-sm font-semibold text-gray-900 mb-3">What customers will receive</p>
              <div className="space-y-3">
                <div className="rounded-lg bg-gray-50 border border-gray-200 p-3">
                  <p className="text-xs font-medium text-gray-700 mb-1">On sale (cash)</p>
                  <p className="text-xs text-gray-500 font-mono leading-relaxed">
                    "Dear John, your purchase of 3 item(s) totaling GHS 150.00 has been processed. Thank you!"
                  </p>
                </div>
                <div className="rounded-lg bg-gray-50 border border-gray-200 p-3">
                  <p className="text-xs font-medium text-gray-700 mb-1">On credit sale</p>
                  <p className="text-xs text-gray-500 font-mono leading-relaxed">
                    "Dear John, your purchase of 2 item(s) totaling GHS 300.00 has been processed. Outstanding balance: GHS 500.00. Thank you!"
                  </p>
                </div>
                <div className="rounded-lg bg-gray-50 border border-gray-200 p-3">
                  <p className="text-xs font-medium text-gray-700 mb-1">On payment received</p>
                  <p className="text-xs text-gray-500 font-mono leading-relaxed">
                    "Dear John, payment of GHS 200.00 received. Outstanding balance: GHS 300.00. Thank you!"
                  </p>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
