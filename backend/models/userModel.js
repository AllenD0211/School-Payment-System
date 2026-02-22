const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },

    middleName: {
      type: String,
      default: "",
      trim: true,
    },

    lastName: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
    },

    notificationMethod: {
      type: String,
      enum: ["email", "phone"],
      required: true,
    },

    notificationContact: {
      type: String,
      required: true,
    },

    // 🔐 ROLE SYSTEM
    usertype: {
      type: String,
      enum: ["parent", "admin"],
      default: "parent",
    },
    
    resetCode: {
      type: String
    },
    resetCodeExpiry: {
      type: Date
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);