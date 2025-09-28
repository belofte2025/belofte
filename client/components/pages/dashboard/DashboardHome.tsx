"use client";
import { TrendingUp, Users, DollarSign, Package, ShoppingCart, Clock } from "lucide-react";

const stats = [
  {
    title: "Today's Sales",
    value: "GHC 0.00",
    change: "+0%",
    trend: "up",
    icon: TrendingUp,
    color: "blue",
    bgGradient: "from-blue-500 to-blue-600",
  },
  {
    title: "Credit Balance",
    value: "GHC 0.00",
    change: "+0%",
    trend: "up",
    icon: DollarSign,
    color: "green",
    bgGradient: "from-green-500 to-green-600",
  },
  {
    title: "Active Customers",
    value: "0",
    change: "+0%",
    trend: "up",
    icon: Users,
    color: "purple",
    bgGradient: "from-purple-500 to-purple-600",
  },
  {
    title: "Inventory Items",
    value: "0",
    change: "+0%",
    trend: "up",
    icon: Package,
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
  {
    title: "View Reports",
    description: "Check sales analytics",
    icon: TrendingUp,
    href: "/summary",
    color: "purple",
  },
];

export default function DashboardHome() {
  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold text-gray-900">
          Welcome back! 👋
        </h1>
        <p className="text-lg text-gray-600">
          Here&apos;s what&apos;s happening with your business today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.title}
              className="card card-hover group relative overflow-hidden"
              style={{ animationDelay: `${index * 100}ms` }}
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
                
                <div className="flex items-center mt-4 text-sm">
                  <span className={`font-medium ${
                    stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stat.change}
                  </span>
                  <span className="text-gray-500 ml-2">from yesterday</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Quick Actions</h2>
          <div className="flex items-center text-sm text-gray-500">
            <Clock className="w-4 h-4 mr-1" />
            Last updated just now
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <div
                key={action.title}
                className="card card-hover group cursor-pointer"
                style={{ animationDelay: `${(index + 4) * 100}ms` }}
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
                    <div className="flex items-center mt-3 text-sm text-blue-600 font-medium opacity-0 group-hover:opacity-100 transform translate-x-0 group-hover:translate-x-2 transition-all duration-300">
                      Get started
                      <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Recent Activity</h2>
          <button className="btn btn-secondary text-sm">
            View All
          </button>
        </div>
        
        <div className="space-y-4">
          {[1, 2, 3].map((_, index) => (
            <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">{index + 1}</span>
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">
                  No recent activity yet
                </p>
                <p className="text-sm text-gray-500">
                  Start making sales to see activity here
                </p>
              </div>
              <div className="text-xs text-gray-400">
                Just now
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
