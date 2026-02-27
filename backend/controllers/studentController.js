const Student = require("../models/studentModel");

const getStudents = async (req, res) => {
  try {
    const students = await Student.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      students
    });
  } catch (error) {
    console.error("Get students error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const getStudentByUserId = async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.params.userId })
      .populate("userId", "email userType")
      .lean();
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    const user = student.userId && typeof student.userId === "object" ? student.userId : null;

    res.status(200).json({
      success: true,
      student: {
        _id: student._id,
        userId: user?._id || student.userId,
        studentId: student.studentId,
        firstName: student.firstName,
        middleName: student.middleName,
        lastName: student.lastName,
        gender: student.gender,
        birthdate: student.birthdate,
        gradeSection: student.gradeSection,
        parentId: student.parentId,
        connectedToParent: student.connectedToParent,
        createdAt: student.createdAt,
        updatedAt: student.updatedAt,
        email: user?.email || ""
      }
    });
  } catch (error) {
    console.error("Get student error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const updateStudent = async (req, res) => {
  try {
    const allowedFields = ["firstName", "middleName", "lastName", "gender", "birthdate", "gradeSection"];
    const updates = {};

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const student = await Student.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true
    });

    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    res.status(200).json({ success: true, student });
  } catch (error) {
    console.error("Update student error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const deleteStudent = async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    res.status(200).json({ success: true, message: "Student deleted" });
  } catch (error) {
    console.error("Delete student error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  getStudents,
  getStudentByUserId,
  updateStudent,
  deleteStudent
};
