// models/feeModel.js
const mongoose = require("mongoose");

const feeSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      default: null
    },

    feeType: {
      type: String,
      enum: ["Tuition", "Miscellaneous", "Event", "Other"],
      required: true,
      default: null
    },

    amount: { type: Number, required: true, default: 0 },

    status: {
      type: String,
      enum: ["pending", "paid"],
      default: "pending"
    },

    dueDate: { type: Date, default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Fee", feeSchema);