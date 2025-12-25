# Quick Edit Dialog - MongoDB Query Analysis

## Tổng quan
Phân tích các MongoDB queries được sử dụng trong Quick Edit Dialog để xác định queries chậm và đề xuất indexes cần thiết.

**Ngày tạo:** 2025-01-XX
**Task:** 3.1.1 - Analyze slow queries trong MongoDB

---

## Queries được sử dụng trong Quick Edit Dialog

### 1. Product Lookup Queries

#### 1.1. Lookup by ObjectId
**Location:** `app/api/admin/products/[id]/quick-edit/route.ts:173`
```typescript
product = await products.findOne({ _id: new ObjectId(id) }, { projection: QUICK_EDIT_PROJECTION });
```

**Analysis:**
- **Query Type:** Equality lookup on `_id`
- **Index:** MongoDB tự động tạo unique index cho `_id` field
- **Performance:** ✅ Excellent (O(log n) với index)
- **Expected Time:** <10ms
- **Optimization:** Không cần thêm index

#### 1.2. Lookup by Slug (Fallback)
**Location:** `app/api/admin/products/[id]/quick-edit/route.ts:177`
```typescript
product = await products.findOne({ slug: id }, { projection: QUICK_EDIT_PROJECTION });
```

**Analysis:**
- **Query Type:** Equality lookup on `slug`
- **Index:** ⚠️ **CẦN INDEX** - `slug` field không có index
- **Performance:** ⚠️ Có thể chậm nếu không có index (O(n) full collection scan)
- **Expected Time:** 50-500ms (tùy collection size) nếu không có index, <10ms nếu có index
- **Optimization:** Tạo index cho `slug` field

**Recommended Index:**
```javascript
db.products.createIndex({ slug: 1 }, { unique: true, sparse: true })
```

**Rationale:**
- `unique: true` - Đảm bảo slug là unique (business requirement)
- `sparse: true` - Cho phép documents không có slug field (backward compatibility)

---

### 2. Category Lookup Queries

#### 2.1. Category Lookup by IDs and Slugs
**Location:** `app/api/admin/products/[id]/quick-edit/route.ts:204`
```typescript
const categoryDocs = categoryIds.length > 0
  ? await categories.find({
      $or: [
        { _id: { $in: categoryIds.filter((id) => ObjectId.isValid(id)).map((id) => new ObjectId(id)) } },
        { slug: { $in: categoryIds.filter((id) => !ObjectId.isValid(id)) } },
      ],
    }).toArray()
  : [];
```

**Analysis:**
- **Query Type:** `$or` với `$in` operators
- **Indexes:**
  - `categories._id` - ✅ MongoDB tự động tạo index
  - `categories.slug` - ⚠️ **CẦN INDEX** - `slug` field không có index
- **Performance:**
  - `_id` lookup: ✅ Excellent (<10ms)
  - `slug` lookup: ⚠️ Có thể chậm nếu không có index
- **Expected Time:** 20-200ms nếu không có index cho slug, <20ms nếu có index
- **Optimization:** Tạo index cho `slug` field

**Recommended Index:**
```javascript
db.categories.createIndex({ slug: 1 }, { unique: true, sparse: true })
```

**Rationale:**
- `unique: true` - Đảm bảo slug là unique (business requirement)
- `sparse: true` - Cho phép documents không có slug field (backward compatibility)

---

### 3. CSRF Token Lookup (Admin Users)

#### 3.1. Admin User Lookup for CSRF Token
**Location:** `lib/middleware/authMiddleware.ts` (implied from CSRF token flow)

**Analysis:**
- **Query Type:** Lookup by `_id` hoặc `tokenVersion`
- **Index:** 
  - `admin_users._id` - ✅ MongoDB tự động tạo index
  - `admin_users.tokenVersion` - ⚠️ **CẦN INDEX** nếu query by tokenVersion
- **Performance:** Tùy thuộc vào query pattern
- **Expected Time:** <10ms nếu có index
- **Optimization:** Tạo index cho `tokenVersion` nếu query by field này

**Recommended Index (nếu query by tokenVersion):**
```javascript
db.admin_users.createIndex({ tokenVersion: 1 })
```

---

## Queries Summary

| Query | Collection | Field | Index Status | Priority | Expected Impact |
|-------|-----------|-------|--------------|----------|-----------------|
| Product by `_id` | `products` | `_id` | ✅ Auto | Low | None (already optimized) |
| Product by `slug` | `products` | `slug` | ⚠️ Missing | **High** | 50-500ms → <10ms |
| Category by `_id` | `categories` | `_id` | ✅ Auto | Low | None (already optimized) |
| Category by `slug` | `categories` | `slug` | ⚠️ Missing | **High** | 20-200ms → <10ms |
| Admin User by `tokenVersion` | `admin_users` | `tokenVersion` | ⚠️ Unknown | Medium | Tùy query pattern |

---

## Recommended Indexes

### Priority 1: High Impact (Must Have)

#### 1. Products Collection - Slug Index
```javascript
db.products.createIndex({ slug: 1 }, { unique: true, sparse: true })
```

