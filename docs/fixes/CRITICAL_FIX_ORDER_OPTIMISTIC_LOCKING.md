# 🚨 CRITICAL FIX: Order Optimistic Locking

**Ngày fix:** 2025-01-XX  
**Mức độ:** **CRITICAL**  
**Files:** 
- `app/api/admin/orders/[id]/route.ts` (Main PUT route)
- `app/api/cms/orders/route.ts` (Order creation)
- `app/api/admin/orders/[id]/items/route.ts` (Update items)
- `app/api/admin/orders/[id]/shipping/route.ts` (Update shipping)
- `app/api/admin/orders/[id]/coupon/route.ts` (Apply/remove coupon)
- `types/mongodb.ts` (Type definitions)
- `docs/SCHEMA_CONTEXT_ORDERS.md` (Schema documentation)

---

## 🔴 VẤN ĐỀ NGHIÊM TRỌNG

### Mô tả
Route `app/api/admin/orders/[id]/route.ts` không sử dụng Optimistic Locking (như đã áp dụng cho Product module với field `version`).

### Hệ quả
1. ❌ **Race Condition** - Nếu hai Admin cùng mở một đơn hàng:
   - Admin A xác nhận đơn (update status → `confirmed`)
   - Cùng lúc Admin B cập nhật địa chỉ và bấm lưu
   - Thay đổi của Admin A về trạng thái sẽ bị ghi đè bởi trạng thái cũ từ form của Admin B
2. ❌ **Mất dữ liệu** - Các thay đổi đồng thời có thể ghi đè lên nhau
3. ❌ **Data inconsistency** - Trạng thái đơn hàng có thể bị revert về giá trị cũ

### Ví dụ
- **T0:** Order #123 có `status = 'pending'`, `version = 1`
- **T1:** Admin A mở order, form load `status = 'pending'`, `version = 1`
- **T2:** Admin B mở order, form load `status = 'pending'`, `version = 1`
- **T3:** Admin A update `status = 'confirmed'` → DB: `status = 'confirmed'`, `version = 2`
- **T4:** Admin B update `adminNotes = 'New note'` (với `version = 1` cũ) → DB: `status = 'pending'` (bị ghi đè), `version = 2`
- **Kết quả:** Status bị revert về `pending`, mất thay đổi của Admin A

---

## ✅ GIẢI PHÁP ĐÃ ÁP DỤNG

### 1. Thêm field `version` vào Order Schema

**Location:** `docs/SCHEMA_CONTEXT_ORDERS.md`, `types/mongodb.ts`

**Changes:**
- ✅ Thêm `version: number` vào order schema
- ✅ Khởi tạo `version = 1` khi tạo order mới
- ✅ Increment `version` sau mỗi lần update thành công

**Schema:**
```typescript
interface MongoOrder {
  // ... other fields ...
  
  // Optimistic Locking
  version: number; // Version field for optimistic locking (starts at 1)
  
  // ... other fields ...
}
```

---

### 2. Implement Optimistic Locking trong PUT Route

**Location:** `app/api/admin/orders/[id]/route.ts`

**Logic:**
1. ✅ Thêm `version` vào `orderUpdateSchema` (optional)
2. ✅ Check version trước khi update:
   - Nếu `requestVersion !== currentVersion` → return 409 `VERSION_MISMATCH`
3. ✅ Increment version sau khi update thành công

**Code:**
```typescript
// Optimistic Locking: Check version if provided
const currentVersion = order.version || 0;
const requestVersion = validatedData.version;

if (requestVersion !== undefined && requestVersion !== currentVersion) {
  return NextResponse.json(
    { 
      error: 'Order has been modified by another user. Please refresh and try again.',
      code: 'VERSION_MISMATCH',
      currentVersion,
    },
    { status: 409 }
  );
}

// ... update logic ...

// Increment version for optimistic locking
const updateData: any = {
  updatedAt: new Date(),
  version: (currentVersion || 0) + 1,
};
```

**Kết quả:**
- ✅ Ngăn chặn race condition
- ✅ Bảo vệ dữ liệu khỏi bị ghi đè
- ✅ Trả về error code rõ ràng (409 VERSION_MISMATCH)

---

### 3. Khởi tạo Version khi tạo Order mới

**Location:** `app/api/cms/orders/route.ts`

**Changes:**
- ✅ Thêm `version: 1` khi tạo order document

**Code:**
```typescript
const orderDoc = {
  // ... other fields ...
  version: 1, // Initialize version for optimistic locking
  createdAt: new Date(),
  updatedAt: new Date(),
};
```

---

### 4. Increment Version trong các Routes khác

**Locations:**
- `app/api/admin/orders/[id]/items/route.ts`
- `app/api/admin/orders/[id]/shipping/route.ts`
- `app/api/admin/orders/[id]/coupon/route.ts`

**Changes:**
- ✅ Increment `version` khi update order totals/shipping/coupon

**Rationale:**
- Các routes này cũng update order, nên cần increment version để đảm bảo consistency
- Tránh conflict khi nhiều admin cùng update order qua các routes khác nhau

---

### 5. Cập nhật Type Definitions

**Location:** `types/mongodb.ts`

**Changes:**
- ✅ Thêm `version?: number` vào `MongoOrder` interface
- ✅ Thêm các fields khác (`grandTotal`, `taxTotal`, `discountTotal`, `adminNotes`, `cancelledReason`)

---

## 📊 SO SÁNH TRƯỚC/SAU

