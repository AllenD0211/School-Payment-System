const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true
    },
    studentId: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    firstName: {
      type: String,
      required: true,
      trim: true
    },
    middleName: {
      type: String,
      default: "",
      trim: true
    },
    lastName: {
      type: String,
      required: true,
      trim: true
    },
    gender: {
      type: String,
      required: true,
      enum: ["Male", "Female", "Other"]
    },
    birthdate: {
      type: Date,
      required: true
    },
    gradeSection: {
      type: String,
      required: true,
      trim: true
    },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Parent",
      default: null
    },
    connectedToParent: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Student", studentSchema);
