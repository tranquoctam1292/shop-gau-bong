# ✅ Phase 1: Setup MongoDB & Database Layer - COMPLETE

**Date:** 2025-01-XX  
**Status:** ✅ Complete  
**Next Phase:** Phase 2 - Migrate API Routes

---

## 📋 Completed Tasks

### ✅ 1. Install MongoDB Dependencies

- [x] Installed `mongodb` package (v7.0.0)
- [x] Installed `tsx` dev dependency for running TypeScript scripts

### ✅ 2. Create Database Layer

**File:** `lib/db.ts`

- [x] MongoDB connection with connection pooling
- [x] `getCollections()` function (Repository Pattern)
- [x] Global connection cache for serverless environments
- [x] Collections: `products`, `categories`, `orders`, `orderItems`, `users`, `banners`
- [x] Export `ObjectId` for use in other files

**Key Features:**
- Connection pooling optimized for serverless (Next.js API Routes)
- Automatic reconnection handling
- Type-safe collections interface

### ✅ 3. Environment Configuration

**File:** `.env.example`

- [x] Added `MONGODB_URI` configuration
- [x] Added `MONGODB_DB_NAME` configuration
- [x] Kept existing WordPress variables (for backward compatibility)
- [x] Added authentication variables for future admin panel

### ✅ 4. Test Script

**File:** `scripts/test-mongodb-connection.ts`

- [x] Connection test script
- [x] Collections access verification
- [x] Database ping test
- [x] Error handling with helpful messages

**Usage:**
```bash
npm run test:mongodb
```

### ✅ 5. Database Indexes Setup

**File:** `scripts/setup-database-indexes.ts`

- [x] Products indexes (slug, status, featured, category, variants, createdAt)
- [x] Categories indexes (slug, parentId, position)
- [x] Orders indexes (orderNumber, status, customerEmail, createdAt, orderType)
- [x] Order Items indexes (orderId, productId)
- [x] Users indexes (email)
- [x] Banners indexes (position, active)

**Usage:**
```bash
npm run db:setup-indexes
```

---

## 📁 Files Created

```
lib/
└── db.ts                          # MongoDB connection & collections

scripts/
├── test-mongodb-connection.ts    # Connection test script
└── setup-database-indexes.ts     # Indexes setup script

.env.example                       # Environment variables template
```

---

## 🚀 Next Steps

### 1. Setup MongoDB

**Option A: Local MongoDB**
```bash
# Install MongoDB locally
# Then update .env.local:
MONGODB_URI=mongodb://localhost:27017/shop-gau-bong
```

**Option B: MongoDB Atlas (Recommended)**
1. Create account at https://cloud.mongodb.com
2. Create a cluster
3. Get connection string
4. Update `.env.local`:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/shop-gau-bong?retryWrites=true&w=majority
```

### 2. Test Connection

```bash
# Create .env.local from .env.example
cp .env.example .env.local

# Edit .env.local and add your MONGODB_URI

# Test connection
npm run test:mongodb
```

**Expected Output:**
```
✅ MONGODB_URI found
📡 Connecting to MongoDB...
✅ Successfully connected to MongoDB!
📦 Testing collections access...
   ✅ Collection "products" accessible
   ...
🎉 MongoDB connection test PASSED!
```

### 3. Setup Indexes

```bash
npm run db:setup-indexes
```

**Expected Output:**
```
🔧 Setting up database indexes...
📦 Setting up products indexes...
   ✅ Products indexes created
...
🎉 All indexes created successfully!
```

---

## 📝 Code Usage Examples

### Using Collections

```typescript
import { getCollections, ObjectId } from '@/lib/db';

// In API Route
export async function GET() {
  const { products } = await getCollections();
  
  const product = await products.findOne({
    _id: new ObjectId(id),
    status: 'publish',
  });
  
  return NextResponse.json({ product });
}
```

### ObjectId Handling

```typescript
import { ObjectId } from '@/lib/db';

// Validate ID
if (!ObjectId.isValid(id)) {
  return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
}

// Use in query
const product = await products.findOne({
  _id: new ObjectId(id),
});
```

---

## ✅ Verification Checklist

- [ ] MongoDB installed/running (local) or Atlas cluster created
- [ ] `.env.local` created with `MONGODB_URI`
- [ ] Connection test passes: `npm run test:mongodb`
- [ ] Indexes created: `npm run db:setup-indexes`
- [ ] No TypeScript errors: `npm run type-check`

---

## 🎯 Ready for Phase 2

Phase 1 is complete! You can now proceed to:

**Phase 2: Migrate API Routes**
- Copy admin API routes from CMS
- Update routes to match business logic
- Test API endpoints

See `docs/CMS_INTEGRATION_ANALYSIS.md` for full migration plan.

---

**Last Updated:** 2025-01-XX  
**Status:** ✅ Phase 1 Complete

