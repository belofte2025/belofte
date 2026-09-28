"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import {
  ShoppingCart, UserPlus, TrendingUp, Users, CreditCard,
  Container, Ship, ArrowRight, Clock, AlertTriangle, Award,
} from "lucide-react";
import { formatCurrency } from "@/utils/format";
import { format } from "date-fns";

type DashboardStats = {
  today: { salesTotal: number; salesCount: number };
  thisMonth: { salesTotal: number; salesCount: number };
  customers: { total: number; withCredit: number; outstandingCredit: number };
  containers: { inTransit: number; inStock: number };
  recentSales: {
    id: string;
    customerName: string;
    totalAmount: number;
    saleType: string;
    paymentMethod: string | null;
    createdAt: string;
  }[];
  paymentMethods: Record<string, { total: number; count: number }>;
  salesTrend: { date: string; total: number; count: number }[];
  lowStockItems: { itemName: string; available: number }[];
  topItems: { itemName: string; quantitySold: number }[];
};

const quickActions = [
  { title: "New Sale",     description: "Record a transaction", href: "/sales",         icon: ShoppingCart, color: "btn-primary"   },
  { title: "Add Customer", description: "Register a customer",  href: "/customers/new", icon: UserPlus,     color: "btn-secondary" },
];

const paymentMethodMeta: Record<string, { label: string; color: string; bar: string }> = {
  CASH:   { label: "Cash",         color: "text-green-700",  bar: "bg-green-500" },
  MOMO:   { label: "Mobile Money", color: "text-amber-700",  bar: "bg-amber-500" },
  BANK:   { label: "Bank",         color: "text-blue-700",   bar: "bg-blue-500" },
  CREDIT: { label: "Credit",       color: "text-orange-700", bar: "bg-orange-500" },
};

