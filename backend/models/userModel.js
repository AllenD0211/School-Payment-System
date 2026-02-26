const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
      default: null
    },

    middleName: {
      type: String,
      default: "",
      trim: true,
      default: null
    },

    lastName: {
      type: String,
      required: true,
      trim: true,
      default: null
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      default: null
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
      default: null
    },

    notificationMethod: {
      type: String,
      enum: ["email", "phone"],
      default: null
    },

    notificationContact: {
      type: String,
      default: null
    },

    // 🔐 ROLE SYSTEM
    userType: {
      type: String,
      enum: ["parent", "admin", "student"],
      default: "parent",
    },
    
    resetCode: {
      type: String,
      default: null
    },
    resetCodeExpiry: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);