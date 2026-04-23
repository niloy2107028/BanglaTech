// MongoDB does NOT create a database until you insert data into it.

const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
    },
    brand: {
      type: String,
      required: [true, "Brand name is required"],
      trim: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      // Means: It stores ID of another document.
      ref: "Category",
      // Means:
      // It connects to Category model.
      // This is called reference / relationship
      // You can use later: Product.find().populate("category")
      required: [true, "Category is required"],
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "seller is required"],
      // Product owner / creator
    },
    categoryName: {
      type: String,
      required: true,
    },
    // Why store both category & categoryName?
    // category → for relationship
    // categoryName → faster filtering / display
    // Avoid populate sometimes

    price: {
      type: Number,
      required: [true, "Price is required"],
      min: 0,
    },
    originalPrice: {
      type: Number,
      min: 0,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
    },
    specifications: {
      type: Map,
      of: String,
    },

    // Example in database:
    // {
    //   "Screen Size": "43 inches",
    //   "Resolution": "4K",
    //   "Battery": "5000mAh"
    // }

    image: {
      // url
      type: String,
      required: [true, "Product image is required"],
    },
    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    inStock: {
      type: Boolean,
      default: true,
    },
    featured: {
      // highlighted products
      type: Boolean,
      default: false,
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
    reviews: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);
// models/Product.js - Defines product structure (name, brand, category ObjectId reference, price, etc.)

// Mongoose Middleware.
// What it means:
// Before saving product → run this function.
// Calculate inStock based on stock quantity
productSchema.pre("save", function (next) {
  this.inStock = this.stock > 0; //if greater than 0 it will assign True
  // auto calculated
  next();
  //middle ware next function for continue next things
});

productSchema.index(
  {
    name: "text",
    brand: "text",
    categoryName: "text",
    description: "text",
  },
  {
    weights: {
      name: 8,
      brand: 5,
      categoryName: 4,
      description: 2,
    },
    name: "product_text_search_idx",
  },
);

module.exports = mongoose.model("Product", productSchema);

// Final Product Structure in Database
// {
//   "_id": "ObjectId",
//   "name": "Sony Headphones",
//   "brand": "Sony",
//   "category": "ObjectId",
//   "categoryName": "Electronics",
//   "price": 28000,
//   "originalPrice": 32000,
//   "description": "...",
//   "specifications": {
//     "Battery": "30 hours"
//   },
//   "image": "https://...",
//   "stock": 15,
//   "inStock": true,
//   "featured": true,
//   "rating": 4.5,
//   "reviews": 89,
//   "createdAt": "...",
//   "updatedAt": "..."
// }
