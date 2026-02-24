# 🚀 Complete Setup Guide for All Projects

This guide will help you or anyone else clone and run these projects on their machine.

---

## 📁 Projects Overview

This workspace contains two main projects:

1. **Airnbn** - Laravel property rental platform (like Airbnb)
2. **BanglaTech** - MERN stack tech e-commerce website

---

## 🏠 **AIRNBN - Laravel Property Rental Platform**

### Prerequisites

- PHP >= 8.2
- Composer ([Download](https://getcomposer.org/))
- Node.js & NPM ([Download](https://nodejs.org/))
- MySQL (local or Railway account)
- Cloudinary Account ([Sign up](https://cloudinary.com))
- Mapbox Account ([Sign up](https://mapbox.com))

### Step-by-Step Setup

#### 1. Navigate to the Project

```bash
cd "e:\3.2\CSE 3200\Airnbn"
```

#### 2. Install PHP Dependencies

```bash
composer install
```

#### 3. Install Node Dependencies

```bash
npm install
```

#### 4. Setup Environment File

```bash
cp .env.example .env
```

Then edit the `.env` file with your settings:

```env
# App Settings
APP_NAME=Airnbn
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:8000

# Database Configuration
# Option 1: Local MySQL
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=airnbn
DB_USERNAME=root
DB_PASSWORD=your_password

# Option 2: Railway MySQL (Production)
# DB_HOST=your-railway-host.proxy.rlwy.net
# DB_PORT=29678
# DB_DATABASE=railway
# DB_USERNAME=root
# DB_PASSWORD=your-railway-password

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Mapbox Configuration
MAPBOX_ACCESS_TOKEN=your-mapbox-token
```

#### 5. Generate Application Key

```bash
php artisan key:generate
```

#### 6. Create Database

For local MySQL, create the database:

```sql
CREATE DATABASE airnbn;
```

#### 7. Run Migrations and Seed Database

```bash
php artisan migrate
php artisan db:seed
```

#### 8. Build Frontend Assets

```bash
npm run build
```

Or for development with hot reload:

```bash
npm run dev
```

#### 9. Start the Server

```bash
php artisan serve
```

#### 10. Access the Application

Visit: **http://localhost:8000**

### Default Login Credentials

**Host Account:**

- Email: `karim@example.com`
- Password: `12345678`

**Guest Account:**

- Email: `fatema@example.com`
- Password: `12345678`

### Common Issues & Solutions

**Issue: "Class not found"**

```bash
composer dump-autoload
```

**Issue: "Permission denied" on storage**

```bash
chmod -R 775 storage bootstrap/cache
```

**Issue: "NPM build errors"**

```bash
npm cache clean --force
rm -rf node_modules
npm install
```

---

## 🛒 **BANGLATECH - MERN E-commerce Platform**

### Prerequisites

- Node.js (v14 or higher) ([Download](https://nodejs.org/))
- MongoDB Server ([Download](https://www.mongodb.com/try/download/community))

### Step-by-Step Setup

#### 1. Navigate to the Project

```bash
cd "e:\3.2\CSE 3200\BanglaTech"
```

#### 2. Install Backend Dependencies

```bash
npm install
```

#### 3. Install Frontend Dependencies

```bash
cd client
npm install
cd ..
```

Or install both at once:

```bash
npm run install-all
```

#### 4. Start MongoDB

Make sure MongoDB is running:

**Windows:**

```bash
net start MongoDB
```

**Mac/Linux:**

```bash
sudo systemctl start mongod
```

**Or run manually:**

```bash
mongod
```

#### 5. Seed the Database

Populate with sample products:

```bash
npm run seed
```

This adds 12 sample tech products to the database.

#### 6. Run the Application

**Option 1: Run Everything Together (Recommended)**

```bash
npm run dev:full
```

**Option 2: Run Backend and Frontend Separately**

Terminal 1 (Backend):

```bash
npm run dev
```

Terminal 2 (Frontend):

```bash
npm run client
```

#### 7. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Test**: http://localhost:5000/api/products

### Verify Database (Optional)

Connect to MongoDB shell:

```bash
mongosh
```

Then run:

```javascript
use banglatech
db.products.find().pretty()
db.products.countDocuments()
```

### Common Issues & Solutions

**Issue: "Cannot connect to MongoDB"**

- Ensure MongoDB service is running
- Check if port 27017 is available
- Verify connection string in backend code

**Issue: "Port already in use"**

- Close other applications using ports 3000 or 5000
- Or modify ports in configuration files

**Issue: "Module not found"**

```bash
rm -rf node_modules
npm install
cd client
rm -rf node_modules
npm install
```

---

## 📝 Quick Reference Commands

### Airnbn (Laravel)

```bash
# Fresh install
composer install && npm install
php artisan key:generate
php artisan migrate:fresh --seed
npm run build
php artisan serve

# Development
npm run dev  # In separate terminal for hot reload
php artisan serve

# Clear cache
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear
```

### BanglaTech (MERN)

```bash
# Fresh install
npm run install-all
npm run seed
npm run dev:full

# Development
npm run dev:full  # Run everything
# OR
npm run dev      # Backend only
npm run client   # Frontend only

# Database operations
npm run seed     # Add sample data
```

---

## 🔧 Environment Variables Summary

### Airnbn (.env)

Required variables:

- `DB_*` - Database connection
- `CLOUDINARY_*` - Image upload service
- `MAPBOX_ACCESS_TOKEN` - Maps integration
- `APP_KEY` - Auto-generated

### BanglaTech (.env)

Default configuration (usually no changes needed):

- `MONGODB_URI=mongodb://localhost:27017/banglatech`
- `PORT=5000`

---

## 📞 Need Help?

If you encounter any issues:

1. Check the individual project README files:

   - [Airnbn README](Airnbn/README.md)
   - [BanglaTech README](BanglaTech/README.md)
   - [BanglaTech Setup Instructions](BanglaTech/SETUP_INSTRUCTIONS.md)

2. Common troubleshooting:

   - Ensure all prerequisites are installed
   - Check if required services (MySQL, MongoDB) are running
   - Verify environment variables are set correctly
   - Clear cache and reinstall dependencies

3. Verify versions:
   ```bash
   php --version
   composer --version
   node --version
   npm --version
   mongod --version
   ```

---

## 🎯 Quick Start Checklist

### For Airnbn:

- [ ] PHP 8.2+ installed
- [ ] Composer installed
- [ ] Node.js installed
- [ ] MySQL running
- [ ] Cloudinary account created
- [ ] Mapbox account created
- [ ] `.env` file configured
- [ ] Dependencies installed
- [ ] Database migrated and seeded
- [ ] Server running

### For BanglaTech:

- [ ] Node.js 14+ installed
- [ ] MongoDB installed and running
- [ ] Dependencies installed (backend & frontend)
- [ ] Database seeded
- [ ] Both servers running

---

**Happy Coding! 🚀**
