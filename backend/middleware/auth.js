const jwt = require("jsonwebtoken");
const User = require("../models/User");

const clearCookieOptions = {
  expires: new Date(0),
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
};

function extractBearerToken(authorizationHeader) {
  const headerValue = String(authorizationHeader || "").trim();
  if (!headerValue) return "";

  const [scheme, token] = headerValue.split(" ");
  if (String(scheme || "").toLowerCase() !== "bearer") return "";
  return String(token || "").trim();
}

function extractTokenFromRequest(req = {}) {
  const cookieToken = String(req?.cookies?.token || "").trim();
  if (cookieToken) {
    return {
      token: cookieToken,
      source: "cookie",
    };
  }

  const bearerToken = extractBearerToken(req?.headers?.authorization);
  if (bearerToken) {
    return {
      token: bearerToken,
      source: "bearer",
    };
  }

  return {
    token: "",
    source: "none",
  };
}

async function attachUserIfTokenValid(req, token) {
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
  const { token, source } = extractTokenFromRequest(req);

  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: "Not authorized, please login" });
  }

  const user = await attachUserIfTokenValid(req, token);
  if (!user) {
    if (source === "cookie") {
      res.cookie("token", "", clearCookieOptions);
    }
    return res.status(401).json({
      success: false,
      message: "Invalid token or user no longer exists. Please login again",
    });
  }

  next();
};

exports.optionalProtect = async (req, res, next) => {
  const { token } = extractTokenFromRequest(req);
  await attachUserIfTokenValid(req, token);
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

exports.extractTokenFromRequest = extractTokenFromRequest;
