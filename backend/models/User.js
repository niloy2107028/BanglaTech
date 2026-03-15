const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
      select: false,
      // select: false → password will NOT be returned in queries by default
    },
    role: {
      type: String,
      enum: ["seller", "admin", "buyer"],
      // Only these three values are allowed
      default: "buyer",
    },
  },
  { timestamps: true },
);

// Hash password before saving
// This runs automatically before every .save()
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  //  If the password was NOT changed skip hashing
  //   update name  password unchanged  don't hash again
  //   If you hashed again, the password would break.
  this.password = await bcrypt.hash(this.password, 12);
  //   12 = salt rounds
  // Higher number = more secure but slower.
  next();
});

// Method to compare password during login
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
