"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Building2,
  Users,
  ShoppingCart,
  TrendingUp,
  LogOut,
  Search,
  Ban,
  CheckCircle2,
  ChevronRight,
  UserCheck,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  getPlatformStats,
  getAllCompanies,
  toggleCompanySuspend,
  PlatformStats,
  SACompany,
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
    if (!token || !user) {
      router.push("/super-admin/login");
      return;
    }
    setSaUser(JSON.parse(user));
    load();
  }, [load, router]);

  const handleSuspend = async (company: SACompany) => {
    setSuspending(company.id);
    try {
      const updated = await toggleCompanySuspend(company.id, !company.suspended);
      setCompanies((prev) => prev.map((c) => (c.id === company.id ? { ...c, suspended: updated.suspended } : c)));
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

  const statCards = stats
    ? [
        { label: "Total Companies", value: stats.companies, icon: Building2, color: "bg-indigo-50 text-indigo-600" },
        { label: "Total Users", value: stats.users, icon: Users, color: "bg-blue-50 text-blue-600" },
        { label: "Total Sales", value: stats.sales.toLocaleString(), icon: ShoppingCart, color: "bg-green-50 text-green-600" },
        { label: "Total Revenue", value: formatCurrency(stats.totalRevenue), icon: TrendingUp, color: "bg-amber-50 text-amber-600" },
      ]
    : [];

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Top bar */}
      <div className="border-b border-gray-800 bg-gray-900 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="font-semibold text-white text-sm">Super Admin Console</span>
            {saUser && <span className="ml-2 text-gray-500 text-xs">— {saUser.email}</span>}
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
        >
          <LogOut className="w-4 h-4" /> Sign out
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 animate-pulse h-24" />
              ))
            : statCards.map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">{label}</p>
                      <p className="text-xl font-bold text-white">{value}</p>
                    </div>
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              ))}
        </div>

        {/* Suspended warning */}
        {stats && stats.suspended > 0 && (
          <div className="bg-red-950 border border-red-800 rounded-2xl px-5 py-3 flex items-center gap-3">
            <Ban className="w-5 h-5 text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-300">
              <span className="font-semibold">{stats.suspended} company{stats.suspended !== 1 ? " tenants" : " tenant"}</span> currently suspended
            </p>
          </div>
        )}

        {/* Companies table */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between gap-4">
            <h2 className="font-semibold text-sm text-white">All Tenants</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search companies…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-56"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-500">
              <Building2 className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm">No companies found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Company</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">Users</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">Customers</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">Sales</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Revenue</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Joined</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">Status</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {filtered.map((company) => (
                    <tr
                      key={company.id}
                      className="hover:bg-gray-800/50 transition-colors group"
                    >
                      <td
                        className="px-6 py-4 cursor-pointer"
                        onClick={() => router.push(`/super-admin/companies/${company.id}`)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-indigo-900 flex items-center justify-center flex-shrink-0">
                            <span className="text-indigo-300 font-bold text-xs">
                              {company.companyName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-white group-hover:text-indigo-300 transition-colors">
                              {company.companyName}
                            </p>
                            {company.phone && (
                              <p className="text-xs text-gray-500">{company.phone}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center text-gray-300">{company._count.User}</td>
                      <td className="px-4 py-4 text-center text-gray-300">{company._count.Customer}</td>
                      <td className="px-4 py-4 text-center text-gray-300">{company._count.Sale.toLocaleString()}</td>
                      <td className="px-4 py-4 text-right font-medium text-white">{formatCurrency(company.totalRevenue)}</td>
                      <td className="px-4 py-4 text-gray-400 text-xs">
                        {format(new Date(company.createdAt), "MMM d, yyyy")}
                      </td>
                      <td className="px-4 py-4 text-center">
                        {company.suspended ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-950 text-red-400 border border-red-800">
                            <Ban className="w-3 h-3" /> Suspended
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-950 text-green-400 border border-green-800">
                            <CheckCircle2 className="w-3 h-3" /> Active
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleSuspend(company)}
                            disabled={suspending === company.id}
                            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-50 ${
                              company.suspended
                                ? "border-green-700 text-green-400 hover:bg-green-900/30"
                                : "border-red-800 text-red-400 hover:bg-red-900/30"
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
                            className="text-gray-500 hover:text-white transition-colors"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && filtered.length > 0 && (
            <div className="px-6 py-3 border-t border-gray-800 text-xs text-gray-600">
              {filtered.length} of {companies.length} companies
            </div>
          )}
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => router.push("/onboard")}
            className="flex items-center gap-3 bg-gray-900 border border-gray-800 hover:border-indigo-700 rounded-2xl p-5 text-left transition-colors group"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-900 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <p className="font-medium text-white text-sm group-hover:text-indigo-300 transition-colors">Onboard New Company</p>
              <p className="text-xs text-gray-500 mt-0.5">Register a new tenant on the platform</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-600 ml-auto group-hover:text-indigo-400 transition-colors" />
          </button>
          <div className="flex items-center gap-3 bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <div className="w-10 h-10 rounded-xl bg-green-900 flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="font-medium text-white text-sm">Active Tenants</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {stats ? `${stats.companies - stats.suspended} of ${stats.companies} companies active` : "—"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
