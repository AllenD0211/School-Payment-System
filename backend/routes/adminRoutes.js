const express = require("express");
const router = express.Router();
const {
  getTotalStudents,
  getAllStudents,
  getStudentDetails,
  getAllParents,
  linkStudentToParent,
  notifyParent
} = require("../controllers/adminController");

router.get("/total-students", getTotalStudents);
router.get("/students", getAllStudents);
router.get("/students/:studentUserId", getStudentDetails);
router.get("/parents", getAllParents);
router.post("/students/:studentUserId/link-parent", linkStudentToParent);
router.post("/students/:studentUserId/notify", notifyParent);

module.exports = router;
