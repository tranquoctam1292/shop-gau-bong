# 🧪 Hướng dẫn Test PIM Phase 1 - API Routes

**Module:** Product Information Management (PIM)  
**Phase:** 1 - Database & API Foundation  
**Ngày tạo:** 12/12/2025

---

## ✅ Migration đã hoàn thành

Migration script đã chạy thành công:
- ✅ Thêm field `deletedAt` cho tất cả products
- ✅ Tạo index `deletedAt` 
- ✅ Tạo compound index `status + deletedAt`
- ✅ Verified: 1 product đã có `deletedAt` field

---

## 🧪 Test API Routes

### Prerequisites

1. **Dev server đang chạy:**
   ```bash
   npm run dev
   ```

2. **Admin user đã được tạo:**
   ```bash
   npm run create:admin-user
   ```
   - Email: `admin@example.com`
   - Password: `admin123`

---

## 📋 Test Cases

### 1. Test GET /api/admin/products với Soft Delete

#### Test 1.1: Get products (trashed=false - default)
```bash
GET http://localhost:3000/api/admin/products?trashed=false&per_page=5
Cookie: next-auth.session-token=[your-session-token]
```

**Expected Response:**
```json
{
  "products": [...],
  "pagination": {
    "total": 1,
    "totalPages": 1,
    "currentPage": 1,
    "perPage": 5
  },
  "filters": {
    "trashCount": 0
  }
}
```

**Verify:**
- ✅ Products array không chứa products có `deletedAt IS NOT NULL`
- ✅ `filters.trashCount` hiển thị số lượng products trong trash

#### Test 1.2: Get trashed products
```bash
GET http://localhost:3000/api/admin/products?trashed=true&per_page=5
Cookie: next-auth.session-token=[your-session-token]
```

**Expected Response:**
```json
{
  "products": [...],
  "pagination": {...},
  "filters": {
    "trashCount": 0
  }
}
```

**Verify:**
- ✅ Chỉ trả về products có `deletedAt IS NOT NULL`

#### Test 1.3: Get products với status=trash
```bash
GET http://localhost:3000/api/admin/products?status=trash&per_page=5
Cookie: next-auth.session-token=[your-session-token]
```

**Expected Response:** Tương tự Test 1.2

#### Test 1.4: Get products với filters
```bash
GET http://localhost:3000/api/admin/products?price_min=10000&price_max=1000000&per_page=5
Cookie: next-auth.session-token=[your-session-token]
```

**Verify:**
- ✅ Products được filter theo price range
- ✅ Chỉ trả về products chưa bị xóa (deletedAt IS NULL)

---

### 2. Test DELETE /api/admin/products/{id} (Soft Delete)

#### Test 2.1: Soft delete product
```bash
DELETE http://localhost:3000/api/admin/products/[productId]
Cookie: next-auth.session-token=[your-session-token]
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Đã chuyển vào thùng rác",
  "product": {...}
}
```

**Verify:**
- ✅ Product có `deletedAt` được set
- ✅ Product có `status = 'trash'`
- ✅ Product vẫn tồn tại trong database (không bị xóa)

#### Test 2.2: Verify product không hiện trong list
```bash
GET http://localhost:3000/api/admin/products?trashed=false
Cookie: next-auth.session-token=[your-session-token]
```

**Verify:**
- ✅ Product đã soft delete không xuất hiện trong list
- ✅ `filters.trashCount` tăng lên 1

---

### 3. Test PATCH /api/admin/products/{id}/restore

#### Test 3.1: Restore product từ trash
```bash
PATCH http://localhost:3000/api/admin/products/[productId]/restore
Cookie: next-auth.session-token=[your-session-token]
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Đã khôi phục",
  "product": {...}
}
```

**Verify:**
- ✅ Product có `deletedAt = null`
- ✅ Product có `status = 'draft'` (hoặc status cũ)
- ✅ Product xuất hiện lại trong list (trashed=false)

---

### 4. Test DELETE /api/admin/products/{id}/force (Force Delete)

#### Test 4.1: Force delete product
```bash
DELETE http://localhost:3000/api/admin/products/[productId]/force
Cookie: next-auth.session-token=[your-session-token]
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Đã xóa vĩnh viễn"
}
```

**Verify:**
- ✅ Product bị xóa hoàn toàn khỏi database
- ✅ Không thể restore được nữa

---

### 5. Test PATCH /api/admin/products/{id}/quick-update

#### Test 5.1: Quick update price
```bash
PATCH http://localhost:3000/api/admin/products/[productId]/quick-update
Content-Type: application/json
Cookie: next-auth.session-token=[your-session-token]

{
  "price": 150000
}
```

**Expected Response:**
```json
{
  "success": true,
  "product": {
    "price": 150000,
    "minPrice": 150000,
    ...
  }
}
```

**Verify:**
- ✅ Price được update
- ✅ minPrice được update tương ứng

#### Test 5.2: Quick update stock
```bash
PATCH http://localhost:3000/api/admin/products/[productId]/quick-update
Content-Type: application/json
Cookie: next-auth.session-token=[your-session-token]

{
  "stockQuantity": 50
}
```

**Expected Response:**
```json
{
  "success": true,
  "product": {
    "stockQuantity": 50,
    "stockStatus": "instock",
    ...
  }
}
```

