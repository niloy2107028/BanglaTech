const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    // Schema = Structure of your document
    name: {
      type: String,
      required: [true, "Category name is required"],
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    image: {
      type: String,
      default: "https://via.placeholder.com/150?text=Category",
    },
    isActive: {
      // Soft delete category
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    // timestamps: true automatically adds:
    // createdAt
    // updatedAt
    // Very useful for:
    // Sorting
    // Admin panel
    // Tracking changes
  },
);
// models/Category.js - Defines category structure (name, description, image, isActive)

module.exports = mongoose.model("Category", categorySchema);

// This line does 2 things:

// 1. Creates a Model
// mongoose.model("Category", categorySchema)

//  Creates a model named Category.

// MongoDB will automatically create collection:

// categories

// (lowercase + plural)

//  2. Exports It
// module.exports = ...

//  Allows other files to use this model:

// const Category = require("./models/Category");

// Now you can:

// Category.find()
// Category.create()
// Category.deleteMany()
