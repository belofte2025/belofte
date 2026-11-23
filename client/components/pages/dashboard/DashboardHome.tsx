"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import {
  ShoppingCart, UserPlus, TrendingUp, Users, CreditCard,
  Container, Ship, ArrowRight, Clock, AlertTriangle, Award, CalendarDays,
} from "lucide-react";
import { formatCurrency } from "@/utils/format";
import { format } from "date-fns";

type DashboardStats = {
  period: {
    key: string;
    label: string;
    startDate: string;
    endDate: string;
    trendUnit: "day" | "month";
    salesTotal: number;
    salesCount: number;
    paidTotal: number;
    creditTotal: number;
  };
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
  lowStockItems: { itemName: string; supplierName?: string; available: number }[];
  topItems: { itemName: string; quantitySold: number }[];
};

const quickActions = [
  { title: "New sale", description: "Record a transaction", href: "/sales", icon: ShoppingCart },
  { title: "Add customer", description: "Register a customer", href: "/customers/new", icon: UserPlus },
];

const paymentMethodMeta: Record<string, { label: string; color: string; bar: string; tile: string }> = {
  CASH:   { label: "Cash",         color: "text-green-700",  bar: "bg-green-500",  tile: "bg-green-50"  },
  MOMO:   { label: "Mobile Money", color: "text-amber-700",  bar: "bg-amber-500",  tile: "bg-amber-50"  },
  BANK:   { label: "Bank",         color: "text-blue-700",   bar: "bg-blue-500",   tile: "bg-blue-50"   },
  CREDIT: { label: "Credit",       color: "text-orange-700", bar: "bg-orange-500", tile: "bg-orange-50" },
};

// The paid methods always precede credit, and every one is shown even at zero so
// the summary keeps the same shape from one period to the next.
const PAID_METHODS = ["CASH", "MOMO", "BANK"] as const;
const SUMMARY_METHODS = [...PAID_METHODS, "CREDIT"] as const;

const PERIOD_OPTIONS = [
  { key: "today",  label: "Today"        },
  { key: "month",  label: "This Month"   },
  { key: "last30", label: "Last 30 Days" },
  { key: "custom", label: "Custom"       },
];

const toInputDate = (d: Date) => d.toISOString().slice(0, 10);

