"use client";
import { useState, useEffect } from "react";
import { register } from "@/services/authService";
import { getCompanies, Company } from "@/services/companyService";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  User,
  Mail,
  Lock,
  Building,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import toast from "react-hot-toast";

export default function RegisterForm() {
  const { setUser } = useAuth();
  const router = useRouter();

  const [formData, setFormData] = useState({
    userName: "",
    email: "",
    password: "",
    confirmPassword: "",
    companyId: "",
  });
  const [companies, setCompanies] = useState<Company[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      const data = await getCompanies();
      setCompanies(data);
    } catch (error) {
      toast.error("Failed to load companies");
      console.error(error);
    } finally {
      setLoadingCompanies(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.userName.trim()) newErrors.userName = "Name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = "Email is invalid";
    if (!formData.password) newErrors.password = "Password is required";
    else if (formData.password.length < 6)
      newErrors.password = "Password must be at least 6 characters";
    if (!formData.confirmPassword)
      newErrors.confirmPassword = "Please confirm your password";
    else if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = "Passwords do not match";
    if (!formData.companyId) newErrors.companyId = "Please select a company";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await register({
        userName: formData.userName,
        email: formData.email,
        password: formData.password,
        companyId: formData.companyId,
      });

      // Store token and user in localStorage
      localStorage.setItem("token", response.token);
      localStorage.setItem("user", JSON.stringify(response.user));

      // Update auth context
      setUser(response.user);

      toast.success(`Welcome, ${response.user.userName}!`);
      router.push("/dashboard");
    } catch (error) {
      console.error("Registration error:", error);

      let errorMessage = "Registration failed. Please try again.";

      if (error && typeof error === "object" && "response" in error) {
        const response = (
          error as { response?: { data?: { error?: string; detail?: string } } }
        ).response;
        errorMessage =
          response?.data?.error || response?.data?.detail || errorMessage;
      }

      setErrors({ general: errorMessage });
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md animate-fade-in">
        {/* Main Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-8 space-y-8">
          {/* Brand Section */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl shadow-lg mb-4">
              <ShieldCheck className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              Join EYO Solutions
            </h1>
            <p className="text-gray-600 font-medium">
              Create your business account
            </p>
            <div className="w-12 h-1 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full mx-auto"></div>
          </div>

          {/* Form Section */}
          <div className="space-y-6">
            {errors.general && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {errors.general}
              </div>
            )}

            <div className="space-y-4">
              {/* Name Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="Enter your full name"
                  className={`w-full px-4 py-3 border rounded-xl bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 ${
                    errors.userName
                      ? "border-red-300 focus:ring-red-500"
                      : "border-gray-200"
                  }`}
                  value={formData.userName}
                  onChange={(e) => {
                    setFormData({ ...formData, userName: e.target.value });
                    if (errors.userName)
                      setErrors((prev) => ({ ...prev, userName: "" }));
                  }}
                />
                {errors.userName && (
                  <p className="text-red-500 text-xs">{errors.userName}</p>
                )}
              </div>

              {/* Email Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="Enter your email address"
                  className={`w-full px-4 py-3 border rounded-xl bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 ${
                    errors.email
                      ? "border-red-300 focus:ring-red-500"
                      : "border-gray-200"
                  }`}
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    if (errors.email)
                      setErrors((prev) => ({ ...prev, email: "" }));
                  }}
                />
                {errors.email && (
                  <p className="text-red-500 text-xs">{errors.email}</p>
                )}
              </div>

              {/* Company Dropdown */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Building className="w-4 h-4" />
                  Company
                </label>
                <select
                  className={`w-full px-4 py-3 border rounded-xl bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 appearance-none ${
                    errors.companyId
                      ? "border-red-300 focus:ring-red-500"
                      : "border-gray-200"
                  }`}
                  value={formData.companyId}
                  onChange={(e) => {
                    setFormData({ ...formData, companyId: e.target.value });
                    if (errors.companyId)
                      setErrors((prev) => ({ ...prev, companyId: "" }));
                  }}
                  disabled={loadingCompanies}
                >
                  <option value="">
                    {loadingCompanies
                      ? "Loading companies..."
                      : "Select your company"}
                  </option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.companyName}
                    </option>
                  ))}
                </select>
                {errors.companyId && (
                  <p className="text-red-500 text-xs">{errors.companyId}</p>
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
                    className={`w-full px-4 py-3 pr-12 border rounded-xl bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 ${
                      errors.password
                        ? "border-red-300 focus:ring-red-500"
                        : "border-gray-200"
                    }`}
                    value={formData.password}
                    onChange={(e) => {
                      setFormData({ ...formData, password: e.target.value });
                      if (errors.password)
                        setErrors((prev) => ({ ...prev, password: "" }));
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
                {errors.password && (
                  <p className="text-red-500 text-xs">{errors.password}</p>
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
                    className={`w-full px-4 py-3 pr-12 border rounded-xl bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 ${
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
                        setErrors((prev) => ({ ...prev, confirmPassword: "" }));
                    }}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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

            {/* Register Button */}
            <button
              onClick={handleRegister}
              disabled={loading || loadingCompanies}
              className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none group"
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
                    Creating Account...
                  </>
                ) : (
                  <>
                    Create Account
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </span>
            </button>
          </div>

          {/* Terms */}
          <div className="text-center text-xs text-gray-500">
            By creating an account, you agree to our{" "}
            <Link href="/terms" className="text-green-600 hover:underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-green-600 hover:underline">
              Privacy Policy
            </Link>
          </div>

          {/* Login Link */}
          <div className="pt-6 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-green-600 font-semibold hover:text-green-700 transition-colors"
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
  );
}
