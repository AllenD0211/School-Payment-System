import { useState } from "react";
import { Card } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Button } from "@/app/components/ui/button";
import { GraduationCap, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function ForgotPassword() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    setIsLoading(true);

    // Simulate sending reset link
    setTimeout(() => {
      setMessage(
        `If an account exists for ${email}, a password reset link has been sent.`,
      );
      toast.success("Reset link sent!");
      setIsLoading(false);
    }, 1000);
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
      <Card className="w-full max-w-md p-8 shadow-2xl relative z-10 bg-white/95 backdrop-blur-sm">
        {/* Back Button */}

        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="p-3 bg-gradient-to-br from-[#1C4D8D] to-[#4988C4] rounded-xl mb-4 shadow-lg">
            <GraduationCap className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl text-center mb-2 text-[#0F2854]">
            Forgot Password
          </h1>
          <p className="text-muted-foreground text-center text-[#1C4D8D]">
            Enter your email address below and we’ll send you a link to reset
            your password.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Label htmlFor="email" className="text-[#0F2854]">
              Email Address *
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="your.email@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              className="border-[#4988C4]/30 focus:border-[#1C4D8D] focus:ring-[#1C4D8D]"
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-[#1C4D8D] to-[#4988C4] hover:from-[#0F2854] hover:to-[#1C4D8D] text-white shadow-lg"
            disabled={isLoading}
          >
            {isLoading ? "Sending..." : "Send Reset Link"}
          </Button>
        </form>

        {/* Message */}
        {message && <p className="mt-4 text-sm text-[#1C4D8D]">{message}</p>}

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate("/login")}
            className="inline-flex items-center gap-2 text-[#1C4D8D] hover:text-[#0F2854] hover:underline text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Login
          </button>
        </div>
      </Card>
    </div>
  );
}
