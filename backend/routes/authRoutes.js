const express = require("express");
const passport = require("passport");
const router = express.Router();
const {
  register,
  login,
  logout,
  getMe,
  googleCallback,
  forgotPassword,
  resetPassword,
  verifyEmail,
  verifyResetOTP,
  resendOTP,
} = require("../controllers/authController");
const { protect } = require("../middleware/auth");

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", protect, getMe);

// Google OAuth
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] }),
);

router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  googleCallback,
);

// Email Verification
router.post("/verify-email", verifyEmail);
router.post("/resend-otp", resendOTP);

// Password Reset
router.post("/forgot-password", forgotPassword);
router.post("/verify-reset-otp", verifyResetOTP);
router.put("/reset-password", resetPassword);

module.exports = router;
