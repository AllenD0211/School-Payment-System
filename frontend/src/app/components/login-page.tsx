import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Button } from "@/app/components/ui/button";
import { Separator } from "@/app/components/ui/separator";
import {
  GraduationCap,
  Eye,
  EyeOff,
  BookOpen,
  Users,
  Bell,
  Mail,
  Lock,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { apiUrl } from "@/lib/api";

export default function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Please enter both email and password");
      return;
    }

    if (!email.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(apiUrl("/api/auth/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message);
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        if (rememberMe) {
          localStorage.setItem("rememberEmail", email);
        }

        if (data.user.userType === "admin") {
          navigate("/admin");
        } else if(data.user.userType === "parent") {
          navigate("/parent");
        } else if(data.user.userType === "student") {
          navigate("/student");
        }
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong. Try again later.");
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F2854] via-[#1C4D8D] to-[#4988C4] flex items-center justify-center px-4 md:px-6 relative overflow-hidden">
      {/* Background Glow Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#BDE8F5] rounded-full opacity-10 blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-[#4988C4] rounded-full opacity-10 blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 right-1/4 w-80 h-80 bg-[#BDE8F5] rounded-full opacity-10 blur-3xl animate-pulse"></div>
      </div>

      {/* Main Layout Wrapper */}
      <div className="relative z-10 w-full max-w-7xl flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-20">
        {/* LEFT SIDE */}
        <div className="hidden lg:flex flex-col text-white flex-1 max-w-xl">
          {/* Logo aligned with heading */}
          <div className="flex items-center gap-6 mb-8 animate-fade-in">
            {/* Logo */}
            <div className="p-4 bg-[#BDE8F5] rounded-2xl shadow-2xl flex-shrink-0 hover:shadow-3xl transition-shadow">
              <GraduationCap className="w-16 h-16 text-[#0F2854]" />
            </div>

            {/* Headings */}
            <div className="flex flex-col">
              <h1 className="text-2xl font-light mb-1">Welcome to</h1>
              <h2 className="text-4xl font-bold leading-tight">
                Student Fee Record<br />Management System
              </h2>
            </div>
          </div>

          <p className="text-lg text-[#BDE8F5] mb-10">
            Manage student records, track fee collections, and communicate with
            parents efficiently. Streamline your school's administrative tasks.
          </p>

          <div className="space-y-4">
            {[
              {
                icon: <BookOpen className="w-6 h-6 text-white" />,
                title: "Student Management",
                desc: "Track and manage student information",
              },
              {
                icon: <Users className="w-6 h-6 text-white" />,
                title: "Fee Collection",
                desc: "Monitor and record fee payments",
              },
              {
                icon: <Bell className="w-6 h-6 text-white" />,
                title: "Parent Notifications",
                desc: "Send updates to parents instantly",
              },
            ].map((feature, idx) => (
              <div
                key={idx}
                className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-xl p-4 hover:bg-white/15 transition-colors border border-white/10"
              >
                <div className="p-3 bg-[#4988C4] rounded-lg flex-shrink-0">
                  {feature.icon}
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{feature.title}</h3>
                  <p className="text-sm text-[#BDE8F5]">{feature.desc}</p>
                </div>
                <CheckCircle2 className="w-5 h-5 text-[#BDE8F5] ml-auto flex-shrink-0" />
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT SIDE - LOGIN CARD */}
        <Card className="w-full max-w-md p-8 shadow-2xl bg-white/95 backdrop-blur-md rounded-2xl border border-white/20 animate-slide-up">
          <div className="flex flex-col items-center mb-8">
            <div className="p-4 bg-gradient-to-br from-[#1C4D8D] to-[#4988C4] rounded-xl mb-4 shadow-xl">
              <GraduationCap className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-[#0F2854] mb-2">
              Sign In
            </h1>
            <p className="text-muted-foreground text-center text-sm">
              Access your account to continue
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Input */}
            <div>
              <Label htmlFor="email" className="text-[#0F2854] font-semibold text-sm">
                Email Address
              </Label>
              <div className="relative mt-2">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#4988C4]" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="pl-10 border-[#4988C4]/30 focus:border-[#1C4D8D] focus:ring-[#1C4D8D] focus:ring-2"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="password" className="text-[#0F2854] font-semibold text-sm">
                  Password
                </Label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-[#4988C4] hover:text-[#1C4D8D] hover:underline"
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="relative mt-2">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#4988C4]" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="pl-10 pr-10 border-[#4988C4]/30 focus:border-[#1C4D8D] focus:ring-[#1C4D8D] focus:ring-2"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  className="absolute inset-y-0 right-3 flex items-center text-[#4988C4] hover:text-[#1C4D8D] transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={isLoading}
                className="w-4 h-4 rounded border-[#4988C4]/30 text-[#1C4D8D] focus:ring-[#1C4D8D]"
              />
              <Label htmlFor="rememberMe" className="text-sm text-[#4988C4]">
                Remember me
              </Label>
            </div>

            {/* Sign In Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-[#1C4D8D] to-[#4988C4] hover:from-[#0F2854] hover:to-[#1C4D8D] text-white shadow-lg font-semibold py-2.5 transition-all duration-300 hover:shadow-xl disabled:opacity-50"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <span className="animate-spin mr-2">⏳</span>
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  Sign In
                  <ArrowRight className="w-4 h-4 ml-2" />
                </span>
              )}
            </Button>
          </form>

          {/* Sign Up Link */}
          <div className="mt-6 pt-6 border-t border-[#4988C4]/20 text-center">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{" "}
              <button
                onClick={() => navigate("/create-account")}
                className="text-[#1C4D8D] hover:text-[#0F2854] hover:underline font-semibold"
              >
                Sign up
              </button>
            </p>
          </div>
        </Card>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }

        .animate-slide-up {
          animation: slide-up 0.6s ease-out;
        }

        .group:hover .group-hover\:scale-105 {
          transform: scale(1.05);
        }
      `}</style>
    </div>
  );
}

//ehaey gravity
