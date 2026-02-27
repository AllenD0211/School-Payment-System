const bcrypt = require("bcryptjs");
const User = require("../models/userModel");
const Student = require("../models/studentModel");
const Parent = require("../models/parentModel");
const { generateToken } = require("../utils/jwt");

// REGISTER
const registerUser = async (req, res) => {
  try {
    const {
      userType,
      email,
      password,

      // student profile
      studentId,
      firstName,
      middleName,
      lastName,
      gender,
      birthdate,
      gradeSection,

      // parent profile
      phoneNumber,
    } = req.body;

    if (!userType || !email || !password) {
      return res.status(400).json({ message: "Required fields missing" });
    }

    if (!["student", "parent"].includes(userType)) {
      return res.status(400).json({ message: "Invalid user type" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "Email already registered" });
    }

    if (userType === "student") {
      if (
        !studentId ||
        !firstName ||
        !lastName ||
        !gender ||
        !birthdate ||
        !gradeSection
      ) {
        return res.status(400).json({ message: "All student fields must be filled" });
      }

      const existingStudent = await Student.findOne({ studentId });
      if (existingStudent) {
        return res.status(409).json({ message: "Student ID already exists" });
      }
    }

    if (userType === "parent") {
      if (!firstName || !lastName || !gender || !phoneNumber) {
        return res.status(400).json({ message: "All parent fields must be filled" });
      }
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      email,
      password: hashedPassword,
      userType,
    });

    if (userType === "student") {
      await Student.create({
        userId: user._idt || user._id,
        studentId,
        firstName,
        middleName,
        lastName,
        gender,
        birthdate,
        gradeSection,
      });
    } else {
      await Parent.create({
        userId: user._id,
        firstName,
        middleName,
        lastName,
        gender,
        email,
        phoneNumber,
        children: [],
      });
    }

    res.status(201).json({ message: "Account created successfully" });
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

module.exports = { registerUser, loginUser };