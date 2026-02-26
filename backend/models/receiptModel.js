// models/receiptModel.js
const mongoose = require("mongoose");

const receiptSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true
    },

    feeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Fee",
      required: true
    },

    amountPaid: { type: Number, required: true },

    paymentDate: {
      type: Date,
      default: Date.now
    },

    sentTo: String,

    status: {
      type: String,
      enum: ["sent", "pending"],
      default: "sent"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Receipt", receiptSchema);