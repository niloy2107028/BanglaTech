// We dont need this file because data updating work is done in the setImmediate.js
// data update : update the string to id in cateagory key

// const mongoose = require("mongoose");
// // Imports Mongoose to connect and work with MongoDB.

// const path = require("path");
// // Used to work with file paths (for loading .env file correctly).

// require("dotenv").config({ path: path.join(__dirname, ".env") });
// // Loads environment variables from .env file.

// const Product = require("./models/Product");
// const Category = require("./models/Category");
// // Imports Product and Category models (schemas).

// // Categories data (Array of objects)
// const categories = [
//   {
//     name: "Electronics",
//     description:
//       "Electronic devices and gadgets including phones, laptops, and accessories",
//     image: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400",
//   },
//   {
//     name: "Fashion",
//     description: "Clothing, shoes, and fashion accessories for men and women",
//     image: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=400",
//   },
//   {
//     name: "Home & Living",
//     description: "Furniture, home decor, and household essentials",
//     image: "https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=400",
//   },
//   {
//     name: "Beauty & Health",
//     description: "Beauty products, skincare, and health items",
//     image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400",
//   },
//   {
//     name: "Sports & Outdoors",
//     description: "Sports equipment, fitness gear, and outdoor accessories",
//     image: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400",
//   },
//   {
//     name: "Books & Stationery",
//     description: "Books, office supplies, and stationery items",
//     image: "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=400",
//   },
//   {
//     name: "Toys & Games",
//     description: "Toys, games, and entertainment for all ages",
//     image: "https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=400",
//   },
//   {
//     name: "Automotive",
//     description: "Car parts, automotive accessories, and tools",
//     image: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=400",
//   },
//   {
//     name: "Food & Groceries",
//     description: "Food items, groceries, and daily essentials",
//     image: "https://images.unsplash.com/photo-1543168256-418811576931?w=400",
//   },
//   {
//     name: "Mobile & Accessories",
//     description: "Mobile phones, cases, chargers, and accessories",
//     image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400",
//   },
// ];

// // Migration function - updates existing data without clearing
// const migrateDatabase = async () => {
//   try {
//     // Connect to MongoDB
//     const mongoUri = process.env.MONGODB_URI;
//     await mongoose.connect(mongoUri);
//     console.log(" MongoDB Connected");

//     console.log("\n Starting database migration...\n");

//     // Migrate Categories
//     console.log(" Migrating categories...");
//     let categoriesUpdated = 0;
//     let categoriesCreated = 0;

//     for (const categoryData of categories) {
//       // Check if category already exists
//       const existingCategory = await Category.findOne({
//         name: categoryData.name,
//       });

//       if (existingCategory) {
//         if (
//           existingCategory.description !== categoryData.description ||
//           existingCategory.image != categoryData.image ||
//           existingCategory.isActive != true
//         ) {
//           categoriesUpdated++;

//           // Update existing category
//           existingCategory.description = categoryData.description;
//           existingCategory.image = categoryData.image;
//           existingCategory.isActive = true;
//         }

//         await existingCategory.save();

//         console.log(`    Updated: ${categoryData.name}`);
//       } else {
//         // Create new category
//         await Category.create(categoryData);
//         categoriesCreated++;
//         console.log(`   Created: ${categoryData.name}`);
//       }
//     }

//     console.log(`\n Categories migration complete!`);
//     console.log(`   Updated: ${categoriesUpdated}`);
//     console.log(`   Created: ${categoriesCreated}`);

//     // Migrate Products
//     console.log("\n Migrating products...");

//     // Get all categories for mapping
//     const allCategories = await Category.find();
//     const categoryMap = {};
//     // we will create a map where key will be name and value will be object id
//     allCategories.forEach((cat) => {
//       categoryMap[cat.name] = cat._id;
//     });

//     // Find products that need migration
//     const products = await Product.find();
//     let productsUpdated = 0;
//     let productsSkipped = 0;

//     for (const product of products) {
//       let needsUpdate = false;

//       // Check if category is a string (needs migration)
//       if (typeof product.category === "string") {
//         const categoryId = categoryMap[product.category];
//         if (categoryId) {
//           product.category = categoryId;
//           product.categoryName = product.category;
//           needsUpdate = true;
//         }
//       }

//       // Check if category is ObjectId but categoryName is missing
//       if (product.category && !product.categoryName) {
//         const category = await Category.findById(product.category);
//         if (category) {
//           product.categoryName = category.name;
//           needsUpdate = true;
//         }
//       }

//       // Ensure image field exists
//       if (!product.image) {
//         product.image = "https://via.placeholder.com/500?text=Product";
//         needsUpdate = true;
//       }

//       if (needsUpdate) {
//         await product.save();
//         productsUpdated++;
//         console.log(`  Updated: ${product.name}`);
//       } else {
//         productsSkipped++;
//       }
//     }

//     console.log(`\n Products migration complete!`);
//     console.log(`   Updated: ${productsUpdated}`);
//     console.log(`   Skipped: ${productsSkipped} (already up to date)`);

//     console.log("\n Database migration completed successfully!");

//     await mongoose.connection.close();
//     console.log(" Database connection closed");
//     process.exit(0);
//   } catch (error) {
//     console.error(" Migration failed:", error);
//     process.exit(1);
//   }
// };

// // Run migration
// migrateDatabase();
