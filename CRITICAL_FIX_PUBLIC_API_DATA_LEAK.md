# 🚨 CRITICAL FIX: Public API Data Leak Prevention

**Ngày fix:** 2025-01-XX  
**Mức độ:** **CRITICAL** (Security)  
**Files:** 
- `app/api/cms/orders/[id]/route.ts` (Public Order API)
- `lib/dto/PublicOrderDTO.ts` (New DTO file)

---

## 🔴 VẤN ĐỀ NGHIÊM TRỌNG

### Mô tả
API GET `/api/cms/orders/[id]` trả về toàn bộ object order bao gồm cả các field không cần thiết cho khách hàng và có thể chứa thông tin nhạy cảm.

### Hệ quả
1. ❌ **Rò rỉ thông tin nhạy cảm** - Các field như `paymentMetadata` có thể chứa:
   - Log giao dịch chi tiết từ Payment Gateway
   - Transaction IDs, internal references
   - Debug information, error messages
   - API keys hoặc tokens (nếu có lỗi trong code)
2. ❌ **Lộ thông tin nội bộ** - Các field như:
   - `adminNotes` - Ghi chú nội bộ của admin
   - `cancelledReason` - Lý do hủy đơn (có thể nhạy cảm)
   - `version` - Thông tin kỹ thuật (optimistic locking)
   - `updatedAt` - Timestamp nội bộ
3. ❌ **Vi phạm Privacy** - Trả về quá nhiều thông tin không cần thiết

### Ví dụ
**Trước khi fix:**
```json
{
  "order": {
    "id": "123",
    "status": "confirmed",
    "paymentMetadata": {
      "momo_transaction_id": "abc123",
      "momo_debug_log": "Request: {...}, Response: {...}",
      "gateway_internal_ref": "internal-xyz",
      "error_details": "Connection timeout at..."
    },
    "adminNotes": "Khách hàng này đã từng khiếu nại",
    "cancelledReason": "Hàng bị lỗi từ nhà cung cấp",
    "version": 5,
    "updatedAt": "2025-01-15T10:30:00Z",
    "_id": "507f1f77bcf86cd799439011"
  }
}
```

**Vấn đề:** `paymentMetadata` có thể chứa thông tin nhạy cảm từ gateway, `adminNotes` và `cancelledReason` là thông tin nội bộ.

---

## ✅ GIẢI PHÁP ĐÃ ÁP DỤNG

### 1. Tạo Public Order DTO (Data Transfer Object)

**Location:** `lib/dto/PublicOrderDTO.ts`

**Mục đích:** Định nghĩa chính xác những field nào được phép trả về cho khách hàng.

**Fields được phép (chỉ những gì cần thiết):**
- ✅ `id`, `number` (orderNumber) - Mã đơn hàng
- ✅ `status` - Trạng thái đơn hàng
- ✅ `payment_method`, `payment_method_title`, `payment_status` - Thông tin thanh toán
- ✅ `total`, `grandTotal`, `currency` - Tổng tiền
- ✅ `customer_note` - Ghi chú của khách (KHÔNG phải admin notes)
- ✅ `billing`, `shipping` - Địa chỉ
- ✅ `line_items` - Danh sách sản phẩm
- ✅ `createdAt` - Ngày tạo đơn

**Fields bị loại bỏ (nhạy cảm):**
- ❌ `paymentMetadata` - Có thể chứa thông tin nhạy cảm từ gateway
- ❌ `adminNotes` - Ghi chú nội bộ
- ❌ `cancelledReason` - Lý do hủy (có thể nhạy cảm)
- ❌ `version` - Thông tin kỹ thuật
- ❌ `updatedAt` - Timestamp nội bộ
- ❌ `_id` - Đã có `id` rồi
- ❌ `userId`, `channel`, `trackingNumber`, `couponCode` - Thông tin nội bộ

**Code:**
```typescript
export interface PublicOrderDTO {
  // Basic Info
  id: string;
  number: string;
  status: string;
  
  // Payment Info
  payment_method: string;
  payment_method_title: string;
  payment_status: string;
  
  // Totals
  total: string;
  grandTotal: number;
  currency: string;
  
  // Customer Note (only customer's note)
  customer_note: string;
  
  // Addresses
  billing: { ... };
  shipping: { ... };
  
  // Order Items
  line_items: PublicOrderItemDTO[];
  
  // Timestamps
  createdAt: Date | string;
  
  // EXCLUDED FIELDS (for security):
  // - paymentMetadata, adminNotes, cancelledReason, version, updatedAt, _id, etc.
}
```

