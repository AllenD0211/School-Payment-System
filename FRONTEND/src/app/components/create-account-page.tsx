import { useState } from "react";
import { Card } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Button } from "@/app/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/app/components/ui/radio-group";
import { GraduationCap, Eye, EyeOff, Mail, Smartphone, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function CreateAccountPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [notificationMethod, setNotificationMethod] = useState<"email" | "phone">("email");
  const [notificationContact, setNotificationContact] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.firstName || !formData.middleName || !formData.lastName || !formData.email || !formData.password || !formData.confirmPassword) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    if (!notificationContact) {
      toast.error(
        `Please enter your ${notificationMethod === "email" ? "Gmail address" : "phone number"}`
      );
      return;
    }

    if (notificationMethod === "email" && !notificationContact.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsLoading(true);

    // Simulate account creation
    setTimeout(() => {
      toast.success("Account created successfully!");
      setIsLoading(false);
      navigate("/login");
    }, 1500);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F2854] via-[#1C4D8D] to-[#4988C4] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#BDE8F5] rounded-full opacity-10 blur-3xl"></div>
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-[#4988C4] rounded-full opacity-10 blur-3xl"></div>
        <div className="absolute -bottom-40 right-1/4 w-80 h-80 bg-[#BDE8F5] rounded-full opacity-10 blur-3xl"></div>
      </div>

      {/* Create Account Form */}
      <Card className="w-full max-w-2xl p-8 shadow-2xl relative z-10 bg-white/95 backdrop-blur-sm">
       

        <div className="flex flex-col items-center mb-8">
          <div className="p-3 bg-gradient-to-br from-[#1C4D8D] to-[#4988C4] rounded-xl mb-4 shadow-lg">
            <GraduationCap className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl text-center mb-2 text-[#0F2854]">Create Account</h1>
          <p className="text-muted-foreground text-center">Join the Student Fee Management System</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="firstName" className="text-[#0F2854]">
                First Name *
              </Label>
              <Input
                id="firstName"
                type="text"
                placeholder="First Name"
                value={formData.firstName}
                onChange={(e) => handleInputChange("firstName", e.target.value)}
                disabled={isLoading}
                className="border-[#4988C4]/30 focus:border-[#1C4D8D] focus:ring-[#1C4D8D]"
              />
            </div>

            <div>
              <Label htmlFor="middleName" className="text-[#0F2854]">
                Middle Name *
              </Label>
              <Input
                id="middleName"
                type="text"
                placeholder="Middle Name"
                value={formData.middleName}
                onChange={(e) => handleInputChange("middleName", e.target.value)}
                disabled={isLoading}
                className="border-[#4988C4]/30 focus:border-[#1C4D8D] focus:ring-[#1C4D8D]"
              />
            </div>

            <div>
              <Label htmlFor="lastName" className="text-[#0F2854]">
                Last Name (Surname) *
              </Label>
              <Input
                id="lastName"
                type="text"
                placeholder="Last Name"
                value={formData.lastName}
                onChange={(e) => handleInputChange("lastName", e.target.value)}
                disabled={isLoading}
                className="border-[#4988C4]/30 focus:border-[#1C4D8D] focus:ring-[#1C4D8D]"
              />
            </div>
          </div>

          {/* Email & Password */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email" className="text-[#0F2854]">
                Email Address *
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@example.com"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                disabled={isLoading}
                className="border-[#4988C4]/30 focus:border-[#1C4D8D] focus:ring-[#1C4D8D]"
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-[#0F2854]">
                Password *
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="At least 6 characters"
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
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
          </div>

          {/* Confirm Password */}
          <div>
            <Label htmlFor="confirmPassword" className="text-[#0F2854]">
              Confirm Password *
            </Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Re-enter your password"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                disabled={isLoading}
                className="border-[#4988C4]/30 focus:border-[#1C4D8D] focus:ring-[#1C4D8D]"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4988C4] hover:text-[#1C4D8D]"
                disabled={isLoading}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Notification Method */}
          <div className="border-t border-[#BDE8F5] pt-5 mt-6">
            <Label className="text-[#0F2854] mb-3 block">
              How would you like to receive notifications? *
            </Label>
            <RadioGroup
              value={notificationMethod}
              onValueChange={(value: "email" | "phone") => {
                setNotificationMethod(value);
                setNotificationContact("");
              }}
              className="space-y-3"
            >
              {/* Email Option */}
              <div className="flex items-center space-x-3 p-4 rounded-lg border-2 border-[#BDE8F5] hover:border-[#4988C4] transition-colors cursor-pointer bg-gradient-to-r from-[#BDE8F5]/10 to-transparent">
                <RadioGroupItem value="email" id="email-notification" className="border-[#1C4D8D]" />
                <Label htmlFor="email-notification" className="flex items-center gap-3 cursor-pointer flex-1">
                  <div className="p-2 bg-[#BDE8F5] rounded-lg">
                    <Mail className="w-5 h-5 text-[#1C4D8D]" />
                  </div>
                  <div>
                    <p className="text-[#0F2854]">Gmail</p>
                    <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                  </div>
                </Label>
              </div>

              {/* Phone Option */}
              <div className="flex items-center space-x-3 p-4 rounded-lg border-2 border-[#BDE8F5] hover:border-[#4988C4] transition-colors cursor-pointer bg-gradient-to-r from-[#BDE8F5]/10 to-transparent">
                <RadioGroupItem value="phone" id="phone-notification" className="border-[#1C4D8D]" />
                <Label htmlFor="phone-notification" className="flex items-center gap-3 cursor-pointer flex-1">
                  <div className="p-2 bg-[#BDE8F5] rounded-lg">
                    <Smartphone className="w-5 h-5 text-[#1C4D8D]" />
                  </div>
                  <div>
                    <p className="text-[#0F2854]">Phone Number</p>
                    <p className="text-sm text-muted-foreground">Receive notifications via SMS</p>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Notification Contact */}
          <div>
            {notificationMethod === "email" ? (
              <>
                <Label htmlFor="notificationEmail" className="text-[#0F2854]">
                  Gmail Address *
                </Label>
                <Input
                  id="notificationEmail"
                  type="email"
                  placeholder="your.gmail@gmail.com"
                  value={notificationContact}
                  onChange={(e) => setNotificationContact(e.target.value)}
                  disabled={isLoading}
                  className="border-[#4988C4]/30 focus:border-[#1C4D8D] focus:ring-[#1C4D8D]"
                />
              </>
            ) : (
              <>
                <Label htmlFor="notificationPhone" className="text-[#0F2854]">
                  Phone Number *
                </Label>
                <Input
                  id="notificationPhone"
                  type="tel"
                  placeholder="+63 912 345 6789"
                  value={notificationContact}
                  onChange={(e) => setNotificationContact(e.target.value)}
                  disabled={isLoading}
                  className="border-[#4988C4]/30 focus:border-[#1C4D8D] focus:ring-[#1C4D8D]"
                />
              </>
            )}
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-[#1C4D8D] to-[#4988C4] hover:from-[#0F2854] hover:to-[#1C4D8D] text-white shadow-lg"
            disabled={isLoading}
          >
            {isLoading ? "Creating Account..." : "Create Account"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <button
              onClick={() => navigate("/login")}
              className="text-[#1C4D8D] hover:text-[#0F2854] hover:underline"
            >
              Sign in here
            </button>
          </p>
        </div>
      </Card>
    </div>
  );
}
