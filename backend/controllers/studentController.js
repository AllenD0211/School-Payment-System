const Student = require("../models/studentModel");

// GET all students
const getStudents = async (req, res) => {
  try {
    const students = await Student.find().populate("parentId", "firstName lastName email");
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// ADD student
const addStudent = async (req, res) => {
  try {
    const { name, grade, parentId, parentName, parentEmail, parentContact, fees } = req.body;
    const student = await Student.create({
      name,
      grade,
      parentId: parentId || null, // make it optional for testing
      parentName,
      parentEmail,
      parentContact,
      fees: fees || [],
    });
    res.status(201).json(student);
  } catch (err) {
    console.error(err); // <-- add this to see why it fails
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