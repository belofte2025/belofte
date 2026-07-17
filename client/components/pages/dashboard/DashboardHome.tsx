"use client";

import Link from "next/link";
import { ShoppingCart, UserPlus, TrendingUp, Users, CreditCard } from "lucide-react";

const stats = [
  { title: "Today's Sales",      value: "GHC 0.00", icon: TrendingUp,  color: "text-blue-600",   bg: "bg-blue-50"   },
  { title: "Total Customers",    value: "0",         icon: Users,       color: "text-green-600",  bg: "bg-green-50"  },
  { title: "Outstanding Credit", value: "GHC 0.00",  icon: CreditCard,  color: "text-orange-600", bg: "bg-orange-50" },
];

const quickActions = [
  { title: "New Sale",      description: "Record a transaction", href: "/sales",        icon: ShoppingCart, color: "btn-primary"   },
  { title: "Add Customer",  description: "Register a customer",  href: "/customers/new", icon: UserPlus,     color: "btn-secondary" },
];

export default function DashboardHome() {
  return (
    <div className="space-y-4">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Business overview</p>
        </div>
      </div>

      <div className="stats-grid">
        {stats.map(({ title, value, icon: Icon, color, bg }) => (
          <div key={title} className="stat-card flex items-center gap-3">
            <div className={`${bg} rounded-xl p-2.5 flex-shrink-0`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <div className="min-w-0">
              <p className="stat-label">{title}</p>
              <p className={`text-xl font-bold ${color} mt-0.5`}>{value}</p>
            </div>
          </div>
        ))}
      </div>

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
    </div>
  );
}
