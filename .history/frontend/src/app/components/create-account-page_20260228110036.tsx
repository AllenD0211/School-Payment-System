import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Card } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Button } from "@/app/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { GraduationCap, Users, BookOpen, Eye, EyeOff } from "lucide-react";

type UserType = "student" | "parent";

type FormState = {
  userType: UserType;
  firstName: string;
  middleName: string;
  lastName: string;
  gender: string;
  email: string;
  password: string;
  confirmPassword: string;
  studentId: string;
  birthdate: string;
  gradeSection: string;
  phoneNumber: string;
};

const INITIAL_FORM: FormState = {
  userType: "student",
  firstName: "",
  middleName: "",
  lastName: "",
  gender: "",
  email: "",
  password: "",
  confirmPassword: "",
  studentId: "",
  birthdate: "",
  gradeSection: "",
  phoneNumber: "",
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const API_BASE = String(
  (import.meta as any).env?.VITE_API_BASE_URL || "http://localhost:5000",
).replace(/\/+$/, "");

export default function CreateAccountPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormState>(INITIAL_FORM);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isOtpStep, setIsOtpStep] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");

  const handleInputChange = (field: keyof FormState, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleUserTypeChange = (value: UserType) => {
    setFormData((prev) => ({
      ...prev,
      userType: value,
      studentId: value === "parent" ? "" : prev.studentId,
      birthdate: value === "parent" ? "" : prev.birthdate,
      gradeSection: value === "parent" ? "" : prev.gradeSection,
      phoneNumber: value === "student" ? "" : prev.phoneNumber,
    }));
  };

  const validateForm = () => {
    const {
      userType,
      firstName,
      lastName,
      gender,
      email,
      password,
      confirmPassword,
      studentId,
      birthdate,
      gradeSection,
      phoneNumber,
    } = formData;

    if (
      !firstName.trim() ||
      !lastName.trim() ||
      !gender.trim() ||
      !email.trim() ||
      !password ||
      !confirmPassword
    ) {
      toast.error("Please fill in all required fields.");
      return false;
    }

    if (!EMAIL_REGEX.test(email.trim())) {
      toast.error("Please enter a valid email address.");
      return false;
    }

    if (!PASSWORD_REGEX.test(password)) {
      toast.error(
        "Password must be at least 8 characters with uppercase, lowercase, and number.",
      );
      return false;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return false;
    }

    if (userType === "student") {
      if (!studentId.trim() || !birthdate.trim() || !gradeSection.trim()) {
        toast.error("Student ID, birthdate, and grade section are required.");
        return false;
      }

      if (!DATE_REGEX.test(birthdate)) {
        toast.error("Birthdate must use YYYY-MM-DD format.");
        return false;
      }

      const parsedBirthdate = new Date(birthdate);
      if (Number.isNaN(parsedBirthdate.getTime())) {
        toast.error("Please enter a valid birthdate.");
        return false;
      }
    }

    if (userType === "parent" && !phoneNumber.trim()) {
      toast.error("Phone number is required for parent accounts.");
      return false;
    }

    if (!agreedToTerms) {
      toast.error("Please agree to the Terms and Conditions.");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    const basePayload = {
      userType: formData.userType,
      firstName: formData.firstName.trim(),
      middleName: formData.middleName.trim(),
      lastName: formData.lastName.trim(),
      gender: formData.gender,
      email: formData.email.trim(),
      password: formData.password,
    };

    const payload =
      formData.userType === "student"
        ? {
            ...basePayload,
            studentId: formData.studentId.trim(),
            birthdate: formData.birthdate,
            gradeSection: formData.gradeSection.trim(),
          }
        : {
            ...basePayload,
            phoneNumber: formData.phoneNumber.trim(),
          };

    try {
      const response = await fetch(`${API_BASE}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.status === 201) {
        if (data.requiresEmailVerification) {
          setVerificationEmail(data?.user?.email || payload.email);
          setIsOtpStep(true);
          toast.success(data.message || "Account created. Enter the OTP sent to your email.");
          return;
        }

        toast.success(data.message || "Account created successfully.");
        navigate("/login");
        return;
      }

      if (response.status === 409 && data?.requiresEmailVerification) {
        setVerificationEmail(data.email || payload.email);
        setIsOtpStep(true);
        toast.info("This email is already registered but not verified. Enter OTP to continue.");
        return;
      }

      if (response.status === 400 || response.status === 409) {
        toast.error(data.message || "Validation failed.");
        return;
      }

      toast.error(data.message || "Failed to create account.");
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong. Try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (otpCode.length !== 6) {
      toast.error("Please enter the 6-digit OTP.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/auth/verify-registration-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: verificationEmail, code: otpCode }),
      });

      const data = await response.json();
      if (!response.ok) {
        toast.error(data.message || "Failed to verify OTP.");
        return;
      }

      toast.success(data.message || "Email verified successfully.");
      navigate("/login");
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong. Try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!verificationEmail) return;

    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/auth/resend-verification-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: verificationEmail }),
      });

      const data = await response.json();
      if (!response.ok) {
        toast.error(data.message || "Failed to resend OTP.");
        return;
      }

      toast.success(data.message || "OTP sent successfully.");
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong. Try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isOtpStep) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0F2854] via-[#1C4D8D] to-[#4988C4] flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#BDE8F5] rounded-full opacity-10 blur-3xl"></div>
          <div className="absolute top-1/2 -left-40 w-96 h-96 bg-[#4988C4] rounded-full opacity-10 blur-3xl"></div>
          <div className="absolute -bottom-40 right-1/4 w-80 h-80 bg-[#BDE8F5] rounded-full opacity-10 blur-3xl"></div>
        </div>

        <Card className="w-full max-w-md p-8 shadow-2xl relative z-10 bg-white/95 backdrop-blur-sm">
          <div className="flex flex-col items-center mb-6">
            <div className="p-3 bg-gradient-to-br from-[#1C4D8D] to-[#4988C4] rounded-xl mb-4 shadow-lg">
              <GraduationCap className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl text-center text-[#0F2854]">Verify Email</h1>
            <p className="text-sm text-[#1C4D8D] text-center mt-2">
              Enter the 6-digit OTP sent to <span className="font-semibold">{verificationEmail}</span>
            </p>
          </div>

          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <Label htmlFor="otp" className="text-[#0F2854]">
                OTP Code *
              </Label>
              <Input
                id="otp"
                inputMode="numeric"
                maxLength={6}
                value={otpCode}
                onChange={(e) =>
                  setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                disabled={isLoading}
                placeholder="Enter 6-digit code"
                className="mt-2 text-center text-xl tracking-widest border-[#4988C4]/30 focus:border-[#1C4D8D] focus:ring-[#1C4D8D]"
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading || otpCode.length !== 6}
              className="w-full bg-gradient-to-r from-[#1C4D8D] to-[#4988C4] hover:from-[#0F2854] hover:to-[#1C4D8D] text-white shadow-lg"
            >
              {isLoading ? "Verifying..." : "Verify OTP"}
            </Button>
          </form>

          <div className="mt-4 space-y-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleResendOtp}
              disabled={isLoading}
              className="w-full border-[#4988C4]/40 text-[#1C4D8D] hover:bg-[#BDE8F5]/20"
            >
              Resend OTP
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setIsOtpStep(false);
                setOtpCode("");
              }}
              disabled={isLoading}
              className="w-full text-[#1C4D8D]"
            >
              Back to Form
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F2854] via-[#1C4D8D] to-[#4988C4] flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#BDE8F5] rounded-full opacity-10 blur-3xl"></div>
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-[#4988C4] rounded-full opacity-10 blur-3xl"></div>
        <div className="absolute -bottom-40 right-1/4 w-80 h-80 bg-[#BDE8F5] rounded-full opacity-10 blur-3xl"></div>
      </div>

      <Card className="w-full max-w-2xl p-8 shadow-2xl relative z-10 bg-white/95 backdrop-blur-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="p-3 bg-gradient-to-br from-[#1C4D8D] to-[#4988C4] rounded-xl mb-4 shadow-lg">
            <GraduationCap className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl text-center mb-2 text-[#0F2854]">
            Create Account
          </h1>
          <p className="text-muted-foreground text-center text-[#1C4D8D]">
            Register as student or parent
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="mb-6">
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => handleUserTypeChange("student")}
                className={`flex-1 p-4 rounded-lg border-2 transition-all cursor-pointer ${
                  formData.userType === "student"
                    ? "border-[#1C4D8D] bg-[#4988C4]/20"
                    : "border-[#BDE8F5] bg-gradient-to-r from-[#BDE8F5]/10 to-transparent hover:border-[#4988C4]"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      formData.userType === "student"
                        ? "border-[#1C4D8D] bg-[#1C4D8D]"
                        : "border-[#1C4D8D]"
                    }`}
                  >
                    {formData.userType === "student" && (
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-[#BDE8F5] rounded-lg">
                      <BookOpen className="w-4 h-4 text-[#1C4D8D]" />
                    </div>
                    <span className="text-[#0F2854] font-medium">Student</span>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleUserTypeChange("parent")}
                className={`flex-1 p-4 rounded-lg border-2 transition-all cursor-pointer ${
                  formData.userType === "parent"
                    ? "border-[#1C4D8D] bg-[#4988C4]/20"
                    : "border-[#BDE8F5] bg-gradient-to-r from-[#BDE8F5]/10 to-transparent hover:border-[#4988C4]"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      formData.userType === "parent"
                        ? "border-[#1C4D8D] bg-[#1C4D8D]"
                        : "border-[#1C4D8D]"
                    }`}
                  >
                    {formData.userType === "parent" && (
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-[#BDE8F5] rounded-lg">
                      <Users className="w-4 h-4 text-[#1C4D8D]" />
                    </div>
                    <span className="text-[#0F2854] font-medium">
                      Parent/Guardian
                    </span>
                  </div>
                </div>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="firstName" className="text-[#0F2854]">
                First Name *
              </Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => handleInputChange("firstName", e.target.value)}
                disabled={isLoading}
                className="border-[#4988C4]/30 focus:border-[#1C4D8D] focus:ring-[#1C4D8D]"
              />
            </div>

            <div>
              <Label htmlFor="middleName" className="text-[#0F2854]">
                Middle Name
              </Label>
              <Input
                id="middleName"
                value={formData.middleName}
                onChange={(e) => handleInputChange("middleName", e.target.value)}
                disabled={isLoading}
                className="border-[#4988C4]/30 focus:border-[#1C4D8D] focus:ring-[#1C4D8D]"
              />
            </div>

            <div>
              <Label htmlFor="lastName" className="text-[#0F2854]">
                Last Name *
              </Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => handleInputChange("lastName", e.target.value)}
                disabled={isLoading}
                className="border-[#4988C4]/30 focus:border-[#1C4D8D] focus:ring-[#1C4D8D]"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="gender" className="text-[#0F2854]">
              Gender *
            </Label>
            <Select
              value={formData.gender}
              onValueChange={(value) => handleInputChange("gender", value)}
            >
              <SelectTrigger className="border-[#4988C4]/30 focus:border-[#1C4D8D]">
                <SelectValue placeholder="Select Gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.userType === "student" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="studentId" className="text-[#0F2854]">
                  Student ID *
                </Label>
                <Input
                  id="studentId"
                  value={formData.studentId}
                  onChange={(e) =>
                    handleInputChange("studentId", e.target.value)
                  }
                  disabled={isLoading}
                  className="border-[#4988C4]/30 focus:border-[#1C4D8D] focus:ring-[#1C4D8D]"
                />
              </div>

              <div>
                <Label htmlFor="birthdate" className="text-[#0F2854]">
                  Birthdate *
                </Label>
                <Input
                  id="birthdate"
                  type="date"
                  value={formData.birthdate}
                  onChange={(e) =>
                    handleInputChange("birthdate", e.target.value)
                  }
                  disabled={isLoading}
                  className="border-[#4988C4]/30 focus:border-[#1C4D8D] focus:ring-[#1C4D8D]"
                />
              </div>

              <div>
                <Label htmlFor="gradeSection" className="text-[#0F2854]">
                  Grade Section *
                </Label>
                <Input
                  id="gradeSection"
                  placeholder="Grade 10 - Lopez Jaena"
                  value={formData.gradeSection}
                  onChange={(e) =>
                    handleInputChange("gradeSection", e.target.value)
                  }
                  disabled={isLoading}
                  className="border-[#4988C4]/30 focus:border-[#1C4D8D] focus:ring-[#1C4D8D]"
                />
              </div>
            </div>
          )}

          {formData.userType === "parent" && (
            <div>
              <Label htmlFor="phoneNumber" className="text-[#0F2854]">
                Phone Number *
              </Label>
              <Input
                id="phoneNumber"
                type="tel"
                placeholder="+63 912 345 6789"
                value={formData.phoneNumber}
                onChange={(e) =>
                  handleInputChange("phoneNumber", e.target.value)
                }
                disabled={isLoading}
                className="border-[#4988C4]/30 focus:border-[#1C4D8D] focus:ring-[#1C4D8D]"
              />
            </div>
          )}

          <div>
            <Label htmlFor="email" className="text-[#0F2854]">
              Email *
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              disabled={isLoading}
              className="border-[#4988C4]/30 focus:border-[#1C4D8D] focus:ring-[#1C4D8D]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="password" className="text-[#0F2854]">
                Password *
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  disabled={isLoading}
                  className="border-[#4988C4]/30 focus:border-[#1C4D8D] focus:ring-[#1C4D8D]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  disabled={isLoading}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4988C4] hover:text-[#1C4D8D]"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                At least 8 chars with uppercase, lowercase, and number
              </p>
            </div>

            <div>
              <Label htmlFor="confirmPassword" className="text-[#0F2854]">
                Confirm Password *
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    handleInputChange("confirmPassword", e.target.value)
                  }
                  disabled={isLoading}
                  className="border-[#4988C4]/30 focus:border-[#1C4D8D] focus:ring-[#1C4D8D]"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  disabled={isLoading}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4988C4] hover:text-[#1C4D8D]"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <input
              type="checkbox"
              id="terms"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              disabled={isLoading}
              className="w-4 h-4 mt-1 rounded border-[#4988C4]/30 text-[#1C4D8D] focus:ring-[#1C4D8D]"
            />
            <Label
              htmlFor="terms"
              className="text-xs text-[#1C4D8D] cursor-pointer"
            >
              I agree to the Terms of Service and Privacy Policy
            </Label>
          </div>

          <Button
            type="submit"
            disabled={isLoading || !agreedToTerms}
            className="w-full bg-gradient-to-r from-[#1C4D8D] to-[#4988C4] hover:from-[#0F2854] hover:to-[#1C4D8D] text-white shadow-lg"
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
