const Parent = require("../models/parentModel");
const Student = require("../models/studentModel");
const Fee = require("../models/feeModel");
const User = require("../models/userModel");

const fullName = (firstName, middleName, lastName) => {
  return [firstName, middleName, lastName].filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
};

const getParentChildren = async (req, res) => {
  try {
    const parentLookupId = String(req.params.parentUserId || "").trim();

    let parent = await Parent.findOne({ userId: parentLookupId }).lean();
    if (!parent) {
      parent = await Parent.findById(parentLookupId).lean();
    }
    if (!parent) {
      const parentUser = await User.findById(parentLookupId).lean();
      if (parentUser && parentUser.userType === "parent") {
        return res.status(200).json({
          success: true,
          parent: {
            _id: null,
            userId: parentUser._id,
            firstName: "",
            middleName: "",
            lastName: "",
            fullName: "",
            gender: "",
            phoneNumber: "",
            email: parentUser.email || ""
          },
          children: []
        });
      }
      return res.status(404).json({
        success: false,
        message: "Parent not found"
      });
    }

    const parentUser = await User.findById(parent.userId).lean();
    const childIds = Array.isArray(parent.children) ? parent.children : [];

    const children = await Student.find({
      $or: [
        { parentId: parent._id },
        { userId: { $in: childIds } },
        { _id: { $in: childIds } }
      ]
    })
      .sort({ createdAt: -1 })
      .lean();

    const childUserIds = children
      .map((child) => child.userId)
      .filter(Boolean);

    const feeAgg = await Fee.aggregate([
      {
        $match: {
          studentId: { $in: childUserIds }
        }
      },
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
    ]);

    const feeAggMap = new Map(feeAgg.map((item) => [String(item._id), item]));

    const formattedChildren = children.map((child) => ({
      _id: child._id,
      userId: child.userId,
      studentId: child.studentId,
      firstName: child.firstName,
      middleName: child.middleName,
      lastName: child.lastName,
      fullName: fullName(child.firstName, child.middleName, child.lastName),
      gender: child.gender,
      birthdate: child.birthdate,
      gradeSection: child.gradeSection,
      connectedToParent: child.connectedToParent,
      feeSummary: feeAggMap.get(String(child.userId)) || {
        totalFees: 0,
        totalAmount: 0,
        paidAmount: 0,
        pendingAmount: 0,
        overdueAmount: 0
      }
    }));

    res.status(200).json({
      success: true,
      parent: {
        _id: parent._id,
        userId: parent.userId,
        firstName: parent.firstName,
        middleName: parent.middleName,
        lastName: parent.lastName,
        fullName: fullName(parent.firstName, parent.middleName, parent.lastName),
        gender: parent.gender,
        phoneNumber: parent.phoneNumber,
        email: parentUser?.email || ""
      },
      children: formattedChildren
    });
  } catch (error) {
    console.error("Error fetching parent children:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

const getUnlinkedStudents = async (req, res) => {
  try {
    const search = String(req.query.q || "").trim().toLowerCase();

    const allUnlinkedStudents = await Student.find({
      $or: [{ connectedToParent: false }, { connectedToParent: { $exists: false } }]
    })
      .sort({ createdAt: -1 })
      .lean();

    const filteredStudents = allUnlinkedStudents.filter((student) => {
      if (!search) return true;
      const searchable = [
        student.studentId,
        student.firstName,
        student.middleName,
        student.lastName,
        student.gradeSection
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return searchable.includes(search);
    });

    res.status(200).json({
      success: true,
      students: filteredStudents.map((student) => ({
        _id: student._id,
        userId: student.userId,
        studentId: student.studentId,
        firstName: student.firstName,
        middleName: student.middleName,
        lastName: student.lastName,
        fullName: fullName(student.firstName, student.middleName, student.lastName),
        gender: student.gender,
        birthdate: student.birthdate,
        gradeSection: student.gradeSection,
        connectedToParent: student.connectedToParent
      }))
    });
  } catch (error) {
    console.error("Error fetching unlinked students:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

const addChildToParent = async (req, res) => {
  try {
    const parentLookupId = String(req.params.parentUserId || "").trim();
    const studentUserId = String(req.body?.studentUserId || "").trim();

    if (!studentUserId) {
      return res.status(400).json({
        success: false,
        message: "studentUserId is required"
      });
    }

    const [parentByUserId, parentById, student] = await Promise.all([
      Parent.findOne({ userId: parentLookupId }),
      Parent.findById(parentLookupId),
      Student.findOne({ userId: studentUserId })
    ]);
    const parent = parentByUserId || parentById;

    if (!parent) {
      return res.status(404).json({
        success: false,
        message: "Parent not found"
      });
    }

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }

    if (student.connectedToParent || student.parentId) {
      return res.status(409).json({
        success: false,
        message: "Student is already linked to a parent"
      });
    }

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

    res.status(200).json({
      success: true,
      message: "Child linked successfully"
    });
  } catch (error) {
    console.error("Error adding child to parent:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

module.exports = {
  getParentChildren,
  getUnlinkedStudents,
  addChildToParent
};
