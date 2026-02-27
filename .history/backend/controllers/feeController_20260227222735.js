const Fee = require("../models/feeModel");
const Student = require("../models/studentModel");

// =======================
// CREATE FEE
// =======================
exports.createFee = async (req, res) => {
  try {
    const { studentId, feeType, amount, status, dueDate } = req.body;

    // Validate required fields
    if (!studentId || !feeType || amount === undefined || !dueDate) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be provided: studentId, feeType, amount, dueDate",
      });
    }

    // Validate student exists in database
    const student = await Student.findOne({ studentId: studentId });
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: `Student with ID "${studentId}" not found in database`,
      });
    }

    // Validate amount is a valid number
    if (isNaN(amount) || amount < 0) {
      return res.status(400).json({
        success: false,
        message: "Amount must be a valid positive number",
      });
    }

    // Create new fee
    const newFee = await Fee.create({
      studentId,
      feeType,
      amount: parseFloat(amount),
      status: status || "pending",
      dueDate: new Date(dueDate),
    });

    res.status(201).json({
      success: true,
      message: "Fee added successfully",
      fee: newFee,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =======================
// GET FEES BY STUDENT
// =======================
exports.getFeesByStudent = async (req, res) => {
  try {
    const fees = await Fee.find({ studentId: req.params.studentId }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      fees,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =======================
// DELETE FEE
// =======================
exports.deleteFee = async (req, res) => {
  try {
    const deletedFee = await Fee.findByIdAndDelete(req.params.id);

    if (!deletedFee) {
      return res.status(404).json({
        success: false,
        message: "Fee not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Fee deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};