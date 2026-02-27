// models/studentModel.js
const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true
    },

    studentId: { type: String, required: true, unique: true },

    firstName: { type: String, required: true, trim: true },
    middleName: { type: String, default: "", trim: true },
    lastName: { type: String, required: true, trim: true },

    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      required: true,
    },

    birthdate: { type: Date, required: true },

    gradeSection: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Student", studentSchema);