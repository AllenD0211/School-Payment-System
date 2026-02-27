const Fee = require("../models/feeModel");

// =======================
// CREATE FEE
// =======================
exports.createFee = async (req, res) => {
  try {
    const { studentId, feeType, amount, status, dueDate } = req.body;

    if (!studentId || !feeType || !amount || !dueDate) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be provided",
      });
    }

    const newFee = await Fee.create({
      studentId,
      feeType,
      amount,
      status,
      dueDate,
    });

    res.status(201).json({
      success: true,
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
    await Fee.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Fee deleted",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};