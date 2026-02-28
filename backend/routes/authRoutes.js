const express = require("express");
const {
  registerUser,
  loginUser,
  forgotPassword,
  verifyCode,
  resetPassword,
  verifyRegistrationOtp,
  resendVerificationOtp
} = require("../controllers/authController");
const router = express.Router();

router.post("/register", registerUser);
router.post("/verify-registration-otp", verifyRegistrationOtp);
router.post("/resend-verification-otp", resendVerificationOtp);
router.post("/login",  loginUser);
router.post("/forgot-password", forgotPassword);
router.post("/verify-code", verifyCode);
router.post("/reset-password", resetPassword);

module.exports = router;