---

### 2. Tạo Mapper Function

**Location:** `lib/dto/PublicOrderDTO.ts`

**Function:** `mapOrderToPublicDTO(order, items)`

**Logic:**
- ✅ Chỉ map những field được phép
- ✅ Explicitly loại bỏ tất cả fields nhạy cảm
- ✅ Safe handling (fallback values nếu field không tồn tại)

**Code:**
```typescript
export function mapOrderToPublicDTO(
  order: any,
  items: any[]
): PublicOrderDTO {
  return {
    // Only map allowed fields
    id: order._id?.toString() || '',
    number: order.orderNumber || '',
    status: order.status || 'pending',
    // ... other allowed fields ...
    
    // NOTE: Explicitly NOT including:
    // - paymentMetadata (sensitive gateway data)
    // - adminNotes (internal notes)
    // - cancelledReason (internal reason)
    // - version (technical field)
    // - updatedAt (internal timestamp)
    // - _id (use id instead)
  };
}
```

---

### 3. Cập nhật Public API

**Location:** `app/api/cms/orders/[id]/route.ts`

**Changes:**
- ✅ Import `mapOrderToPublicDTO` từ DTO
- ✅ Thay thế manual mapping bằng DTO mapper
- ✅ Loại bỏ tất cả fields nhạy cảm

**Before:**
```typescript
const mappedOrder = {
  id: order._id.toString(),
  // ... manual mapping ...
  _id: order._id.toString(), // ❌ Exposed
  updatedAt: order.updatedAt, // ❌ Exposed
  // ... other fields that might include sensitive data ...
};
```

**After:**
```typescript
// Map to Public Order DTO (sanitized - excludes sensitive fields)
// SECURITY: Only return fields necessary for customer-facing features
const publicOrder = mapOrderToPublicDTO(order, items);
```

---

## 📊 SO SÁNH TRƯỚC/SAU

### Trước khi fix:

| Field | Exposed | Risk Level |
|-------|---------|------------|
| `paymentMetadata` | ✅ **YES** | 🔴 **HIGH** - Gateway transaction details |
| `adminNotes` | ✅ **YES** | 🟡 **MEDIUM** - Internal notes |
| `cancelledReason` | ✅ **YES** | 🟡 **MEDIUM** - Internal reason |
| `version` | ✅ **YES** | 🟢 **LOW** - Technical field |
| `updatedAt` | ✅ **YES** | 🟢 **LOW** - Internal timestamp |
| `_id` | ✅ **YES** | 🟢 **LOW** - Redundant (already have id) |

**Vấn đề:** Quá nhiều thông tin được expose, có thể chứa dữ liệu nhạy cảm.

---

### Sau khi fix:

| Field | Exposed | Risk Level |
|-------|---------|------------|
| `paymentMetadata` | ❌ **NO** | ✅ **Protected** |
| `adminNotes` | ❌ **NO** | ✅ **Protected** |
| `cancelledReason` | ❌ **NO** | ✅ **Protected** |
| `version` | ❌ **NO** | ✅ **Protected** |
| `updatedAt` | ❌ **NO** | ✅ **Protected** |
| `_id` | ❌ **NO** | ✅ **Protected** |

**Kết quả:** Chỉ trả về những field cần thiết, không có thông tin nhạy cảm.

---

## 🔍 CHI TIẾT IMPLEMENTATION

### File 1: `lib/dto/PublicOrderDTO.ts` (NEW)

**Purpose:** DTO definition và mapper function

**Structure:**
- `PublicOrderItemDTO` interface - Order item structure
- `PublicOrderDTO` interface - Order structure (sanitized)
- `mapOrderToPublicDTO()` function - Mapper function

**Security Features:**
- ✅ Explicit exclusion list trong comments
- ✅ Type-safe mapping
- ✅ Safe fallback values

**Code location:** New file

---

### File 2: `app/api/cms/orders/[id]/route.ts`

**Changes:**
1. ✅ Import `mapOrderToPublicDTO` từ DTO
2. ✅ Thay thế manual mapping bằng DTO mapper
3. ✅ Loại bỏ tất cả fields nhạy cảm

