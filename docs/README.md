# BanglaMart - MERN E-commerce Platform

BanglaMart is a full-stack marketplace built with MongoDB, Express, React, and Node.js.
It supports role-based commerce flows (buyer, seller, admin), order lifecycle management, reviews, and an AI chatbot with text, voice, and image input.

## What Is Implemented

### Customer and Storefront
- Category browsing and product listing
- Product details page
- Search page and category-level filtering UX
- Cart management for buyers
- Checkout and order history for buyers

### Authentication and Accounts
- Email/password registration and login
- OTP-based email verification
- Forgot password flow with OTP verification
- Google OAuth login via Passport
- Profile page for signed-in users
- HTTP-only cookie-based auth session

### Seller and Marketplace Flows
- Buyer can apply to become seller
- Seller application review by admin
- Seller product CRUD (create, update, delete)
- Seller orders view and order item status updates

### Admin Controls
- Admin dashboard
- Category management (create, update, delete)
- User management and role updates
- Seller application approval/rejection

### Reviews
- Product review creation
- Review voting
- Reply to reviews

### AI Chatbot
- Text chat endpoint
- Voice search endpoint (Whisper via Hugging Face)
- Image search endpoint (vision caption + product retrieval)
- Context-aware reply/search routing with chat history
- Product card response payloads for UI rendering

## Tech Stack

### Frontend
- React 18
- Vite
- React Router
- Axios
- Bootstrap
- React Markdown

### Backend
- Node.js
- Express
- MongoDB + Mongoose
- JWT + HTTP-only cookies
- Passport (Google OAuth)
- Multer (audio/image upload)
- Nodemailer (OTP email)
- OpenAI SDK (used with Hugging Face router base URL)
- ChromaDB client (vector retrieval path)

## Current Project Structure

```text
BanglaTech/
  backend/
    config/
    controllers/
    middleware/
    models/
    routes/
    services/chatbot/
    utils/
    seed.js
    server.js
  client/
    src/
      components/
      context/
      App.js
    vite.config.js
  docs/
    README.md
  package.json
```

## Environment Variables

Create a .env file in project root with at least the following:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/banglamart

JWT_SECRET=replace_with_secure_value
JWT_EXPIRE=7d
SESSION_SECRET=replace_with_secure_value

# Email (OTP)
EMAIL_USER=your_gmail_address
EMAIL_PASS=your_gmail_app_password

# Optional Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# Hugging Face (text/voice chat routing)
HUGGINGFACE_API_KEY=your_hf_key
# or HF_API_KEY / HF_TOKEN

# Image understanding key (image route currently uses this key)
HF_API_KEY2=your_hf_image_key

# Optional model overrides
HF_CHAT_MODEL=MiniMaxAI/MiniMax-M2.5
HF_GENERAL_CHAT_MODEL=Qwen/Qwen2.5-7B-Instruct
HF_IMAGE_MODEL=Qwen/Qwen3-VL-8B-Instruct:novita
HF_IMAGE_PARSER_MODEL=MiniMaxAI/MiniMax-M2.5
```

## Run Locally

### 1. Install dependencies

Backend (from project root):

```bash
npm install
```

Frontend:

```bash
cd client
npm install
```

### 2. Seed sample data

From project root:

```bash
npm run seed
```

### 3. Start backend

From project root:

```bash
npm run dev
```

Backend URL: http://localhost:5000

### 4. Start frontend

In another terminal:

```bash
cd client
npm run dev
```

Frontend URL: http://localhost:3000

## API Overview

### Auth
- POST /api/auth/register
- POST /api/auth/verify-email
- POST /api/auth/resend-otp
- POST /api/auth/login
- POST /api/auth/logout
- GET /api/auth/me
- POST /api/auth/forgot-password
- POST /api/auth/verify-reset-otp
- PUT /api/auth/reset-password
- GET /api/auth/google
- GET /api/auth/google/callback

Admin-only auth management:
- GET /api/auth/users
- DELETE /api/auth/users/:id
- PUT /api/auth/users/:id/role

### Products and Categories
- GET /api/products
- GET /api/products/:id
- GET /api/products/mine (seller/admin)
- POST /api/products (seller)
- PUT /api/products/:id (seller/admin)
- DELETE /api/products/:id (seller/admin)

- GET /api/categories
- GET /api/categories/:id
- POST /api/categories (admin)
- PUT /api/categories/:id (admin)
- DELETE /api/categories/:id (admin)

### Cart and Orders
- GET /api/cart (buyer)
- POST /api/cart (buyer)
- PUT /api/cart/:productId (buyer)
- DELETE /api/cart/:productId (buyer)
- DELETE /api/cart (buyer)

- POST /api/orders (buyer)
- GET /api/orders/myorders (buyer)
- GET /api/orders/:id
- GET /api/orders/seller (seller)
- PUT /api/orders/:orderId/item/:productId/status (seller)
- PUT /api/orders/:orderId/item/:productId/cancel (buyer)

### Seller Application
- POST /api/sellers/apply (buyer)
- GET /api/sellers/my-application (buyer)
- GET /api/sellers/applications (admin)
- PUT /api/sellers/applications/:id (admin)

### Reviews
- GET /api/reviews/:productId
- POST /api/reviews/:productId
- POST /api/reviews/:reviewId/vote
- POST /api/reviews/:reviewId/reply

### Chatbot
- POST /api/chatbot/chat
- POST /api/chatbot/voice-search
- POST /api/chatbot/image-search

## Notes
- Frontend dev server is configured to run on port 3000 with strictPort enabled.
- CORS on backend currently allows http://localhost:3000.
- Uploaded files are processed in memory (Multer memory storage) for voice/image chatbot routes.
- Chatbot behavior depends on external model availability and configured keys.

## License

This project is for educational use.
