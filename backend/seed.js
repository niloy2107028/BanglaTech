const mongoose = require("mongoose");
require("dotenv").config();
const Product = require("./models/Product");

// Sample product data
const sampleProducts = [
  {
    name: 'Dell Inspiron 15 3520 Core i5 12th Gen 15.6" FHD Laptop',
    brand: "Dell",
    category: "Laptop",
    price: 58500,
    originalPrice: 65000,
    description:
      "Dell Inspiron 15 3520 powered by 12th Gen Intel Core i5-1235U processor with 8GB DDR4 RAM and 512GB SSD storage.",
    specifications: {
      Processor: "Intel Core i5-1235U (12th Gen)",
      RAM: "8GB DDR4",
      Storage: "512GB SSD",
      Display: '15.6" FHD (1920x1080)',
      Graphics: "Intel UHD Graphics",
    },
    image:
      "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=500&h=500&fit=crop",
    stock: 15,
    featured: true,
    rating: 4.5,
    reviews: 128,
  },
  {
    name: 'ASUS TUF Gaming F15 Core i5 11th Gen RTX 3050 15.6" FHD Gaming Laptop',
    brand: "ASUS",
    category: "Gaming",
    price: 89999,
    originalPrice: 99999,
    description:
      "ASUS TUF Gaming F15 features 11th Gen Intel Core i5 processor, NVIDIA GeForce RTX 3050 4GB graphics, 8GB RAM, and 512GB SSD.",
    specifications: {
      Processor: "Intel Core i5-11400H (11th Gen)",
      RAM: "8GB DDR4",
      Storage: "512GB SSD",
      Display: '15.6" FHD 144Hz',
      Graphics: "NVIDIA RTX 3050 4GB",
    },
    image:
      "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=500&h=500&fit=crop",
    stock: 8,
    featured: true,
    rating: 4.7,
    reviews: 256,
  },
  {
    name: 'HP Pavilion 15-eg2061TX Core i7 12th Gen 15.6" FHD Laptop',
    brand: "HP",
    category: "Laptop",
    price: 95000,
    originalPrice: 105000,
    description:
      "HP Pavilion 15 powered by Intel Core i7 12th Gen processor with 16GB RAM, 512GB SSD, and NVIDIA MX550 2GB Graphics.",
    specifications: {
      Processor: "Intel Core i7-1255U (12th Gen)",
      RAM: "16GB DDR4",
      Storage: "512GB SSD",
      Display: '15.6" FHD IPS',
      Graphics: "NVIDIA MX550 2GB",
    },
    image:
      "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500&h=500&fit=crop",
    stock: 12,
    featured: false,
    rating: 4.3,
    reviews: 87,
  },
  {
    name: 'Lenovo IdeaPad Slim 3 Core i3 12th Gen 15.6" FHD Laptop',
    brand: "Lenovo",
    category: "Laptop",
    price: 45500,
    originalPrice: 50000,
    description:
      "Lenovo IdeaPad Slim 3 features Intel Core i3 12th Gen processor, 8GB RAM, 512GB SSD in a sleek and portable design.",
    specifications: {
      Processor: "Intel Core i3-1215U (12th Gen)",
      RAM: "8GB DDR4",
      Storage: "512GB SSD",
      Display: '15.6" FHD',
      Graphics: "Intel UHD Graphics",
    },
    image:
      "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=500&h=500&fit=crop",
    stock: 20,
    featured: false,
    rating: 4.2,
    reviews: 143,
  },
  {
    name: 'MSI Modern 14 C13M Core i7 13th Gen 14" FHD Laptop',
    brand: "MSI",
    category: "Laptop",
    price: 87500,
    originalPrice: 95000,
    description:
      "MSI Modern 14 with 13th Gen Intel Core i7, 16GB RAM, 512GB NVMe SSD in a premium aluminum chassis.",
    specifications: {
      Processor: "Intel Core i7-1355U (13th Gen)",
      RAM: "16GB DDR4",
      Storage: "512GB NVMe SSD",
      Display: '14" FHD IPS',
      Graphics: "Intel Iris Xe",
    },
    image:
      "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&h=500&fit=crop",
    stock: 6,
    featured: true,
    rating: 4.6,
    reviews: 94,
  },
  {
    name: 'Acer Aspire 3 AMD Ryzen 5 5500U 15.6" FHD Laptop',
    brand: "Acer",
    category: "Laptop",
    price: 49900,
    originalPrice: 55000,
    description:
      "Acer Aspire 3 powered by AMD Ryzen 5 5500U with 8GB RAM and 512GB SSD for everyday computing.",
    specifications: {
      Processor: "AMD Ryzen 5 5500U",
      RAM: "8GB DDR4",
      Storage: "512GB SSD",
      Display: '15.6" FHD',
      Graphics: "AMD Radeon",
    },
    image:
      "https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=500&h=500&fit=crop",
    stock: 18,
    featured: false,
    rating: 4.1,
    reviews: 167,
  },
  {
    name: 'Samsung 24" M5 FHD Smart Monitor',
    brand: "Samsung",
    category: "Monitor",
    price: 18500,
    originalPrice: 22000,
    description:
      'Samsung 24" Smart Monitor with built-in streaming apps, wireless DeX, and USB Type-C connectivity.',
    specifications: {
      Size: "24 inches",
      Resolution: "1920x1080 FHD",
      "Panel Type": "VA",
      "Refresh Rate": "60Hz",
      Connectivity: "HDMI, USB-C",
    },
    image:
      "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500&h=500&fit=crop",
    stock: 25,
    featured: false,
    rating: 4.4,
    reviews: 76,
  },
  {
    name: 'LG UltraGear 27GP850 27" QHD 165Hz Gaming Monitor',
    brand: "LG",
    category: "Monitor",
    price: 42000,
    originalPrice: 48000,
    description:
      'LG UltraGear 27" Nano IPS gaming monitor with 165Hz refresh rate, 1ms response time, and G-Sync compatibility.',
    specifications: {
      Size: "27 inches",
      Resolution: "2560x1440 QHD",
      "Panel Type": "Nano IPS",
      "Refresh Rate": "165Hz",
      "Response Time": "1ms",
    },
    image:
      "https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=500&h=500&fit=crop",
    stock: 10,
    featured: true,
    rating: 4.8,
    reviews: 142,
  },
  {
    name: "Corsair Vengeance RGB Pro 16GB (2x8GB) DDR4 3200MHz RAM",
    brand: "Corsair",
    category: "Components",
    price: 7500,
    originalPrice: 8500,
    description:
      "Corsair Vengeance RGB Pro 16GB DDR4 RAM with dynamic RGB lighting and optimized for Intel and AMD platforms.",
    specifications: {
      Capacity: "16GB (2x8GB)",
      Type: "DDR4",
      Speed: "3200MHz",
      RGB: "Yes",
      Latency: "CL16",
    },
    image:
      "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=500&h=500&fit=crop",
    stock: 35,
    featured: false,
    rating: 4.7,
    reviews: 312,
  },
  {
    name: "Logitech G502 HERO High Performance Gaming Mouse",
    brand: "Logitech",
    category: "Accessories",
    price: 6500,
    originalPrice: 7500,
    description:
      "Logitech G502 HERO gaming mouse with HERO 25K sensor, 11 programmable buttons, and adjustable weights.",
    specifications: {
      Sensor: "HERO 25K",
      DPI: "Up to 25,600",
      Buttons: "11 Programmable",
      Weight: "Adjustable",
      RGB: "Yes",
    },
    image:
      "https://images.unsplash.com/photo-1527814050087-3793815479db?w=500&h=500&fit=crop",
    stock: 42,
    featured: true,
    rating: 4.9,
    reviews: 523,
  },
  {
    name: "Kingston NV2 500GB M.2 NVMe PCIe 4.0 SSD",
    brand: "Kingston",
    category: "Storage",
    price: 4200,
    originalPrice: 5000,
    description:
      "Kingston NV2 500GB NVMe SSD with PCIe 4.0 interface delivering exceptional performance for gaming and productivity.",
    specifications: {
      Capacity: "500GB",
      Interface: "NVMe PCIe 4.0",
      "Form Factor": "M.2 2280",
      "Read Speed": "Up to 3500 MB/s",
      "Write Speed": "Up to 2100 MB/s",
    },
    image:
      "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=500&h=500&fit=crop",
    stock: 28,
    featured: false,
    rating: 4.5,
    reviews: 198,
  },
  {
    name: "TP-Link Archer AX55 AX3000 Dual Band Gigabit Wi-Fi 6 Router",
    brand: "TP-Link",
    category: "Networking",
    price: 8900,
    originalPrice: 10500,
    description:
      "TP-Link Archer AX55 Wi-Fi 6 router with AX3000 speeds, OFDMA, and MU-MIMO technology for seamless connectivity.",
    specifications: {
      Standard: "Wi-Fi 6 (802.11ax)",
      Speed: "AX3000 (2402 + 574 Mbps)",
      Antenna: "4 External",
      Ports: "4 Gigabit LAN",
      Features: "OFDMA, MU-MIMO",
    },
    image:
      "https://images.unsplash.com/photo-1606904825846-647eb07f5be2?w=500&h=500&fit=crop",
    stock: 16,
    featured: false,
    rating: 4.6,
    reviews: 89,
  },
];

// Connect to MongoDB and seed data
mongoose
  .connect(process.env.MONGODB_URI, {
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
