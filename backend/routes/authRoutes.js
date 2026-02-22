const express = require("express");
const {
  registerUser,
  loginUser,
  forgotPassword,
  verifyCode,
  resetPassword
} = require("../controllers/authController");
const router = express.Router();

router.post("/register", registerUser);
router.post("/login",  loginUser);
router.post("/forgot-password", forgotPassword);
router.post("/verify-code", verifyCode);
router.post("/reset-password", resetPassword);

module.exports = router;
