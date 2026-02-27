const express = require("express");
const router = express.Router();
const {
  createFee,
  getFeesByStudent,
  deleteFee,
} = require("../controllers/feeController");

router.post("/", createFee);
router.get("/student/:studentId", getFeesByStudent);
router.delete("/:id", deleteFee);

module.exports = router;