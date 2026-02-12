import { useState } from "react";
import { Card } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Button } from "@/app/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/app/components/ui/radio-group";
import { GraduationCap, Eye, EyeOff, BookOpen, Users, Bell } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userType, setUserType] = useState<"admin" | "student">("student");
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
        body: JSON.stringify({ email, password, userType }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message);

        // Save token
        localStorage.setItem("token", data.token);

        // Redirect based on user type
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
    <div className="min-h-screen bg-gradient-to-br from-[#0F2854] via-[#1C4D8D] to-[#4988C4] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#BDE8F5] rounded-full opacity-10 blur-3xl"></div>
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-[#4988C4] rounded-full opacity-10 blur-3xl"></div>
        <div className="absolute -bottom-40 right-1/4 w-80 h-80 bg-[#BDE8F5] rounded-full opacity-10 blur-3xl"></div>
      </div>

      {/* Left side - Branding */}
      <div className="hidden lg:flex flex-col justify-center text-white max-w-lg mr-16 relative z-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-4 bg-[#BDE8F5] rounded-2xl shadow-lg">
            <GraduationCap className="w-16 h-16 text-[#0F2854]" />
          </div>
        </div>
        <h1 className="text-5xl mb-4">Welcome to</h1>
        <h2 className="text-6xl mb-6">Student Portal</h2>
        <p className="text-xl text-[#BDE8F5] mb-8">
          Manage student records, track fee collections, and communicate with parents efficiently.
        </p>

        <div className="space-y-4">
          <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <div className="p-3 bg-[#4988C4] rounded-lg">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg">Student Management</h3>
              <p className="text-sm text-[#BDE8F5]">Track and manage student information</p>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <div className="p-3 bg-[#4988C4] rounded-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg">Fee Collection</h3>
              <p className="text-sm text-[#BDE8F5]">Monitor and record fee payments</p>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <div className="p-3 bg-[#4988C4] rounded-lg">
              <Bell className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg">Parent Notifications</h3>
              <p className="text-sm text-[#BDE8F5]">Send updates to parents instantly</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login Form */}
      <Card className="w-full max-w-md p-8 shadow-2xl relative z-10 bg-white/95 backdrop-blur-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="p-3 bg-gradient-to-br from-[#1C4D8D] to-[#4988C4] rounded-xl mb-4 shadow-lg">
            <GraduationCap className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl text-center mb-2 text-[#0F2854]">Sign In</h1>
          <p className="text-muted-foreground text-center">Access the Student Information System</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* User Type Selection */}
          <div>
            <Label className="text-[#0F2854] mb-3 block">Login As</Label>
            <RadioGroup
              value={userType}
              onValueChange={(value: "admin" | "student") => setUserType(value)}
              className="grid grid-cols-2 gap-3"
            >
              <div className="flex items-center space-x-3 p-3 rounded-lg border-2 border-[#BDE8F5] hover:border-[#4988C4] transition-colors cursor-pointer bg-gradient-to-r from-[#BDE8F5]/10 to-transparent">
                <RadioGroupItem value="student" id="student-login" className="border-[#1C4D8D]" />
                <Label htmlFor="student-login" className="cursor-pointer text-[#0F2854] flex-1">
                  Student
                </Label>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-lg border-2 border-[#BDE8F5] hover:border-[#4988C4] transition-colors cursor-pointer bg-gradient-to-r from-[#BDE8F5]/10 to-transparent">
                <RadioGroupItem value="admin" id="admin-login" className="border-[#1C4D8D]" />
                <Label htmlFor="admin-login" className="cursor-pointer text-[#0F2854] flex-1">
                  Admin
                </Label>
              </div>
            </RadioGroup>
          </div>

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
              className="border-[#4988C4]/30 focus:border-[#1C4D8D] focus:ring-[#1C4D8D]"
            />
          </div>

          <div>
            <Label htmlFor="password" className="text-[#0F2854]">
              Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="border-[#4988C4]/30 focus:border-[#1C4D8D] focus:ring-[#1C4D8D]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4988C4] hover:text-[#1C4D8D]"
                disabled={isLoading}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-[#1C4D8D] to-[#4988C4] hover:from-[#0F2854] hover:to-[#1C4D8D] text-white shadow-lg"
            disabled={isLoading}
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <div className="mt-4 text-center">
          <p className="text-sm text-muted-foreground">
            Don't have an account?{" "}
            <button
              onClick={() => navigate("/create-account")}
              className="text-[#1C4D8D] hover:text-[#0F2854] hover:underline"
            >
              Create one here
            </button>
          </p>
        </div>

        <div className="mt-6 p-4 bg-gradient-to-r from-[#BDE8F5]/20 to-[#4988C4]/20 rounded-lg border-2 border-[#BDE8F5]">
          <p className="text-xs text-[#0F2854] mb-2">🔑 Demo Credentials:</p>
          <div className="space-y-2">
            <div>
              <p className="text-xs text-[#1C4D8D] font-semibold">Student:</p>
              <p className="text-sm text-[#1C4D8D]">
                <strong>Email:</strong> student@school.com
              </p>
              <p className="text-sm text-[#1C4D8D]">
                <strong>Password:</strong> student123
              </p>
            </div>
            <div>
              <p className="text-xs text-[#1C4D8D] font-semibold">Admin:</p>
              <p className="text-sm text-[#1C4D8D]">
                <strong>Email:</strong> admin@school.com
              </p>
              <p className="text-sm text-[#1C4D8D]">
                <strong>Password:</strong> admin123
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Mobile branding */}
      <div className="lg:hidden absolute top-8 left-0 right-0 text-center z-10">
        <h1 className="text-3xl text-white mb-2">Student Portal</h1>
        <p className="text-[#BDE8F5]">Fee Collection & Parent Notification System</p>
      </div>
    </div>
  );
}
