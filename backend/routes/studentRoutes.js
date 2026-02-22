const express = require('express');
const router = express.Router();
const Student = require('../models/studentModel');

// GET all students with their fees
router.get('/', async (req, res) => {
  try {
    const students = await Student.find()
      .populate('parentId', 'name email phone')
      .lean();
    
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST create new student
router.post('/', async (req, res) => {
  const { name, grade, parentId } = req.body;

  // Validate required fields
  if (!name || !grade || !parentId) {
    return res.status(400).json({ 
      message: 'Missing required fields: name, grade, parentId' 
    });
  }

  const student = new Student({
    name,
    grade,
    parentId
  });

  try {
    const newStudent = await student.save();
    res.status(201).json(newStudent);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;