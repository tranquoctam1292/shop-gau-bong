# 🚨 CRITICAL FIX: Refund Stock Restoration

**Ngày fix:** 2025-01-XX  
**Mức độ:** **CRITICAL**  
**Files:** 
- `lib/services/inventory.ts` (thêm hàm `incrementStock()`)
- `lib/services/refund.ts` (thêm logic hoàn kho)

---

## 🔴 VẤN ĐỀ NGHIÊM TRỌNG

### Mô tả
Trong `lib/services/refund.ts`, hàm `processRefund()` xử lý cập nhật tiền và trạng thái đơn hàng nhưng **hoàn toàn thiếu** việc gọi `releaseStock()` hoặc `incrementStock()`.

### Hệ quả
1. ❌ **Stock không được hoàn lại** - Khi một đơn hàng bị hoàn trả toàn bộ (full refund), sản phẩm không được tự động cộng lại vào kho
2. ❌ **Sai lệch số liệu tồn kho** - `stockQuantity` không được restore, dẫn đến inventory không chính xác
3. ❌ **Mất hàng hóa** - Hàng đã được trừ kho nhưng không được hoàn lại khi refund

### Ví dụ
- Order #123: Mua 5 gấu bông, status `confirmed` → `stockQuantity` giảm 5
- Refund toàn bộ → `stockQuantity` **KHÔNG** tăng lại 5
- **Kết quả:** Inventory sai lệch, thiếu 5 sản phẩm

---

## ✅ GIẢI PHÁP ĐÃ ÁP DỤNG

### 1. Tạo hàm `incrementStock()` trong Inventory Service

**Location:** `lib/services/inventory.ts`

**Mục đích:** Hoàn lại stock vào kho khi order được refund sau khi đã bị trừ kho.

**Logic:**
```typescript
export async function incrementStock(
  orderId: string,
  items: Array<{ productId: string; variationId?: string; quantity: number }>
): Promise<void>
```

**Hoạt động:**
- ✅ Tăng `stockQuantity` cho simple products
- ✅ Tăng `stock` và `stockQuantity` cho variable products (variants)
- ✅ Chỉ xử lý products có `manageStock = true`
- ✅ Xử lý cả simple products và variable products

**Kết quả:**
- ✅ Stock được hoàn lại đúng số lượng
- ✅ Hỗ trợ cả simple và variable products
- ✅ Safe handling (skip nếu product không tồn tại hoặc không manage stock)

---

### 2. Thêm logic hoàn kho vào `processRefund()`

**Location:** `lib/services/refund.ts`

**Logic kiểm tra:**

#### Case 1: Full Refund + Order đã bị trừ kho
**Điều kiện:**
- `isFullRefund === true`
- Order status từ `confirmed` trở đi: `['confirmed', 'processing', 'shipping', 'completed']`

**Hành động:**
- ✅ Fetch order items từ `orderItems` collection
- ✅ Gọi `incrementStock()` để hoàn lại stock
- ✅ Restore đúng số lượng đã bị trừ

**Ví dụ:**
```
Order #123: status = 'processing', đã trừ 5 gấu bông
→ Full refund → incrementStock() → stockQuantity +5
```

---

#### Case 2: Order chưa bị trừ kho (Pending/Awaiting Payment)
**Điều kiện:**
- Order status: `pending` hoặc `awaiting_payment`

**Hành động:**
- ✅ Fetch order items
- ✅ Gọi `releaseStock()` để giải phóng `reservedQuantity`
- ✅ Áp dụng cho cả full và partial refund

**Ví dụ:**
```
Order #124: status = 'pending', chỉ có reservedQuantity = 5
→ Refund → releaseStock() → reservedQuantity -5 (stockQuantity không đổi)
```

---

#### Case 3: Partial Refund + Order đã bị trừ kho
**Điều kiện:**
- `isFullRefund === false`
- Order status từ `confirmed` trở đi

**Hành động:**
- ❌ **KHÔNG hoàn kho** (vì vẫn giữ một phần hàng)

