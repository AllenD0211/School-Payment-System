const User = require("../models/userModel");
const Student = require("../models/studentModel");

// GET total students
const getTotalStudents = async (req, res) => {
  try {
    const totalStudents = await User.countDocuments({ userType: "student" });

    res.status(200).json({
      success: true,
      totalStudents
    });

  } catch (error) {
    console.error("Error fetching total students:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

// GET all students
const getAllStudents = async (req, res) => {
  try {
    const students = await Student.find()
    .populate("userId", "firstName lastName email notificationMethod notificationContact");

    res.status(200).json({
      success: true,
      students
    });

  } catch (error) {
    console.error("Error fetching students:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

module.exports = {
  getTotalStudents,
  getAllStudents
};