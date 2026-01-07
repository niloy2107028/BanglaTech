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
      type: String,
      required: [true, "Category is required"],
      enum: [
        "Laptop",
        "Desktop",
        "Monitor",
        "Components",
        "Accessories",
        "Networking",
        "Storage",
        "Gaming",
        "Software",
        "Mobile",
      ],
    },
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
    image: {
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
  }
);

// Calculate inStock based on stock quantity
productSchema.pre("save", function (next) {
  this.inStock = this.stock > 0;
  next();
});

module.exports = mongoose.model("Product", productSchema);
