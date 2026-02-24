# 🚀 BanglaTech - Quick Reference Card

## 🌐 Access URLs

- **Website**: http://localhost:3000
- **API**: http://localhost:5000/api/products

## ⚡ Quick Commands

### Start Everything

```bash
# Terminal 1 - Backend
cd "e:\3.2\CSE 3200\BanglaTech"
npm run dev

# Terminal 2 - Frontend
cd "e:\3.2\CSE 3200\BanglaTech\client"
$env:DANGEROUSLY_DISABLE_HOST_CHECK='true'
npm start
```

### Database Operations

```bash
# Seed database
npm run seed

# MongoDB Shell
mongosh
use banglatech
db.products.find().pretty()
```

## 🎯 CRUD Demo Steps

### 1️⃣ CREATE

- Click "Add New Product"
- Fill form → Create Product
- ✅ New card appears

### 2️⃣ READ

- Products auto-load
- Click category filters
- Click "View" for details

### 3️⃣ UPDATE

- Click "Edit" on any card
- Change fields → Update
- ✅ Changes show immediately

### 4️⃣ DELETE

- Click "Delete" on card
- Confirm → ✅ Removed

## 📊 MongoDB Verification

```javascript
// Count all products
db.products.countDocuments();

// View latest product
db.products.find().sort({ createdAt: -1 }).limit(1);

// Find by category
db.products.find({ category: "Laptop" });
```

## 🎨 Tech Stack

- **M**ongoDB - Database
- **E**xpress - Backend Framework
- **R**eact - Frontend Library
- **N**ode.js - Runtime

## 📦 What's Included

✅ 12 Sample Products
✅ All CRUD Operations
✅ Category Filters
✅ Product Details View
✅ Stock Management
✅ Rating System
✅ Responsive Design
✅ Professional UI

## 🔥 Key Features

- Beautiful card-based layout
- Real-time updates
- Modal-based CRUD
- Category filtering
- Discount badges
- Stock indicators
- Rating display
- Mobile responsive

## 💡 Demo Tips

1. Show product grid
2. Add a new product
3. Edit existing product
4. Delete a product
5. Filter by category
6. View in MongoDB shell
7. Explain code structure

## 📱 Responsive Breakpoints

- Desktop: Full grid
- Tablet: 2 columns
- Mobile: 1 column

## 🎓 For Teacher Demo

Focus on:

1. MongoDB connection ✅
2. CRUD operations ✅
3. Database verification ✅
4. Clean code structure ✅
5. Modern UI/UX ✅

---

**Everything is ready! Good luck with your presentation! 🎉**
