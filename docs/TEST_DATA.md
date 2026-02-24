# 🧪 Test Data for CRUD Demonstration

Use these sample products when demonstrating CREATE operation to your teacher:

## Test Product 1 - Budget Gaming Laptop

```
Name: Gigabyte G5 Core i5 12th Gen RTX 4050 Gaming Laptop
Brand: Gigabyte
Category: Gaming
Price: 105000
Original Price: 115000
Description: Powerful gaming laptop with 12th Gen Intel Core i5, NVIDIA RTX 4050 6GB graphics, 16GB DDR4 RAM, and 512GB NVMe SSD. Perfect for gaming and content creation.
Image: https://www.startech.com.bd/image/cache/catalog/laptop/gigabyte/g5-kf/g5-kf-01-500x500.webp
Stock: 5
Featured: true
Rating: 4.6
Reviews: 89
```

## Test Product 2 - Professional Monitor

```
Name: BenQ PD2705U 27" 4K UHD Designer Monitor
Brand: BenQ
Category: Monitor
Price: 52000
Original Price: 58000
Description: Professional 27-inch 4K UHD monitor with IPS panel, USB-C connectivity, and factory calibrated color accuracy. Perfect for designers and content creators.
Image: https://www.startech.com.bd/image/cache/catalog/monitor/benq/pd2705u/pd2705u-01-500x500.webp
Stock: 8
Featured: false
Rating: 4.8
Reviews: 124
```

## Test Product 3 - High-End Graphics Card

```
Name: MSI GeForce RTX 4060 Ti Gaming X 8GB Graphics Card
Brand: MSI
Category: Components
Price: 62000
Original Price: 68000
Description: NVIDIA GeForce RTX 4060 Ti with 8GB GDDR6 memory, advanced cooling system, and RGB lighting. Delivers exceptional 1080p gaming performance.
Image: https://www.startech.com.bd/image/cache/catalog/graphics-card/msi/geforce-rtx-4060-ti-gaming-x-8g/geforce-rtx-4060-ti-gaming-x-8g-01-500x500.webp
Stock: 12
Featured: true
Rating: 4.7
Reviews: 203
```

## Test Product 4 - Premium Wireless Mouse

```
Name: Razer Viper V3 Pro Wireless Gaming Mouse
Brand: Razer
Category: Accessories
Price: 15500
Original Price: 18000
Description: Ultra-lightweight wireless gaming mouse with Focus Pro 30K optical sensor, 90-hour battery life, and customizable buttons. Perfect for competitive gaming.
Image: https://www.startech.com.bd/image/cache/catalog/mouse/razer/viper-v3-pro/viper-v3-pro-01-500x500.webp
Stock: 25
Featured: false
Rating: 4.9
Reviews: 367
```

## Test Product 5 - Budget Desktop PC

```
Name: Custom Built Gaming PC - Intel Core i5 12th Gen
Brand: Custom Build
Category: Desktop
Price: 75000
Original Price: 85000
Description: Pre-built gaming desktop featuring Intel Core i5 12400F, 16GB RAM, GTX 1660 Super 6GB, 512GB NVMe SSD, and RGB case with fans.
Image: https://www.startech.com.bd/image/cache/catalog/desktop-pc/gaming-pc/gaming-pc-01-500x500.jpg
Stock: 3
Featured: true
Rating: 4.5
Reviews: 67
```

## Test Product 6 - Mobile Phone

```
Name: Samsung Galaxy A54 5G 8GB/256GB
Brand: Samsung
Category: Mobile
Price: 42990
Original Price: 47990
Description: Samsung Galaxy A54 with 6.4" Super AMOLED display, 50MP triple camera, Exynos 1380 processor, 5000mAh battery with 25W fast charging.
Image: https://www.startech.com.bd/image/cache/catalog/mobile/samsung/galaxy-a54-5g/galaxy-a54-5g-violet-500x500.webp
Stock: 30
Featured: false
Rating: 4.4
Reviews: 456
```

## Test Product 7 - Mechanical Keyboard

```
Name: Corsair K70 RGB Pro Mechanical Gaming Keyboard
Brand: Corsair
Category: Accessories
Price: 12500
Original Price: 14000
Description: Premium mechanical gaming keyboard with Cherry MX Red switches, per-key RGB backlighting, aluminum frame, and dedicated media controls.
Image: https://www.startech.com.bd/image/cache/catalog/keyboard/corsair/k70-rgb-pro/k70-rgb-pro-01-500x500.webp
Stock: 18
Featured: true
Rating: 4.8
Reviews: 289
```

---

## 🎯 Quick Copy Formats

### Minimal Test Product (Quick Demo)

```
Name: Test Laptop Model XYZ
Brand: TestBrand
Category: Laptop
Price: 45000
Description: This is a test product for demonstration
Image: https://via.placeholder.com/500
Stock: 10
```

### Professional Test Product

```
Name: Dell XPS 15 9530 Core i7 13th Gen 15.6" FHD+ Laptop
Brand: Dell
Category: Laptop
Price: 185000
Original Price: 195000
Description: Premium laptop with 13th Gen Intel Core i7, 16GB DDR5 RAM, 1TB SSD, NVIDIA RTX 4050 6GB, and stunning 15.6" FHD+ display
Image: https://www.startech.com.bd/image/cache/catalog/laptop/dell/xps-15-9530/xps-15-9530-01-500x500.webp
Stock: 4
Featured: true
Rating: 4.9
Reviews: 178
```

---

## 📋 Testing Checklist

### When Adding Product:

- ✅ Use realistic product name
- ✅ Select correct category
- ✅ Enter reasonable prices (Price < Original Price)
- ✅ Add stock quantity
- ✅ Use valid image URL
- ✅ Write descriptive text
- ✅ Set rating (0-5)
- ✅ Add review count

### After Adding:

- ✅ Product appears in grid
- ✅ Discount badge shows (if original price set)
- ✅ Stock status displays correctly
- ✅ Rating stars show correctly
- ✅ Image loads properly

### Test Update:

- ✅ Change price
- ✅ Update stock
- ✅ Modify description
- ✅ Toggle featured status
- ✅ Verify changes in MongoDB

### Test Delete:

- ✅ Confirm deletion popup
- ✅ Product removed from UI
- ✅ Verify in MongoDB (product gone)

---

## 💡 Demo Script for Teacher

**Step 1: Show Existing Products**
"Here are 12 pre-loaded tech products in our e-commerce system"

**Step 2: Demonstrate READ**
"We can filter by category, view details, and see all product information"

**Step 3: Demonstrate CREATE**
"Let me add a new product..." [Use Test Product 1]
"As you can see, it appears immediately with all features"

**Step 4: Verify in MongoDB**

```javascript
db.products.find().sort({ createdAt: -1 }).limit(1).pretty();
```

"Here's the product in our MongoDB database"

**Step 5: Demonstrate UPDATE**
"Let me update the price and stock..." [Edit the product you just added]
"Changes are reflected immediately in both UI and database"

**Step 6: Demonstrate DELETE**
"Finally, let me remove this test product"
"Gone from UI, and verified in database"

**Step 7: Show Code**
"The CRUD operations are implemented in the productController.js file"
"MongoDB schema is defined in Product.js model"
"React components handle the user interface"

---

## 🎨 Tips for Visual Appeal

1. **Use Featured Products**: Toggle "Featured" to show variety
2. **Show Discounts**: Use different Original Price to show discounts
3. **Stock Variety**: Use different stock numbers (some low, some high)
4. **Categories**: Add products in different categories
5. **Ratings**: Use various ratings to show the system works

---

**Ready to impress your teacher! 🚀**
