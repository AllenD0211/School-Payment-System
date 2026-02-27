const bcrypt = require("bcryptjs");
const User = require("../models/userModel");
const Student = require("../models/studentModel");
const Parent = require("../models/parentModel");
const { generateToken } = require("../utils/jwt");

// REGISTER
const registerUser = async (req, res) => {
  try {
    const { email, password, userType, ...profile } = req.body;

    // basic validation
    if (!email || !password || !userType) {
      return res.status(400).json({ message: "Email, password and userType are required" });
    }
    if (!["student", "parent"].includes(userType)) {
      return res.status(400).json({ message: "Invalid userType" });
    }

    // check for existing email in users collection
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // create base user document
    const user = await User.create({
      email,
      password: hashedPassword,
      userType,
    });

    // create profile depending on type
    if (userType === "student") {
      const {
        studentId,
        firstName,
        middleName = "",
        lastName,
        gender,
        birthdate,
        gradeSection,
      } = profile;

      if (!studentId || !firstName || !lastName || !gender || !birthdate || !gradeSection) {
        // rollback user creation if profile incomplete
        await User.findByIdAndDelete(user._id);
        return res.status(400).json({ message: "All student profile fields are required" });
      }

      await Student.create({
        userId: user._id,
        studentId,
        firstName,
        middleName,
        lastName,
        gender,
        birthdate,
        gradeSection,
      });
    } else if (userType === "parent") {
      const {
        firstName,
        middleName = "",
        lastName,
        gender,
        phoneNumber,
      } = profile;

      if (!firstName || !lastName || !gender || !phoneNumber) {
        await User.findByIdAndDelete(user._id);
        return res.status(400).json({ message: "All parent profile fields are required" });
      }

      await Parent.create({
        userId: user._id,
        firstName,
        middleName,
        lastName,
        gender,
        email, // reference
        phoneNumber,
        children: [],
      });
    }

    res.status(201).json({ message: "Account created successfully", user: { id: user._id, email: user.email, userType: user.userType } });
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
    if (!user) return res.status(400).json({ message: "Invalid email or password" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid email or password" });

    const token = generateToken({ id: user._id, email: user.email, userType: user.userType });

    // fetch profile names for response
    let profileData = {};
    if (user.userType === "student") {
      const student = await Student.findOne({ userId: user._id });
      if (student) {
        profileData = {
          firstName: student.firstName,
          middleName: student.middleName,
          lastName: student.lastName,
        };
      }
    } else if (user.userType === "parent") {
      const parent = await Parent.findOne({ userId: user._id });
      if (parent) {
        profileData = {
          firstName: parent.firstName,
          middleName: parent.middleName,
          lastName: parent.lastName,
          children: parent.children || [],
        };
      }
    }

    res.json({
      message: "Login successful",
      token,
      user: { id: user._id, email: user.email, userType: user.userType, ...profileData },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { registerUser, loginUser };
