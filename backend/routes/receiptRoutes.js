const express = require("express");
const router = express.Router();
const {
  getAllReceipts,
  getReceiptsByParent,
  clearReceipts,
  createManualReceipt,
  createSentReceipt,
  resendReceipt
} = require("../controllers/receiptController");
const { authenticate, requireAdmin } = require("../middleware/authMiddleware");

router.get("/", getAllReceipts);
router.delete("/", authenticate, requireAdmin, clearReceipts);
router.get("/parent/:parentUserId", getReceiptsByParent);
router.post("/manual", createManualReceipt);
router.post("/sent", createSentReceipt);
router.post("/:id/resend", resendReceipt);

module.exports = router;
