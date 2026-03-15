const { response } = require("express");
const User = require("../models/User");
const jwt = require("jsonwebtoken");

// Helper: create JWT and send as HTTP-only cookie
const sendTokenResponse = (user, statusCode, res) => {
  // token generate kore response er cookie te pathay
  const token = jwt.sign(
    { id: user._id, role: user.role },
    // Payload: user id and role
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE },
  );

  const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    // 7 days from now
    httpOnly: true,
    // JS cannot access this cookie → prevents XSS attacks
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    // Only send over HTTPS in production
  };

  //   Option	Purpose
  // expires	cookie expires after 7 days
  // httpOnly	JavaScript cannot access it
  // sameSite	protects from CSRF
  // secure	only sent over HTTPS
  // httpOnly is important because it prevents XSS attacks.

  res
    .status(statusCode)
    .cookie("token", token, cookieOptions)
    .json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
};

// @desc    Register user
// @route   POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "Email already registered" });
    }

    const user = await User.create({ name, email, password, role });
    // this is important
    sendTokenResponse(user, 201, res);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Please provide email and password" });
    }

    // select: false was set on password, so we manually include it
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
exports.logout = (req, res) => {
  res.cookie("token", "", {
    expires: new Date(0),
    // Set cookie to expire immediately
    httpOnly: true,
  });
  res.json({ success: true, message: "Logged out" });
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
exports.getMe = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Not authorized, please login",
    });
  }

  // req.user is set by the protect middleware
  const user = await User.findById(req.user.id);

  if (!user) {
    return res.status(401).json({
      success: false,
      message: "User no longer exists. Please login again",
    });
  }

  res.json({ success: true, user });
};
