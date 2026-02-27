const express = require("express");
const router = express.Router();

const {
  getParents,
  addParent,
  updateParent,
  deleteParent,
} = require("../controllers/parentController");

router.get("/", getParents);
router.post("/", addParent);
router.put("/:id", updateParent);
router.delete("/:id", deleteParent);

module.exports = router;