**Impact:**
- Giảm query time từ 50-500ms xuống <10ms
- Cải thiện fallback lookup khi ObjectId không hợp lệ
- Đảm bảo slug uniqueness (business requirement)

**Implementation:**
- Tạo index script: `scripts/create-mongodb-indexes.js`
- Chạy trong migration hoặc setup script

#### 2. Categories Collection - Slug Index
```javascript
db.categories.createIndex({ slug: 1 }, { unique: true, sparse: true })
```

**Impact:**
- Giảm query time từ 20-200ms xuống <10ms
- Cải thiện category lookup performance
- Đảm bảo slug uniqueness (business requirement)

**Implementation:**
- Tạo index script: `scripts/create-mongodb-indexes.js`
- Chạy trong migration hoặc setup script

### Priority 2: Medium Impact (Nice to Have)

#### 3. Admin Users Collection - Token Version Index
```javascript
db.admin_users.createIndex({ tokenVersion: 1 })
```

**Impact:**
- Cải thiện CSRF token validation performance
- Chỉ cần thiết nếu query by `tokenVersion` field

**Implementation:**
- Kiểm tra query pattern trước khi tạo index
- Tạo index nếu query by `tokenVersion` được sử dụng

---

## Index Creation Script

Tạo file `scripts/create-mongodb-indexes.js` để tạo các indexes cần thiết:

```javascript
/**
 * MongoDB Index Creation Script for Quick Edit Performance Optimization
 * 
 * Task: 3.1.2 - Add indexes cho các queries phổ biến
 * 
 * Run: node scripts/create-mongodb-indexes.js
 */

const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/shop-gau-bong';

async function createIndexes() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db();
    
    console.log('Creating indexes for Quick Edit performance optimization...');
    
    // 1. Products Collection - Slug Index
    try {
      await db.collection('products').createIndex(
        { slug: 1 },
        { unique: true, sparse: true, name: 'slug_1_unique' }
      );
      console.log('✅ Created index: products.slug');
    } catch (error) {
      if (error.code === 85) {
        console.log('⚠️  Index already exists: products.slug');
      } else {
        console.error('❌ Error creating products.slug index:', error.message);
      }
    }
    
    // 2. Categories Collection - Slug Index
    try {
      await db.collection('categories').createIndex(
        { slug: 1 },
        { unique: true, sparse: true, name: 'slug_1_unique' }
      );
      console.log('✅ Created index: categories.slug');
    } catch (error) {
      if (error.code === 85) {
        console.log('⚠️  Index already exists: categories.slug');
      } else {
        console.error('❌ Error creating categories.slug index:', error.message);
      }
    }
    
    // 3. Admin Users Collection - Token Version Index (if needed)
    // Uncomment if query by tokenVersion is used
    /*
    try {
      await db.collection('admin_users').createIndex(
        { tokenVersion: 1 },
        { name: 'tokenVersion_1' }
      );
      console.log('✅ Created index: admin_users.tokenVersion');
    } catch (error) {
      if (error.code === 85) {
        console.log('⚠️  Index already exists: admin_users.tokenVersion');
      } else {
        console.error('❌ Error creating admin_users.tokenVersion index:', error.message);
      }
    }
    */
    
    console.log('\n✅ Index creation completed!');
    
    // List all indexes
    console.log('\nCurrent indexes:');
    const productsIndexes = await db.collection('products').indexes();
    console.log('Products indexes:', productsIndexes.map(idx => idx.name).join(', '));
    
    const categoriesIndexes = await db.collection('categories').indexes();
    console.log('Categories indexes:', categoriesIndexes.map(idx => idx.name).join(', '));
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

createIndexes();
```

---

## Performance Impact Estimation

### Before Indexes
- Product lookup by slug: **50-500ms** (full collection scan)
- Category lookup by slug: **20-200ms** (full collection scan)
- **Total potential delay:** 70-700ms per Quick Edit open

### After Indexes
- Product lookup by slug: **<10ms** (index lookup)
- Category lookup by slug: **<10ms** (index lookup)
- **Total improvement:** 60-690ms saved per Quick Edit open

### Expected Overall Impact
- **Query time reduction:** 20-30% (as per plan)
- **Perceived performance:** Cải thiện đáng kể, đặc biệt với large collections
- **Scalability:** Better performance khi collection size tăng

---

## Next Steps

1. ✅ **Task 3.1.1:** Analyze slow queries - **Completed**
2. ⏭️ **Task 3.1.2:** Add indexes cho các queries phổ biến
   - Tạo index creation script
   - Chạy script để tạo indexes
   - Verify indexes được tạo thành công
   - Test performance improvement

---

## Notes

- **Index Maintenance:** Indexes cần disk space và làm chậm write operations một chút
- **Unique Constraint:** Unique indexes đảm bảo data integrity (slug uniqueness)
- **Sparse Index:** Cho phép documents không có slug field (backward compatibility)
- **Monitoring:** Nên monitor index usage và performance sau khi tạo indexes

---

## References

- MongoDB Index Documentation: https://docs.mongodb.com/manual/indexes/
- Query Performance: https://docs.mongodb.com/manual/core/query-performance/
- Index Types: https://docs.mongodb.com/manual/core/index-types/

