"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck, Building2, Users, ShoppingCart, TrendingUp,
  LogOut, Search, Ban, CheckCircle2, ChevronRight, UserCheck,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  getPlatformStats, getAllCompanies, toggleCompanySuspend,
  PlatformStats, SACompany,
} from "@/services/superAdminService";
import { formatCurrency } from "@/utils/format";
import { format } from "date-fns";

export default function SuperAdminDashboard() {
  const router = useRouter();
  const [saUser, setSaUser] = useState<{ email: string; userName: string } | null>(null);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [companies, setCompanies] = useState<SACompany[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [suspending, setSuspending] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, c] = await Promise.all([getPlatformStats(), getAllCompanies()]);
      setStats(s);
      setCompanies(c);
    } catch {
      toast.error("Failed to load data");
      router.push("/super-admin/login");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const token = localStorage.getItem("sa_token");
    const user = localStorage.getItem("sa_user");
    if (!token || !user) { router.push("/super-admin/login"); return; }
    setSaUser(JSON.parse(user));
    load();
  }, [load, router]);

  const handleSuspend = async (company: SACompany) => {
    setSuspending(company.id);
    try {
      const updated = await toggleCompanySuspend(company.id, !company.suspended);
      setCompanies((prev) =>
        prev.map((c) => c.id === company.id ? { ...c, suspended: updated.suspended } : c)
      );
      toast.success(updated.suspended ? `${company.companyName} suspended` : `${company.companyName} reactivated`);
    } catch {
      toast.error("Failed to update company status");
    } finally {
      setSuspending(null);
    }
  };

  const logout = () => {
    localStorage.removeItem("sa_token");
    localStorage.removeItem("sa_user");
    router.push("/super-admin/login");
  };

  const filtered = companies.filter((c) =>
    c.companyName.toLowerCase().includes(search.toLowerCase())
  );

  const statCards = stats ? [
    { label: "Total Companies", value: stats.companies, icon: Building2, iconCls: "text-blue-600 bg-blue-50" },
    { label: "Total Users", value: stats.users, icon: Users, iconCls: "text-indigo-600 bg-indigo-50" },
    { label: "Total Sales", value: stats.sales.toLocaleString(), icon: ShoppingCart, iconCls: "text-green-600 bg-green-50" },
    { label: "Platform Revenue", value: formatCurrency(stats.totalRevenue), icon: TrendingUp, iconCls: "text-amber-600 bg-amber-50" },
  ] : [];

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
          {saUser && (
            <span className="text-white/50 text-xs hidden sm:inline">— {saUser.email}</span>
          )}
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-1.5 text-xs text-white/70 hover:text-white transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Sign out</span>
        </button>
      </header>

      <div className="max-w-7xl mx-auto page-container space-y-6">
        {/* Page header */}
        <div className="page-header">
          <div>
            <h1 className="page-title">Platform Overview</h1>
            <p className="text-sm text-gray-500 mt-0.5">Manage all tenants and platform settings</p>
          </div>
          <button onClick={() => router.push("/onboard")} className="btn btn-primary">
            <Building2 className="w-4 h-4" />
            Onboard Company
          </button>
        </div>

        {/* Stat cards */}
        <div className="stats-grid">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="stat-card animate-pulse">
                  <div className="h-3 bg-gray-200 rounded w-24 mb-3" />
                  <div className="h-7 bg-gray-200 rounded w-16" />
                </div>
              ))
            : statCards.map(({ label, value, icon: Icon, iconCls }) => (
                <div key={label} className="stat-card">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="stat-label">{label}</p>
                      <p className="stat-value">{value}</p>
                    </div>
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${iconCls}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              ))}
        </div>

        {/* Suspended warning */}
        {stats && stats.suspended > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-center gap-3">
            <Ban className="w-4 h-4 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700">
              <span className="font-semibold">{stats.suspended} {stats.suspended === 1 ? "company" : "companies"}</span>{" "}
              currently suspended
            </p>
          </div>
        )}

        {/* Companies table */}
        <div>
          <div className="section-header">
            <h2 className="font-semibold text-gray-900">All Tenants</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search companies…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-52 placeholder-gray-400"
              />
            </div>
          </div>

          <div className="table-wrapper">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <Building2 className="w-10 h-10 mb-3 opacity-30" />
                <p className="text-sm">No companies found</p>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Company</th>
                    <th className="text-center">Users</th>
                    <th className="text-center">Customers</th>
                    <th className="text-center">Sales</th>
                    <th className="text-right">Revenue</th>
                    <th>Joined</th>
                    <th className="text-center">Status</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((company) => (
                    <tr
                      key={company.id}
                      className="cursor-pointer"
                      onClick={() => router.push(`/super-admin/companies/${company.id}`)}
                    >
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-blue-600 font-bold text-xs">
                              {company.companyName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{company.companyName}</p>
                            {company.phone && (
                              <p className="text-xs text-gray-500">{company.phone}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="text-center">{company._count.User}</td>
                      <td className="text-center">{company._count.Customer}</td>
                      <td className="text-center">{company._count.Sale.toLocaleString()}</td>
                      <td className="text-right font-medium">{formatCurrency(company.totalRevenue)}</td>
                      <td>{format(new Date(company.createdAt), "MMM d, yyyy")}</td>
                      <td className="text-center">
                        {company.suspended ? (
                          <span className="badge badge-red">Suspended</span>
                        ) : (
                          <span className="badge badge-green">Active</span>
                        )}
                      </td>
                      <td>
                        <div
                          className="flex items-center justify-end gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => handleSuspend(company)}
                            disabled={suspending === company.id}
                            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50 ${
                              company.suspended
                                ? "bg-green-100 text-green-700 hover:bg-green-200"
                                : "bg-red-100 text-red-700 hover:bg-red-200"
                            }`}
                          >
                            {suspending === company.id
                              ? "…"
                              : company.suspended
                              ? "Reactivate"
                              : "Suspend"}
                          </button>
                          <button
                            onClick={() => router.push(`/super-admin/companies/${company.id}`)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {!loading && filtered.length > 0 && (
              <div className="px-4 py-2.5 border-t border-gray-100 text-xs text-gray-500">
                {filtered.length} of {companies.length} {companies.length === 1 ? "company" : "companies"}
              </div>
            )}
          </div>
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => router.push("/onboard")}
            className="card card-hover text-left flex items-center gap-4"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 text-sm">Onboard New Company</p>
              <p className="text-xs text-gray-500 mt-0.5">Register a new tenant on the platform</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
          </button>

          <div className="card flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
              <UserCheck className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900 text-sm">Active Tenants</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {stats
                  ? `${stats.companies - stats.suspended} of ${stats.companies} companies active`
                  : "—"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
