const jwt = require("jsonwebtoken");
const User = require("../models/User");

const clearCookieOptions = {
  expires: new Date(0),
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
};

async function attachUserIfTokenValid(req) {
  const token = req.cookies.token;
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    req.user = user || null;
    return user || null;
  } catch (error) {
    req.user = null;
    return null;
  }
}

exports.protect = async (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: "Not authorized, please login" });
  }

  const user = await attachUserIfTokenValid(req);
  if (!user) {
    res.cookie("token", "", clearCookieOptions);
    return res.status(401).json({
      success: false,
      message: "Invalid token or user no longer exists. Please login again",
    });
  }

  next();
};

exports.optionalProtect = async (req, res, next) => {
  await attachUserIfTokenValid(req);
  next();
};

exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' is not allowed to access this route`,
      });
    }
    next();
  };
};
