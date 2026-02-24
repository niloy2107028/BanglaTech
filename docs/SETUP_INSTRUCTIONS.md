# BanglaTech E-commerce Setup Guide

## 🚀 Quick Start Guide

### Prerequisites

- Node.js (v14 or higher)
- MongoDB Server installed and running locally
- MongoDB Shell (optional, for database verification)

### Step 1: Install Dependencies

#### Install Backend Dependencies

```bash
npm install
```

#### Install Frontend Dependencies

```bash
cd client
npm install
cd ..
```

Or install both at once:

```bash
npm run install-all
```

### Step 2: Configure Environment

The `.env` file is already created with default settings:

- MongoDB URI: `mongodb://localhost:27017/banglatech`
- Port: `5000`

Make sure your MongoDB server is running before proceeding.

### Step 3: Seed the Database

Populate the database with sample tech products:

```bash
npm run seed
```

This will add 12 sample products (laptops, monitors, components, accessories, etc.)

### Step 4: Run the Application

#### Option A: Run Backend and Frontend Separately

Terminal 1 (Backend):

```bash
npm run dev
```

Terminal 2 (Frontend):

```bash
npm run client
```

#### Option B: Run Everything Together

```bash
npm run dev:full
```

### Step 5: Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Test**: http://localhost:5000/api/products

## 📋 Available Features

### CRUD Operations

✅ **Create**: Add new products using the "Add New Product" button
✅ **Read**: View all products in card format on the homepage
✅ **Update**: Edit existing products using the "Edit" button on each card
✅ **Delete**: Remove products using the "Delete" button on each card

### Additional Features

- Product filtering by category
- Product search functionality (UI ready)
- View detailed product information
- Stock management
- Featured products
- Rating and reviews display
- Discount badges
- Responsive design

## 🗄️ Database Operations Demonstration

### MongoDB Commands to Verify Database

1. **Connect to MongoDB Shell**:

```bash
mongosh
```

2. **Switch to BanglaTech Database**:

```javascript
use banglatech
```

3. **View All Products**:

```javascript
db.products.find().pretty();
```

4. **Count Products**:

```javascript
db.products.countDocuments();
```

5. **Find Products by Category**:

```javascript
db.products.find({ category: "Laptop" });
```

6. **Find Products in Stock**:

```javascript
db.products.find({ inStock: true });
```

7. **Find Featured Products**:

```javascript
db.products.find({ featured: true });
```

## 🛠️ API Endpoints

### Get All Products

```
GET http://localhost:5000/api/products
```

### Get Single Product

```
GET http://localhost:5000/api/products/:id
```

### Create New Product

```
POST http://localhost:5000/api/products
Content-Type: application/json

{
  "name": "Product Name",
  "brand": "Brand Name",
  "category": "Laptop",
  "price": 50000,
  "originalPrice": 55000,
  "description": "Product description",
  "image": "https://example.com/image.jpg",
  "stock": 10,
  "featured": false,
  "rating": 4.5,
  "reviews": 100
}
```

### Update Product

```
PUT http://localhost:5000/api/products/:id
Content-Type: application/json

{
  "price": 48000,
  "stock": 15
}
```

### Delete Product

```
DELETE http://localhost:5000/api/products/:id
```

## 📱 Project Structure

```
BanglaTech/
├── backend/
│   ├── controllers/
│   │   └── productController.js    # CRUD operation handlers
│   ├── models/
│   │   └── Product.js               # MongoDB schema
│   ├── routes/
│   │   └── productRoutes.js         # API routes
│   ├── server.js                    # Express server setup
│   └── seed.js                      # Database seeding script
├── client/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.js            # Navigation bar
│   │   │   ├── ProductList.js       # Product grid view
│   │   │   ├── ProductCard.js       # Individual product card
│   │   │   ├── ProductModal.js      # CRUD modal form
│   │   │   └── Footer.js            # Footer component
│   │   ├── App.js                   # Main app component
│   │   └── index.js                 # React entry point
│   └── package.json
├── .env                             # Environment variables
├── package.json                     # Backend dependencies
└── README.md                        # Project documentation
```

## 🎨 Design Features

- Modern, clean UI inspired by StarTech BD and Dazzle BD
- Color scheme similar to Airbnb project (red primary color)
- Responsive design for all screen sizes
- Smooth animations and transitions
- Card-based product layout
- Modal-based CRUD operations

## 🧪 Testing CRUD Operations

### Test Create Operation:

1. Click "Add New Product" button
2. Fill in the form with product details
3. Click "Create Product"
4. Verify the new product appears in the grid

### Test Read Operation:

1. All products are displayed on page load
2. Click "View" button on any product card
3. See detailed information in the modal

### Test Update Operation:

1. Click "Edit" button on a product card
2. Modify any field (e.g., price, stock)
3. Click "Update Product"
4. Verify changes are reflected immediately

### Test Delete Operation:

1. Click "Delete" button on a product card
2. Confirm the deletion in the alert
3. Verify the product is removed from the grid

## 🎓 Presenting to Your Teacher

When demonstrating to your teacher, show:

1. **Database Connection**: Show MongoDB running and connected
2. **Initial Data**: Show seeded products in database using MongoDB shell
3. **Create Operation**: Add a new product through the UI
4. **Read Operation**: Show product list and view details
5. **Update Operation**: Edit a product's price or stock
6. **Delete Operation**: Remove a product
7. **Database Verification**: Show changes in MongoDB shell

Example MongoDB verification after operations:

```javascript
// Show all products
db.products.find().pretty();

// Show recently added product
db.products.find().sort({ createdAt: -1 }).limit(1);

// Show product count
db.products.countDocuments();
```

## 📞 Troubleshooting

### MongoDB Connection Error

- Make sure MongoDB service is running
- Check if port 27017 is available
- Verify MongoDB URI in .env file

### Port Already in Use

- Backend: Change PORT in .env file
- Frontend: Set different port in client/package.json

### Dependencies Error

- Delete node_modules folders
- Run npm install again
- Make sure you're using Node.js v14 or higher

## 🎉 Success!

Your BanglaTech e-commerce website is now ready to demonstrate complete CRUD operations with MongoDB!
