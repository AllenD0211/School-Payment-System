const express = require("express");
const router = express.Router();
const {
  getAllReceipts,
  getReceiptsByParent,
  createManualReceipt,
  createSentReceipt
} = require("../controllers/receiptController");

router.get("/", getAllReceipts);
router.get("/parent/:parentUserId", getReceiptsByParent);
router.post("/manual", createManualReceipt);
router.post("/sent", createSentReceipt);

module.exports = router;
