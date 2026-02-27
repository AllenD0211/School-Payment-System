const bcrypt = require("bcryptjs");
const User = require("../models/userModel");
const Student = require("../models/studentModel");
const crypto = require("crypto");
const sendMail = require("../utils/mailer");
const { generateToken } = require("../utils/jwt");

// REGISTER
const registerUser = async (req, res) => {
  try {
    const {
      firstName,
      middleName,
      lastName,
      email,
      password,
      notificationMethod,
      notificationContact,
      studentID,
      gender,
      birthdate,
      gradeLevel,
      section,
      userType
    } = req.body;



    if (!firstName || !lastName || !email || !password || !userType || (userType === "student" && (!studentID || !gender || !birthdate || !gradeLevel || !section))) {
      return res.status(400).json({ message: "All required fields must be filled" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "User already exists" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    let user;

    if (userType === "parent") {
      user = await User.create({
        firstName,
        middleName,
        lastName,
        email,
        password: hashedPassword,
        notificationMethod,
        notificationContact,
        userType: "parent"
      });
    } else if (userType === "student") {
      user = await User.create({
        firstName,
        middleName,
        lastName,
        email,
        password: hashedPassword,
        userType: "student"
      });

      await Student.create({
        userId: user._id,
        studentId: studentID,
        gender,
        birthdate,
        gradeLevel,
        section
      });
    } else {
      return res.status(400).json({ message: "Invalid user type" });
    }

    res.status(201).json({
      message: "Account created successfully",
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// LOGIN
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ message: "Invalid email or password" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid email or password" });

    const token = generateToken({
      id: user._id,
      email: user.email,
      userType: user.userType
    });

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        userType: user.userType
      }
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// FORGOT PASSWORD
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.json({ message: "If that email exists, a reset code has been sent." });
    }

    const resetCode = crypto.randomInt(100000, 999999).toString();
    const hashedCode = await bcrypt.hash(resetCode, 10);

    user.resetCode = hashedCode;
    user.resetCodeExpiry = Date.now() + 10 * 60 * 1000;
    await user.save();

    await sendMail(
      email,
      "Password Reset Code",
      `Your verification code is: <b>${resetCode}</b>. It expires in 10 minutes.`
    );

    res.json({ message: "Verification code sent to email" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

const verifyCode = async (req, res) => {
  try {
    const { email, code } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid or expired code" });
    }

    const isMatch = await bcrypt.compare(code, user.resetCode);

    if (!isMatch || user.resetCodeExpiry < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired code" });
    }

    res.json({ message: "Code verified successfully" });

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired code" });
    }

    const isMatch = await bcrypt.compare(code, user.resetCode);

    if (!isMatch || user.resetCodeExpiry < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired code" });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    user.resetCode = undefined;
    user.resetCodeExpiry = undefined;

    await user.save();

    res.json({ message: "Password reset successful" });

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { registerUser, loginUser, forgotPassword, verifyCode, resetPassword };