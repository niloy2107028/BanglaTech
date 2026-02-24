# BanglaMart - General E-commerce Website

A full-stack e-commerce platform built with the MERN stack (MongoDB, Express, React, Node.js). BanglaMart is a comprehensive online marketplace where you can shop everything from electronics to fashion, home goods, beauty products, and more!

## Features

- **Category-based Shopping**: Browse through 10 diverse product categories
- **Featured Products**: Highlighted products on the homepage
- **Advanced Filtering**: Filter products by price (low to high, high to low) and brand
- **Product Management**: Full CRUD operations for products (Create, Read, Update, Delete)
- **Responsive Design**: Clean and modern UI inspired by Bikroy.com
- **Smart Navigation**: Browser back/forward button support with page reloading
- **MongoDB Integration**: Efficient data storage and retrieval
- **React Router**: Seamless navigation between pages

## Product Categories

1. **Electronics** - TVs, cameras, headphones, and more
2. **Fashion** - Clothing, shoes, and accessories
3. **Home & Living** - Furniture, decor, and home essentials
4. **Beauty & Health** - Skincare, cosmetics, and health products
5. **Sports & Outdoors** - Fitness equipment and outdoor gear
6. **Books & Stationery** - Books, notebooks, and art supplies
7. **Toys & Games** - Educational toys and board games
8. **Automotive** - Car accessories and tools
9. **Food & Groceries** - Organic food and pantry items
10. **Mobile & Accessories** - Smartphones, earbuds, and mobile accessories

## Tech Stack

### Frontend

- **React.js** (v18.2.0) - Component-based UI framework
- **React Router DOM** (v6) - Client-side routing
- **Bootstrap 5** - Responsive styling
- **Axios** - HTTP requests
- **Vite** - Fast build tool and dev server

### Backend

- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling

## Installation

### Prerequisites

- Node.js (v14 or higher)
- MongoDB Server running locally on port 27017

### Backend Setup

1. Navigate to the project root:

```bash
cd BanglaTech
```

2. Install backend dependencies:

```bash
npm install
```

3. Seed the database with sample products:

```bash
node backend/seed.js
```

4. Start the backend server:

```bash
npm run dev
```

The backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the client folder:

```bash
cd client
```

2. Install frontend dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

The frontend will run on `http://localhost:3001` (or the next available port)

## Project Structure

```
BanglaTech/
├── backend/
│   ├── controllers/
│   │   └── productController.js
│   ├── models/
│   │   └── Product.js
│   ├── routes/
│   │   └── productRoutes.js
│   ├── seed.js
│   └── server.js
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── CategoryCard.js
│   │   │   ├── CategoryView.js
│   │   │   ├── Footer.js
│   │   │   ├── HomePage.js
│   │   │   ├── Navbar.js
│   │   │   ├── ProductCard.js
│   │   │   └── ProductModal.js
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
├── package.json
└── README.md
```

## API Endpoints

### Products

- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get single product by ID
- `POST /api/products` - Create new product
- `PUT /api/products/:id` - Update product by ID
- `DELETE /api/products/:id` - Delete product by ID

## Database

- **Database Name**: `banglamart`
- **Connection String**: `mongodb://localhost:27017/banglamart`
- **Collections**: products

### Sample Product Schema

```javascript
{
  name: String,
  price: Number,
  category: String,
  brand: String,
  description: String,
  image: String,
  stock: Number,
  featured: Boolean
}
```

## Usage

1. **Homepage**: View all product categories and featured products
2. **Category View**: Click any category card to see filtered products
3. **Filtering**: Use price sorting and brand filters on category pages
4. **Product Details**: Click "View Details" to see full product information
5. **Edit/Delete**: Manage products using the edit and delete buttons
6. **Navigation**: Use the "Back to Home" button or browser back button to return to homepage

## Features in Detail

### Category-Based Navigation

- Click on any of the 10 category cards on the homepage
- Each category shows the number of available products
- Navigate seamlessly between different categories

### Product Filtering

- **Sort by Price**: Choose "Low to High" or "High to Low"
- **Filter by Brand**: Select from available brands in each category
- **Reset Filters**: Clear all filters with one click

### Product Management

- **View**: See detailed product information including description, price, and stock
- **Edit**: Update product details through a modal interface
- **Delete**: Remove products with confirmation prompt

## Browser Compatibility

- Chrome (recommended)
- Firefox
- Edge
- Safari

## Notes

- The database is seeded with 24 sample products across all categories
- Browser back/forward navigation triggers page reload for consistent state
- All category links and navigation use page reload for reliability

## Future Enhancements

- User authentication and authorization
- Shopping cart functionality
- Order management system
- Payment gateway integration
- Product search functionality
- Product reviews and ratings
- Wishlist feature
- Admin dashboard

## License

This project is for educational purposes.
