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

// In-memory store to support forgot/reset flow without adding fields to User.
const passwordResetStore = new Map();

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
        userType: "student"
      });

      const student = await Student.create({
        userId: user._id,
        studentId: normalizedStudentId,
        firstName: normalizedFirstName,
        middleName: normalizedMiddleName,
        lastName: normalizedLastName,
        gender: normalizedGender,
        birthdate: parsedBirthdate,
        gradeSection: normalizedGradeSection
      });

      return res.status(201).json({
        message: "Student account created successfully",
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
      userType: "parent"
    });

    const parent = await Parent.create({
      userId: user._id,
      firstName: normalizedFirstName,
      middleName: normalizedMiddleName,
      lastName: normalizedLastName,
      gender: normalizedGender,
      email: normalizedEmail,
      phoneNumber: normalizedPhoneNumber,
      children: []
    });

    return res.status(201).json({
      message: "Parent account created successfully",
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

    const resetCode = crypto.randomInt(100000, 999999).toString();
    const hashedCode = await bcrypt.hash(resetCode, 10);

    passwordResetStore.set(normalizedEmail, {
      hashedCode,
      expiresAt: Date.now() + 10 * 60 * 1000
    });

    await sendMail(
      normalizedEmail,
      "Password Reset Code",
      `Your verification code is: <b>${resetCode}</b>. It expires in 10 minutes.`
    );

    res.json({ message: "Verification code sent to email" });
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

    const resetRecord = passwordResetStore.get(normalizedEmail);
    if (!resetRecord || resetRecord.expiresAt < Date.now()) {
      passwordResetStore.delete(normalizedEmail);
      return res.status(400).json({ message: "Invalid or expired code" });
    }

    const isMatch = await bcrypt.compare(code, resetRecord.hashedCode);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid or expired code" });
    }

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

    const resetRecord = passwordResetStore.get(normalizedEmail);
    if (!resetRecord || resetRecord.expiresAt < Date.now()) {
      passwordResetStore.delete(normalizedEmail);
      return res.status(400).json({ message: "Invalid or expired code" });
    }

    const isMatch = await bcrypt.compare(code, resetRecord.hashedCode);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid or expired code" });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(400).json({ message: "Invalid or expired code" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    passwordResetStore.delete(normalizedEmail);

    res.json({ message: "Password reset successful" });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  registerUser,
  loginUser,
  forgotPassword,
  verifyCode,
  resetPassword
};
