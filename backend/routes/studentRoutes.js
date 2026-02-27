const express = require("express");
const router = express.Router();

const {
  getStudents,
  getStudentByUserId,
  updateStudent,
  deleteStudent,
} = require("../controllers/studentController");

// GET all students
router.get("/", getStudents);

// GET student by userId
router.get("/:userId", getStudentByUserId);

// PUT update student
router.put("/:id", updateStudent);

// DELETE student
router.delete("/:id", deleteStudent);

module.exports = router;
