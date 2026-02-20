import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Button } from "@/app/components/ui/button";
import {
  GraduationCap,
  Eye,
  EyeOff,
  BookOpen,
  Users,
  Bell,
} from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Please enter both email and password");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message);
        localStorage.setItem("token", data.token);

        if (data.usertype === "admin") {
          navigate("/admin");
        } else {
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
    <div className="min-h-screen bg-gradient-to-br from-[#0F2854] via-[#1C4D8D] to-[#4988C4] flex items-center justify-center px-6 relative overflow-hidden">
      {/* Background Glow Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#BDE8F5] rounded-full opacity-10 blur-3xl"></div>
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-[#4988C4] rounded-full opacity-10 blur-3xl"></div>
        <div className="absolute -bottom-40 right-1/4 w-80 h-80 bg-[#BDE8F5] rounded-full opacity-10 blur-3xl"></div>
      </div>

      {/* Main Layout Wrapper */}
      <div className="relative z-10 w-full max-w-7xl flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-20">
        {/* LEFT SIDE */}
        <div className="hidden lg:flex flex-col text-white flex-1 max-w-xl">
          {/* Logo aligned with heading */}
          <div className="flex items-center gap-6 mb-8">
            {/* Logo */}
            <div className="p-4 bg-[#BDE8F5] rounded-2xl shadow-lg flex-shrink-0">
              <GraduationCap className="w-16 h-16 text-[#0F2854]" />
            </div>

            {/* Headings */}
            <div className="flex flex-col">
              <h1 className="text-2xl font-light mb-1">Welcome to</h1>
              <h2 className="text-4xl font-bold leading-tight">
                Student Fee Record Management System
              </h2>
            </div>
          </div>

          <p className="text-lg text-[#BDE8F5] mb-10">
            Manage student records, track fee collections, and communicate with
            parents efficiently.
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
                className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-xl p-4"
              >
                <div className="p-3 bg-[#4988C4] rounded-lg">
                  {feature.icon}
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{feature.title}</h3>
                  <p className="text-sm text-[#BDE8F5]">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT SIDE - LOGIN CARD */}
        <Card className="w-full max-w-md p-8 shadow-2xl bg-white/95 backdrop-blur-sm rounded-2xl">
          <div className="flex flex-col items-center mb-8">
            <div className="p-3 bg-gradient-to-br from-[#1C4D8D] to-[#4988C4] rounded-xl mb-4 shadow-md">
              <GraduationCap className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-3xl font-semibold text-[#0F2854] mb-2">
              Sign In
            </h1>
            <p className="text-muted-foreground text-center text-sm">
              Access your account
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label htmlFor="email" className="text-[#0F2854]">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@school.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="mt-1 border-[#4988C4]/30 focus:border-[#1C4D8D] focus:ring-[#1C4D8D]"
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-[#0F2854]">
                Password
              </Label>
              <div className="relative mt-1">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="border-[#4988C4]/30 focus:border-[#1C4D8D] focus:ring-[#1C4D8D] pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  className="absolute inset-y-0 right-3 flex items-center text-[#4988C4] hover:text-[#1C4D8D]"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="text-right">
              <Link
                to="/forgot-password"
                className="text-sm text-[#4988C4] hover:text-[#1C4D8D] hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-[#1C4D8D] to-[#4988C4] hover:from-[#0F2854] hover:to-[#1C4D8D] text-white shadow-lg"
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{" "}
              <button
                onClick={() => navigate("/create-account")}
                className="text-[#1C4D8D] hover:text-[#0F2854] hover:underline"
              >
                Sign up
              </button>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
