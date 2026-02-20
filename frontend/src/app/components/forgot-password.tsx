import { useState } from "react";
import { Card } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Button } from "@/app/components/ui/button";
import { GraduationCap, ArrowLeft, Mail, Lock, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

type ForgotPasswordStep = "email" | "verification" | "reset";

export default function ForgotPassword() {
  const navigate = useNavigate();

  // Email verification step
  const [email, setEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // UI state
  const [step, setStep] = useState<ForgotPasswordStep>("email");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [resendCountdown, setResendCountdown] = useState(0);

  // Validation helper
  const validateEmail = (emailValue: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue);
  };

  // Step 1: Request password reset
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error("Please enter your email address");
      return;
    }

    if (!validateEmail(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Verification code sent to your email");
        setStep("verification");
        setMessage(`We've sent a verification code to ${email}. It expires in 10 minutes.`);
        startResendCountdown();
      } else {
        toast.error(data.message || "Failed to send reset code");
      }
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong. Please try again later.");
    }

    setIsLoading(false);
  };

  // Step 2: Verify code
  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!verificationCode.trim()) {
      toast.error("Please enter the verification code");
      return;
    }

    if (verificationCode.length < 4) {
      toast.error("Verification code must be at least 4 characters");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: verificationCode }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Code verified successfully");
        setStep("reset");
        setMessage("");
      } else {
        toast.error(data.message || "Invalid verification code");
      }
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong. Please try again later.");
    }

    setIsLoading(false);
  };

  // Step 3: Reset password
  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword.trim()) {
      toast.error("Please enter a new password");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (!/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      toast.error("Password must contain at least one uppercase letter and one number");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          code: verificationCode,
          newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Password reset successfully!");
        setTimeout(() => {
          navigate("/login");
        }, 1500);
      } else {
        toast.error(data.message || "Failed to reset password");
      }
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong. Please try again later.");
    }

    setIsLoading(false);
  };

  // Resend code countdown
  const startResendCountdown = () => {
    setResendCountdown(60);
    const interval = setInterval(() => {
      setResendCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleResendCode = () => {
    if (resendCountdown === 0) {
      handleEmailSubmit(new Event("submit") as any);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F2854] via-[#1C4D8D] to-[#4988C4] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#BDE8F5] rounded-full opacity-10 blur-3xl"></div>
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-[#4988C4] rounded-full opacity-10 blur-3xl"></div>
        <div className="absolute -bottom-40 right-1/4 w-80 h-80 bg-[#BDE8F5] rounded-full opacity-10 blur-3xl"></div>
      </div>

      {/* Forgot Password Form */}
      <Card className="w-full max-w-md p-8 shadow-2xl relative z-10 bg-white/95 backdrop-blur-sm rounded-2xl border border-white/20">
        {/* Back Button */}
        <button
          onClick={() => {
            if (step === "email") {
              navigate("/login");
            } else {
              setStep("email");
              setVerificationCode("");
              setNewPassword("");
              setConfirmPassword("");
              setMessage("");
            }
          }}
          className="mb-6 inline-flex items-center gap-2 text-[#1C4D8D] hover:text-[#0F2854] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back</span>
        </button>

        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="p-3 bg-gradient-to-br from-[#1C4D8D] to-[#4988C4] rounded-xl mb-4 shadow-lg">
            <GraduationCap className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-center mb-2 text-[#0F2854]">
            {step === "email" && "Forgot Password"}
            {step === "verification" && "Verify Code"}
            {step === "reset" && "Create New Password"}
          </h1>
          <p className="text-muted-foreground text-center text-sm text-[#1C4D8D]">
            {step === "email" &&
              "Enter your email address and we'll send you a verification code to reset your password."}
            {step === "verification" &&
              "Enter the verification code we sent to your email."}
            {step === "reset" &&
              "Create a strong password for your account."}
          </p>
        </div>

        {/* Step Indicators */}
        <div className="flex gap-2 mb-8">
          {(["email", "verification", "reset"] as ForgotPasswordStep[]).map(
            (s, idx) => (
              <div
                key={s}
                className={`flex-1 h-1 rounded-full transition-colors ${
                  step === s
                    ? "bg-gradient-to-r from-[#1C4D8D] to-[#4988C4]"
                    : (["email", "verification", "reset"] as ForgotPasswordStep[]).indexOf(step) > idx
                      ? "bg-[#4988C4]/50"
                      : "bg-gray-300"
                }`}
              />
            )
          )}
        </div>

        {/* Email Step */}
        {step === "email" && (
          <form onSubmit={handleEmailSubmit} className="space-y-5">
            <div>
              <Label htmlFor="email" className="text-[#0F2854] font-semibold text-sm">
                Email Address *
              </Label>
              <div className="relative mt-2">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#4988C4]" />
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="pl-10 border-[#4988C4]/30 focus:border-[#1C4D8D] focus:ring-[#1C4D8D] focus:ring-2"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-[#1C4D8D] to-[#4988C4] hover:from-[#0F2854] hover:to-[#1C4D8D] text-white shadow-lg font-semibold py-2.5 transition-all duration-300 hover:shadow-xl disabled:opacity-50"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <span className="animate-spin mr-2">⏳</span>
                  Sending...
                </span>
              ) : (
                "Send Verification Code"
              )}
            </Button>
          </form>
        )}

        {/* Verification Step */}
        {step === "verification" && (
          <form onSubmit={handleVerificationSubmit} className="space-y-5">
            <div>
              <Label htmlFor="code" className="text-[#0F2854] font-semibold text-sm">
                Verification Code *
              </Label>
              <Input
                id="code"
                type="text"
                placeholder="Enter 6-digit code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.toUpperCase())}
                disabled={isLoading}
                maxLength={6}
                className="mt-2 text-center text-xl tracking-widest border-[#4988C4]/30 focus:border-[#1C4D8D] focus:ring-[#1C4D8D] focus:ring-2"
              />
              <p className="text-xs text-[#1C4D8D] mt-2">
                Check your email for the verification code
              </p>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-[#1C4D8D] to-[#4988C4] hover:from-[#0F2854] hover:to-[#1C4D8D] text-white shadow-lg font-semibold py-2.5 transition-all duration-300 hover:shadow-xl disabled:opacity-50"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <span className="animate-spin mr-2">⏳</span>
                  Verifying...
                </span>
              ) : (
                "Verify Code"
              )}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={handleResendCode}
                disabled={resendCountdown > 0 || isLoading}
                className="text-xs text-[#4988C4] hover:text-[#1C4D8D] hover:underline disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {resendCountdown > 0
                  ? `Resend code in ${resendCountdown}s`
                  : "Resend Code"}
              </button>
            </div>
          </form>
        )}

        {/* Reset Password Step */}
        {step === "reset" && (
          <form onSubmit={handleResetSubmit} className="space-y-5">
            {/* New Password */}
            <div>
              <Label htmlFor="newPassword" className="text-[#0F2854] font-semibold text-sm">
                New Password *
              </Label>
              <div className="relative mt-2">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#4988C4]" />
                <Input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a strong password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={isLoading}
                  className="pl-10 pr-10 border-[#4988C4]/30 focus:border-[#1C4D8D] focus:ring-[#1C4D8D] focus:ring-2"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  className="absolute inset-y-0 right-3 flex items-center text-[#4988C4] hover:text-[#1C4D8D]"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                At least 8 characters, 1 uppercase letter, and 1 number
              </p>
            </div>

            {/* Confirm Password */}
            <div>
              <Label htmlFor="confirmPassword" className="text-[#0F2854] font-semibold text-sm">
                Confirm Password *
              </Label>
              <div className="relative mt-2">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#4988C4]" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                  className="pl-10 pr-10 border-[#4988C4]/30 focus:border-[#1C4D8D] focus:ring-[#1C4D8D] focus:ring-2"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isLoading}
                  className="absolute inset-y-0 right-3 flex items-center text-[#4988C4] hover:text-[#1C4D8D]"
                >
                  {showConfirmPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-[#1C4D8D] to-[#4988C4] hover:from-[#0F2854] hover:to-[#1C4D8D] text-white shadow-lg font-semibold py-2.5 transition-all duration-300 hover:shadow-xl disabled:opacity-50"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <span className="animate-spin mr-2">⏳</span>
                  Resetting...
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Reset Password
                </span>
              )}
            </Button>
          </form>
        )}

        {/* Info Message */}
        {message && (
          <div className="mt-4 p-3 bg-[#BDE8F5]/20 border border-[#4988C4]/30 rounded-lg">
            <p className="text-sm text-[#1C4D8D]">{message}</p>
          </div>
        )}

        {/* Back to Login */}
        <div className="mt-6 pt-6 border-t border-[#4988C4]/20 text-center">
          <button
            onClick={() => navigate("/login")}
            className="text-sm text-[#1C4D8D] hover:text-[#0F2854] hover:underline transition-colors"
          >
            Back to Sign In
          </button>
        </div>
      </Card>

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

        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
      `}</style>
    </div>
  );
}