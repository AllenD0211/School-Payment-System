const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const User = require("../models/userModel");
const Student = require("../models/studentModel");
const Parent = require("../models/parentModel");
const sendMail = require("../utils/mailer");
const { generateToken } = require("../utils/jwt");

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const VALID_USER_TYPES = new Set(["student", "parent"]);
const OTP_EXPIRY_MS = 10 * 60 * 1000;

const normalizeGender = (value) => {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "male") return "Male";
  if (normalized === "female") return "Female";
  if (normalized === "other") return "Other";
  return null;
};

const isStrongPassword = (password) => PASSWORD_REGEX.test(String(password || ""));

const normalizeEmail = (email) => String(email || "").trim().toLowerCase();

const parseDate = (dateInput) => {
  const parsed = new Date(dateInput);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const generateOtpCode = () => crypto.randomInt(100000, 1000000).toString();

const buildOtpHtml = (heading, otpCode, description) => `
  <div style="font-family: Arial, sans-serif; color: #0F2854; line-height: 1.5;">
    <h2 style="margin: 0 0 8px;">${heading}</h2>
    <p style="margin: 0 0 16px;">${description}</p>
    <div style="font-size: 28px; font-weight: 700; letter-spacing: 4px; margin: 0 0 16px;">
      ${otpCode}
    </div>
    <p style="margin: 0; color: #4b5563;">This OTP expires in 10 minutes.</p>
  </div>
`;

const clearEmailVerificationState = (user) => {
  user.emailVerification = {
    otpHash: null,
    expiresAt: null,
    verifiedAt: new Date()
  };
};

const clearPasswordResetState = (user) => {
  user.passwordReset = {
    otpHash: null,
    expiresAt: null,
    verifiedAt: null
  };
};

const setEmailVerificationOtp = async (user) => {
  const otpCode = generateOtpCode();
  user.isVerified = false;
  user.emailVerification = {
    otpHash: await bcrypt.hash(otpCode, 10),
    expiresAt: new Date(Date.now() + OTP_EXPIRY_MS),
    verifiedAt: null
  };
  await user.save();

  const text = `Your email verification code is ${otpCode}. It expires in 10 minutes.`;
  const html = buildOtpHtml(
    "Verify Your Email",
    otpCode,
    "Use this OTP to complete your account verification.",
  );

  await sendMail(user.email, "Email Verification Code", html, {
    html: true,
    text
  });
};

const setPasswordResetOtp = async (user) => {
  const otpCode = generateOtpCode();
  user.passwordReset = {
    otpHash: await bcrypt.hash(otpCode, 10),
    expiresAt: new Date(Date.now() + OTP_EXPIRY_MS),
    verifiedAt: null
  };
  await user.save();

  const text = `Your password reset code is ${otpCode}. It expires in 10 minutes.`;
  const html = buildOtpHtml(
    "Reset Your Password",
    otpCode,
    "Use this OTP to continue resetting your account password.",
  );

  await sendMail(user.email, "Password Reset Code", html, {
    html: true,
    text
  });
};

const handleDuplicateKeyError = (error, res) => {
  if (error?.code !== 11000) return false;

  if (error.keyPattern?.email) {
    res.status(409).json({ message: "Email already exists" });
    return true;
  }

  if (error.keyPattern?.studentId) {
    res.status(409).json({ message: "Student ID already exists" });
    return true;
  }

  res.status(409).json({ message: "Duplicate data found" });
  return true;
};

const registerUser = async (req, res) => {
  let user = null;
  let student = null;
  let parent = null;

  try {
    const {
      userType,
      email,
      password,
      studentId,
      firstName,
      middleName,
      lastName,
      gender,
      birthdate,
      gradeSection,
      phoneNumber
    } = req.body;

    const normalizedUserType = String(userType || "").trim().toLowerCase();
    const normalizedEmail = normalizeEmail(email);
    const normalizedFirstName = String(firstName || "").trim();
    const normalizedMiddleName = String(middleName || "").trim();
    const normalizedLastName = String(lastName || "").trim();
    const normalizedGender = normalizeGender(gender);

    if (!VALID_USER_TYPES.has(normalizedUserType)) {
      return res.status(400).json({ message: "userType must be student or parent" });
    }

    if (!normalizedEmail || !password || !normalizedFirstName || !normalizedLastName || !normalizedGender) {
      return res.status(400).json({ message: "All required fields must be filled" });
    }

    if (!EMAIL_REGEX.test(normalizedEmail)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    if (!isStrongPassword(password)) {
      return res.status(400).json({
        message: "Password must be at least 8 characters with uppercase, lowercase, and number"
      });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      if (existingUser.isVerified === false) {
        return res.status(409).json({
          message: "Email already registered but not yet verified",
          requiresEmailVerification: true,
          email: existingUser.email
        });
      }
      return res.status(409).json({ message: "Email already exists" });
    }

    if (normalizedUserType === "student") {
      const normalizedStudentId = String(studentId || "").trim();
      const normalizedGradeSection = String(gradeSection || "").trim();
      const normalizedBirthdate = String(birthdate || "").trim();

      if (!DATE_REGEX.test(normalizedBirthdate)) {
        return res.status(400).json({ message: "Birthdate must be in YYYY-MM-DD format" });
      }

      const parsedBirthdate = parseDate(normalizedBirthdate);

      if (!normalizedStudentId || !normalizedGradeSection || !parsedBirthdate) {
        return res.status(400).json({ message: "Student ID, birthdate, and gradeSection are required" });
      }

      const existingStudentId = await Student.findOne({ studentId: normalizedStudentId });
      if (existingStudentId) {
        return res.status(409).json({ message: "Student ID already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      user = await User.create({
        email: normalizedEmail,
        password: hashedPassword,
        userType: "student",
        isVerified: false
      });

      student = await Student.create({
        userId: user._id,
        studentId: normalizedStudentId,
        firstName: normalizedFirstName,
        middleName: normalizedMiddleName,
        lastName: normalizedLastName,
        gender: normalizedGender,
        birthdate: parsedBirthdate,
        gradeSection: normalizedGradeSection
      });

      await setEmailVerificationOtp(user);

      return res.status(201).json({
        message: "Student account created. Verify your email using the OTP sent.",
        requiresEmailVerification: true,
        user: {
          id: user._id,
          email: user.email,
          userType: user.userType
        },
        student: {
          id: student._id,
          studentId: student.studentId
        }
      });
    }

    const normalizedPhoneNumber = String(phoneNumber || "").trim();
    if (!normalizedPhoneNumber) {
      return res.status(400).json({ message: "Phone number is required for parent accounts" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    user = await User.create({
      email: normalizedEmail,
      password: hashedPassword,
      userType: "parent",
      isVerified: false
    });

    parent = await Parent.create({
      userId: user._id,
      firstName: normalizedFirstName,
      middleName: normalizedMiddleName,
      lastName: normalizedLastName,
      gender: normalizedGender,
      phoneNumber: normalizedPhoneNumber,
      children: []
    });

    await setEmailVerificationOtp(user);

    return res.status(201).json({
      message: "Parent account created. Verify your email using the OTP sent.",
      requiresEmailVerification: true,
      user: {
        id: user._id,
        email: user.email,
        userType: user.userType
      },
      parent: {
        id: parent._id
      }
    });
  } catch (error) {
    if (student?._id) {
      await Student.findByIdAndDelete(student._id);
    }

    if (parent?._id) {
      await Parent.findByIdAndDelete(parent._id);
    }

    if (user?._id) {
      await User.findByIdAndDelete(user._id);
    }

    if (handleDuplicateKeyError(error, res)) {
      return;
    }

    console.error("Register error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    if (user.userType !== "admin" && user.isVerified === false) {
      user.isVerified = true;
      user.emailVerification = {
        otpHash: null,
        expiresAt: null,
        verifiedAt: new Date()
      };
      await user.save();
    }

    const token = generateToken({
      id: user._id,
      email: user.email,
      userType: user.userType
    });

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        email: user.email,
        userType: user.userType
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const normalizedEmail = normalizeEmail(req.body?.email);

    if (!normalizedEmail || !EMAIL_REGEX.test(normalizedEmail)) {
      return res.status(400).json({ message: "Valid email is required" });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.json({ message: "If that email exists, a reset code has been sent." });
    }

    await setPasswordResetOtp(user);

    res.json({ message: "If that email exists, a reset code has been sent." });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const verifyCode = async (req, res) => {
  try {
    const normalizedEmail = normalizeEmail(req.body?.email);
    const code = String(req.body?.code || "").trim();

    if (!normalizedEmail || !code) {
      return res.status(400).json({ message: "Email and code are required" });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(400).json({ message: "Invalid or expired code" });
    }

    const resetRecord = user.passwordReset || {};
    const expiresAt = resetRecord.expiresAt ? new Date(resetRecord.expiresAt).getTime() : 0;

    if (!resetRecord.otpHash || !expiresAt || expiresAt < Date.now()) {
      clearPasswordResetState(user);
      await user.save();
      return res.status(400).json({ message: "Invalid or expired code" });
    }

    const isMatch = await bcrypt.compare(code, resetRecord.otpHash);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid or expired code" });
    }

    user.passwordReset = {
      ...user.passwordReset,
      verifiedAt: new Date()
    };
    await user.save();

    res.json({ message: "Code verified successfully" });
  } catch (error) {
    console.error("Verify code error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const resetPassword = async (req, res) => {
  try {
    const normalizedEmail = normalizeEmail(req.body?.email);
    const code = String(req.body?.code || "").trim();
    const newPassword = String(req.body?.newPassword || "");

    if (!normalizedEmail || !code || !newPassword) {
      return res.status(400).json({ message: "Email, code, and newPassword are required" });
    }

    if (!isStrongPassword(newPassword)) {
      return res.status(400).json({
        message: "Password must be at least 8 characters with uppercase, lowercase, and number"
      });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(400).json({ message: "Invalid or expired code" });
    }

    const resetRecord = user.passwordReset || {};
    const expiresAt = resetRecord.expiresAt ? new Date(resetRecord.expiresAt).getTime() : 0;

    if (!resetRecord.otpHash || !expiresAt || expiresAt < Date.now()) {
      clearPasswordResetState(user);
      await user.save();
      return res.status(400).json({ message: "Invalid or expired code" });
    }

    const isMatch = await bcrypt.compare(code, resetRecord.otpHash);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid or expired code" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    clearPasswordResetState(user);
    await user.save();

    res.json({ message: "Password reset successful" });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const verifyRegistrationOtp = async (req, res) => {
  try {
    const normalizedEmail = normalizeEmail(req.body?.email);
    const code = String(req.body?.code || "").trim();

    if (!normalizedEmail || !code) {
      return res.status(400).json({ message: "Email and code are required" });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(400).json({ message: "Invalid or expired code" });
    }

    if (user.isVerified === true) {
      return res.json({ message: "Email is already verified" });
    }

    const verificationRecord = user.emailVerification || {};
    const expiresAt = verificationRecord.expiresAt
      ? new Date(verificationRecord.expiresAt).getTime()
      : 0;

    if (!verificationRecord.otpHash || !expiresAt || expiresAt < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired code" });
    }

    const isMatch = await bcrypt.compare(code, verificationRecord.otpHash);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid or expired code" });
    }

    user.isVerified = true;
    clearEmailVerificationState(user);
    await user.save();

    return res.json({ message: "Email verified successfully" });
  } catch (error) {
    console.error("Verify registration OTP error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

const resendVerificationOtp = async (req, res) => {
  try {
    const normalizedEmail = normalizeEmail(req.body?.email);

    if (!normalizedEmail || !EMAIL_REGEX.test(normalizedEmail)) {
      return res.status(400).json({ message: "Valid email is required" });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.json({ message: "If the account exists, a verification code has been sent." });
    }

    if (user.isVerified === true) {
      return res.status(400).json({ message: "Email is already verified" });
    }

    await setEmailVerificationOtp(user);

    return res.json({ message: "Verification code sent to email" });
  } catch (error) {
    console.error("Resend verification OTP error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  registerUser,
  loginUser,
  forgotPassword,
  verifyCode,
  resetPassword,
  verifyRegistrationOtp,
  resendVerificationOtp
};
