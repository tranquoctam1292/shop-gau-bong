# 🗄️ MongoDB Setup Guide

**Date:** 2025-01-XX  
**Status:** Setup Required

---

## 📋 Quick Setup

### Option 1: MongoDB Atlas (Recommended - Cloud)

1. **Create Account:**
   - Go to: https://cloud.mongodb.com
   - Sign up for free account

2. **Create Cluster:**
   - Click "Build a Database"
   - Choose "Free" tier (M0)
   - Select region closest to you
   - Click "Create"

3. **Create Database User:**
   - Go to "Database Access"
   - Click "Add New Database User"
   - Choose "Password" authentication
   - Username: `admin` (or your choice)
   - Password: Generate secure password (save it!)
   - Click "Add User"

4. **Whitelist IP Address:**
   - Go to "Network Access"
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (for development)
   - Or add your specific IP
   - Click "Confirm"

5. **Get Connection String:**
   - Go to "Database" → Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy connection string
   - Format: `mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority`

6. **Update `.env.local`:**
   ```env
   MONGODB_URI=mongodb+srv://admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/shop-gau-bong?retryWrites=true&w=majority
   MONGODB_DB_NAME=shop-gau-bong
   ```
   
   **Important:**
   - Replace `YOUR_PASSWORD` with actual password
   - Replace `cluster0.xxxxx.mongodb.net` with your cluster URL
   - Add database name `/shop-gau-bong` before `?`
   - If password contains special characters, URL-encode them:
     - `@` → `%40`
     - `#` → `%23`
     - `$` → `%24`
     - `%` → `%25`
     - `&` → `%26`

### Option 2: Local MongoDB

1. **Install MongoDB:**
   - Windows: Download from https://www.mongodb.com/try/download/community
   - Mac: `brew install mongodb-community`
   - Linux: Follow official guide

2. **Start MongoDB:**
   ```bash
   # Windows (as service)
   net start MongoDB
   
   # Mac/Linux
   mongod --dbpath /path/to/data
   ```

3. **Update `.env.local`:**
   ```env
   MONGODB_URI=mongodb://localhost:27017/shop-gau-bong
   MONGODB_DB_NAME=shop-gau-bong
   ```

---

## ✅ Test Connection

After adding `MONGODB_URI` to `.env.local`:

```bash
npm run test:mongodb
```

**Expected Output:**
```
✅ MONGODB_URI found
📡 Connecting to MongoDB...
✅ Successfully connected to MongoDB!
📦 Testing collections access...
   ✅ Collection "products" accessible
   ✅ Collection "categories" accessible
   ...
🎉 MongoDB connection test PASSED!
```

---

## 🔧 Troubleshooting

### Error: "MONGODB_URI not found"

**Solution:**
1. Check `.env.local` exists in project root
2. Verify `MONGODB_URI` is in `.env.local`
3. No spaces around `=`: `MONGODB_URI=...` (not `MONGODB_URI = ...`)

### Error: "authentication failed"

**Solution:**
- Check username and password in connection string
- Verify database user exists in MongoDB Atlas
- Check password doesn't have unencoded special characters

### Error: "ENOTFOUND" or "getaddrinfo"

**Solution:**
- Check MongoDB host/URL is correct
- Verify network access in MongoDB Atlas
- Check internet connection

### Error: "timeout"

**Solution:**
- Check MongoDB server is running (local)
- Verify network access (Atlas)
- Check firewall settings

### Error: "Protocol and host list are required"

**Solution:**
- Check connection string format
- Verify no duplicate `mongodb+srv://` prefix
- Check password is URL-encoded if contains special characters

---

## 📝 Example `.env.local`

```env
# Database
MONGODB_URI=mongodb+srv://admin:MySecurePassword123@cluster0.xxxxx.mongodb.net/shop-gau-bong?retryWrites=true&w=majority
MONGODB_DB_NAME=shop-gau-bong

# WordPress (Legacy - for backward compatibility)
NEXT_PUBLIC_WORDPRESS_URL=https://your-wordpress-site.com
WOOCOMMERCE_CONSUMER_KEY=ck_xxxxx
WOOCOMMERCE_CONSUMER_SECRET=cs_xxxxx

# Site URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

---

## 🚀 Next Steps

After successful connection test:

1. **Setup Indexes:**
   ```bash
   npm run db:setup-indexes
   ```

2. **Proceed to Phase 2:**
   - Migrate API Routes
   - See `docs/CMS_INTEGRATION_ANALYSIS.md`

---

**Last Updated:** 2025-01-XX

