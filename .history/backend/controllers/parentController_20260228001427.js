const Parent = require("../models/parentModel");

// GET all parents
const getParents = async (req, res) => {
  try {
    const parents = await Parent.find().populate("userId", "email");
    res.json(parents);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// ADD parent (manual creation, separate from auth)
const addParent = async (req, res) => {
  try {
    const {
      userId,
      firstName,
      middleName = "",
      lastName,
      gender,
      email,
      phoneNumber,
      children = [],
    } = req.body;

    if (!userId || !firstName || !lastName || !gender || !email || !phoneNumber) {
      return res.status(400).json({ message: "All required parent fields must be provided" });
    }

    const parent = await Parent.create({
      userId,
      firstName,
      middleName,
      lastName,
      gender,
      email,
      phoneNumber,
      children,
    });
    res.status(201).json(parent);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// UPDATE parent
const updateParent = async (req, res) => {
  try {
    const parent = await Parent.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(parent);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// DELETE parent
const deleteParent = async (req, res) => {
  try {
    await Parent.findByIdAndDelete(req.params.id);
    res.json({ message: "Parent deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { getParents, addParent, updateParent, deleteParent };
