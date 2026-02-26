// models/notificationModel.js
const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true
    },

    recipient: String,

    method: {
      type: String,
      enum: ["sms", "email"],
      required: true
    },

    message: String,

    status: {
      type: String,
      enum: ["sent", "failed"],
      default: "sent"
    },

    sentAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);