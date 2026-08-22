"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, ShieldCheck, Building2, Users, ShoppingCart, Package,
  TruckIcon, TrendingUp, Ban, CheckCircle2, LogOut, ExternalLink,
  User, Clock,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  getCompanyDetail, toggleCompanySuspend, impersonateCompany, SACompanyDetail,
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!company) return null;

  const statCards = [
    { label: "Users", value: company._count?.User ?? company.User.length, icon: Users },
    { label: "Customers", value: company._count?.Customer ?? 0, icon: User },
    { label: "Sales", value: (company._count?.Sale ?? 0).toLocaleString(), icon: ShoppingCart },
    { label: "Containers", value: company._count?.Container ?? 0, icon: Package },
    { label: "Suppliers", value: company._count?.Supplier ?? 0, icon: TruckIcon },
    { label: "Revenue", value: formatCurrency(company.totalRevenue), icon: TrendingUp },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Topbar */}
      <header
        className="h-14 px-4 lg:px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm"
        style={{ background: "#0A2540" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: "#0099d6" }}
          >
            <ShieldCheck className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-bold text-white">Super Admin Console</span>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-1.5 text-xs text-white/70 hover:text-white transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Sign out</span>
        </button>
      </header>

      <div className="max-w-5xl mx-auto page-container space-y-6">
        {/* Back + header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <button
              onClick={() => router.push("/super-admin")}
              className="mt-0.5 p-2 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors flex-shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="page-title">{company.companyName}</h1>
                {company.suspended ? (
                  <span className="badge badge-red">Suspended</span>
                ) : (
                  <span className="badge badge-green">Active</span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-0.5 font-mono">
                {company.id} · Joined {format(new Date(company.createdAt), "MMM d, yyyy")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleImpersonate}
              disabled={impersonating || company.suspended}
              className="btn btn-primary"
            >
              <ExternalLink className="w-4 h-4" />
              {impersonating ? "Opening…" : "Impersonate"}
            </button>
            <button
              onClick={handleSuspend}
              disabled={suspending}
              className={`btn ${company.suspended ? "btn-success" : "btn-danger"}`}
            >
              {company.suspended ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <Ban className="w-4 h-4" />
              )}
              {suspending ? "…" : company.suspended ? "Reactivate" : "Suspend"}
            </button>
          </div>
        </div>

        {/* Company info */}
        <div className="card flex flex-wrap gap-6">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Phone</p>
            <p className="text-sm text-gray-900">{company.phone || "—"}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Address</p>
            <p className="text-sm text-gray-900">{company.address || "—"}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Accounting</p>
            <span className={`badge ${company.enableAccounting ? "badge-green" : "badge-gray"}`}>
              {company.enableAccounting ? "Enabled" : "Disabled"}
            </span>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {statCards.map(({ label, value, icon: Icon }) => (
            <div key={label} className="stat-card text-center">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center mx-auto mb-2">
                <Icon className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-xl font-bold text-gray-900">{value}</p>
              <p className="stat-label mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Users table */}
          <div className="table-wrapper">
            <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-2 bg-gray-50">
              <Users className="w-4 h-4 text-gray-500" />
              <h2 className="font-semibold text-sm text-gray-900">
                Users ({company.User.length})
              </h2>
            </div>
            {company.User.length === 0 ? (
              <div className="flex items-center justify-center py-10 text-gray-400 text-sm">
                No users
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Role</th>
                    <th>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {company.User.map((u) => (
                    <tr key={u.id}>
                      <td>
                        <p className="font-medium text-gray-900">{u.userName}</p>
                        <p className="text-xs text-gray-500">{u.email}</p>
                      </td>
                      <td>
                        <span className="badge badge-gray">{u.Role?.name ?? "No role"}</span>
                      </td>
                      <td>
                        <div className="flex items-center gap-1 text-gray-500 text-xs">
                          <Clock className="w-3 h-3" />
                          {format(new Date(u.createdAt), "MMM d, yyyy")}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Recent sales table */}
          <div className="table-wrapper">
            <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-2 bg-gray-50">
              <ShoppingCart className="w-4 h-4 text-gray-500" />
              <h2 className="font-semibold text-sm text-gray-900">Recent Sales</h2>
            </div>
            {company.recentSales.length === 0 ? (
              <div className="flex items-center justify-center py-10 text-gray-400 text-sm">
                No sales yet
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Date</th>
                    <th>Type</th>
                    <th className="text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {company.recentSales.map((sale) => (
                    <tr key={sale.id}>
                      <td>{sale.Customer?.customerName ?? "Walk-in"}</td>
                      <td>{format(new Date(sale.createdAt), "MMM d, yyyy")}</td>
                      <td>
                        <span className={`badge ${sale.saleType === "credit" ? "badge-yellow" : "badge-green"}`}>
                          {sale.saleType}
                        </span>
                      </td>
                      <td className="text-right font-semibold">{formatCurrency(sale.totalAmount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Impersonation notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
          <Building2 className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Impersonation Notice</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Clicking <strong>Impersonate</strong> opens the app as this company&apos;s first admin user in a new tab.
              Actions taken are audited under that user&apos;s account.
              Your super-admin session in this tab remains active.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
