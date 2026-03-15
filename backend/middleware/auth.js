const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Protect: user must be logged in
exports.protect = async (req, res, next) => {
  const token = req.cookies.token;
  // Read token from HTTP-only cookie

  if (!token) {
    console.log("no token found. I am inside auth protect middleware");
    // Browser console only shows frontend logs
    //check vs code backend terminal for this
    return res
      .status(401)
      .json({ success: false, message: "Not authorized, please login" });
  } else {
    console.log("token found in protect middleware");
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Verify and decode the token

    req.user = await User.findById(decoded.id);
    if (!req.user) {
      // Token may belong to a deleted user (e.g., after reseeding DB)
      res.cookie("token", "", {
        expires: new Date(0),
        httpOnly: true,
      });
      return res
        .status(401)
        .json({
          success: false,
          message: "User no longer exists. Please login again",
        });
    }
    // Attach user to request so next middleware/controller can use it

    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
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
