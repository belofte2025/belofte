"use client";
import Link from "next/link";
import Image from "next/image";
import { 
  BarChart2, 
  Users, 
  ArrowRight, 
  CheckCircle, 
  TrendingUp, 
  Shield,
  Zap,
  Container,
  Package
} from "lucide-react";

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  features: string[];
}

function FeatureCard({ icon, title, description, features }: FeatureCardProps) {
  return (
    <div className="group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-blue-200">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      <div className="relative z-10">
        <div className="mb-6 inline-flex p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
          {icon}
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-700 transition-colors">{title}</h3>
        <p className="text-gray-600 mb-6">{description}</p>
        <ul className="space-y-2">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center text-sm text-gray-700">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
              {feature}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

interface StatProps {
  number: string;
  label: string;
  suffix?: string;
}

function StatCard({ number, label, suffix = "" }: StatProps) {
  return (
    <div className="text-center">
      <div className="text-4xl font-bold text-white mb-2">
        {number}<span className="text-2xl text-blue-200">{suffix}</span>
      </div>
      <div className="text-blue-100 font-medium">{label}</div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-900">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="absolute top-0 left-0 w-full h-full">
            <div className="absolute top-10 left-10 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl"></div>
            <div className="absolute bottom-10 right-10 w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl"></div>
          </div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="text-center">
            <div className="mb-8 flex justify-center">
              <div className="relative p-4 bg-white/10 backdrop-blur-sm rounded-2xl">
                <Image
                  src="/icon/eyo.png"
                  alt="EYO Solutions Logo"
                  width={80}
                  height={80}
                  className="drop-shadow-lg"
                />
              </div>
            </div>
            
            <h1 className="text-5xl lg:text-7xl font-bold text-white mb-6 leading-tight">
              Modern Business
              <span className="block bg-gradient-to-r from-blue-200 to-cyan-200 bg-clip-text text-transparent">
                Management
              </span>
            </h1>
            
            <p className="text-xl lg:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto leading-relaxed">
              Streamline your sales, inventory, and customer management with our comprehensive platform designed for modern businesses.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/login"
                className="group inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-700 font-semibold rounded-full hover:bg-gray-50 transition-all duration-200 transform hover:scale-105 shadow-xl"
              >
                Get Started
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-8 py-4 border-2 border-white/30 text-white font-semibold rounded-full hover:bg-white/10 transition-all duration-200 backdrop-blur-sm"
              >
                Create Account
              </Link>
            </div>
            
            {/* Stats */}
            <div className="mt-16 grid grid-cols-2 lg:grid-cols-4 gap-8 max-w-4xl mx-auto">
              <StatCard number="99.9" label="Uptime" suffix="%" />
              <StatCard number="500" label="Happy Customers" suffix="+" />
              <StatCard number="24/7" label="Support" />
              <StatCard number="5" label="Star Rating" suffix="⭐" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Powerful Features for
              <span className="block text-blue-600">Your Business</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to manage your business efficiently, all in one integrated platform.
            </p>
          </div>
          
          <div className="grid lg:grid-cols-3 gap-8 mb-16">
            <FeatureCard
              icon={<Container className="w-8 h-8 text-white" />}
              title="Smart Container Tracking"
              description="Advanced container management with real-time tracking and automated notifications."
              features={[
                "Real-time delivery tracking",
                "Automated status updates",
                "Inventory optimization",
                "Delivery scheduling"
              ]}
            />
            
            <FeatureCard
              icon={<BarChart2 className="w-8 h-8 text-white" />}
              title="Advanced Analytics"
              description="Comprehensive sales insights with powerful reporting and forecasting tools."
              features={[
                "Real-time dashboards",
                "Sales forecasting",
                "Performance metrics",
                "Custom reports"
              ]}
            />
            
            <FeatureCard
              icon={<Users className="w-8 h-8 text-white" />}
              title="Customer Excellence"
              description="Complete customer relationship management with automated workflows."
              features={[
                "Customer profiles",
                "Payment tracking",
                "Credit management",
                "Communication history"
              ]}
            />
          </div>
          
          {/* Additional Benefits */}
          <div className="bg-white rounded-3xl p-8 lg:p-12 shadow-lg border border-gray-100">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-3xl font-bold text-gray-900 mb-6">
                  Built for Modern Businesses
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Shield className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Enterprise Security</h4>
                      <p className="text-gray-600">Bank-level security with encrypted data storage</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Zap className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Lightning Fast</h4>
                      <p className="text-gray-600">Optimized for speed and performance</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <TrendingUp className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Scalable Growth</h4>
                      <p className="text-gray-600">Grows with your business needs</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="relative">
                <div className="aspect-square bg-gradient-to-br from-blue-100 to-indigo-100 rounded-3xl flex items-center justify-center">
                  <Package className="w-32 h-32 text-blue-600" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-blue-600 to-indigo-700">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Business?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of businesses already using our platform to streamline their operations.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-700 font-semibold rounded-full hover:bg-gray-50 transition-all duration-200 transform hover:scale-105 shadow-xl"
          >
            Start Free Trial
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-4 gap-8">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <Image
                  src="/icon/eyo.png"
                  alt="EYO Solutions"
                  width={40}
                  height={40}
                />
                <span className="text-xl font-bold text-white">EYO Solutions</span>
              </div>
              <p className="text-gray-400 max-w-md">
                Empowering businesses with modern management solutions for the digital age.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-4">Product</h3>
              <ul className="space-y-2">
                <li><Link href="/features" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="/security" className="hover:text-white transition-colors">Security</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-4">Support</h3>
              <ul className="space-y-2">
                <li><Link href="/help" className="hover:text-white transition-colors">Help Center</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
                <li><Link href="/status" className="hover:text-white transition-colors">System Status</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center">
            <p className="text-gray-400">
              © {new Date().getFullYear()} EYO Solutions. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
