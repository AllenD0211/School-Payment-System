const express = require("express");
const router = express.Router();
const {
  getParentChildren,
  getUnlinkedStudents,
  addChildToParent
} = require("../controllers/parentController");

router.get("/unlinked-students", getUnlinkedStudents);
router.get("/:parentUserId/children", getParentChildren);
router.post("/:parentUserId/children", addChildToParent);

module.exports = router;
