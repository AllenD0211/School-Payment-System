const express = require("express");
const router = express.Router();

const {
  getStudents,
  getStudentByUserId,
  updateStudent,
  deleteStudent,
  notifyParentByStudentAction,
  getPendingParentLinkRequests,
  respondToParentLinkRequest,
} = require("../controllers/studentController");

// GET all students
router.get("/", getStudents);

// GET student by userId
router.get("/:userId", getStudentByUserId);
router.post("/:userId/notify-parent", notifyParentByStudentAction);
router.get("/:userId/parent-link-requests", getPendingParentLinkRequests);
router.post("/:userId/parent-link-requests/:requestId/respond", respondToParentLinkRequest);

// PUT update student
router.put("/:id", updateStudent);

// DELETE student
router.delete("/:id", deleteStudent);

module.exports = router;
