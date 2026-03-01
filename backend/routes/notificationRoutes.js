const express = require("express");
const router = express.Router();
const { getNotifications, clearNotifications } = require("../controllers/notificationsController");
const { authenticate, requireAdmin } = require("../middleware/authMiddleware");

router.use(authenticate, requireAdmin);

router.get("/", getNotifications);
router.delete("/", clearNotifications);

module.exports = router;