export default function DashboardHome() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/dashboard/stats")
      .then((r) => setStats(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const fmt = (n: number) => (loading ? "—" : formatCurrency(n));

  const paymentEntries = stats ? Object.entries(stats.paymentMethods) : [];
  const paymentTotal = paymentEntries.reduce((sum, [, v]) => sum + v.total, 0);

  const trendMax = stats ? Math.max(...stats.salesTrend.map((d) => d.total), 1) : 1;

  return (
    <div className="space-y-4">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Business overview</p>
        </div>
      </div>

      {/* Key stats */}
      <div className="stats-grid">
        <div className="stat-card flex items-center gap-3">
          <div className="bg-blue-50 rounded-xl p-2.5 flex-shrink-0">
            <TrendingUp className="w-5 h-5 text-blue-600" />
          </div>
          <div className="min-w-0">
            <p className="stat-label">Today&apos;s Sales</p>
            <p className="text-xl font-bold text-blue-600 mt-0.5">{fmt(stats?.today.salesTotal ?? 0)}</p>
            {!loading && stats && (
              <p className="text-xs text-gray-400 mt-0.5">{stats.today.salesCount} transaction{stats.today.salesCount !== 1 ? "s" : ""}</p>
            )}
          </div>
        </div>

        <div className="stat-card flex items-center gap-3">
          <div className="bg-purple-50 rounded-xl p-2.5 flex-shrink-0">
            <TrendingUp className="w-5 h-5 text-purple-600" />
          </div>
          <div className="min-w-0">
            <p className="stat-label">This Month</p>
            <p className="text-xl font-bold text-purple-600 mt-0.5">{fmt(stats?.thisMonth.salesTotal ?? 0)}</p>
            {!loading && stats && (
              <p className="text-xs text-gray-400 mt-0.5">{stats.thisMonth.salesCount} sales</p>
            )}
          </div>
        </div>

        <div className="stat-card flex items-center gap-3">
          <div className="bg-green-50 rounded-xl p-2.5 flex-shrink-0">
            <Users className="w-5 h-5 text-green-600" />
          </div>
          <div className="min-w-0">
            <p className="stat-label">Total Customers</p>
            <p className="text-xl font-bold text-green-600 mt-0.5">
              {loading ? "—" : (stats?.customers.total ?? 0)}
            </p>
          </div>
        </div>

        <div className="stat-card flex items-center gap-3">
          <div className="bg-orange-50 rounded-xl p-2.5 flex-shrink-0">
            <CreditCard className="w-5 h-5 text-orange-600" />
          </div>
          <div className="min-w-0">
            <p className="stat-label">Outstanding Credit</p>
            <p className="text-xl font-bold text-orange-600 mt-0.5">{fmt(stats?.customers.outstandingCredit ?? 0)}</p>
            {!loading && stats && stats.customers.withCredit > 0 && (
              <p className="text-xs text-gray-400 mt-0.5">{stats.customers.withCredit} customer{stats.customers.withCredit !== 1 ? "s" : ""}</p>
            )}
          </div>
        </div>
      </div>

      {/* Container status row — only shown when relevant */}
      {!loading && stats && (stats.containers.inTransit > 0 || stats.containers.inStock > 0) && (
        <div className="grid grid-cols-2 gap-3">
          {stats.containers.inTransit > 0 && (
            <Link href="/containers" className="stat-card flex items-center gap-3 hover:border-blue-200 transition-colors">
              <div className="bg-blue-50 rounded-xl p-2.5 flex-shrink-0">
                <Ship className="w-5 h-5 text-blue-600" />
              </div>
              <div className="min-w-0">
                <p className="stat-label">In Transit</p>
                <p className="text-xl font-bold text-blue-600 mt-0.5">{stats.containers.inTransit}</p>
                <p className="text-xs text-gray-400">container{stats.containers.inTransit !== 1 ? "s" : ""}</p>
              </div>
            </Link>
          )}
          <Link href="/containers" className="stat-card flex items-center gap-3 hover:border-green-200 transition-colors">
            <div className="bg-green-50 rounded-xl p-2.5 flex-shrink-0">
              <Container className="w-5 h-5 text-green-600" />
            </div>
            <div className="min-w-0">
              <p className="stat-label">In Stock</p>
              <p className="text-xl font-bold text-green-600 mt-0.5">{stats.containers.inStock}</p>
              <p className="text-xs text-gray-400">container{stats.containers.inStock !== 1 ? "s" : ""}</p>
            </div>
          </Link>
        </div>
      )}

      {/* Quick actions */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map(({ title, description, href, icon: Icon, color }) => (
            <Link key={title} href={href} className={`btn ${color} flex-col h-auto py-4 gap-2 rounded-xl`}>
              <Icon className="w-5 h-5" />
              <span className="text-sm font-semibold">{title}</span>
              <span className="text-xs opacity-75 hidden sm:block">{description}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Sales trend + Payment methods */}
      {!loading && stats && (
        <div className="grid lg:grid-cols-3 gap-3">
          {/* Sales trend chart */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-4">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Sales Trend (14 days)</h2>
            {stats.salesTrend.every((d) => d.total === 0) ? (
              <p className="text-sm text-gray-400 py-8 text-center">No sales in this period yet</p>
            ) : (
              <div className="flex items-end gap-1.5 h-36">
                {stats.salesTrend.map((d) => (
                  <div key={d.date} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                    <div
                      className="w-full rounded-t bg-blue-500 group-hover:bg-blue-600 transition-colors min-h-[2px]"
                      style={{ height: `${Math.max(2, (d.total / trendMax) * 100)}%` }}
                      title={`${format(new Date(d.date + "T00:00:00"), "MMM d")}: ${formatCurrency(d.total)} (${d.count} sale${d.count !== 1 ? "s" : ""})`}
                    />
                    <span className="text-[9px] text-gray-400 mt-1 hidden sm:block">
                      {format(new Date(d.date + "T00:00:00"), "d")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Payment methods breakdown */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Payment Methods</h2>
            {paymentEntries.length === 0 ? (
              <p className="text-sm text-gray-400 py-4 text-center">No sales this month yet</p>
            ) : (
              <div className="space-y-3">
                {paymentEntries
                  .sort(([, a], [, b]) => b.total - a.total)
                  .map(([method, { total, count }]) => {
                    const meta = paymentMethodMeta[method] ?? { label: method, color: "text-gray-700", bar: "bg-gray-400" };
                    const pct = paymentTotal > 0 ? (total / paymentTotal) * 100 : 0;
                    return (
                      <div key={method}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className={`font-medium ${meta.color}`}>{meta.label}</span>
                          <span className="text-gray-500">{formatCurrency(total)} · {count}</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full ${meta.bar} rounded-full`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Low stock + Top items */}
      {!loading && stats && (stats.lowStockItems.length > 0 || stats.topItems.length > 0) && (
        <div className="grid lg:grid-cols-2 gap-3">
          {stats.lowStockItems.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <h2 className="text-sm font-semibold text-gray-700">Low Stock</h2>
              </div>
              <div className="divide-y divide-gray-50">
                {stats.lowStockItems.map((item) => (
                  <div key={item.itemName} className="flex items-center justify-between px-4 py-2.5">
                    <span className="text-sm text-gray-700 truncate">{item.itemName}</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ml-2 ${
                      item.available <= 0 ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                    }`}>
                      {item.available} left
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {stats.topItems.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
                <Award className="w-4 h-4 text-indigo-500" />
                <h2 className="text-sm font-semibold text-gray-700">Top Selling This Month</h2>
              </div>
              <div className="divide-y divide-gray-50">
                {stats.topItems.map((item, i) => (
                  <div key={item.itemName} className="flex items-center justify-between px-4 py-2.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-semibold text-gray-400 w-4 flex-shrink-0">{i + 1}</span>
                      <span className="text-sm text-gray-700 truncate">{item.itemName}</span>
                    </div>
                    <span className="text-xs font-semibold text-indigo-600 flex-shrink-0 ml-2">
                      {item.quantitySold} sold
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Recent sales */}
      {!loading && stats && stats.recentSales.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Recent Sales</h2>
            <Link href="/reports/sales/saleslist" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
            {stats.recentSales.map((sale) => (
              <div key={sale.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{sale.customerName}</p>
                    <p className="text-xs text-gray-400">{format(new Date(sale.createdAt), "MMM d, h:mm a")}</p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-3">
                  <p className="text-sm font-semibold text-gray-900">{formatCurrency(sale.totalAmount)}</p>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                    sale.saleType === "credit"
                      ? "bg-orange-100 text-orange-700"
                      : "bg-green-100 text-green-700"
                  }`}>
                    {sale.saleType === "credit" ? "credit" : (sale.paymentMethod || "cash").toLowerCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
