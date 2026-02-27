const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    // login credentials only
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

    // either "student" or "parent"
    userType: {
      type: String,
      enum: ["student", "parent"],
      required: true,
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);