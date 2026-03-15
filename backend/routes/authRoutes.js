const express = require("express");
const router = express.Router();
const {
  register,
  login,
  logout,
  getMe,
} = require("../controllers/authController");
const { protect } = require("../middleware/auth");

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", protect, getMe);
// protect middleware runs first → only logged in users can access /me

module.exports = router;