**Rationale:**
- Partial refund = khách vẫn giữ một phần hàng
- Không nên hoàn kho vì hàng vẫn đã được giao/giữ
- Chỉ hoàn kho khi full refund (trả lại toàn bộ)

---

## 📊 SO SÁNH TRƯỚC/SAU

### Trước khi fix:

| Scenario | Order Status | Refund Type | Stock Action | Result |
|----------|--------------|-------------|--------------|--------|
| 1. Full refund | `confirmed` | Full | ❌ **KHÔNG hoàn kho** | Stock sai lệch |
| 2. Full refund | `processing` | Full | ❌ **KHÔNG hoàn kho** | Stock sai lệch |
| 3. Full refund | `pending` | Full | ❌ **KHÔNG release reserved** | Reserved stock không được giải phóng |
| 4. Partial refund | `confirmed` | Partial | ❌ **KHÔNG hoàn kho** | OK (vì vẫn giữ hàng) |

**Vấn đề:** Stock không được restore khi refund.

---

### Sau khi fix:

| Scenario | Order Status | Refund Type | Stock Action | Result |
|----------|--------------|-------------|--------------|--------|
| 1. Full refund | `confirmed` | Full | ✅ **`incrementStock()`** | Stock được hoàn lại |
| 2. Full refund | `processing` | Full | ✅ **`incrementStock()`** | Stock được hoàn lại |
| 3. Full refund | `pending` | Full | ✅ **`releaseStock()`** | Reserved stock được giải phóng |
| 4. Partial refund | `confirmed` | Partial | ❌ **KHÔNG hoàn kho** | OK (vì vẫn giữ hàng) |

**Kết quả:** Stock được restore đúng cách khi full refund.

---

## 🔍 CHI TIẾT IMPLEMENTATION

### File 1: `lib/services/inventory.ts`

**Thêm hàm mới:**
```typescript
/**
 * Increment stock back to inventory (when order is Refunded after stock was deducted)
 * 
 * @param orderId - Order ID
 * @param items - Array of items to increment stock for
 */
export async function incrementStock(
  orderId: string,
  items: Array<{ productId: string; variationId?: string; quantity: number }>
): Promise<void>
```

**Features:**
- ✅ Hỗ trợ simple products (tăng `stockQuantity`)
- ✅ Hỗ trợ variable products (tăng `stock` và `stockQuantity` cho variants)
- ✅ Skip products không manage stock
- ✅ Safe error handling (warn nếu product không tồn tại)

**Code location:** Line 186-250 (sau `deductStock()`, trước `releaseStock()`)

---

### File 2: `lib/services/refund.ts`

**Thêm imports:**
```typescript
import { incrementStock, releaseStock } from '@/lib/services/inventory';
import type { OrderStatus } from '@/lib/utils/orderStateMachine';
```

**Thêm logic hoàn kho:**
```typescript
// Handle stock restoration for refunds
// Only restore stock if:
// 1. Full refund (not partial)
// 2. Order was already confirmed (stock was deducted)
const orderStatus = order.status as OrderStatus;
const statusesWithDeductedStock: OrderStatus[] = ['confirmed', 'processing', 'shipping', 'completed'];

if (isFullRefund && statusesWithDeductedStock.includes(orderStatus)) {
  // Full refund + order was already confirmed → restore stock
  await incrementStock(orderId, itemsForInventory);
} else if (orderStatus === 'pending' || orderStatus === 'awaiting_payment') {
  // Order was not confirmed yet → release reserved stock
  await releaseStock(orderId, itemsForInventory);
}
```

**Code location:** Line 114-155 (sau order update, trước return)

---

## 🛡️ ERROR HANDLING

### Inventory Restoration Error Handling

```typescript
try {
  await incrementStock(orderId, itemsForInventory);
} catch (inventoryError: unknown) {
  // Log error but don't fail refund (to prevent data inconsistency)
  console.error('[Refund Service] Stock restoration error:', inventoryError);
  // Continue with refund processing even if stock restoration fails
  // This will be logged for manual intervention
}
```

