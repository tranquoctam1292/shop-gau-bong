# 🔍 API Validation Audit Report

**Ngày audit:** 2025-12-13  
**Mục đích:** Kiểm tra các API routes cần input validation

---

## ✅ Routes Đã Có Validation

### 1. `/api/cms/orders` (POST) - Create Order
- **Status:** ✅ **Đã có Zod validation**
- **File:** `app/api/cms/orders/route.ts`
- **Schema:** `orderCreateSchema` (inline)
- **Coverage:** Đầy đủ - customer info, billing, shipping, lineItems, payment

### 2. `/api/admin/products` (POST, PUT)
- **Status:** ⚠️ **Có import Zod, cần verify**
- **File:** `app/api/admin/products/route.ts`
- **Note:** Cần kiểm tra xem có dùng validation không

### 3. `/api/admin/orders/[id]/refund` (POST)
- **Status:** ✅ **Đã có Zod validation** (theo grep results)

### 4. `/api/admin/menus/[id]/structure` (PUT)
- **Status:** ✅ **Đã có Zod validation** (theo grep results)

### 5. `/api/admin/orders/bulk-*` routes
- **Status:** ✅ **Đã có Zod validation** (theo grep results)

---

## ❌ Routes Chưa Có Validation (Cần Thêm)

### 1. `/api/payment/momo` (POST)
- **Status:** ❌ **Chỉ có basic if checks**
- **File:** `app/api/payment/momo/route.ts`
- **Current:** Manual validation với `if (!orderId || !amount...)`
- **Needs:** Zod schema cho payment request

### 2. `/api/payment/vietqr` (POST)
- **Status:** ❌ **Cần kiểm tra**
- **File:** `app/api/payment/vietqr/route.ts`
- **Needs:** Zod schema cho VietQR request

### 3. `/api/payment/bank-transfer/upload` (POST)
- **Status:** ❌ **Cần kiểm tra**
- **File:** `app/api/payment/bank-transfer/upload/route.ts`
- **Needs:** Zod schema cho file upload

### 4. `/api/admin/categories` (POST, PUT)
- **Status:** ❌ **Cần kiểm tra**
- **File:** `app/api/admin/categories/route.ts`
- **Needs:** Zod schema cho category creation/update

### 5. `/api/admin/posts` (POST, PUT)
- **Status:** ❌ **Cần kiểm tra**
- **File:** `app/api/admin/posts/route.ts`
- **Needs:** Zod schema cho post creation/update

### 6. `/api/admin/orders` (PUT) - Update order
- **Status:** ❌ **Cần kiểm tra**
- **File:** `app/api/admin/orders/[id]/route.ts`
- **Needs:** Zod schema cho order update

### 7. `/api/admin/products/[id]` (PUT) - Update product
- **Status:** ⚠️ **Cần verify**
- **File:** `app/api/admin/products/[id]/route.ts`
- **Needs:** Verify và thêm nếu thiếu

---

## 📋 Priority List

### High Priority (Public-facing, User Input)
1. ✅ `/api/cms/orders` - **DONE**
2. ❌ `/api/payment/momo` - **TODO**
3. ❌ `/api/payment/vietqr` - **TODO**
4. ❌ `/api/payment/bank-transfer/upload` - **TODO**

### Medium Priority (Admin, but important)
5. ❌ `/api/admin/products` (POST, PUT) - **TODO**
6. ❌ `/api/admin/categories` (POST, PUT) - **TODO**
7. ❌ `/api/admin/orders` (PUT) - **TODO**
8. ❌ `/api/admin/posts` (POST, PUT) - **TODO**

### Low Priority (Internal/Simple)
9. ⚠️ Other admin routes - Verify và thêm nếu cần

---

## 📝 Next Steps

1. ✅ Audit completed
2. ⏳ Create Zod schemas cho payment routes
3. ⏳ Create Zod schemas cho admin routes
4. ⏳ Update API routes để sử dụng schemas
5. ⏳ Test validation với invalid/valid data

---

**Last Updated:** 2025-12-13
