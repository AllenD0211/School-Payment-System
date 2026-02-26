const express = require("express");
const router = express.Router();
const { getTotalStudents, getAllStudents } = require("../controllers/adminController");

router.get("/total-students", getTotalStudents);
router.get("/students", getAllStudents);

module.exports = router;