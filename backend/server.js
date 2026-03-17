const express = require("express");
// Imports Express framework.
// Used to create server and handle routes.
const mongoose = require("mongoose");
// Used to connect and interact with MongoDB.

const cors = require("cors");
// Imports CORS middleware.
// Allows frontend (like React on port 5173/3000) to access backend.
// Without this → browser blocks requests.

const path = require("path");
// Used to work with file & folder paths safely.

const cookieParser = require("cookie-parser");
const session = require("express-session");
const passport = require("passport");

require("dotenv").config();
// Loads environment variables from .env file.

// Passport config
require("./config/passport")(passport);

const app = express();
// Creates Express application instance.

// Middleware
// app.use(cors());
app.use(
  cors({
    origin: "http://localhost:3000",
    // Your React dev server URL
    credentials: true,
    // Allow cookies to be sent cross-origin
  }),
);
// Allows frontend to call backend API.
app.use(express.json());
// Allows server to read JSON data from request body
app.use(express.urlencoded({ extended: true }));
// It is middleware that allows your server to read data sent from an HTML form**

app.use(cookieParser());
// Reads cookies from requests
// Required for HTTP-only token cookie to work

// Sessions
app.use(
  session({
    secret: process.env.SESSION_SECRET || "somethingsecret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  }),
);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Serve static files from uploads directory
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
// Make this folder publicly accessible
// Example:
// If your project is in:
// E:/BanglaTech/backend
// Then:
// path.join(__dirname, "uploads")
// Becomes:
// E:/BanglaTech/backend/uploads

// MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log(" MongoDB Connected Successfully"))
  .catch((err) => console.error(" MongoDB Connection Error:", err));

// Connects to MongoDB using mongoose.connect(process.env.MONGODB_URI)
// Database is automatically created on first connection if it doesn't exist
// Collections are created when first document is inserted

// Routes
app.use("/api/products", require("./routes/productRoutes"));
// Any request starting with: /api/products
// Will go to:
// ./routes/productRoutes.js

app.use("/api/categories", require("./routes/categoryRoutes"));

app.use("/api/auth", require("./routes/authRoutes"));

app.use("/api/cart", require("./routes/cartRoutes"));
app.use("/api/orders", require("./routes/orderRoutes"));

// Root route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to BanglaTech API" });
});

/* If user visits:
http://localhost:5000/
They will see:
{
  "message": "Welcome to BanglaTech API"
} 
*/

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: "Something went wrong!",
    error: err.message,
  });
});
// This must be last:
// Because:
// It catches errors from routes above
// If placed before routes → it won’t catch them
// routes should call it (when needed).
// Errors passed with next(err)

// routes must call next(err)
// For async errors
// For custom errors (404, validation, etc.)

const PORT = process.env.PORT;

app.listen(PORT, () => {
  console.log(` Server running on port ${PORT}`);
});
