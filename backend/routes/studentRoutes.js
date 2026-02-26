const express = require("express");
const router = express.Router();

const {
  getStudents,
  addStudent,
  updateStudent,
  deleteStudent,
} = require("../controllers/studentController");

// GET all students
router.get("/", getStudents);

// POST create new student
router.post("/", addStudent);

// PUT update student
router.put("/:id", updateStudent);

// DELETE student
router.delete("/:id", deleteStudent);

module.exports = router;