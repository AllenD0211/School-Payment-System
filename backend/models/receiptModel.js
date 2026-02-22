const mongoose = require("mongoose");

const receiptSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
  feeId: { type: mongoose.Schema.Types.ObjectId },
  amountPaid: { type: Number, required: true },
  sentTo: { type: String, required: true },
  status: { type: String, enum: ["sent", "failed"], default: "sent" },
  sentAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model("Receipt", receiptSchema);