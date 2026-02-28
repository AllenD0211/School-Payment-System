const mongoose = require("mongoose");

const receiptSchema = new mongoose.Schema(
  {
    receiptNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    parentUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    studentUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    studentName: {
      type: String,
      required: true,
      trim: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    paymentDescription: {
      type: String,
      required: true,
      trim: true
    },
    sentTo: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    sentVia: {
      type: String,
      enum: ["email", "sms"],
      default: "email"
    },
    paymentDate: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ["sent", "pending", "delivered", "read", "acknowledged"],
      default: "sent"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Receipt", receiptSchema);