**Rationale:**
- Refund không nên fail vì lỗi inventory (để tránh data inconsistency)
- Error được log để manual intervention
- Refund vẫn được process (tiền đã được hoàn)

---

### Stock Release Error Handling

```typescript
try {
  await releaseStock(orderId, itemsForInventory);
} catch (inventoryError: unknown) {
  // Log error but don't fail refund
  console.error('[Refund Service] Stock release error:', inventoryError);
}
```

**Rationale:**
- Tương tự, không fail refund vì lỗi release stock
- Log error để debug

---

## ✅ TESTING CHECKLIST

### Test Cases

1. **Full Refund - Confirmed Order:**
   - [ ] Order status `confirmed` → Full refund → `incrementStock()` được gọi
   - [ ] `stockQuantity` tăng đúng số lượng
   - [ ] Refund được process thành công

2. **Full Refund - Processing Order:**
   - [ ] Order status `processing` → Full refund → `incrementStock()` được gọi
   - [ ] `stockQuantity` tăng đúng số lượng

3. **Full Refund - Pending Order:**
   - [ ] Order status `pending` → Full refund → `releaseStock()` được gọi
   - [ ] `reservedQuantity` giảm, `stockQuantity` không đổi

4. **Partial Refund - Confirmed Order:**
   - [ ] Order status `confirmed` → Partial refund → **KHÔNG** gọi `incrementStock()`
   - [ ] Stock không được hoàn lại (vì vẫn giữ hàng)

5. **Error Handling:**
   - [ ] Nếu `incrementStock()` fail, refund vẫn được process
   - [ ] Error được log đúng

6. **Variable Products:**
   - [ ] Full refund với variable product → Variant stock được restore đúng
   - [ ] Simple product → `stockQuantity` được restore đúng

---

## 📝 NOTES

### Why Only Full Refund Restores Stock?

**Partial Refund:**
- Khách vẫn giữ một phần hàng
- Không nên hoàn kho vì hàng vẫn đã được giao/giữ
- Chỉ hoàn tiền, không hoàn hàng

**Full Refund:**
- Khách trả lại toàn bộ hàng
- Cần hoàn lại stock vì hàng đã được trả về
- Hoàn cả tiền và hàng

---

### Status Flow và Stock Impact

| Order Status | Stock Impact | Refund Action |
|--------------|--------------|---------------|
| `pending` | `reservedQuantity` +1 | `releaseStock()` (giải phóng reserved) |
| `awaiting_payment` | `reservedQuantity` +1 | `releaseStock()` (giải phóng reserved) |
| `confirmed` | `stockQuantity` -1, `reservedQuantity` -1 | `incrementStock()` (hoàn lại stock) |
| `processing` | `stockQuantity` -1 | `incrementStock()` (hoàn lại stock) |
| `shipping` | `stockQuantity` -1 | `incrementStock()` (hoàn lại stock) |
| `completed` | `stockQuantity` -1 | `incrementStock()` (hoàn lại stock) |

---

## 🔄 RELATED FILES

- `lib/services/inventory.ts` - Inventory service với `incrementStock()`, `deductStock()`, `releaseStock()`
- `lib/services/refund.ts` - Refund service với logic hoàn kho
- `lib/utils/orderStateMachine.ts` - Order state machine với `OrderStatus` type
- `app/api/admin/orders/[id]/refund/route.ts` - Refund API route (gọi `processRefund()`)

---

## ✅ KẾT LUẬN

**Fix đã được apply:**
- ✅ Hàm `incrementStock()` được tạo trong inventory service
- ✅ Logic hoàn kho được thêm vào `processRefund()`
- ✅ Chỉ hoàn kho khi full refund + order đã bị trừ kho
- ✅ Release reserved stock cho pending orders
- ✅ Error handling đầy đủ
- ✅ Type checking pass

**Status:** ✅ **FIXED** - Sẵn sàng để test và deploy

---

**Lưu ý:** Cần test kỹ với real refund scenarios để đảm bảo stock được restore đúng cách.