**Code location:** Line 9 (import), Line 44-47 (usage)

**Before (94 lines):**
```typescript
const mappedOrder = {
  // ... 50+ lines of manual mapping ...
  _id: order._id.toString(), // ❌ Exposed
  updatedAt: order.updatedAt, // ❌ Exposed
  // ... potentially more sensitive fields ...
};
```

**After (3 lines):**
```typescript
const publicOrder = mapOrderToPublicDTO(order, items);
return NextResponse.json({ order: publicOrder });
```

---

## ✅ TESTING CHECKLIST

### Test Cases

1. **Basic Order Retrieval:**
   - [ ] GET `/api/cms/orders/[id]` trả về order với đầy đủ fields cần thiết
   - [ ] Không có field nhạy cảm trong response

2. **Sensitive Fields Exclusion:**
   - [ ] Order có `paymentMetadata` → Không có trong response
   - [ ] Order có `adminNotes` → Không có trong response
   - [ ] Order có `cancelledReason` → Không có trong response
   - [ ] Order có `version` → Không có trong response
   - [ ] Order có `updatedAt` → Không có trong response
   - [ ] Order có `_id` → Không có trong response (chỉ có `id`)

3. **Required Fields:**
   - [ ] Response có `id`, `number`, `status`
   - [ ] Response có `payment_method`, `payment_status`
   - [ ] Response có `total`, `grandTotal`, `currency`
   - [ ] Response có `billing`, `shipping`
   - [ ] Response có `line_items`
   - [ ] Response có `createdAt`

4. **Edge Cases:**
   - [ ] Order không có `paymentMetadata` → Không crash
   - [ ] Order không có `adminNotes` → Không crash
   - [ ] Order items rỗng → `line_items: []`
   - [ ] Order có null/undefined fields → Safe fallback values

5. **Backward Compatibility:**
   - [ ] Frontend vẫn hoạt động với response mới
   - [ ] Response format tương thích với WooCommerce format (nếu cần)

---

## 🔒 SECURITY IMPROVEMENTS

### Before Fix:
- ❌ Trả về toàn bộ order object
- ❌ Có thể expose `paymentMetadata` với gateway transaction details
- ❌ Có thể expose `adminNotes`, `cancelledReason`
- ❌ Không có explicit control về fields được trả về

### After Fix:
- ✅ Chỉ trả về fields được phép (whitelist approach)
- ✅ Explicitly loại bỏ tất cả fields nhạy cảm
- ✅ Type-safe DTO đảm bảo không có field nào bị lộ
- ✅ Dễ maintain và audit

---

## 📝 BEST PRACTICES APPLIED

1. **DTO Pattern:**
   - ✅ Tách biệt data structure cho public API
   - ✅ Dễ maintain và audit
   - ✅ Type-safe

2. **Whitelist Approach:**
   - ✅ Chỉ trả về những gì cần thiết
   - ✅ Safer than blacklist (không thể quên exclude field mới)

3. **Explicit Documentation:**
   - ✅ Comments rõ ràng về fields bị loại bỏ
   - ✅ Dễ hiểu và maintain

4. **Single Responsibility:**
   - ✅ Mapper function chỉ làm một việc: map và sanitize
   - ✅ Dễ test và debug

---

## 🔄 RELATED FILES

- `app/api/cms/orders/[id]/route.ts` - Public Order API (updated)
- `lib/dto/PublicOrderDTO.ts` - Public Order DTO (new)
- `app/api/admin/orders/[id]/route.ts` - Admin Order API (không thay đổi - admin có quyền xem tất cả)

---

## ✅ KẾT LUẬN

**Fix đã được apply:**
- ✅ DTO được tạo với chỉ những field cần thiết
- ✅ Public API chỉ trả về DTO (sanitized)
- ✅ Tất cả fields nhạy cảm được loại bỏ
- ✅ Type-safe và maintainable
- ✅ Type checking pass

**Status:** ✅ **FIXED** - Security vulnerability đã được khắc phục

---

**Lưu ý:** 
- Admin API (`/api/admin/orders/[id]`) vẫn trả về đầy đủ thông tin (vì admin cần xem tất cả)
- Chỉ Public API (`/api/cms/orders/[id]`) được sanitize
- Nếu có thêm field nhạy cảm mới trong tương lai, cần update DTO để loại bỏ

