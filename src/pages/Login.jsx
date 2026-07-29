// pages/Login.jsx
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiLogIn,
  FiAlertCircle,
  FiShield,
  FiTrendingUp,
  FiUsers,
  FiBarChart2,
  FiTruck,
  FiPackage,
  FiGlobe,
} from "react-icons/fi";
import InputText from "../components/ui/InputText";
import Button from "../components/ui/Button";
import CheckBox from "../components/ui/CheckBox";
import logo from "../assets/logo.png";
import { useAuthStore } from "../stores/authStore";
import { getApiError } from "../lib/api";

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const loading = useAuthStore((state) => state.loading);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setErrors({});

    try {
      const data = await login({
        email: formData.email.trim(),
        password: formData.password,
        loginType: "client",
      });
      const nextPath = ["active", "verified"].includes(data.user?.status)
        ? "/"
        : "/profile";
      navigate(nextPath, { replace: true });
    } catch (error) {
      setErrors({ general: getApiError(error) });
    }
  };

  const features = [
    {
      icon: FiTruck,
      title: "Track Shipments",
      description: "Real-time tracking of all your shipments",
      color: "text-blue-500",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
    },
    {
      icon: FiPackage,
      title: "Manage Orders",
      description: "Easily manage and process your orders",
      color: "text-blue-500",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
    },
    {
      icon: FiGlobe,
      title: "Global Network",
      description: "Access to worldwide shipping networks",
      color: "text-purple-500",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
    },
  ];

  const stats = [
    {
      icon: FiUsers,
      value: "50K+",
      label: "Active Clients",
      color: "text-blue-400",
    },
    {
      icon: FiBarChart2,
      value: "99.9%",
      label: "Uptime",
      color: "text-blue-400",
    },
    {
      icon: FiTrendingUp,
      value: "10K+",
      label: "Deliveries",
      color: "text-purple-400",
    },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left Section - Client Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-50 via-emerald-50 to-purple-50 flex-col items-center justify-center p-12 relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-200/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
          <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-emerald-200/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
        </div>

        <div className="relative z-10 text-center max-w-lg w-full">
          {/* Large Logo */}
          <div className="mb-8 flex justify-center">
            <div className="w-56 h-56 bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl shadow-blue-200/30 border border-white/50 flex items-center justify-center">
              <img
                src={logo}
                alt="Client Portal Logo"
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Client Portal
          </h1>
          <p className="text-gray-600 text-lg mb-8">
            Manage your shipping and logistics
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="bg-white/60 backdrop-blur-sm rounded-xl p-4 shadow-sm border border-white/50 hover:shadow-md transition-shadow"
              >
                <stat.icon className={`h-6 w-6 ${stat.color} mx-auto mb-2`} />
                <div className="text-gray-800 font-bold text-xl">
                  {stat.value}
                </div>
                <div className="text-gray-500 text-xs">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Features */}
          <div className="space-y-3">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`flex items-center space-x-4 ${feature.bgColor} backdrop-blur-sm rounded-lg p-3 border ${feature.borderColor} hover:shadow-md transition-all duration-200`}
              >
                <div className={`${feature.color} flex-shrink-0`}>
                  <feature.icon className="h-6 w-6" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-800">
                    {feature.title}
                  </p>
                  <p className="text-xs text-gray-600">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 text-gray-400 text-xs">
            <p>Secure • Reliable • Fast</p>
          </div>
        </div>
      </div>

      {/* Right Section - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-8 bg-gradient-to-br from-white to-gray-50/80">
        <div className="w-full max-w-md bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-gray-200/50 p-8 space-y-6 border border-white/50">
          {/* Mobile Logo */}
          <div className="lg:hidden flex flex-col items-center">
            <div className="w-28 h-28 mb-4 bg-gradient-to-br from-blue-50 via-emerald-50 to-purple-50 rounded-2xl p-4 shadow-lg shadow-blue-200/30 flex items-center justify-center">
              <img
                src={logo}
                alt="Client Portal Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Client Portal</h2>
          </div>

          {/* Welcome */}
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Welcome Back</h2>
            <p className="text-gray-500 text-sm mt-1">
              Sign in to manage your shipments and orders
            </p>
          </div>

          {/* Error */}
          {errors.general && (
            <div className="bg-red-50 border border-red-200 p-3 rounded-lg flex items-start space-x-2">
              <FiAlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-700 text-sm">{errors.general}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <InputText
              label="Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              placeholder="Enter your email"
              required
              disabled={loading}
              icon={<FiMail className="h-5 w-5 text-gray-400" />}
            />

            <InputText
              label="Password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              placeholder="Enter your password"
              required
              disabled={loading}
              icon={<FiLock className="h-5 w-5 text-gray-400" />}
              showPasswordToggle
              onTogglePassword={() => setShowPassword(!showPassword)}
            />

            <div className="flex items-center justify-between">
              <div>
                <CheckBox
                  label="Remember me"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  size="sm"
                />
              </div>
              <a
                href="#"
                className="text-sm text-emerald-500 hover:text-emerald-600 font-medium transition-colors"
              >
                Forgot password?
              </a>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
              disabled={loading}
              icon={<FiLogIn className="h-5 w-5" />}
              className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-lg shadow-emerald-200/50"
            >
              Sign In
            </Button>
          </form>

          {/* Register Link */}
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
              >
                Create Account
              </Link>
            </p>
          </div>

          <div className="text-center text-xs text-gray-400">
            <p>© {new Date().getFullYear()} One True Logistics Inc. All rights reserved.</p>
            <div className="mt-2 flex items-center justify-center gap-3">
              <Link to="/terms-and-conditions" className="hover:text-emerald-600 hover:underline">Terms</Link>
              <span>•</span>
              <Link to="/privacy-policy" className="hover:text-emerald-600 hover:underline">Privacy</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