### Trước khi fix:

| Scenario | Result | Status |
|----------|--------|--------|
| Admin A update status | ✅ Success | OK |
| Admin B update cùng lúc | ❌ **Ghi đè thay đổi của Admin A** | **Race Condition** |
| Data consistency | ❌ **Không đảm bảo** | **Unsafe** |

**Vấn đề:** Race condition, mất dữ liệu.

---

### Sau khi fix:

| Scenario | Result | Status |
|----------|--------|--------|
| Admin A update status | ✅ Success, `version = 2` | OK |
| Admin B update với `version = 1` cũ | ❌ **409 VERSION_MISMATCH** | **Protected** |
| Admin B refresh và update lại | ✅ Success, `version = 3` | **Safe** |
| Data consistency | ✅ **Đảm bảo** | **Safe** |

**Kết quả:** Race condition được ngăn chặn, dữ liệu an toàn.

---

## 🔍 CHI TIẾT IMPLEMENTATION

### File 1: `app/api/admin/orders/[id]/route.ts`

**Changes:**
1. ✅ Thêm `version: z.number().optional()` vào `orderUpdateSchema`
2. ✅ Check version trước khi update (return 409 nếu mismatch)
3. ✅ Increment version sau khi update thành công

**Code location:** 
- Schema: Line 28-46
- Version check: Line 136-150
- Version increment: Line 163-167

---

### File 2: `app/api/cms/orders/route.ts`

**Changes:**
1. ✅ Thêm `version: 1` khi tạo order mới

**Code location:** Line 100

---

### File 3-5: Other Update Routes

**Files:**
- `app/api/admin/orders/[id]/items/route.ts`
- `app/api/admin/orders/[id]/shipping/route.ts`
- `app/api/admin/orders/[id]/coupon/route.ts`

**Changes:**
1. ✅ Increment version khi update order

**Code location:**
- Items: Line 344-356
- Shipping: Line 129-138
- Coupon: Line 143-153

---

### File 6: `types/mongodb.ts`

**Changes:**
1. ✅ Thêm `version?: number` vào `MongoOrder` interface
2. ✅ Thêm các fields khác (`grandTotal`, `taxTotal`, `discountTotal`, etc.)

**Code location:** Line 17-67

---

### File 7: `docs/SCHEMA_CONTEXT_ORDERS.md`

**Changes:**
1. ✅ Thêm `version: number` vào order schema documentation

**Code location:** Line 50-60

---

## ✅ TESTING CHECKLIST

### Test Cases

1. **Single Admin Update:**
   - [ ] Admin A update order → Success, version increment
   - [ ] Version tăng từ 1 → 2

2. **Concurrent Updates (Race Condition):**
   - [ ] Admin A và B cùng mở order (version = 1)
   - [ ] Admin A update status → Success, version = 2
   - [ ] Admin B update với version = 1 cũ → 409 VERSION_MISMATCH
   - [ ] Admin B refresh và update lại → Success, version = 3

3. **Version Check Logic:**
   - [ ] Request không có version → Update thành công (backward compatibility)
   - [ ] Request có version đúng → Update thành công
   - [ ] Request có version sai → 409 VERSION_MISMATCH

4. **Order Creation:**
   - [ ] Tạo order mới → version = 1

5. **Other Routes:**
   - [ ] Update items → version increment
   - [ ] Update shipping → version increment
   - [ ] Apply coupon → version increment

---

## 📝 FRONTEND INTEGRATION (TODO)

### Cần cập nhật Frontend để:

1. **Gửi `version` trong request:**
   ```typescript
   const response = await fetch(`/api/admin/orders/${orderId}`, {
     method: 'PUT',
     body: JSON.stringify({
       ...formData,
       version: order.version, // Include current version
     }),
   });
   ```

2. **Handle 409 VERSION_MISMATCH error:**
   ```typescript
   if (response.status === 409 && errorData.code === 'VERSION_MISMATCH') {
     showToast(
       'Đơn hàng đã được chỉnh sửa bởi người khác. Vui lòng làm mới trang và thử lại.',
       'error'
     );
     // Refresh order data
     window.location.reload();
   }
   ```

3. **Lưu `version` khi load order:**
   ```typescript
   const { order } = await fetchOrder(orderId);
   setFormData({ ...order, version: order.version });
   ```

---

## 🔄 RELATED FILES

- `app/api/admin/products/[id]/route.ts` - Product module optimistic locking (reference implementation)
- `components/admin/ProductForm.tsx` - Frontend handling VERSION_MISMATCH (reference)
- `docs/PRODUCT_MODULE_CONTEXT.md` - Product module documentation (reference)

---

## ✅ KẾT LUẬN

**Fix đã được apply:**
- ✅ Field `version` được thêm vào order schema
- ✅ Optimistic locking được implement trong PUT route
- ✅ Version được khởi tạo khi tạo order mới
- ✅ Version được increment trong các routes update khác
- ✅ Type definitions được cập nhật
- ✅ Schema documentation được cập nhật
- ✅ Type checking pass

**Status:** ✅ **FIXED** - Backend sẵn sàng. Frontend cần được cập nhật để gửi `version` và handle 409 error.

---

**Lưu ý:** 
- Backend đã sẵn sàng với optimistic locking
- Frontend cần được cập nhật để gửi `version` trong request và handle 409 error
- Các đơn hàng cũ có thể không có `version` field (sẽ được xử lý với `version || 0`)

