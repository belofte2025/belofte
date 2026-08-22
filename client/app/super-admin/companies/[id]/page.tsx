"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ShieldCheck,
  Building2,
  Users,
  ShoppingCart,
  Package,
  TruckIcon,
  TrendingUp,
  Ban,
  CheckCircle2,
  LogOut,
  ExternalLink,
  User,
  Clock,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  getCompanyDetail,
  toggleCompanySuspend,
  impersonateCompany,
  SACompanyDetail,
} from "@/services/superAdminService";
import { formatCurrency } from "@/utils/format";
import { format } from "date-fns";

export default function CompanyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [company, setCompany] = useState<SACompanyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [suspending, setSuspending] = useState(false);
  const [impersonating, setImpersonating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getCompanyDetail(id);
      setCompany(data);
    } catch {
      toast.error("Failed to load company");
      router.push("/super-admin");
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    const token = localStorage.getItem("sa_token");
    if (!token) { router.push("/super-admin/login"); return; }
    load();
  }, [load, router]);

  const handleSuspend = async () => {
    if (!company) return;
    setSuspending(true);
    try {
      const updated = await toggleCompanySuspend(company.id, !company.suspended);
      setCompany((prev) => prev ? { ...prev, suspended: updated.suspended } : prev);
      toast.success(updated.suspended ? "Company suspended" : "Company reactivated");
    } catch {
      toast.error("Failed to update status");
    } finally {
      setSuspending(false);
    }
  };

  const handleImpersonate = async () => {
    if (!company) return;
    setImpersonating(true);
    try {
      const { token, user } = await impersonateCompany(company.id);
      // Save as regular user session then open dashboard
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      toast.success(`Logged in as ${company.companyName}`);
      window.open("/dashboard", "_blank");
    } catch {
      toast.error("Impersonation failed");
    } finally {
      setImpersonating(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("sa_token");
    localStorage.removeItem("sa_user");
    router.push("/super-admin/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-indigo-500" />
      </div>
    );
  }

  if (!company) return null;

  const statCards = [
    { label: "Users", value: company._count?.User ?? company.User.length, icon: Users, color: "text-blue-400 bg-blue-950" },
    { label: "Customers", value: company._count?.Customer ?? 0, icon: User, color: "text-purple-400 bg-purple-950" },
    { label: "Sales", value: (company._count?.Sale ?? 0).toLocaleString(), icon: ShoppingCart, color: "text-green-400 bg-green-950" },
    { label: "Containers", value: company._count?.Container ?? 0, icon: Package, color: "text-amber-400 bg-amber-950" },
    { label: "Suppliers", value: company._count?.Supplier ?? 0, icon: TruckIcon, color: "text-cyan-400 bg-cyan-950" },
    { label: "Revenue", value: formatCurrency(company.totalRevenue), icon: TrendingUp, color: "text-indigo-400 bg-indigo-950" },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Top bar */}
      <div className="border-b border-gray-800 bg-gray-900 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-white text-sm">Super Admin Console</span>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
        >
          <LogOut className="w-4 h-4" /> Sign out
        </button>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {/* Back + header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/super-admin")}
              className="w-8 h-8 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-gray-400" />
            </button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-white">{company.companyName}</h1>
                {company.suspended ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-950 text-red-400 border border-red-800">
                    <Ban className="w-3 h-3" /> Suspended
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-950 text-green-400 border border-green-800">
                    <CheckCircle2 className="w-3 h-3" /> Active
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                ID: <span className="font-mono">{company.id}</span> · Joined {format(new Date(company.createdAt), "MMM d, yyyy")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleImpersonate}
              disabled={impersonating || company.suspended}
              className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-xl bg-indigo-700 hover:bg-indigo-600 text-white font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ExternalLink className="w-4 h-4" />
              {impersonating ? "Opening…" : "Impersonate"}
            </button>
            <button
              onClick={handleSuspend}
              disabled={suspending}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm rounded-xl font-medium transition-colors disabled:opacity-40 ${
                company.suspended
                  ? "bg-green-900 hover:bg-green-800 text-green-300 border border-green-700"
                  : "bg-red-900 hover:bg-red-800 text-red-300 border border-red-700"
              }`}
            >
              {company.suspended ? <CheckCircle2 className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
              {suspending ? "…" : company.suspended ? "Reactivate" : "Suspend"}
            </button>
          </div>
        </div>

        {/* Company info */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex flex-wrap gap-6">
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Phone</p>
            <p className="text-sm text-white">{company.phone || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Address</p>
            <p className="text-sm text-white">{company.address || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Accounting</p>
            <p className="text-sm text-white">{company.enableAccounting ? "Enabled" : "Disabled"}</p>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {statCards.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-gray-900 border border-gray-800 rounded-2xl p-4 text-center">
              <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center mx-auto mb-2`}>
                <Icon className="w-4 h-4" />
              </div>
              <p className="text-lg font-bold text-white">{value}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Users list */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-800 flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-500" />
              <h2 className="font-semibold text-sm text-white">Users ({company.User.length})</h2>
            </div>
            {company.User.length === 0 ? (
              <div className="flex items-center justify-center py-10 text-gray-600 text-sm">No users</div>
            ) : (
              <div className="divide-y divide-gray-800">
                {company.User.map((u) => (
                  <div key={u.id} className="px-5 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-white">{u.userName}</p>
                      <p className="text-xs text-gray-500">{u.email}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-400">
                        {u.Role?.name ?? "No role"}
                      </span>
                      <p className="text-xs text-gray-600 mt-1 flex items-center gap-1 justify-end">
                        <Clock className="w-3 h-3" />
                        {format(new Date(u.createdAt), "MMM d, yyyy")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent sales */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-800 flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-gray-500" />
              <h2 className="font-semibold text-sm text-white">Recent Sales</h2>
            </div>
            {company.recentSales.length === 0 ? (
              <div className="flex items-center justify-center py-10 text-gray-600 text-sm">No sales yet</div>
            ) : (
              <div className="divide-y divide-gray-800">
                {company.recentSales.map((sale) => (
                  <div key={sale.id} className="px-5 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-white">
                        {sale.Customer?.customerName ?? "Walk-in"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(sale.createdAt), "MMM d, yyyy · h:mm a")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-white">{formatCurrency(sale.totalAmount)}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        sale.saleType === "credit"
                          ? "bg-orange-950 text-orange-400"
                          : "bg-green-950 text-green-400"
                      }`}>
                        {sale.saleType}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Impersonate note */}
        <div className="bg-gray-900 border border-amber-900/50 rounded-2xl px-5 py-4 flex items-start gap-3">
          <Building2 className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-400">Impersonate Access</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Clicking <strong>Impersonate</strong> opens the app as this company&apos;s first admin user in a new tab.
              It uses their permission set. Any actions taken are audited under that user&apos;s account.
              The super-admin session in this tab remains active.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
