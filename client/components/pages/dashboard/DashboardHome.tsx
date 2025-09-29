"use client";
import { TrendingUp, Users, DollarSign, ShoppingCart } from "lucide-react";

const stats = [
  {
    title: "Today's Sales",
    value: "GHC 0.00",
    icon: TrendingUp,
    color: "blue",
    bgGradient: "from-blue-500 to-blue-600",
  },
  {
    title: "Total Customers",
    value: "0",
    icon: Users,
    color: "green",
    bgGradient: "from-green-500 to-green-600",
  },
  {
    title: "Outstanding Credit",
    value: "GHC 0.00",
    icon: DollarSign,
    color: "orange",
    bgGradient: "from-orange-500 to-orange-600",
  },
];

const quickActions = [
  {
    title: "New Sale",
    description: "Record a new transaction",
    icon: ShoppingCart,
    href: "/sales",
    color: "blue",
  },
  {
    title: "Add Customer",
    description: "Register new customer",
    icon: Users,
    href: "/customers/new",
    color: "green",
  },
];

export default function DashboardHome() {
  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">
          Dashboard
        </h1>
        <p className="text-gray-600">
          Overview of your business metrics
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.title}
              className="card group relative overflow-hidden"
            >
              {/* Background Gradient */}
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${stat.bgGradient} opacity-10 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-300`}></div>
              
              <div className="relative">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-2xl bg-gradient-to-br ${stat.bgGradient} group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Quick Actions</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <a
                key={action.title}
                href={action.href}
                className="card card-hover group cursor-pointer"
              >
                <div className="flex items-start space-x-4">
                  <div className={`p-3 rounded-2xl bg-${action.color}-100 group-hover:bg-${action.color}-200 transition-colors duration-300`}>
                    <Icon className={`w-6 h-6 text-${action.color}-600`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {action.title}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {action.description}
                    </p>
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}