export default function DashboardHome() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [period, setPeriod] = useState("month");
  const [customStart, setCustomStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 29);
    return toInputDate(d);
  });
  const [customEnd, setCustomEnd] = useState(() => toInputDate(new Date()));

  useEffect(() => {
    // A custom range only becomes a valid request once both ends are filled in.
    if (period === "custom" && (!customStart || !customEnd)) return;

    const params =
      period === "custom"
        ? { period, startDate: customStart, endDate: customEnd }
        : { period };

    const controller = new AbortController();
    setLoading(true);
    setLoadError(false);
    api.get<DashboardStats>("/dashboard/stats", { params, signal: controller.signal })
      .then(({ data }) => {
        if (!controller.signal.aborted) setStats(data);
      })
      .catch(() => {
        if (!controller.signal.aborted) setLoadError(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [period, customStart, customEnd, attempt]);

  const fmt = (n: number) => (loading || loadError ? "—" : formatCurrency(n));

  const paymentEntries = stats ? Object.entries(stats.paymentMethods) : [];
  const paymentTotal = paymentEntries.reduce((sum, [, v]) => sum + v.total, 0);

  const trendMax = stats ? Math.max(...stats.salesTrend.map((d) => d.total), 1) : 1;
  const trendLabel = stats?.period.trendUnit === "month" ? "MMM" : "d";
  const summaryReady = !loading && !loadError && stats;
  const activePeriod = PERIOD_OPTIONS.find(({ key }) => key === period)?.label;

  return (
    <div className="space-y-5 lg:space-y-6">
      <div className="page-header gap-4">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Track sales, customer balances, and warehouse activity.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Scrolls rather than overflowing the viewport on a narrow screen. */}
          <div aria-label="Dashboard period" role="group" className="inline-flex max-w-full flex-wrap items-center gap-0.5 rounded-xl border border-[#dce7e3] bg-white p-1">
            {PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                type="button"
                aria-pressed={period === opt.key}
                onClick={() => setPeriod(opt.key)}
                className={`min-h-9 rounded-lg px-2.5 text-xs font-semibold whitespace-nowrap transition-colors sm:px-3 ${
                  period === opt.key
                    ? "bg-blue-100 text-blue-800"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {period === "custom" && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customStart}
                max={customEnd || undefined}
                onChange={(e) => setCustomStart(e.target.value)}
                className="input text-xs py-1.5"
                aria-label="Start date"
              />
              <span className="text-xs text-gray-400">to</span>
              <input
                type="date"
                value={customEnd}
                min={customStart || undefined}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="input text-xs py-1.5"
                aria-label="End date"
              />
            </div>
          )}
        </div>
      </div>

      {/* Key stats */}
      <div className="stats-grid dashboard-metrics">
        <div className="dashboard-kpi stat-card">
          <div className="bg-blue-50 rounded-xl p-2.5 flex-shrink-0">
            <TrendingUp className="w-5 h-5 text-blue-600" />
          </div>
          <div className="min-w-0">
            <p className="stat-label">Total Sales</p>
            <p className="stat-value text-[#102f2f]">{fmt(stats?.period.salesTotal ?? 0)}</p>
            {summaryReady && (
              <p className="text-xs text-gray-400 mt-0.5">{stats.period.salesCount} transaction{stats.period.salesCount !== 1 ? "s" : ""}</p>
            )}
          </div>
        </div>

        <div className="dashboard-kpi stat-card">
          <div className="bg-purple-50 rounded-xl p-2.5 flex-shrink-0">
            <TrendingUp className="w-5 h-5 text-purple-600" />
          </div>
          <div className="min-w-0">
            <p className="stat-label">Paid At Sale</p>
            <p className="stat-value text-[#102f2f]">{fmt(stats?.period.paidTotal ?? 0)}</p>
            {summaryReady && (
              <p className="text-xs text-gray-400 mt-0.5">
                taken at the till · {formatCurrency(stats.period.creditTotal)} given on credit
              </p>
            )}
          </div>
        </div>

        <div className="dashboard-kpi stat-card">
          <div className="bg-green-50 rounded-xl p-2.5 flex-shrink-0">
            <Users className="w-5 h-5 text-green-600" />
          </div>
          <div className="min-w-0">
            <p className="stat-label">Total Customers</p>
            <p className="stat-value text-[#102f2f]">
              {loading || loadError ? "—" : (stats?.customers.total ?? 0).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="dashboard-kpi stat-card">
          <div className="bg-orange-50 rounded-xl p-2.5 flex-shrink-0">
            <CreditCard className="w-5 h-5 text-orange-600" />
          </div>
          <div className="min-w-0">
            <p className="stat-label">Outstanding Credit</p>
            <p className="stat-value text-[#102f2f]">{fmt(stats?.customers.outstandingCredit ?? 0)}</p>
            {summaryReady && stats.customers.withCredit > 0 && (
              <p className="text-xs text-gray-400 mt-0.5">{stats.customers.withCredit} customer{stats.customers.withCredit !== 1 ? "s" : ""}</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(250px,1fr)]">
        <section className="dashboard-trend" aria-labelledby="sales-trend-heading" aria-busy={loading}>
          <div className="relative flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 id="sales-trend-heading" className="text-sm font-semibold text-[#b5d1ca]">Sales trend</h2>
              <p className="mt-1 text-[clamp(1.65rem,4vw,2.7rem)] leading-tight font-semibold tracking-[-0.05em] text-white tabular-nums">
                {fmt(stats?.period.salesTotal ?? 0)}
              </p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold text-[#d6ebe5]">
              <CalendarDays className="size-4" /> {summaryReady ? summaryReady.period.label : activePeriod}
            </span>
          </div>
          {loadError ? (
            <div className="dashboard-chart-status">
              <p role="alert">Couldn’t load dashboard data.</p>
              <button type="button" className="mt-2 rounded-lg bg-white/10 px-3 py-2 font-semibold hover:bg-white/20" onClick={() => setAttempt((count) => count + 1)}>Try again</button>
            </div>
          ) : loading ? (
            <p role="status" className="dashboard-chart-status">Loading sales…</p>
          ) : stats && stats.salesTrend.some((day) => day.total > 0) ? (
            <div className="dashboard-chart">
              {stats.salesTrend.map((day, index) => {
                const date = new Date(day.date + "T00:00:00");
                const interval = Math.max(1, Math.ceil(stats.salesTrend.length / 8));
                return (
                  <div key={day.date} className="dashboard-chart-column" title={`${format(date, "MMM d, yyyy")} · ${formatCurrency(day.total)} · ${day.count} sales`}>
                    <div className="dashboard-chart-bar" style={{ height: `${Math.max(1, (day.total / trendMax) * 100)}%` }} />
                    {index % interval === 0 && <span>{format(date, trendLabel)}</span>}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="dashboard-chart-status">No sales in this period.</p>
          )}
        </section>

        <section className="card flex flex-col gap-5">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Quick actions</h2>
            <div className="mt-3 grid gap-2">
              {quickActions.map(({ title, description, href, icon: Icon }) => (
                <Link key={title} href={href} className="group flex items-center gap-3 rounded-xl border border-gray-200 p-2.5 hover:border-blue-200 hover:bg-blue-50">
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-700"><Icon className="size-4" /></span>
                  <span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-gray-900">{title}</span><span className="block text-xs text-gray-600">{description}</span></span>
                  <ArrowRight className="size-4 shrink-0 text-gray-500 group-hover:text-blue-700" />
                </Link>
              ))}
            </div>
          </div>
          {summaryReady && (
            <div className="border-t border-gray-100 pt-4">
              <h2 className="text-sm font-semibold text-gray-900">Payment methods</h2>
              {paymentEntries.length === 0 ? (
                <p className="mt-2 text-xs text-gray-600">No payments in this period.</p>
              ) : (
                <div className="mt-3 space-y-2.5">
                  {paymentEntries.sort(([, a], [, b]) => b.total - a.total).map(([method, { total, count }]) => {
                    const meta = paymentMethodMeta[method] ?? { label: method, color: "text-gray-700", bar: "bg-gray-400" };
                    const pct = paymentTotal > 0 ? (total / paymentTotal) * 100 : 0;
                    return (
                      <div key={method}>
                        <div className="mb-1 flex flex-wrap items-center justify-between gap-x-2 text-xs">
                          <span className={`font-semibold ${meta.color}`}>{meta.label}</span>
                          <span className="text-gray-600 tabular-nums">{formatCurrency(total)} · {count}</span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
                          <div className={`h-full rounded-full ${meta.bar}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      {/* How the period's sales were settled: each paid method, then credit */}
      {summaryReady && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Sales Breakdown
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {SUMMARY_METHODS.map((method) => {
              const meta = paymentMethodMeta[method];
              const entry = stats.paymentMethods[method] ?? { total: 0, count: 0 };
              const pct = stats.period.salesTotal > 0
                ? (entry.total / stats.period.salesTotal) * 100
                : 0;
              return (
                <div key={method} className="stat-card">
                  <div className="flex items-center justify-between gap-2">
                    <p className="stat-label">{meta.label}</p>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${meta.tile} ${meta.color}`}>
                      {pct.toFixed(0)}%
                    </span>
                  </div>
                  <p className={`amount mt-1 ${meta.color}`}>
                    {formatCurrency(entry.total)}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {method === "CREDIT"
                      ? `${entry.count} credit sale${entry.count !== 1 ? "s" : ""}`
                      : `${entry.count} transaction${entry.count !== 1 ? "s" : ""}`}
                  </p>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mt-2">
                    <div className={`h-full ${meta.bar} rounded-full`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-gray-400 mt-2">
            How this period&rsquo;s sales were taken, not what has been collected since.
            A deposit counts under the method that took it and only the remainder
            counts as credit, so the four add up to total sales. What customers
            still owe today is the Outstanding Credit figure above.
          </p>
        </div>
      )}

      {/* Container status row — only shown when relevant */}
      {summaryReady && (stats.containers.inTransit > 0 || stats.containers.inStock > 0) && (
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

      {/* Low stock + Top items */}
      {summaryReady && (stats.lowStockItems.length > 0 || stats.topItems.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {stats.lowStockItems.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <h2 className="text-sm font-semibold text-gray-700">Low Stock</h2>
              </div>
              <div className="divide-y divide-gray-50">
                {stats.lowStockItems.map((item) => (
                  <div key={item.itemName} className="flex items-center justify-between px-4 py-2.5">
                    {/* min-w-0 is required for truncate: a flex item defaults to
                        min-width:auto and so refuses to shrink below its text. */}
                    <span className="min-w-0 truncate">
                      <span className="text-sm text-gray-700">{item.itemName}</span>
                      {item.supplierName && (
                        /* Stock is tracked per supplier, so the name alone is
                           ambiguous when several suppliers carry the item. */
                        <span className="text-xs text-gray-400 ml-1.5">{item.supplierName}</span>
                      )}
                    </span>
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
                <h2 className="text-sm font-semibold text-gray-700">Top Selling</h2>
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
      {summaryReady && stats.recentSales.length > 0 && (
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
