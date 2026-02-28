const Student = require("../models/studentModel");
const Parent = require("../models/parentModel");
const User = require("../models/userModel");
const Notification = require("../models/notificationModel");
const sendMail = require("../utils/mailer");

const fullName = (firstName, middleName, lastName) =>
  [firstName, middleName, lastName].filter(Boolean).join(" ").replace(/\s+/g, " ").trim();

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

const notifyParentByStudentAction = async (req, res) => {
  try {
    const studentUserId = String(req.params.userId || "").trim();
    const actionType = String(req.body?.actionType || "performed an action").trim();
    const customSubject = String(req.body?.subject || "").trim();
    const customMessage = String(req.body?.message || "").trim();

    if (!studentUserId) {
      return res.status(400).json({ success: false, message: "student userId is required" });
    }

    const student = await Student.findOne({ userId: studentUserId }).lean();
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    const parent = student.parentId
      ? await Parent.findById(student.parentId).lean()
      : await Parent.findOne({ children: student.userId }).lean();

    if (!parent) {
      return res.status(404).json({ success: false, message: "Parent not linked to student" });
    }

    const parentUser = await User.findById(parent.userId).lean();
    if (!parentUser?.email) {
      return res.status(400).json({ success: false, message: "Parent email not found" });
    }

    const studentName =
      fullName(student.firstName, student.middleName, student.lastName) || student.studentId;
    const subject = customSubject || "Student Activity Notification";
    const textMessage =
      customMessage ||
      `Hello Parent/Guardian,\n\n${studentName} (${student.studentId}) has ${actionType}.\n\nThis is an automated notice from the School Payment System.`;
    const htmlMessage = `<div style="font-family: Arial, sans-serif; line-height: 1.5; color: #0F2854;">
      ${textMessage.replace(/\n/g, "<br>")}
    </div>`;

    await sendMail(parentUser.email, subject, htmlMessage, {
      html: true,
      text: textMessage
    });

    const notification = await Notification.create({
      studentId: student._id,
      recipient: parentUser.email,
      method: "email",
      message: textMessage,
      status: "sent"
    });

    return res.status(200).json({
      success: true,
      message: "Parent notification sent successfully",
      notification: {
        id: notification._id,
        recipient: notification.recipient,
        method: notification.method,
        status: notification.status,
        timestamp: notification.createdAt
      }
    });
  } catch (error) {
    console.error("Notify parent by student action error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  getStudents,
  getStudentByUserId,
  updateStudent,
  deleteStudent,
  notifyParentByStudentAction
};
