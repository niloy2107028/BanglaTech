const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const Category = require("./models/Category");

const categories = [
  {
    name: "Electronics",
    description: "Electronic devices and gadgets",
    icon: "📱",
  },
  {
    name: "Fashion",
    description: "Clothing, shoes, and accessories",
    icon: "👔",
  },
  {
    name: "Home & Living",
    description: "Furniture, decor, and home essentials",
    icon: "🏠",
  },
  {
    name: "Beauty & Health",
    description: "Beauty products and health items",
    icon: "💄",
  },
  {
    name: "Sports & Outdoors",
    description: "Sports equipment and outdoor gear",
    icon: "⚽",
  },
  {
    name: "Books & Stationery",
    description: "Books, office supplies, and stationery",
    icon: "📚",
  },
  {
    name: "Toys & Games",
    description: "Toys, games, and entertainment",
    icon: "🎮",
  },
  {
    name: "Automotive",
    description: "Car parts and automotive accessories",
    icon: "🚗",
  },
  {
    name: "Food & Groceries",
    description: "Food items and groceries",
    icon: "🍎",
  },
  {
    name: "Mobile & Accessories",
    description: "Mobile phones and accessories",
    icon: "📱",
  },
  {
    name: "Laptop",
    description: "Laptops and notebook computers",
    icon: "💻",
  },
  {
    name: "Desktop",
    description: "Desktop computers and accessories",
    icon: "🖥️",
  },
  {
    name: "Monitor",
    description: "Computer monitors and displays",
    icon: "🖥️",
  },
  {
    name: "Components",
    description: "Computer components and parts",
    icon: "🔧",
  },
  {
    name: "Accessories",
    description: "Computer and tech accessories",
    icon: "🎧",
  },
  {
    name: "Networking",
    description: "Networking equipment and devices",
    icon: "📡",
  },
  {
    name: "Storage",
    description: "Storage devices and solutions",
    icon: "💾",
  },
  {
    name: "Gaming",
    description: "Gaming consoles and accessories",
    icon: "🎮",
  },
];

const seedCategories = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ MongoDB Connected");

    // Clear existing categories
    await Category.deleteMany({});
    console.log("🗑️  Cleared existing categories");

    // Insert categories
    const createdCategories = await Category.insertMany(categories);
    console.log(`✅ ${createdCategories.length} categories added successfully`);

    mongoose.connection.close();
    console.log("👋 Database connection closed");
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
};

seedCategories();
