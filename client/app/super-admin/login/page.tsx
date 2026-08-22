"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Eye, EyeOff, Building2, Users, BarChart3, Lock } from "lucide-react";
import toast from "react-hot-toast";
import { superAdminLogin } from "@/services/superAdminService";

const features = [
  { icon: Building2, text: "Tenant Management", desc: "Onboard, suspend, and manage all companies" },
  { icon: Users, text: "Impersonation Access", desc: "Log in as any company for support" },
  { icon: BarChart3, text: "Platform Analytics", desc: "Real-time metrics across all tenants" },
  { icon: Lock, text: "Secure Access", desc: "Bcrypt-secured admin authentication" },
];

export default function SuperAdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.error("Email and password are required"); return; }
    setLoading(true);
    try {
      const { token, user } = await superAdminLogin(email, password);
      localStorage.setItem("sa_token", token);
      localStorage.setItem("sa_user", JSON.stringify(user));
      toast.success("Welcome, Super Admin");
      router.push("/super-admin");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || "Login failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-900 to-blue-950 relative overflow-hidden flex-col">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse delay-1000" />
        </div>
        <div className="relative z-10 p-12 flex flex-col h-full">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
              <ShieldCheck className="w-7 h-7 text-blue-600" />
            </div>
            <span className="text-2xl font-bold text-white">PETROS</span>
          </div>
          <div className="flex-1 flex items-center">
            <div>
              <h2 className="text-4xl font-bold text-white mb-3">Super Admin Portal</h2>
              <p className="text-blue-100 text-xl mb-10">
                Complete control over the entire PETROS platform
              </p>
              <div className="space-y-5">
                {features.map(({ icon: Icon, text, desc }) => (
                  <div key={text} className="flex items-start gap-4">
                    <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-white text-sm">{text}</p>
                      <p className="text-blue-200/80 text-xs mt-0.5">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <p className="text-blue-200/40 text-xs">EYO Solutions Ghana · Restricted access</p>
        </div>
      </div>

      {/* Right panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-950 rounded-xl flex items-center justify-center">
                <ShieldCheck className="w-7 h-7 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-950 bg-clip-text text-transparent">
                PETROS
              </span>
            </div>
          </div>

          <form onSubmit={handleLogin} className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-1">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
                  Super Admin
                </span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Sign In</h1>
              <p className="text-gray-600">Access the platform administration console</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Email Address</label>
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter admin email"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-900 placeholder:text-gray-400"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Password</label>
                <div className="relative">
                  <input
                    type={showPw ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter admin password"
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-900 placeholder:text-gray-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-950 text-white font-semibold rounded-lg hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Signing In...
                </>
              ) : (
                <>
                  Sign In
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </>
              )}
            </button>

            <div className="pt-4 border-t border-gray-100 text-center">
              <p className="text-sm text-gray-500">Restricted access — authorised personnel only</p>
            </div>
          </form>

          <div className="text-center mt-6">
            <p className="text-sm text-gray-500">© 2024 PETROS · EYO Solutions Ghana</p>
          </div>
        </div>
      </div>
    </div>
  );
}
