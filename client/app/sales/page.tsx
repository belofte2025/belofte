"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { Container, Receipt, ArrowRight } from "lucide-react";
import Link from "next/link";

const salesMethods = [
  {
    icon: Container,
    title: "Container Sales",
    description: "Sell items directly from specific containers with detailed tracking",
    href: "/sales/container",
    gradient: "from-blue-500 to-blue-700",
  },
  {
    icon: Receipt,
    title: "Regular Sales",
    description: "Traditional sales by supplier with flexible inventory management",
    href: "/sales/regular",
    gradient: "from-purple-500 to-purple-700",
  },
];

export default function SalesDashboardPage() {
  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div className="page-header">
          <h1 className="page-title">Sales</h1>
        </div>

        <p className="text-sm text-gray-500">Choose your preferred sales method</p>

        <div className="grid gap-4 sm:grid-cols-2">
          {salesMethods.map(({ icon: Icon, title, description, href, gradient }) => (
            <Link key={href} href={href}>
              <div className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} p-6 shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95`}>
                <div className="relative z-10">
                  <div className="mb-4 inline-flex p-3 rounded-xl bg-white/20">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1">{title}</h3>
                  <p className="text-white/80 text-sm mb-4 leading-relaxed">{description}</p>
                  <div className="flex items-center text-white font-medium text-sm">
                    Get Started
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
                <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white/10" />
                <div className="absolute bottom-0 left-0 -mb-8 -ml-8 h-32 w-32 rounded-full bg-white/5" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
