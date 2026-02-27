// models/studentModel.js
const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    studentId: { type: String, required: true, unique: true },

    firstName: { type: String, required: true, trim: true },
    middleName: { type: String, trim: true, default: "" },
    lastName: { type: String, required: true, trim: true },

    gender: { type: String, required: true, enum: ["male", "female", "other"] },
    birthdate: { type: Date, required: true },

    gradeSection: { type: String, required: true, trim: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Student", studentSchema);