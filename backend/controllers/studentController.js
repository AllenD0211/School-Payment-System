const Student = require("../models/studentModel");
const Parent = require("../models/parentModel");
const User = require("../models/userModel");
const Notification = require("../models/notificationModel");
const ParentLinkRequest = require("../models/parentLinkRequestModel");
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

const getPendingParentLinkRequests = async (req, res) => {
  try {
    const studentUserId = String(req.params.userId || "").trim();
    if (!studentUserId) {
      return res.status(400).json({
        success: false,
        message: "student userId is required"
      });
    }

    const student = await Student.findOne({ userId: studentUserId }).lean();
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }

    const requests = await ParentLinkRequest.find({
      studentUserId: student.userId,
      status: "pending"
    })
      .sort({ createdAt: -1 })
      .lean();

    if (!requests.length) {
      return res.status(200).json({
        success: true,
        requests: []
      });
    }

    const parentIds = requests
      .map((request) => request.parentId)
      .filter(Boolean);
    const parents = await Parent.find({
      _id: { $in: parentIds }
    }).lean();
    const parentById = new Map(
      parents.map((parent) => [String(parent._id), parent])
    );

    const parentUserIds = parents
      .map((parent) => parent.userId)
      .filter(Boolean);
    const parentUsers = await User.find({
      _id: { $in: parentUserIds }
    })
      .select("email")
      .lean();
    const parentUserById = new Map(
      parentUsers.map((parentUser) => [String(parentUser._id), parentUser])
    );

    const formattedRequests = requests.map((request) => {
      const parent = parentById.get(String(request.parentId));
      const parentUser = parent
        ? parentUserById.get(String(parent.userId))
        : null;

      return {
        id: String(request._id),
        parentId: parent ? String(parent._id) : String(request.parentId || ""),
        parentUserId: parent ? String(parent.userId) : String(request.parentUserId || ""),
        parentName: parent
          ? fullName(parent.firstName, parent.middleName, parent.lastName) || "Parent"
          : "Parent",
        parentEmail: parentUser?.email || "",
        parentPhone: parent?.phoneNumber || "",
        requestedAt: request.createdAt
      };
    });

    return res.status(200).json({
      success: true,
      requests: formattedRequests
    });
  } catch (error) {
    console.error("Get pending parent link requests error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

const respondToParentLinkRequest = async (req, res) => {
  try {
    const studentUserId = String(req.params.userId || "").trim();
    const requestId = String(req.params.requestId || "").trim();
    const action = String(req.body?.action || "").trim().toLowerCase();

    if (!studentUserId || !requestId) {
      return res.status(400).json({
        success: false,
        message: "student userId and requestId are required"
      });
    }

    if (action !== "approve" && action !== "reject") {
      return res.status(400).json({
        success: false,
        message: "action must be either approve or reject"
      });
    }

    const student = await Student.findOne({ userId: studentUserId });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }

    const request = await ParentLinkRequest.findById(requestId);
    if (!request || String(request.studentUserId) !== String(student.userId)) {
      return res.status(404).json({
        success: false,
        message: "Parent link request not found"
      });
    }

    if (request.status !== "pending") {
      return res.status(409).json({
        success: false,
        message: "Parent link request is already resolved"
      });
    }

    const parent = await Parent.findById(request.parentId);
    if (!parent) {
      request.status = "rejected";
      request.resolvedAt = new Date();
      request.resolvedBy = student.userId;
      request.resolutionNote = "Parent account record not found.";
      await request.save();

      return res.status(404).json({
        success: false,
        message: "Parent record not found"
      });
    }

    if (action === "reject") {
      request.status = "rejected";
      request.resolvedAt = new Date();
      request.resolvedBy = student.userId;
      request.resolutionNote = "Rejected by student.";
      await request.save();

      return res.status(200).json({
        success: true,
        message: "Parent link request rejected"
      });
    }

    if (student.connectedToParent || student.parentId) {
      if (String(student.parentId) !== String(parent._id)) {
        request.status = "rejected";
        request.resolvedAt = new Date();
        request.resolvedBy = student.userId;
        request.resolutionNote = "Student is already linked to another parent.";
        await request.save();

        return res.status(409).json({
          success: false,
          message: "Student is already linked to another parent"
        });
      }
    } else {
      const parentChildren = Array.isArray(parent.children) ? parent.children : [];
      const alreadyAdded = parentChildren.some(
        (childUserId) => String(childUserId) === String(student.userId)
      );

      if (!alreadyAdded) {
        parent.children = [...parentChildren, student.userId];
        await parent.save();
      }

      student.parentId = parent._id;
      student.connectedToParent = true;
      await student.save();
    }

    request.status = "approved";
    request.resolvedAt = new Date();
    request.resolvedBy = student.userId;
    request.resolutionNote = "Approved by student.";
    await request.save();

    await ParentLinkRequest.updateMany(
      {
        _id: { $ne: request._id },
        studentUserId: student.userId,
        status: "pending"
      },
      {
        $set: {
          status: "rejected",
          resolvedAt: new Date(),
          resolvedBy: student.userId,
          resolutionNote: "Student approved another parent link request."
        }
      }
    );

    return res.status(200).json({
      success: true,
      message: "Parent linked successfully"
    });
  } catch (error) {
    console.error("Respond to parent link request error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

module.exports = {
  getStudents,
  getStudentByUserId,
  updateStudent,
  deleteStudent,
  notifyParentByStudentAction,
  getPendingParentLinkRequests,
  respondToParentLinkRequest
};
