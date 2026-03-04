const express = require("express");
const router = express.Router();
const { authenticate, requireAdmin } = require("../middleware/authMiddleware");
const {
  getTotalStudents,
  getAllStudents,
  getStudentDetails,
  getAllParents,
  linkStudentToParent,
  notifyParent,
  deleteStudentAccount,
  deleteParentAccount
} = require("../controllers/adminController");

router.use(authenticate, requireAdmin);

router.get("/total-students", getTotalStudents);
router.get("/students", getAllStudents);
router.get("/students/:studentUserId", getStudentDetails);
router.delete("/students/:studentUserId", deleteStudentAccount);
router.post("/students/:studentUserId/delete", deleteStudentAccount);
router.delete("/parents/:parentId", deleteParentAccount);
router.post("/parents/:parentId/delete", deleteParentAccount);
router.get("/parents", getAllParents);
router.post("/students/:studentUserId/link-parent", linkStudentToParent);
router.post("/students/:studentUserId/notify", notifyParent);

module.exports = router;
