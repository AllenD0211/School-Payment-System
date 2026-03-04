const User = require("../models/userModel");
const Parent = require("../models/parentModel");
const Student = require("../models/studentModel");
const Fee = require("../models/feeModel");
const Notification = require("../models/notificationModel");
const Receipt = require("../models/receiptModel");
const ParentLinkRequest = require("../models/parentLinkRequestModel");
const sendMail = require("../utils/mailer");

const buildParentLookup = (parents) => {
  const childToParent = new Map();

  parents.forEach((parent) => {
    parent.children.forEach((childUserId) => {
      childToParent.set(String(childUserId), parent);
    });
  });

  return childToParent;
};

const fullName = (firstName, middleName, lastName) => {
  return [firstName, middleName, lastName].filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
};

const inferParentConnection = (gender) => {
  const normalized = String(gender || "").trim().toLowerCase();
  if (normalized === "male") return "Father";
  if (normalized === "female") return "Mother";
  return "Parent/Guardian";
};

const feeSummaryFromAgg = (aggregateItem) => {
  if (!aggregateItem) {
    return {
      totalFees: 0,
      totalAmount: 0,
      paidAmount: 0,
      pendingAmount: 0,
      overdueAmount: 0
    };
  }

  return {
    totalFees: aggregateItem.totalFees || 0,
    totalAmount: aggregateItem.totalAmount || 0,
    paidAmount: aggregateItem.paidAmount || 0,
    pendingAmount: aggregateItem.pendingAmount || 0,
    overdueAmount: aggregateItem.overdueAmount || 0
  };
};

