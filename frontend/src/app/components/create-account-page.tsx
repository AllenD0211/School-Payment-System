import { useState } from "react";
import { Card } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Button } from "@/app/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/app/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { GraduationCap, Eye, EyeOff, Users, BookOpen, Mail, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function CreateAccountPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    userType: "student" as "student" | "parent",
    // Student fields
    studentID: "",
    firstName: "",
    lastName: "",
    middleName: "",
    gender: "",
    birthdate: "",
    gradeLevel: "",
    section: "",
    email: "",
    password: "",
    confirmPassword: "",
    // Parent fields
    parentFirstName: "",
    parentMiddleName: "",
    parentLastName: "",
    parentEmail: "",
    parentPassword: "",
    parentConfirmPassword: "",
  });

  const [notificationMethod, setNotificationMethod] = useState<"email" | "phone">("email");
  const [notificationContact, setNotificationContact] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Validation helpers
  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validatePhone = (phone: string) => {
    return /^[\d\s\-\+\(\)]{10,}$/.test(phone.replace(/\s/g, ""));
  };

  const validatePassword = (password: string) => {
    return (
      password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /[0-9]/.test(password)
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.userType === "student") {
      // Student validation
      if (
        !formData.studentID.trim() ||
        !formData.firstName.trim() ||
        !formData.lastName.trim() ||
        !formData.gender.trim() ||
        !formData.birthdate.trim() ||
        !formData.gradeLevel.trim() ||
        !formData.section.trim() ||
        !formData.email.trim() ||
        !formData.password.trim() ||
        !formData.confirmPassword.trim()
      ) {
        toast.error("Please fill in all required fields");
        return;
      }

      if (!validateEmail(formData.email)) {
        toast.error("Please enter a valid email address");
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        toast.error("Passwords do not match");
        return;
      }

      if (!validatePassword(formData.password)) {
        toast.error(
          "Password must be at least 8 characters with uppercase, lowercase, and number"
        );
        return;
      }
    } else {
      // Parent validation
      if (
        !formData.parentFirstName.trim() ||
        !formData.parentLastName.trim() ||
        !formData.parentEmail.trim() ||
        !formData.parentPassword.trim() ||
        !formData.parentConfirmPassword.trim()
      ) {
        toast.error("Please fill in all required fields");
        return;
      }

      if (!validateEmail(formData.parentEmail)) {
        toast.error("Please enter a valid email address");
        return;
      }

      if (formData.parentPassword !== formData.parentConfirmPassword) {
        toast.error("Passwords do not match");
        return;
      }

      if (!validatePassword(formData.parentPassword)) {
        toast.error(
          "Password must be at least 8 characters with uppercase, lowercase, and number"
        );
        return;
      }

      if (!notificationContact.trim()) {
        toast.error(
          `Please enter your ${
            notificationMethod === "email" ? "email address" : "phone number"
          }`
        );
        return;
      }

      if (notificationMethod === "email" && !validateEmail(notificationContact)) {
        toast.error("Please enter a valid email address");
        return;
      }

      if (notificationMethod === "phone" && !validatePhone(notificationContact)) {
        toast.error("Please enter a valid phone number (at least 10 digits)");
        return;
      }
    }

    if (!agreedToTerms) {
      toast.error("Please agree to the Terms and Conditions");
      return;
    }

    setIsLoading(true);

    try {
      let payload: Record<string, any> = {
        userType: formData.userType,
      };

      if (formData.userType === "student") {
        payload = {
          ...payload,
          studentID: formData.studentID.trim(),
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          middleName: formData.middleName.trim(),
          gender: formData.gender,
          birthdate: formData.birthdate,
          gradeLevel: formData.gradeLevel,
          section: formData.section.trim(),
          email: formData.email.trim(),
          password: formData.password,
        };
      } else {
        payload = {
          ...payload,
          firstName: formData.parentFirstName.trim(),
          middleName: formData.parentMiddleName.trim(),
          lastName: formData.parentLastName.trim(),
          email: formData.parentEmail.trim(),
          password: formData.parentPassword,
          notificationMethod,
          notificationContact: notificationContact.trim(),
        };
      }

      const response = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Account created successfully!");
        setIsLoading(false);
        setTimeout(() => {
          navigate("/login");
        }, 1500);
      } else {
        toast.error(data.message || "Failed to create account");
        setIsLoading(false);
      }
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong. Try again later.");
      setIsLoading(false);
    }
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
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="p-3 bg-gradient-to-br from-[#1C4D8D] to-[#4988C4] rounded-xl mb-4 shadow-lg">
            <GraduationCap className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl text-center mb-2 text-[#0F2854]">
            Create Account
          </h1>
          <p className="text-muted-foreground text-center text-[#1C4D8D]">
            Join the Student Fee Management System
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* User Type Selection - Horizontal */}
          <div className="mb-6">
            <RadioGroup
              value={formData.userType}
              onValueChange={(value: "student" | "parent") => {
                setFormData((prev) => ({
                  ...prev,
                  userType: value,
                }));
                setNotificationMethod("email");
                setNotificationContact("");
              }}
            >
              <div className="flex gap-4">
                {/* Student Option */}
                <div className="flex items-center flex-1 p-4 rounded-lg border-2 border-[#BDE8F5] hover:border-[#4988C4] transition-colors cursor-pointer bg-gradient-to-r from-[#BDE8F5]/10 to-transparent">
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem
                      value="student"
                      id="student-type"
                      className="border-[#1C4D8D]"
                    />
                    <Label
                      htmlFor="student-type"
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <div className="p-2 bg-[#BDE8F5] rounded-lg">
                        <BookOpen className="w-4 h-4 text-[#1C4D8D]" />
                      </div>
                      <span className="text-[#0F2854] font-medium">Student</span>
                    </Label>
                  </div>
                </div>

                {/* Parent Option */}
                <div className="flex items-center flex-1 p-4 rounded-lg border-2 border-[#BDE8F5] hover:border-[#4988C4] transition-colors cursor-pointer bg-gradient-to-r from-[#BDE8F5]/10 to-transparent">
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem
                      value="parent"
                      id="parent-type"
                      className="border-[#1C4D8D]"
                    />
                    <Label
                      htmlFor="parent-type"
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <div className="p-2 bg-[#BDE8F5] rounded-lg">
                        <Users className="w-4 h-4 text-[#1C4D8D]" />
                      </div>
                      <span className="text-[#0F2854] font-medium">Parent/Guardian</span>
                    </Label>
                  </div>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* STUDENT FORM */}
          {formData.userType === "student" && (
            <>
              {/* Student ID */}
              <div>
                <Label htmlFor="studentID" className="text-[#0F2854]">
                  Student ID *
                </Label>
                <Input
                  id="studentID"
                  type="text"
                  placeholder="Enter your Student ID"
                  value={formData.studentID}
                  onChange={(e) => handleInputChange("studentID", e.target.value)}
                  disabled={isLoading}
                  className="border-[#4988C4]/30 focus:border-[#1C4D8D] focus:ring-[#1C4D8D]"
                />
              </div>

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
                    onChange={(e) =>
                      handleInputChange("firstName", e.target.value)
                    }
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
                    type="text"
                    placeholder="Middle Name (Optional)"
                    value={formData.middleName}
                    onChange={(e) =>
                      handleInputChange("middleName", e.target.value)
                    }
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
                    type="text"
                    placeholder="Last Name"
                    value={formData.lastName}
                    onChange={(e) =>
                      handleInputChange("lastName", e.target.value)
                    }
                    disabled={isLoading}
                    className="border-[#4988C4]/30 focus:border-[#1C4D8D] focus:ring-[#1C4D8D]"
                  />
                </div>
              </div>

              {/* Gender and Birthdate */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="gender" className="text-[#0F2854]">
                    Gender *
                  </Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(value) =>
                      handleInputChange("gender", value)
                    }
                  >
                    <SelectTrigger className="border-[#4988C4]/30 focus:border-[#1C4D8D]">
                      <SelectValue placeholder="Select Gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
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
              </div>

              {/* Grade Level and Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="gradeLevel" className="text-[#0F2854]">
                    Grade / Year Level *
                  </Label>
                  <Select
                    value={formData.gradeLevel}
                    onValueChange={(value) =>
                      handleInputChange("gradeLevel", value)
                    }
                  >
                    <SelectTrigger className="border-[#4988C4]/30 focus:border-[#1C4D8D]">
                      <SelectValue placeholder="Select Grade Level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="grade7">Grade 7</SelectItem>
                      <SelectItem value="grade8">Grade 8</SelectItem>
                      <SelectItem value="grade9">Grade 9</SelectItem>
                      <SelectItem value="grade10">Grade 10</SelectItem>
                      <SelectItem value="grade11">Grade 11</SelectItem>
                      <SelectItem value="grade12">Grade 12</SelectItem>
                      <SelectItem value="1st-year">1st Year</SelectItem>
                      <SelectItem value="2nd-year">2nd Year</SelectItem>
                      <SelectItem value="3rd-year">3rd Year</SelectItem>
                      <SelectItem value="4th-year">4th Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="section" className="text-[#0F2854]">
                    Section *
                  </Label>
                  <Input
                    id="section"
                    type="text"
                    placeholder="e.g., A, B, C or Section Name"
                    value={formData.section}
                    onChange={(e) =>
                      handleInputChange("section", e.target.value)
                    }
                    disabled={isLoading}
                    className="border-[#4988C4]/30 focus:border-[#1C4D8D] focus:ring-[#1C4D8D]"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <Label htmlFor="email" className="text-[#0F2854]">
                  Email (Username) *
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

              {/* Password */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="password" className="text-[#0F2854]">
                    Password *
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="At least 8 characters"
                      value={formData.password}
                      onChange={(e) =>
                        handleInputChange("password", e.target.value)
                      }
                      disabled={isLoading}
                      className="border-[#4988C4]/30 focus:border-[#1C4D8D] focus:ring-[#1C4D8D]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4988C4] hover:text-[#1C4D8D]"
                      disabled={isLoading}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Must contain uppercase, lowercase, and number
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
                      placeholder="Re-enter your password"
                      value={formData.confirmPassword}
                      onChange={(e) =>
                        handleInputChange("confirmPassword", e.target.value)
                      }
                      disabled={isLoading}
                      className="border-[#4988C4]/30 focus:border-[#1C4D8D] focus:ring-[#1C4D8D]"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4988C4] hover:text-[#1C4D8D]"
                      disabled={isLoading}
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
            </>
          )}

          {/* PARENT FORM */}
          {formData.userType === "parent" && (
            <>
              {/* Parent Name Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="parentFirstName" className="text-[#0F2854]">
                    First Name *
                  </Label>
                  <Input
                    id="parentFirstName"
                    type="text"
                    placeholder="First Name"
                    value={formData.parentFirstName}
                    onChange={(e) =>
                      handleInputChange("parentFirstName", e.target.value)
                    }
                    disabled={isLoading}
                    className="border-[#4988C4]/30 focus:border-[#1C4D8D] focus:ring-[#1C4D8D]"
                  />
                </div>

                <div>
                  <Label htmlFor="parentMiddleName" className="text-[#0F2854]">
                    Middle Name
                  </Label>
                  <Input
                    id="parentMiddleName"
                    type="text"
                    placeholder="Middle Name (Optional)"
                    value={formData.parentMiddleName}
                    onChange={(e) =>
                      handleInputChange("parentMiddleName", e.target.value)
                    }
                    disabled={isLoading}
                    className="border-[#4988C4]/30 focus:border-[#1C4D8D] focus:ring-[#1C4D8D]"
                  />
                </div>

                <div>
                  <Label htmlFor="parentLastName" className="text-[#0F2854]">
                    Last Name (Surname) *
                  </Label>
                  <Input
                    id="parentLastName"
                    type="text"
                    placeholder="Last Name"
                    value={formData.parentLastName}
                    onChange={(e) =>
                      handleInputChange("parentLastName", e.target.value)
                    }
                    disabled={isLoading}
                    className="border-[#4988C4]/30 focus:border-[#1C4D8D] focus:ring-[#1C4D8D]"
                  />
                </div>
              </div>

              {/* Parent Email & Password */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="parentEmail" className="text-[#0F2854]">
                    Email Address *
                  </Label>
                  <Input
                    id="parentEmail"
                    type="email"
                    placeholder="your.email@example.com"
                    value={formData.parentEmail}
                    onChange={(e) =>
                      handleInputChange("parentEmail", e.target.value)
                    }
                    disabled={isLoading}
                    className="border-[#4988C4]/30 focus:border-[#1C4D8D] focus:ring-[#1C4D8D]"
                  />
                </div>

                <div>
                  <Label htmlFor="parentPassword" className="text-[#0F2854]">
                    Password *
                  </Label>
                  <div className="relative">
                    <Input
                      id="parentPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="At least 8 characters"
                      value={formData.parentPassword}
                      onChange={(e) =>
                        handleInputChange("parentPassword", e.target.value)
                      }
                      disabled={isLoading}
                      className="border-[#4988C4]/30 focus:border-[#1C4D8D] focus:ring-[#1C4D8D]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4988C4] hover:text-[#1C4D8D]"
                      disabled={isLoading}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Must contain uppercase, lowercase, and number
                  </p>
                </div>
              </div>

              {/* Parent Confirm Password */}
              <div>
                <Label htmlFor="parentConfirmPassword" className="text-[#0F2854]">
                  Confirm Password *
                </Label>
                <div className="relative">
                  <Input
                    id="parentConfirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Re-enter your password"
                    value={formData.parentConfirmPassword}
                    onChange={(e) =>
                      handleInputChange("parentConfirmPassword", e.target.value)
                    }
                    disabled={isLoading}
                    className="border-[#4988C4]/30 focus:border-[#1C4D8D] focus:ring-[#1C4D8D]"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword(!showConfirmPassword)
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4988C4] hover:text-[#1C4D8D]"
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
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
                    <RadioGroupItem
                      value="email"
                      id="email-notification"
                      className="border-[#1C4D8D]"
                    />
                    <Label
                      htmlFor="email-notification"
                      className="flex items-center gap-3 cursor-pointer flex-1"
                    >
                      <div className="p-2 bg-[#BDE8F5] rounded-lg">
                        <Mail className="w-5 h-5 text-[#1C4D8D]" />
                      </div>
                      <div>
                        <p className="text-[#0F2854]">Email</p>
                        <p className="text-sm text-muted-foreground">
                          Receive notifications via email
                        </p>
                      </div>
                    </Label>
                  </div>

                  {/* Phone Option */}
                  <div className="flex items-center space-x-3 p-4 rounded-lg border-2 border-[#BDE8F5] hover:border-[#4988C4] transition-colors cursor-pointer bg-gradient-to-r from-[#BDE8F5]/10 to-transparent">
                    <RadioGroupItem
                      value="phone"
                      id="phone-notification"
                      className="border-[#1C4D8D]"
                    />
                    <Label
                      htmlFor="phone-notification"
                      className="flex items-center gap-3 cursor-pointer flex-1"
                    >
                      <div className="p-2 bg-[#BDE8F5] rounded-lg">
                        <Smartphone className="w-5 h-5 text-[#1C4D8D]" />
                      </div>
                      <div>
                        <p className="text-[#0F2854]">Phone Number</p>
                        <p className="text-sm text-muted-foreground">
                          Receive notifications via SMS
                        </p>
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
                      Email Address *
                    </Label>
                    <Input
                      id="notificationEmail"
                      type="email"
                      placeholder="your.email@example.com"
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
            </>
          )}

          {/* Terms & Conditions */}
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