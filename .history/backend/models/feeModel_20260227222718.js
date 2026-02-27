// models/feeModel.js
const mongoose = require("mongoose");

const feeSchema = new mongoose.Schema(
  {
    studentId: {
      type: String,
      required: true,
    },

    feeType: {
      type: String,
      required: true,
    },

    amount: { 
      type: Number, 
      required: true
    },

    status: {
      type: String,
      enum: ["pending", "paid", "overdue"],
      default: "pending"
    },

    dueDate: { 
      type: Date, 
      required: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Fee", feeSchema);