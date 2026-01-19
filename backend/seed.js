const mongoose = require("mongoose");
require("dotenv").config();
const Product = require("./models/Product");

// Sample product data
const sampleProducts = [
  // Electronics
  {
    name: 'Samsung 43" 4K Smart LED TV',
    brand: "Samsung",
    category: "Electronics",
    price: 45000,
    originalPrice: 52000,
    description:
      "43-inch 4K UHD Smart LED TV with HDR, built-in WiFi, and multiple connectivity options.",
    specifications: {
      "Screen Size": "43 inches",
      Resolution: "4K UHD (3840x2160)",
      "Smart TV": "Yes",
      HDR: "Yes",
    },
    image:
      "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=500&h=500&fit=crop",
    stock: 12,
    featured: true,
    rating: 4.5,
    reviews: 89,
  },
  {
    name: "Sony WH-1000XM5 Wireless Headphones",
    brand: "Sony",
    category: "Electronics",
    price: 28000,
    originalPrice: 32000,
    description:
      "Premium noise-cancelling wireless headphones with exceptional sound quality and 30-hour battery life.",
    specifications: {
      Type: "Over-Ear",
      "Noise Cancelling": "Yes",
      "Battery Life": "30 hours",
      Bluetooth: "5.2",
    },
    image:
      "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=500&h=500&fit=crop",
    stock: 20,
    featured: true,
    rating: 4.8,
    reviews: 156,
  },
  {
    name: "Canon EOS 2000D DSLR Camera",
    brand: "Canon",
    category: "Electronics",
    price: 35000,
    originalPrice: 40000,
    description:
      "24.1 MP DSLR camera with 18-55mm lens, perfect for photography enthusiasts.",
    specifications: {
      Megapixels: "24.1 MP",
      "Sensor Type": "APS-C CMOS",
      "Video Resolution": "Full HD 1080p",
      Lens: "18-55mm",
    },
    image:
      "https://images.unsplash.com/photo-1606980707428-33b383cdb6c0?w=500&h=500&fit=crop",
    stock: 8,
    featured: false,
    rating: 4.6,
    reviews: 67,
  },

  // Fashion
  {
    name: "Men's Casual Denim Jacket",
    brand: "Levis",
    category: "Fashion",
    price: 3500,
    originalPrice: 4500,
    description:
      "Classic blue denim jacket with a modern fit. Perfect for casual outings.",
    specifications: {
      Material: "100% Cotton Denim",
      Fit: "Regular",
      Color: "Blue",
      Size: "M, L, XL available",
    },
    image:
      "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500&h=500&fit=crop",
    stock: 30,
    featured: true,
    rating: 4.3,
    reviews: 92,
  },
  {
    name: "Women's Summer Floral Dress",
    brand: "Zara",
    category: "Fashion",
    price: 2800,
    originalPrice: 3500,
    description: "Elegant floral print dress perfect for summer occasions.",
    specifications: {
      Material: "Cotton Blend",
      Pattern: "Floral",
      Length: "Knee Length",
      "Sleeve Type": "Short Sleeve",
    },
    image:
      "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=500&h=500&fit=crop",
    stock: 25,
    featured: false,
    rating: 4.4,
    reviews: 78,
  },
  {
    name: "Unisex Canvas Sneakers",
    brand: "Adidas",
    category: "Fashion",
    price: 4200,
    originalPrice: 5000,
    description: "Comfortable canvas sneakers suitable for everyday wear.",
    specifications: {
      Material: "Canvas Upper",
      "Sole Type": "Rubber",
      Color: "White",
      Sizes: "38-44",
    },
    image:
      "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=500&h=500&fit=crop",
    stock: 40,
    featured: true,
    rating: 4.5,
    reviews: 134,
  },

  // Home & Living
  {
    name: "6-Seater Wooden Dining Table Set",
    brand: "Hatil",
    category: "Home & Living",
    price: 45000,
    originalPrice: 55000,
    description:
      "Elegant wooden dining table with 6 cushioned chairs. Perfect for family dinners.",
    specifications: {
      Material: "Solid Wood",
      Seating: "6 Persons",
      Color: "Brown",
      Dimensions: "180cm x 90cm",
    },
    image:
      "https://images.unsplash.com/photo-1617806118233-18e1de247200?w=500&h=500&fit=crop",
    stock: 5,
    featured: true,
    rating: 4.7,
    reviews: 43,
  },
  {
    name: "Cotton Bed Sheet Set - King Size",
    brand: "Aarong",
    category: "Home & Living",
    price: 3500,
    originalPrice: 4200,
    description: "Premium quality cotton bed sheet set with 2 pillow covers.",
    specifications: {
      Material: "100% Cotton",
      Size: "King Size",
      "Thread Count": "300",
      Pieces: "3 pieces (1 sheet + 2 covers)",
    },
    image:
      "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=500&h=500&fit=crop",
    stock: 50,
    featured: false,
    rating: 4.4,
    reviews: 112,
  },
  {
    name: "LED Table Lamp with USB Port",
    brand: "Philips",
    category: "Home & Living",
    price: 1800,
    originalPrice: 2500,
    description:
      "Modern LED desk lamp with adjustable brightness and USB charging port.",
    specifications: {
      "Power Source": "AC Adapter",
      "Light Color": "Warm White",
      Features: "Dimmable, USB Port",
      Material: "Metal & Plastic",
    },
    image:
      "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=500&h=500&fit=crop",
    stock: 35,
    featured: false,
    rating: 4.2,
    reviews: 68,
  },

  // Beauty & Health
  {
    name: "Facial Cleanser & Moisturizer Set",
    brand: "Neutrogena",
    category: "Beauty & Health",
    price: 1500,
    originalPrice: 1800,
    description:
      "Complete skincare set with cleanser and moisturizer for daily use.",
    specifications: {
      "Skin Type": "All Types",
      Volume: "200ml each",
      "Paraben Free": "Yes",
      Dermatologist: "Tested",
    },
    image:
      "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=500&h=500&fit=crop",
    stock: 60,
    featured: true,
    rating: 4.6,
    reviews: 203,
  },
  {
    name: "Hair Dryer Professional 2000W",
    brand: "Panasonic",
    category: "Beauty & Health",
    price: 2800,
    originalPrice: 3500,
    description:
      "Professional hair dryer with multiple heat settings and cool shot button.",
    specifications: {
      Power: "2000W",
      Settings: "3 Heat, 2 Speed",
      "Cool Shot": "Yes",
      "Ionic Technology": "Yes",
    },
    image:
      "https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=500&h=500&fit=crop",
    stock: 18,
    featured: false,
    rating: 4.3,
    reviews: 87,
  },

  // Sports & Outdoors
  {
    name: "Professional Yoga Mat with Bag",
    brand: "Nike",
    category: "Sports & Outdoors",
    price: 2200,
    originalPrice: 2800,
    description:
      "Non-slip yoga mat with carrying bag. Perfect for yoga and fitness exercises.",
    specifications: {
      Material: "TPE",
      Thickness: "6mm",
      Size: "183cm x 61cm",
      "Non-Slip": "Yes",
    },
    image:
      "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=500&h=500&fit=crop",
    stock: 45,
    featured: true,
    rating: 4.5,
    reviews: 124,
  },
  {
    name: "Badminton Racket Set (2 Rackets)",
    brand: "Yonex",
    category: "Sports & Outdoors",
    price: 3500,
    originalPrice: 4200,
    description:
      "Professional badminton racket set with cover and 3 shuttlecocks.",
    specifications: {
      Material: "Carbon Fiber",
      Weight: "85g each",
      "Grip Size": "G4",
      Includes: "2 rackets, 3 shuttles, cover",
    },
    image:
      "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=500&h=500&fit=crop",
    stock: 22,
    featured: false,
    rating: 4.7,
    reviews: 95,
  },

  // Books & Stationery
  {
    name: "Hardcover Notebook Set (3 Pack)",
    brand: "Moleskine",
    category: "Books & Stationery",
    price: 1200,
    originalPrice: 1500,
    description:
      "Premium quality hardcover notebooks perfect for journaling and note-taking.",
    specifications: {
      Pages: "192 pages each",
      Size: "A5",
      Paper: "Ivory",
      Binding: "Hardcover",
    },
    image:
      "https://images.unsplash.com/photo-1517842645767-c639042777db?w=500&h=500&fit=crop",
    stock: 80,
    featured: false,
    rating: 4.6,
    reviews: 156,
  },
  {
    name: "Complete Art Supplies Kit",
    brand: "Faber-Castell",
    category: "Books & Stationery",
    price: 2500,
    originalPrice: 3000,
    description:
      "Complete art kit with colored pencils, markers, and sketchbook.",
    specifications: {
      Includes: "24 colored pencils, 12 markers",
      Sketchbook: "A4 size, 50 pages",
      "Pencil Case": "Included",
      Quality: "Premium",
    },
    image:
      "https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=500&h=500&fit=crop",
    stock: 35,
    featured: true,
    rating: 4.8,
    reviews: 142,
  },

  // Toys & Games
  {
    name: "Building Blocks Set (1000 Pieces)",
    brand: "LEGO",
    category: "Toys & Games",
    price: 4500,
    originalPrice: 5500,
    description:
      "Creative building blocks set with 1000 pieces. Enhances creativity and motor skills.",
    specifications: {
      Pieces: "1000",
      "Age Range": "6+ years",
      Material: "ABS Plastic",
      Color: "Multicolor",
    },
    image:
      "https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=500&h=500&fit=crop",
    stock: 28,
    featured: true,
    rating: 4.9,
    reviews: 267,
  },
  {
    name: "Remote Control Racing Car",
    brand: "Hot Wheels",
    category: "Toys & Games",
    price: 3200,
    originalPrice: 3800,
    description:
      "High-speed RC car with rechargeable battery and remote control.",
    specifications: {
      Speed: "Up to 25 km/h",
      Battery: "Rechargeable Li-ion",
      Range: "50 meters",
      Scale: "1:18",
    },
    image:
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&h=500&fit=crop",
    stock: 32,
    featured: false,
    rating: 4.4,
    reviews: 98,
  },

  // Automotive
  {
    name: "Car Vacuum Cleaner Portable",
    brand: "Black+Decker",
    category: "Automotive",
    price: 2800,
    originalPrice: 3500,
    description:
      "Powerful portable car vacuum cleaner with multiple attachments.",
    specifications: {
      Power: "120W",
      "Power Source": "12V DC (Car socket)",
      "Cord Length": "4.5 meters",
      Accessories: "3 nozzles included",
    },
    image:
      "https://images.unsplash.com/photo-1585846416120-3a7354ed7d39?w=500&h=500&fit=crop",
    stock: 25,
    featured: false,
    rating: 4.3,
    reviews: 76,
  },
  {
    name: "Car Phone Holder Dashboard Mount",
    brand: "Baseus",
    category: "Automotive",
    price: 800,
    originalPrice: 1200,
    description:
      "Universal car phone holder with 360-degree rotation and strong grip.",
    specifications: {
      Compatibility: "All smartphones",
      Mount: "Dashboard & Windshield",
      Rotation: "360 degrees",
      Material: "ABS + Silicone",
    },
    image:
      "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=500&h=500&fit=crop",
    stock: 65,
    featured: false,
    rating: 4.2,
    reviews: 134,
  },

  // Food & Groceries
  {
    name: "Premium Basmati Rice 5kg",
    brand: "Pran",
    category: "Food & Groceries",
    price: 650,
    originalPrice: 750,
    description:
      "High-quality basmati rice with long grains and aromatic flavor.",
    specifications: {
      Weight: "5 kg",
      Type: "Basmati",
      Origin: "Bangladesh",
      "Shelf Life": "12 months",
    },
    image:
      "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&h=500&fit=crop",
    stock: 150,
    featured: false,
    rating: 4.5,
    reviews: 234,
  },
  {
    name: "Organic Honey 500g",
    brand: "Sundarban",
    category: "Food & Groceries",
    price: 450,
    originalPrice: 550,
    description:
      "Pure organic honey from Sundarban. Natural and healthy sweetener.",
    specifications: {
      Weight: "500g",
      Type: "Pure Organic",
      Origin: "Sundarban",
      "No Additives": "Yes",
    },
    image:
      "https://images.unsplash.com/photo-1587049352846-4a222e784196?w=500&h=500&fit=crop",
    stock: 85,
    featured: true,
    rating: 4.7,
    reviews: 178,
  },

  // Mobile & Accessories
  {
    name: "Xiaomi Redmi Note 12 Pro",
    brand: "Xiaomi",
    category: "Mobile & Accessories",
    price: 28500,
    originalPrice: 32000,
    description:
      '6.67" AMOLED display, 50MP camera, 5000mAh battery with 67W fast charging.',
    specifications: {
      Display: '6.67" AMOLED',
      Processor: "Snapdragon 4 Gen 1",
      RAM: "8GB",
      Storage: "128GB",
      Camera: "50MP + 8MP + 2MP",
      Battery: "5000mAh",
    },
    image:
      "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500&h=500&fit=crop",
    stock: 15,
    featured: true,
    rating: 4.6,
    reviews: 189,
  },
  {
    name: "Wireless Power Bank 20000mAh",
    brand: "Anker",
    category: "Mobile & Accessories",
    price: 3200,
    originalPrice: 3800,
    description:
      "High-capacity power bank with wireless charging and dual USB ports.",
    specifications: {
      Capacity: "20000mAh",
      "Wireless Charging": "Yes (10W)",
      Ports: "2 USB-A, 1 USB-C",
      "Fast Charging": "Yes",
    },
    image:
      "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=500&h=500&fit=crop",
    stock: 42,
    featured: false,
    rating: 4.5,
    reviews: 156,
  },
  {
    name: "Bluetooth Earbuds with Charging Case",
    brand: "JBL",
    category: "Mobile & Accessories",
    price: 4500,
    originalPrice: 5500,
    description:
      "True wireless earbuds with premium sound quality and 24-hour battery life.",
    specifications: {
      Type: "True Wireless",
      "Battery Life": "6h + 18h case",
      "Water Resistance": "IPX5",
      Bluetooth: "5.1",
    },
    image:
      "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500&h=500&fit=crop",
    stock: 38,
    featured: true,
    rating: 4.7,
    reviews: 213,
  },
];

// Connect to MongoDB and seed data
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/banglamart", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(async () => {
    console.log("✅ MongoDB Connected");

    // Clear existing data
    await Product.deleteMany({});
    console.log("🗑️  Cleared existing products");

    // Insert sample data
    await Product.insertMany(sampleProducts);
    console.log("✅ Sample products added successfully");

    console.log(`📦 Total ${sampleProducts.length} products seeded`);
    process.exit();
  })
  .catch((err) => {
    console.error("❌ Error:", err);
    process.exit(1);
  });
