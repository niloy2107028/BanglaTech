# BanglaMart

A full-stack marketplace built with the MERN stack. Supports role-based commerce flows for buyers, sellers, and admins, with an AI-powered chatbot that accepts text, voice, and image input.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Endpoints](#api-endpoints)
- [License](#license)

## Features

### Platform Highlights

- Category-based shopping across diverse product categories
- Featured products highlighted on the homepage
- Advanced filtering by price (low to high, high to low) and brand
- Product management with full CRUD operations
- Clean and modern responsive UI inspired by Bikroy.com
- Smart navigation with browser back/forward support
- MongoDB-backed data storage and retrieval
- Seamless client-side navigation with React Router

### Storefront and Discovery

- Fully responsive layout (mobile-first)
- Homepage featured products section with curated listings
- Browse products by category
- Product detail pages
- Product search with keyword matching
- AI chatbot for natural language product discovery (text, voice, image)

### Authentication and Accounts

- Email and password registration with OTP-based email verification
- Forgot password flow via OTP
- Google OAuth login
- Profile page for signed-in users
- Secure session management via HTTP-only cookies

### Buyer

- Add to cart, update quantities, remove items
- Checkout and place orders
- View order history and cancel eligible order items

### Seller

- Apply to become a seller (buyer-initiated)
- Manage product listings (create, update, delete)
- View incoming orders and update item fulfillment status

### Admin

- Dashboard overview
- Category management (create, update, delete)
- User management and role assignment
- Seller application review (approve or reject)

### Reviews and Ratings

- Only verified buyers (users who purchased the product) can create ratings and reviews
- Only verified buyers can vote on reviews
- Ratings and reviews are tied to confirmed purchases to ensure authenticity

### AI Chatbot

- Text chat with context-aware reply and product search routing
- Audio input in chatbot currently uses the browser Web Speech API
- Voice search endpoint support exists via Whisper (Hugging Face)
- Image search with vision-based caption extraction and product retrieval
- Chat history-aware follow-up handling
- Returns structured product card payloads for UI rendering

## Tech Stack

### Frontend

- React 18
- Vite
- React Router
- Axios
- Bootstrap
- React Markdown + remark-gfm

### Backend

- Node.js + Express
- MongoDB + Mongoose
- JWT + cookie-parser + express-session
- Passport + passport-google-oauth20
- Multer for audio and image uploads
- Nodemailer for OTP emails
- OpenAI SDK (used with Hugging Face router-compatible endpoints)
- ChromaDB client dependency present in project

## Project Structure

```text
BanglaTech/
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   │   └── chatbot/
│   ├── utils/
│   ├── seed.js
│   └── server.js
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── App.js
│   │   └── index.js
│   ├── package.json
│   └── vite.config.js
├── docs/
└── package.json
```

## Getting Started

### Prerequisites

- Node.js (recommended: v18+)
- MongoDB running locally or a remote MongoDB URI

### 1. Install Dependencies

From project root:

```bash
npm install
```

Install frontend dependencies:

```bash
cd client
npm install
cd ..
```

### 2. Configure Environment Variables

Create a `.env` file in project root (example values in next section).

### 3. Seed Database (Optional but Recommended)

```bash
npm run seed
```

### 4. Start Backend

```bash
npm run dev
```

Backend runs at `http://localhost:5000`.

### 5. Start Frontend

In a new terminal:

```bash
cd client
npm run dev
```

Frontend runs at `http://localhost:3000`.

## Environment Variables

Create a `.env` file in project root:

```env
# App
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://127.0.0.1:27017/banglamart

# Auth
JWT_SECRET=replace_with_secure_value
JWT_EXPIRE=7d
SESSION_SECRET=replace_with_secure_value

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# Email (OTP)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# AI Providers
HUGGINGFACE_API_KEY=your_hf_key
HF_API_KEY2=your_hf_key_for_image
HF_CHAT_MODEL=Qwen/Qwen3-VL-8B-Instruct
HF_GENERAL_CHAT_MODEL=Qwen/Qwen3-VL-8B-Instruct
HF_IMAGE_MODEL=Qwen/Qwen3-VL-8B-Instruct:novita
HF_IMAGE_PARSER_MODEL=MiniMaxAI/MiniMax-M2.5
```

## API Endpoints

### Auth

- `POST /api/auth/register`
- `POST /api/auth/verify-email`
- `POST /api/auth/resend-otp`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `POST /api/auth/forgot-password`
- `POST /api/auth/verify-reset-otp`
- `PUT /api/auth/reset-password`
- `GET /api/auth/google`
- `GET /api/auth/google/callback`

Admin user management:

- `GET /api/auth/users`
- `DELETE /api/auth/users/:id`
- `PUT /api/auth/users/:id/role`

### Products

- `GET /api/products`
- `GET /api/products/:id`
- `GET /api/products/mine` (seller/admin)
- `POST /api/products` (seller)
- `PUT /api/products/:id` (seller/admin)
- `DELETE /api/products/:id` (seller/admin)

### Categories

- `GET /api/categories`
- `GET /api/categories/:id`
- `POST /api/categories` (admin)
- `PUT /api/categories/:id` (admin)
- `DELETE /api/categories/:id` (admin)

### Cart (buyer)

- `GET /api/cart`
- `POST /api/cart`
- `PUT /api/cart/:productId`
- `DELETE /api/cart/:productId`
- `DELETE /api/cart`

### Orders

- `POST /api/orders` (buyer)
- `GET /api/orders/myorders` (buyer)
- `GET /api/orders/:id`
- `GET /api/orders/seller` (seller)
- `PUT /api/orders/:orderId/item/:productId/status` (seller)
- `PUT /api/orders/:orderId/item/:productId/cancel` (buyer)

### Seller Applications

- `POST /api/sellers/apply` (buyer)
- `GET /api/sellers/my-application` (buyer)
- `GET /api/sellers/applications` (admin)
- `PUT /api/sellers/applications/:id` (admin)

### Reviews

- `GET /api/reviews/:productId`
- `POST /api/reviews/:productId`
- `POST /api/reviews/:reviewId/vote`
- `POST /api/reviews/:reviewId/reply`

### Chatbot

- `POST /api/chatbot/chat`
- `POST /api/chatbot/voice-search`
- `POST /api/chatbot/image-search`

## License

This project is for educational purposes.
