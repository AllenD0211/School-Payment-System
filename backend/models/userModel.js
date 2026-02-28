const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: true
    },
    userType: {
      type: String,
      required: true,
      enum: ["student", "parent"]
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    emailVerification: {
      otpHash: {
        type: String,
        default: null
      },
      expiresAt: {
        type: Date,
        default: null
      },
      verifiedAt: {
        type: Date,
        default: null
      }
    },
    passwordReset: {
      otpHash: {
        type: String,
        default: null
      },
      expiresAt: {
        type: Date,
        default: null
      },
      verifiedAt: {
        type: Date,
        default: null
      }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
