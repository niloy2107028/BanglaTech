const User = require("../models/User");
const PendingUser = require("../models/PendingUser");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");

// Helper: create JWT and send as HTTP-only cookie
const sendTokenResponse = (user, statusCode, res, redirect = false) => {
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

  res.cookie("token", token, cookieOptions);

  if (redirect) {
    return res.redirect(process.env.CLIENT_URL || "http://localhost:3000/");
  }

  res.status(statusCode).json({
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

    // Delete any existing pending registration for this email
    await PendingUser.deleteOne({ email });

    // Create 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Create pending user record
    await PendingUser.create({
      name,
      email,
      password,
      role,
      otp,
      otpExpires,
    });

    const message = `Your email verification code is: ${otp}. This code is valid for 10 minutes.`;

    try {
      await sendEmail({
        email,
        subject: "Email Verification Code",
        message,
        html: `<h1>Email Verification</h1><p>Your verification code is: <strong>${otp}</strong></p><p>This code is valid for 10 minutes.</p>`,
      });

      res.status(201).json({
        success: true,
        message: "Enter the code to verify your account.",
      });
    } catch (err) {
      await PendingUser.deleteOne({ email });

      return res.status(500).json({
        success: false,
        message: "Email could not be sent. Please try again later.",
      });
    }
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Verify email OTP
// @route   POST /api/auth/verify-email
exports.verifyEmail = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const pendingUser = await PendingUser.findOne({
      email: email.toLowerCase(),
      otp: otp.trim(),
      otpExpires: { $gt: Date.now() },
    });

    if (!pendingUser) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification code",
      });
    }

    // Move pending user to main user collection
    const user = await User.create({
      name: pendingUser.name,
      email: pendingUser.email,
      password: pendingUser.password, // This will be hashed by User model's pre('save')
      role: pendingUser.role,
      isVerified: true,
    });

    // Delete pending user record
    await PendingUser.deleteOne({ email: pendingUser.email });

    sendTokenResponse(user, 201, res);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Resend OTP (for both registration and forgot password)
// @route   POST /api/auth/resend-otp
exports.resendOTP = async (req, res) => {
  try {
    const { email, type } = req.body; // type: 'register' or 'forgot-password'

    if (type === "register") {
      const pendingUser = await PendingUser.findOne({ email: email.toLowerCase() });
      if (!pendingUser) {
        return res.status(404).json({ success: false, message: "No pending registration found" });
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      pendingUser.otp = otp;
      pendingUser.otpExpires = Date.now() + 10 * 60 * 1000;
      await pendingUser.save();

      await sendEmail({
        email,
        subject: "Email Verification Code (Resent)",
        message: `Your email verification code is: ${otp}`,
        html: `<h1>Email Verification</h1><p>Your verification code is: <strong>${otp}</strong></p>`,
      });
    } else {
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }

      const otp = user.getResetPasswordOTP();
      await user.save({ validateBeforeSave: false });

      await sendEmail({
        email,
        subject: "Password Reset Code (Resent)",
        message: `Your password reset code is: ${otp}`,
        html: `<h1>Password Reset</h1><p>Your password reset code is: <strong>${otp}</strong></p>`,
      });
    }

    res.status(200).json({ success: true, message: "OTP resent successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all users
// @route   GET /api/auth/users
// @access  Private (Admin only)
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().sort("-createdAt");
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete user
// @route   DELETE /api/auth/users/:id
// @access  Private (Admin only)
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    await user.deleteOne();
    res.json({ success: true, message: "User removed" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update user role
// @route   PUT /api/auth/users/:id/role
// @access  Private (Admin only)
exports.updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    user.role = role;
    await user.save();
    res.json({ success: true, message: "Role updated", data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Google OAuth Callback
// @route   GET /api/auth/google/callback
exports.googleCallback = (req, res) => {
  sendTokenResponse(req.user, 200, res, true);
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
exports.forgotPassword = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "There is no user with that email",
      });
    }

    // Get reset OTP
    const otp = user.getResetPasswordOTP();

    await user.save({ validateBeforeSave: false });

    const message = `Your password reset code is: ${otp}. This code is valid for 10 minutes.`;

    try {
      await sendEmail({
        email: user.email,
        subject: "Password Reset Code",
        message,
        html: `<h1>Password Reset</h1><p>Your password reset code is: <strong>${otp}</strong></p><p>This code is valid for 10 minutes.</p>`,
      });

      res.status(200).json({ success: true, message: "Enter the code to reset your password." });
    } catch (err) {
      user.resetPasswordOTP = undefined;
      user.resetPasswordOTPExpire = undefined;

      await user.save({ validateBeforeSave: false });

      return res.status(500).json({
        success: false,
        message: "Email could not be sent",
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Verify Reset Password OTP
// @route   POST /api/auth/verify-reset-otp
exports.verifyResetOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({
      email: email.toLowerCase(),
      resetPasswordOTP: otp,
      resetPasswordOTPExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification code",
      });
    }

    res.status(200).json({ success: true, message: "Code verified" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Reset password
// @route   PUT /api/auth/reset-password
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, password } = req.body;

    const user = await User.findOne({
      email: email.toLowerCase(),
      resetPasswordOTP: otp,
      resetPasswordOTPExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification code",
      });
    }

    // Set new password
    user.password = password;
    user.resetPasswordOTP = undefined;
    user.resetPasswordOTPExpire = undefined;
    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
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

    if (!user.isVerified) {
      return res.status(401).json({
        success: false,
        message: "Please verify your email to login",
      });
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
    return res.json({
      success: true,
      user: null,
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
