// models/studentModel.js
const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    studentId: { type: String, required: true, unique: true },

    gender: { type: String, default: null },
    
    birthdate: { type: Date, default: null },

    // combined grade and section for sign‑up form
    gradeSection: { type: String, default: null },

    // legacy fields (optional)
    gradeLevel: { type: String, default: null },
    section: { type: String, default: null },

    parentName: { type: String, default: null },
    parentContact: { type: String, default: null },
    parentEmail: { type: String, default: null },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Student", studentSchema);