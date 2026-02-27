const Student = require("../models/studentModel");

// GET all students (generic, includes basic profile)
const getStudents = async (req, res) => {
  try {
    const students = await Student.find().populate("userId", "email");
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// ADD student - expects all profile fields including userId (the user must already exist)
const addStudent = async (req, res) => {
  try {
    const {
      userId,
      studentId,
      firstName,
      middleName = "",
      lastName,
      gender,
      birthdate,
      gradeSection,
    } = req.body;

    if (!userId || !studentId || !firstName || !lastName || !gender || !birthdate || !gradeSection) {
      return res.status(400).json({ message: "All required student fields must be provided" });
    }

    const student = await Student.create({
      userId,
      studentId,
      firstName,
      middleName,
      lastName,
      gender,
      birthdate,
      gradeSection,
    });
    res.status(201).json(student);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// UPDATE student
const updateStudent = async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(student);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// DELETE student
const deleteStudent = async (req, res) => {
  try {
    await Student.findByIdAndDelete(req.params.id);
    res.json({ message: "Student deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { getStudents, addStudent, updateStudent, deleteStudent };