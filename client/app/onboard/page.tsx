"use client";
import { useState } from "react";
import { onboardCompany } from "@/services/onboardService";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import toast from "react-hot-toast";

export default function OnboardPage() {
  const { setUser } = useAuth();
  const router = useRouter();

  const [formData, setFormData] = useState({
    companyName: "",
    adminName: "",
    adminEmail: "",
    adminPassword: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.companyName.trim())
      newErrors.companyName = "Company name is required";
    if (!formData.adminName.trim())
      newErrors.adminName = "Admin name is required";
    if (!formData.adminEmail.trim())
      newErrors.adminEmail = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.adminEmail))
      newErrors.adminEmail = "Email is invalid";
    if (!formData.adminPassword)
      newErrors.adminPassword = "Password is required";
    else if (formData.adminPassword.length < 6)
      newErrors.adminPassword = "Password must be at least 6 characters";
    if (!formData.confirmPassword)
      newErrors.confirmPassword = "Please confirm your password";
    else if (formData.adminPassword !== formData.confirmPassword)
      newErrors.confirmPassword = "Passwords do not match";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleOnboard = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await onboardCompany({
        companyName: formData.companyName,
        adminName: formData.adminName,
        adminEmail: formData.adminEmail,
        adminPassword: formData.adminPassword,
      });

      // Store token and user in localStorage
      localStorage.setItem("token", response.token);
      localStorage.setItem("user", JSON.stringify(response.user));

      // Update auth context
      setUser(response.user);

      toast.success(
        `Welcome! ${response.company.companyName} has been successfully onboarded!`
      );
      router.push("/dashboard");
    } catch (error) {
      console.error("Onboarding error:", error);

      let errorMessage = "Onboarding failed. Please try again.";

      if (error && typeof error === "object" && "response" in error) {
        const response = (
          error as { response?: { data?: { error?: string; detail?: string } } }
        ).response;
        errorMessage =
          response?.data?.detail || response?.data?.error || errorMessage;
      }

      setErrors({ general: errorMessage });
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const features = [
    "Complete inventory management system",
    "Multi-tenant architecture",
    "Role-based access control",
    "Real-time reporting & analytics",
    "Container & sales tracking",
    "Customer & supplier management",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex">
      {/* Left Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
        <div className="w-full max-w-md animate-fade-in">
          {/* Main Card */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-8 space-y-8">
            {/* Brand Section */}
            <div className="text-center space-y-3">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl shadow-lg mb-4">
                <Building2 className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-blue-600">
                Start Your Journey
              </h1>
              <p className="text-gray-600 font-medium">
                Create your company and admin account
              </p>
              <div className="w-12 h-1 bg-blue-600 rounded-full mx-auto"></div>
            </div>

            {/* Form Section */}
            <div className="space-y-6">
              {errors.general && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {errors.general}
                </div>
              )}

              <div className="space-y-4">
                {/* Company Name Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Company Name
                  </label>
                  <input
                    type="text"
                    placeholder="Enter your company name"
                    className={`w-full px-4 py-3 border rounded-xl bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder:text-gray-400 ${
                      errors.companyName
                        ? "border-red-300 focus:ring-red-500"
                        : "border-gray-200"
                    }`}
                    value={formData.companyName}
                    onChange={(e) => {
                      setFormData({ ...formData, companyName: e.target.value });
                      if (errors.companyName)
                        setErrors((prev) => ({ ...prev, companyName: "" }));
                    }}
                  />
                  {errors.companyName && (
                    <p className="text-red-500 text-xs">{errors.companyName}</p>
                  )}
                </div>

                {/* Admin Name Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Admin Full Name
                  </label>
                  <input
                    type="text"
                    placeholder="Enter admin full name"
                    className={`w-full px-4 py-3 border rounded-xl bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder:text-gray-400 ${
                      errors.adminName
                        ? "border-red-300 focus:ring-red-500"
                        : "border-gray-200"
                    }`}
                    value={formData.adminName}
                    onChange={(e) => {
                      setFormData({ ...formData, adminName: e.target.value });
                      if (errors.adminName)
                        setErrors((prev) => ({ ...prev, adminName: "" }));
                    }}
                  />
                  {errors.adminName && (
                    <p className="text-red-500 text-xs">{errors.adminName}</p>
                  )}
                </div>

                {/* Admin Email Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Admin Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="admin@company.com"
                    className={`w-full px-4 py-3 border rounded-xl bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder:text-gray-400 ${
                      errors.adminEmail
                        ? "border-red-300 focus:ring-red-500"
                        : "border-gray-200"
                    }`}
                    value={formData.adminEmail}
                    onChange={(e) => {
                      setFormData({ ...formData, adminEmail: e.target.value });
                      if (errors.adminEmail)
                        setErrors((prev) => ({ ...prev, adminEmail: "" }));
                    }}
                  />
                  {errors.adminEmail && (
                    <p className="text-red-500 text-xs">{errors.adminEmail}</p>
                  )}
                </div>

                {/* Password Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a secure password"
                      className={`w-full px-4 py-3 pr-12 border rounded-xl bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder:text-gray-400 ${
                        errors.adminPassword
                          ? "border-red-300 focus:ring-red-500"
                          : "border-gray-200"
                      }`}
                      value={formData.adminPassword}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          adminPassword: e.target.value,
                        });
                        if (errors.adminPassword)
                          setErrors((prev) => ({ ...prev, adminPassword: "" }));
                      }}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  {errors.adminPassword && (
                    <p className="text-red-500 text-xs">
                      {errors.adminPassword}
                    </p>
                  )}
                </div>

                {/* Confirm Password Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                      className={`w-full px-4 py-3 pr-12 border rounded-xl bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder:text-gray-400 ${
                        errors.confirmPassword
                          ? "border-red-300 focus:ring-red-500"
                          : "border-gray-200"
                      }`}
                      value={formData.confirmPassword}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          confirmPassword: e.target.value,
                        });
                        if (errors.confirmPassword)
                          setErrors((prev) => ({
                            ...prev,
                            confirmPassword: "",
                          }));
                      }}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-red-500 text-xs">
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>
              </div>

              {/* Onboard Button */}
              <button
                onClick={handleOnboard}
                disabled={loading}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none group"
              >
                <span className="flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Creating Your Company...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Launch Your Company
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </span>
              </button>
            </div>

            {/* Login Link */}
            <div className="pt-6 border-t border-gray-100 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="text-blue-600 font-semibold hover:text-blue-700 transition-colors"
                >
                  Sign In
                </Link>
              </p>
            </div>
          </div>

          {/* Bottom Note */}
          <div className="text-center mt-6">
            <p className="text-sm text-gray-500">
              © {new Date().getFullYear()} EYO Solutions. All rights reserved.
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Features */}
      <div className="hidden lg:flex lg:w-1/2 bg-blue-600 p-12 items-center justify-center relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-20 right-20 w-72 h-72 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>

        <div className="relative z-10 space-y-8 max-w-lg">
          <div className="space-y-4">
            <Sparkles className="w-16 h-16 text-white/90" />
            <h2 className="text-4xl font-bold text-white">
              Everything You Need to Manage Your Business
            </h2>
            <p className="text-blue-100 text-lg">
              Get started with our comprehensive inventory management platform in
              minutes.
            </p>
          </div>

          <div className="space-y-4">
            {features.map((feature, index) => (
              <div
                key={index}
                className="flex items-start gap-3 bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20"
              >
                <CheckCircle2 className="w-6 h-6 text-green-300 flex-shrink-0 mt-0.5" />
                <span className="text-white font-medium">{feature}</span>
              </div>
            ))}
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <p className="text-white/90 text-sm leading-relaxed">
              <span className="font-semibold">Quick Setup:</span> Your company
              will be ready in under 2 minutes. We&apos;ll create your admin account
              with full permissions so you can start adding users and managing
              inventory right away.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
