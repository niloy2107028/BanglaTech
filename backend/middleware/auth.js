const jwt = require("jsonwebtoken");
const User = require("../models/User");

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

// Protect: user must be logged in
exports.protect = async (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: "Not authorized, please login" });
  }

  const user = await attachUserIfTokenValid(req);
  if (!user) {
    res.cookie("token", "", {
      expires: new Date(0),
      httpOnly: true,
    });
    return res
      .status(401)
      .json({
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

// Authorize: user must have specific role
exports.authorize = (...roles) => {
  // ...roles means you can pass multiple: authorize("admin", "manager")
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
