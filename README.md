# BanglaTech - Tech E-commerce Website

A full-stack tech e-commerce platform built with the MERN stack (MongoDB, Express, React, Node.js).

## Features

- Product listing with card-based display
- Full CRUD operations for products
- MongoDB database integration
- Responsive design inspired by StarTech BD and Dazzle BD
- Clean and modern UI

## Tech Stack

- **Frontend**: React.js with Bootstrap
- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Styling**: Custom CSS with Bootstrap

## Installation

### Prerequisites

- Node.js (v14 or higher)
- MongoDB Server running locally

### Backend Setup

```bash
npm install
npm run dev
```

### Frontend Setup

```bash
cd client
npm install
npm start
```

### Run Full Stack

```bash
npm run dev:full
```

## API Endpoints

- GET `/api/products` - Get all products
- GET `/api/products/:id` - Get single product
- POST `/api/products` - Create new product
- PUT `/api/products/:id` - Update product
- DELETE `/api/products/:id` - Delete product

## Database

MongoDB connection: `mongodb://localhost:27017/banglatech`
