"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { Users, Package, Container, FileText, TrendingDown, ArrowUpRight } from "lucide-react";
import Link from "next/link";

const reportCards = [
  { icon: FileText,     title: "Sales Summary",      description: "Detailed breakdown of all sales activities",             gradient: "from-blue-500 to-blue-700",   href: "/reports/sales"              },
  { icon: Users,        title: "Customer Analytics", description: "Customer behavior and transaction history",              gradient: "from-green-500 to-green-700", href: "/reports/customers"          },
  { icon: Container,    title: "Container Reports",  description: "Container processing and inventory status",             gradient: "from-purple-500 to-purple-700", href: "/reports/containers"        },
  { icon: Package,      title: "Inventory Status",   description: "Current stock levels and movement tracking",            gradient: "from-orange-500 to-orange-700", href: "/reports/inventory"         },
  { icon: TrendingDown, title: "Item Transactions",  description: "Detailed transaction history to track negative stock",  gradient: "from-indigo-500 to-indigo-700", href: "/reports/item-transactions" },
];

export default function ReportsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div className="page-header">
          <h1 className="page-title">Reports</h1>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {reportCards.map(({ icon: Icon, title, description, gradient, href }) => (
            <Link key={href} href={href}>
              <div className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} p-5 shadow-md hover:shadow-lg transition-all duration-200 active:scale-95`}>
                <div className="relative z-10">
                  <div className="mb-3 inline-flex p-2.5 rounded-xl bg-white/20">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-base font-bold text-white mb-1">{title}</h3>
                  <p className="text-white/80 text-xs mb-3 leading-relaxed">{description}</p>
                  <div className="flex items-center text-white font-medium text-xs">
                    Generate Report
                    <ArrowUpRight className="w-3.5 h-3.5 ml-1.5 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
                <div className="absolute top-0 right-0 -mt-2 -mr-2 h-16 w-16 rounded-full bg-white/10" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
