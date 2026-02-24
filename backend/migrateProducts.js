const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const Product = require("./models/Product");
const Category = require("./models/Category");

const migrateProducts = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ MongoDB Connected");

    // Get all categories
    const categories = await Category.find();
    const categoryMap = {};
    categories.forEach((cat) => {
      categoryMap[cat.name] = cat._id;
    });

    console.log("📋 Found categories:", Object.keys(categoryMap));

    // Get all products
    const products = await Product.find();
    console.log(`📦 Found ${products.length} products to migrate`);

    let updated = 0;
    let skipped = 0;

    for (const product of products) {
      // Get the category string - it might be in different fields
      let oldCategory = null;

      if (typeof product.category === "string") {
        oldCategory = product.category;
      } else if (product.categoryName) {
        oldCategory = product.categoryName;
      } else if (typeof product.category === "object" && product.category) {
        // Already migrated or has object reference
        oldCategory = null;
      }

      // Log the product structure for debugging
      console.log(
        `Checking: ${product.name} - category type: ${typeof product.category}, categoryName: ${product.categoryName}`,
      );

      if (oldCategory && categoryMap[oldCategory]) {
        product.category = categoryMap[oldCategory];
        product.categoryName = oldCategory;
        await product.save();
        updated++;
        console.log(`✅ Updated: ${product.name} -> ${oldCategory}`);
      } else if (!oldCategory && product.category) {
        // Already has a category reference, skip
        skipped++;
        console.log(
          `⏭️  Skipped: ${product.name} (already has category reference)`,
        );
      } else {
        skipped++;
        console.log(
          `⚠️  Skipped: ${product.name} (no matching category: ${oldCategory || "none"})`,
        );
      }
    }

    console.log(`\n✅ Migration complete!`);
    console.log(`   Updated: ${updated} products`);
    console.log(`   Skipped: ${skipped} products`);

    mongoose.connection.close();
    console.log("👋 Database connection closed");
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
};

migrateProducts();
