const Fee = require("../models/feeModel");
const Student = require("../models/studentModel");

const VALID_STATUSES = new Set(["paid", "pending", "overdue"]);

const parseDate = (value) => {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const serializeFee = (fee) => ({
  fee_id: fee._id,
  fee_type: fee.feeType,
  amount: fee.amount,
  due_date: fee.dueDate,
  status: fee.status,
  created_at: fee.createdAt,
  updated_at: fee.updatedAt
});

const serializeStudentSummary = (student) => {
  if (!student) return null;
  return {
    student_id: student.studentId,
    first_name: student.firstName,
    middle_name: student.middleName || "",
    last_name: student.lastName,
    gradeSection: student.gradeSection || ""
  };
};

exports.createFee = async (req, res) => {
  try {
    const { studentId, feeType, amount, dueDate, status } = req.body;
    const normalizedFeeType = String(feeType || "").trim();
    const parsedAmount = Number(amount);
    const parsedDueDate = parseDate(dueDate);
    const normalizedStatus = String(status || "pending").trim().toLowerCase();

    if (!studentId || !normalizedFeeType || Number.isNaN(parsedAmount) || !parsedDueDate) {
      return res.status(400).json({
        success: false,
        message: "studentId, feeType, amount, and dueDate are required"
      });
    }

    if (!VALID_STATUSES.has(normalizedStatus)) {
      return res.status(400).json({
        success: false,
        message: "status must be paid, pending, or overdue"
      });
    }

    const student = await Student.findOne({ userId: studentId });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }

    const newFee = await Fee.create({
      studentId,
      feeType: normalizedFeeType,
      amount: parsedAmount,
      dueDate: parsedDueDate,
      status: normalizedStatus
    });

    res.status(201).json({
      success: true,
      fee: serializeFee(newFee)
    });
  } catch (error) {
    console.error("Create fee error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

exports.getFeesByStudent = async (req, res) => {
  try {
    const studentUserId = String(req.params.studentId || "").trim();

    const fees = await Fee.find({ studentId: studentUserId }).sort({
      dueDate: 1,
      createdAt: -1
    });

    res.status(200).json({
      success: true,
      fees: fees.map(serializeFee)
    });
  } catch (error) {
    console.error("Get fees error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

exports.getAllFees = async (req, res) => {
  try {
    const fees = await Fee.find().sort({
      dueDate: 1,
      createdAt: -1
    });

    const studentUserIds = [
      ...new Set(
        fees
          .map((fee) => String(fee.studentId || ""))
          .filter(Boolean)
      )
    ];

    const students = await Student.find({
      userId: { $in: studentUserIds }
    }).lean();

    const studentByUserId = new Map(
      students.map((student) => [String(student.userId), student])
    );

    res.status(200).json({
      success: true,
      fees: fees.map((fee) => ({
        ...serializeFee(fee),
        student: serializeStudentSummary(
          studentByUserId.get(String(fee.studentId || ""))
        )
      }))
    });
  } catch (error) {
    console.error("Get all fees error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

exports.updateFee = async (req, res) => {
  try {
    const fee = await Fee.findById(req.params.id);
    if (!fee) {
      return res.status(404).json({
        success: false,
        message: "Fee not found"
      });
    }

    const updates = {};

    if (req.body.feeType !== undefined) {
      const normalizedFeeType = String(req.body.feeType || "").trim();
      if (!normalizedFeeType) {
        return res.status(400).json({
          success: false,
          message: "feeType cannot be empty"
        });
      }
      updates.feeType = normalizedFeeType;
    }

    if (req.body.amount !== undefined) {
      const parsedAmount = Number(req.body.amount);
      if (Number.isNaN(parsedAmount) || parsedAmount < 0) {
        return res.status(400).json({
          success: false,
          message: "amount must be a valid number"
        });
      }
      updates.amount = parsedAmount;
    }

    if (req.body.dueDate !== undefined) {
      const parsedDueDate = parseDate(req.body.dueDate);
      if (!parsedDueDate) {
        return res.status(400).json({
          success: false,
          message: "dueDate must be a valid date"
        });
      }
      updates.dueDate = parsedDueDate;
    }

    if (req.body.status !== undefined) {
      const normalizedStatus = String(req.body.status || "").trim().toLowerCase();
      if (!VALID_STATUSES.has(normalizedStatus)) {
        return res.status(400).json({
          success: false,
          message: "status must be paid, pending, or overdue"
        });
      }
      updates.status = normalizedStatus;
    }

    const updatedFee = await Fee.findByIdAndUpdate(fee._id, updates, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      fee: serializeFee(updatedFee)
    });
  } catch (error) {
    console.error("Update fee error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

exports.deleteFee = async (req, res) => {
  try {
    const deletedFee = await Fee.findByIdAndDelete(req.params.id);

    if (!deletedFee) {
      return res.status(404).json({
        success: false,
        message: "Fee not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Fee deleted"
    });
  } catch (error) {
    console.error("Delete fee error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};
