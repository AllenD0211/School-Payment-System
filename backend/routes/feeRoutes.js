const express = require("express");
const router = express.Router();
const {
  createFee,
  getAllFees,
  getFeesByStudent,
  updateFee,
  deleteFee,
} = require("../controllers/feeController");

router.post("/", createFee);
router.get("/", getAllFees);
router.get("/student/:studentId", getFeesByStudent);
router.put("/:id", updateFee);
router.patch("/:id", updateFee);
router.post("/:id/update", updateFee);
router.delete("/:id", deleteFee);
router.post("/:id/delete", deleteFee);

module.exports = router;