**Verify:**
- ✅ stockQuantity được update
- ✅ stockStatus tự động update (instock nếu > 0, outofstock nếu = 0)

#### Test 5.3: Quick update status
```bash
PATCH http://localhost:3000/api/admin/products/[productId]/quick-update
Content-Type: application/json
Cookie: next-auth.session-token=[your-session-token]

{
  "status": "publish"
}
```

**Verify:**
- ✅ Status được update

---

### 6. Test POST /api/admin/products/bulk-action

#### Test 6.1: Bulk soft delete
```bash
POST http://localhost:3000/api/admin/products/bulk-action
Content-Type: application/json
Cookie: next-auth.session-token=[your-session-token]

{
  "ids": ["productId1", "productId2"],
  "action": "soft_delete"
}
```

**Expected Response:**
```json
{
  "success": true,
  "updated": 2,
  "failed": 0,
  "message": "Đã cập nhật 2 sản phẩm"
}
```

**Verify:**
- ✅ Tất cả products được soft delete
- ✅ `updated` count đúng

#### Test 6.2: Bulk restore
```bash
POST http://localhost:3000/api/admin/products/bulk-action
Content-Type: application/json
Cookie: next-auth.session-token=[your-session-token]

{
  "ids": ["productId1", "productId2"],
  "action": "restore"
}
```

**Verify:**
- ✅ Tất cả products được restore

#### Test 6.3: Bulk update status
```bash
POST http://localhost:3000/api/admin/products/bulk-action
Content-Type: application/json
Cookie: next-auth.session-token=[your-session-token]

{
  "ids": ["productId1", "productId2"],
  "action": "update_status",
  "value": "publish"
}
```

**Verify:**
- ✅ Tất cả products có status = "publish"

#### Test 6.4: Bulk update price
```bash
POST http://localhost:3000/api/admin/products/bulk-action
Content-Type: application/json
Cookie: next-auth.session-token=[your-session-token]

{
  "ids": ["productId1", "productId2"],
  "action": "update_price",
  "value": 200000
}
```

**Verify:**
- ✅ Tất cả products có price = 200000

#### Test 6.5: Bulk update stock
```bash
POST http://localhost:3000/api/admin/products/bulk-action
Content-Type: application/json
Cookie: next-auth.session-token=[your-session-token]

{
  "ids": ["productId1", "productId2"],
  "action": "update_stock",
  "value": 100
}
```

**Verify:**
- ✅ Tất cả products có stockQuantity = 100

---

## 🔧 Cách lấy Session Cookie

### Option 1: Từ Browser DevTools

1. **Login vào Admin Panel:**
   - Mở browser: `http://localhost:3000/admin/login`
   - Login với: `admin@example.com` / `admin123`

2. **Lấy Session Cookie:**
   - Mở DevTools (F12)
   - Vào tab **Application** (Chrome) hoặc **Storage** (Firefox)
   - Vào **Cookies** > `http://localhost:3000`
   - Copy giá trị của cookie `next-auth.session-token`

### Option 2: Từ Network Tab

1. **Login và xem Network requests:**
   - Mở DevTools > Network tab
   - Login vào admin panel
   - Tìm request đến `/api/admin/products`
   - Copy cookie từ Request Headers

---

## 📝 Test Checklist

- [ ] Migration script chạy thành công
- [ ] GET products với trashed=false (chỉ lấy products chưa xóa)
- [ ] GET products với trashed=true (chỉ lấy products đã xóa)
- [ ] GET products với status=trash
- [ ] GET products với filters (price_min, price_max, category, stock_status)
- [ ] DELETE product (soft delete - set deletedAt)
- [ ] PATCH restore product (set deletedAt = null)
- [ ] DELETE force product (xóa vĩnh viễn)
- [ ] PATCH quick-update price
- [ ] PATCH quick-update stock
- [ ] PATCH quick-update status
- [ ] POST bulk-action soft_delete
- [ ] POST bulk-action restore
- [ ] POST bulk-action update_status
- [ ] POST bulk-action update_price
- [ ] POST bulk-action update_stock

---

## 🐛 Troubleshooting

### Issue: 401 Unauthorized

**Solution:**
1. Đảm bảo đã login vào admin panel
2. Copy session cookie từ browser
3. Sử dụng cookie trong request headers

### Issue: Product không bị soft delete

**Solution:**
1. Check migration đã chạy: `deletedAt` field đã tồn tại
2. Check API response: `success: true` và `message: "Đã chuyển vào thùng rác"`
3. Check database: `deletedAt` field có giá trị Date

### Issue: Bulk action không hoạt động

**Solution:**
1. Check `ids` array có valid ObjectIds
2. Check `action` value đúng format
3. Check `value` field có đúng type (string cho status, number cho price/stock)

---

## ✅ Phase 1 Completion Status

- ✅ Migration script: Hoàn thành
- ✅ GET API với soft delete: Hoàn thành
- ✅ DELETE API (soft delete): Hoàn thành
- ✅ DELETE API (force delete): Hoàn thành
- ✅ PATCH restore API: Hoàn thành
- ✅ PATCH quick-update API: Hoàn thành
- ✅ POST bulk-action API: Hoàn thành
- ✅ Test script: Hoàn thành (cần manual test với auth)

**Next Step:** Bắt đầu Phase 2 - Frontend Implementation

