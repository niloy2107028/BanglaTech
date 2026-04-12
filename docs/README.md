# BanglaMart

> A full-stack e-commerce marketplace built with the MERN stack — supporting role-based commerce flows for buyers, sellers, and admins, with an AI-powered multimodal chatbot.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [License](#license)

---

## Overview

BanglaMart is a production-inspired online marketplace that covers the full commerce lifecycle — from product discovery and cart management to order fulfillment and seller onboarding. The platform features a built-in AI chatbot that accepts text, voice, and image input for natural language product search and support.

---

## Features

### 🏪 Storefront & Discovery

- Category-based product browsing across diverse listings
- Featured products section on the homepage
- Advanced filtering by price (low → high, high → low) and brand
- Keyword-based product search
- Fully responsive, mobile-first UI inspired by Bikroy.com
- Client-side navigation powered by React Router with browser history support

### 🔐 Authentication & Accounts

- Email/password registration with OTP-based email verification
- Forgot password flow via OTP
- Google OAuth login
- Secure session management via HTTP-only cookies
- User profile page for signed-in users

### 🛒 Buyer

- Add to cart, update quantities, remove items
- Checkout and place orders
- View order history and cancel eligible order items

### 🧾 Seller

- Apply to become a seller (buyer-initiated application)
- Manage product listings with full CRUD operations
- View and update incoming order fulfillment status
- View hot-category insights to identify products performing best by most sold or most clicked

### 🛠️ Admin

- Dashboard overview
- Category management (create, update, delete)
- User management and role assignment
- Seller application review (approve or reject)

### ⭐ Reviews & Ratings

- Reviews and ratings restricted to verified purchasers only
- Review voting also gated to confirmed buyers
- All review activity tied to purchase history to ensure authenticity

### 🤖 AI Chatbot

- Text chat with context-aware replies and product search routing
- Voice input via browser Web Speech API (Whisper/Hugging Face endpoint also supported)
- Image input with vision-based caption extraction and product retrieval
- Chat history-aware follow-up handling
- Returns structured product card payloads for rendering in the UI

---

## Tech Stack

### Frontend

| Technology                  | Purpose                        |
| --------------------------- | ------------------------------ |
| React 18 + Vite             | UI framework and build tooling |
| React Router                | Client-side navigation         |
| Axios                       | HTTP client                    |
| Bootstrap                   | UI component library           |
| React Markdown + remark-gfm | Chatbot response rendering     |

### Backend

| Technology                            | Purpose                                                         |
| ------------------------------------- | --------------------------------------------------------------- |
| Node.js + Express                     | Server and API layer                                            |
| MongoDB + Mongoose                    | Database and ODM                                                |
| JWT + cookie-parser + express-session | Authentication and session management                           |
| Passport + passport-google-oauth20    | Google OAuth                                                    |
| Multer                                | Audio and image file uploads                                    |
| Nodemailer                            | OTP email delivery                                              |
| OpenAI SDK                            | AI provider integration (via Hugging Face-compatible endpoints) |

---

## Project Structure

```
BanglaTech/
├── backend/
│   ├── config/              # Database and app configuration
│   ├── controllers/         # Route handler logic
│   ├── middleware/          # Auth, error handling, etc.
│   ├── models/              # Mongoose schemas
│   ├── routes/              # Express route definitions
│   ├── services/
│   │   └── chatbot/         # AI chatbot service logic
│   ├── utils/               # Shared utility functions
│   ├── seed.js              # Database seeding script
│   └── server.js            # App entry point
├── client/
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── context/         # React context providers
│   │   ├── App.js
│   │   └── index.js
│   ├── package.json
│   └── vite.config.js
├── docs/
└── package.json
```

---

## Getting Started

### Prerequisites

- Node.js v18 or higher
- MongoDB (local instance or remote URI)

### 1. Install Dependencies

From the project root:

```bash
npm install
```

Then install frontend dependencies:

```bash
cd client && npm install && cd ..
```

### 2. Configure Environment Variables

Create a `.env` file in the project root. See the [Environment Variables](#environment-variables) section below for all required values.

### 3. Seed the Database _(Optional but Recommended)_

```bash
npm run seed
```

### 4. Start the Backend

```bash
npm run dev
```

The backend runs at **http://localhost:5000**.

### 5. Start the Frontend

In a separate terminal:

```bash
cd client
npm run dev
```

The frontend runs at **http://localhost:3000**.

---

## Environment Variables

Create a `.env` file in the project root with the following keys:

```env
# ── App ──────────────────────────────────────────────
PORT=5000
NODE_ENV=development

# ── Database ─────────────────────────────────────────
MONGODB_URI=mongodb://127.0.0.1:27017/banglamart

# ── Authentication ───────────────────────────────────
JWT_SECRET=replace_with_secure_value
JWT_EXPIRE=7d
SESSION_SECRET=replace_with_secure_value

# ── Google OAuth (optional) ──────────────────────────
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# ── Email / OTP ──────────────────────────────────────
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# ── AI Providers ─────────────────────────────────────
HUGGINGFACE_API_KEY=your_hf_key
HF_API_KEY2=your_hf_key_for_image
HF_CHAT_MODEL=Qwen/Qwen3-VL-8B-Instruct
HF_GENERAL_CHAT_MODEL=Qwen/Qwen3-VL-8B-Instruct
HF_IMAGE_MODEL=Qwen/Qwen3-VL-8B-Instruct:novita
HF_IMAGE_PARSER_MODEL=MiniMaxAI/MiniMax-M2.5
```

---

## API Reference

### Auth — `/api/auth`

| Method | Endpoint            | Description                | Access |
| ------ | ------------------- | -------------------------- | ------ |
| POST   | `/register`         | Register a new user        | Public |
| POST   | `/verify-email`     | Verify email via OTP       | Public |
| POST   | `/resend-otp`       | Resend OTP                 | Public |
| POST   | `/login`            | Log in                     | Public |
| POST   | `/logout`           | Log out                    | Auth   |
| GET    | `/me`               | Get current user           | Auth   |
| POST   | `/forgot-password`  | Request password reset OTP | Public |
| POST   | `/verify-reset-otp` | Verify reset OTP           | Public |
| PUT    | `/reset-password`   | Reset password             | Public |
| GET    | `/google`           | Initiate Google OAuth      | Public |
| GET    | `/google/callback`  | Google OAuth callback      | Public |
| GET    | `/users`            | List all users             | Admin  |
| DELETE | `/users/:id`        | Delete a user              | Admin  |
| PUT    | `/users/:id/role`   | Update a user's role       | Admin  |

### Products — `/api/products`

| Method | Endpoint | Description               | Access         |
| ------ | -------- | ------------------------- | -------------- |
| GET    | `/`      | List all products         | Public         |
| GET    | `/:id`   | Get a product             | Public         |
| GET    | `/mine`  | Get seller's own products | Seller / Admin |
| POST   | `/`      | Create a product          | Seller         |
| PUT    | `/:id`   | Update a product          | Seller / Admin |
| DELETE | `/:id`   | Delete a product          | Seller / Admin |

### Categories — `/api/categories`

| Method | Endpoint | Description         | Access |
| ------ | -------- | ------------------- | ------ |
| GET    | `/`      | List all categories | Public |
| GET    | `/:id`   | Get a category      | Public |
| POST   | `/`      | Create a category   | Admin  |
| PUT    | `/:id`   | Update a category   | Admin  |
| DELETE | `/:id`   | Delete a category   | Admin  |

### Cart — `/api/cart`

| Method | Endpoint      | Description           | Access |
| ------ | ------------- | --------------------- | ------ |
| GET    | `/`           | Get cart              | Buyer  |
| POST   | `/`           | Add item to cart      | Buyer  |
| PUT    | `/:productId` | Update item quantity  | Buyer  |
| DELETE | `/:productId` | Remove item from cart | Buyer  |
| DELETE | `/`           | Clear entire cart     | Buyer  |

### Orders — `/api/orders`

| Method | Endpoint                           | Description                  | Access |
| ------ | ---------------------------------- | ---------------------------- | ------ |
| POST   | `/`                                | Place an order               | Buyer  |
| GET    | `/myorders`                        | Get buyer's orders           | Buyer  |
| GET    | `/:id`                             | Get order by ID              | Auth   |
| GET    | `/seller`                          | Get seller's incoming orders | Seller |
| PUT    | `/:orderId/item/:productId/status` | Update fulfillment status    | Seller |
| PUT    | `/:orderId/item/:productId/cancel` | Cancel an order item         | Buyer  |

### Seller Applications — `/api/sellers`

| Method | Endpoint            | Description                   | Access |
| ------ | ------------------- | ----------------------------- | ------ |
| POST   | `/apply`            | Submit seller application     | Buyer  |
| GET    | `/my-application`   | View own application status   | Buyer  |
| GET    | `/applications`     | List all applications         | Admin  |
| PUT    | `/applications/:id` | Approve or reject application | Admin  |

### Reviews — `/api/reviews`

| Method | Endpoint           | Description               | Access         |
| ------ | ------------------ | ------------------------- | -------------- |
| GET    | `/:productId`      | Get reviews for a product | Public         |
| POST   | `/:productId`      | Submit a review           | Verified Buyer |
| POST   | `/:reviewId/vote`  | Vote on a review          | Verified Buyer |
| POST   | `/:reviewId/reply` | Reply to a review         | Auth           |

### Chatbot — `/api/chatbot`

| Method | Endpoint        | Description        | Access |
| ------ | --------------- | ------------------ | ------ |
| POST   | `/chat`         | Text-based chat    | Auth   |
| POST   | `/voice-search` | Voice/audio search | Auth   |
| POST   | `/image-search` | Image-based search | Auth   |

---

## License

This project is for **educational purposes** only.