const getTotalStudents = async (req, res) => {
  try {
    const totalStudents = await Student.countDocuments();

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

const getAllStudents = async (req, res) => {
  try {
    const [students, parents, feeAgg] = await Promise.all([
      Student.find().sort({ createdAt: -1 }).lean(),
      Parent.find().lean(),
      Fee.aggregate([
        {
          $group: {
            _id: "$studentId",
            totalFees: { $sum: 1 },
            totalAmount: { $sum: "$amount" },
            paidAmount: {
              $sum: {
                $cond: [{ $eq: ["$status", "paid"] }, "$amount", 0]
              }
            },
            pendingAmount: {
              $sum: {
                $cond: [{ $eq: ["$status", "pending"] }, "$amount", 0]
              }
            },
            overdueAmount: {
              $sum: {
                $cond: [{ $eq: ["$status", "overdue"] }, "$amount", 0]
              }
            }
          }
        }
      ])
    ]);

    const childToParent = buildParentLookup(parents);
    const feeAggMap = new Map(feeAgg.map((item) => [String(item._id), item]));

    const formattedStudents = students.map((student) => {
      const parent =
        parents.find((item) => String(item._id) === String(student.parentId)) ||
        childToParent.get(String(student.userId));
      const summary = feeSummaryFromAgg(feeAggMap.get(String(student.userId)));
      const computedFullName = fullName(student.firstName, student.middleName, student.lastName);

      return {
        _id: student._id,
        student_user_id: student.userId,
        student_id: student.studentId,
        first_name: student.firstName,
        middle_name: student.middleName,
        last_name: student.lastName,
        full_name: computedFullName || student.studentId,
        gender: student.gender,
        birth_date: student.birthdate,
        gradeSection: student.gradeSection,
        connected_to_parent: student.connectedToParent,
        parent_id: parent?._id || null,
        parent: parent
          ? {
              parent_id: parent._id,
              parent_user_id: parent.userId,
              father_name: parent.firstName || "",
              mother_name: parent.middleName || "",
              contact_number: parent.phoneNumber || ""
            }
          : null,
        fee_summary: summary,
        created_at: student.createdAt,
        updated_at: student.updatedAt
      };
    });

    res.status(200).json({
      success: true,
      students: formattedStudents
    });
  } catch (error) {
    console.error("Error fetching students:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

const getStudentDetails = async (req, res) => {
  try {
    const studentUserId = String(req.params.studentUserId || "").trim();

    const student = await Student.findOne({ userId: studentUserId }).lean();
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }

    const [parent, fees] = await Promise.all([
      student.parentId
        ? Parent.findById(student.parentId).lean()
        : Parent.findOne({ children: student.userId }).lean(),
      Fee.find({ studentId: student.userId }).sort({ dueDate: 1, createdAt: -1 }).lean()
    ]);
    const parentUser = parent ? await User.findById(parent.userId).lean() : null;
    const studentFullName = fullName(student.firstName, student.middleName, student.lastName) || student.studentId;

    res.status(200).json({
      success: true,
      student: {
        _id: student._id,
        student_user_id: student.userId,
        student_id: student.studentId,
        first_name: student.firstName,
        middle_name: student.middleName,
        last_name: student.lastName,
        full_name: studentFullName,
        gender: student.gender,
        birth_date: student.birthdate,
        gradeSection: student.gradeSection,
        parent_id: parent?._id || null,
        connected_to_parent: student.connectedToParent,
        created_at: student.createdAt,
        updated_at: student.updatedAt
      },
      parent: parent
        ? {
            parent_id: parent._id,
            parent_user_id: parent.userId,
            first_name: parent.firstName || "",
            middle_name: parent.middleName || "",
            last_name: parent.lastName || "",
            gender: parent.gender || "",
            connection: inferParentConnection(parent.gender),
            father_name: parent.firstName || "",
            mother_name: parent.middleName || "",
            contact_number: parent.phoneNumber || "",
            email: parentUser?.email || "",
            created_at: parent.createdAt,
            updated_at: parent.updatedAt
          }
        : null,
      fees: fees.map((fee) => ({
        fee_id: fee._id,
        fee_type: fee.feeType,
        amount: fee.amount,
        due_date: fee.dueDate,
        status: fee.status,
        created_at: fee.createdAt,
        updated_at: fee.updatedAt
      }))
    });
  } catch (error) {
    console.error("Error fetching student details:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

const getAllParents = async (req, res) => {
  try {
    const parents = await Parent.find().sort({ createdAt: -1 }).lean();

    const formattedParents = parents.map((parent) => ({
      _id: parent._id,
      userId: parent.userId,
      firstName: parent.firstName,
      middleName: parent.middleName,
      lastName: parent.lastName,
      fullName: fullName(parent.firstName, parent.middleName, parent.lastName),
      gender: parent.gender,
      phoneNumber: parent.phoneNumber,
      childrenCount: parent.children.length
    }));

    res.status(200).json({
      success: true,
      parents: formattedParents
    });
  } catch (error) {
    console.error("Error fetching parents:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

const linkStudentToParent = async (req, res) => {
  try {
    const studentUserId = String(req.params.studentUserId || "").trim();
    const parentUserId = String(req.body?.parentUserId || "").trim();

    if (!studentUserId || !parentUserId) {
      return res.status(400).json({
        success: false,
        message: "studentUserId and parentUserId are required"
      });
    }

    const [student, parent] = await Promise.all([
      Student.findOne({ userId: studentUserId }),
      Parent.findOne({ userId: parentUserId })
    ]);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }

    if (!parent) {
      return res.status(404).json({
        success: false,
        message: "Parent not found"
      });
    }

    if (student.parentId && String(student.parentId) !== String(parent._id)) {
      return res.status(409).json({
        success: false,
        message: "Student is already linked to another parent"
      });
    }

    const alreadyLinked = parent.children.some(
      (childUserId) => String(childUserId) === String(student.userId)
    );

    if (!alreadyLinked) {
      parent.children.push(student.userId);
      await parent.save();
    }

    student.parentId = parent._id;
    student.connectedToParent = true;
    await student.save();

    res.status(200).json({
      success: true,
      message: "Student linked to parent successfully"
    });
  } catch (error) {
    console.error("Error linking student to parent:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

const notifyParent = async (req, res) => {
  try {
    const studentUserId = String(req.params.studentUserId || "").trim();
    const method = String(req.body?.method || "").trim().toLowerCase();
    const customMessage = String(req.body?.message || "").trim();

    if (method && method !== "email") {
      return res.status(400).json({
        success: false,
        message: "Only email notifications are supported"
      });
    }

    const student = await Student.findOne({ userId: studentUserId }).lean();
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }

    const parent = student.parentId
      ? await Parent.findById(student.parentId).lean()
      : await Parent.findOne({ children: student.userId }).lean();
    if (!parent) {
      return res.status(404).json({
        success: false,
        message: "Parent not linked to student"
      });
    }

    const parentUser = await User.findById(parent.userId).lean();
    if (!parentUser?.email) {
      return res.status(400).json({
        success: false,
        message: "Parent email is not available"
      });
    }
    const recipient = parentUser.email;

    const message =
      customMessage ||
      `Reminder for ${fullName(student.firstName, student.middleName, student.lastName)} (${student.studentId}) regarding student fee records.`;

    try {
      await sendMail(recipient, "Student Fee Notification", message);
    } catch (mailError) {
      return res.status(502).json({
        success: false,
        message: `Failed to send email notification: ${String(mailError?.message || mailError || "SMTP error").trim()}`
      });
    }

    const notification = await Notification.create({
      studentId: student._id,
      recipient,
      method: "email",
      message,
      status: "sent"
    });

    res.status(200).json({
      success: true,
      message: "Notification sent",
      notification: {
        id: notification._id,
        recipient,
        method: "email",
        message,
        status: "sent",
        timestamp: notification.createdAt
      }
    });
  } catch (error) {
    console.error("Error notifying parent:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

const deleteStudentAccount = async (req, res) => {
  try {
    const studentUserId = String(req.params.studentUserId || "").trim();
    if (!studentUserId) {
      return res.status(400).json({
        success: false,
        message: "studentUserId is required"
      });
    }

    const student = await Student.findOne({ userId: studentUserId });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }

    const userId = student.userId;
    const studentRecordId = student._id;

    await Promise.all([
      Parent.updateMany(
        { children: userId },
        {
          $pull: {
            children: userId
          }
        }
      ),
      ParentLinkRequest.deleteMany({ studentUserId: userId }),
      Fee.deleteMany({ studentId: userId }),
      Notification.deleteMany({ studentId: studentRecordId }),
      Receipt.deleteMany({ studentUserId: userId })
    ]);

    await Student.deleteOne({ _id: studentRecordId });
    await User.deleteOne({ _id: userId });

    return res.status(200).json({
      success: true,
      message: "Student account deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting student account:", error);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

const deleteParentAccount = async (req, res) => {
  try {
    const parentLookupId = String(req.params.parentId || "").trim();
    if (!parentLookupId) {
      return res.status(400).json({
        success: false,
        message: "parentId is required"
      });
    }

    const [parentById, parentByUserId] = await Promise.all([
      Parent.findById(parentLookupId),
      Parent.findOne({ userId: parentLookupId })
    ]);
    const parent = parentById || parentByUserId;

    if (!parent) {
      return res.status(404).json({
        success: false,
        message: "Parent not found"
      });
    }

    const parentId = parent._id;
    const parentUserId = parent.userId;
    const linkedChildUserIds = Array.isArray(parent.children) ? parent.children : [];

    await Promise.all([
      Student.updateMany(
        {
          $or: [
            { parentId },
            { userId: { $in: linkedChildUserIds } }
          ]
        },
        {
          $set: {
            parentId: null,
            connectedToParent: false
          }
        }
      ),
      ParentLinkRequest.deleteMany({
        $or: [
          { parentId },
          { parentUserId }
        ]
      }),
      Parent.deleteOne({ _id: parentId }),
      User.deleteOne({ _id: parentUserId })
    ]);

    return res.status(200).json({
      success: true,
      message: "Parent account deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting parent account:", error);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

module.exports = {
  getTotalStudents,
  getAllStudents,
  getStudentDetails,
  getAllParents,
  linkStudentToParent,
  notifyParent,
  deleteStudentAccount,
  deleteParentAccount
};
