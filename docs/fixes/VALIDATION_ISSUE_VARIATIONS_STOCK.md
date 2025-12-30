# 🔍 XÁC THỰC VẤN ĐỀ: THIẾU VALIDATION CHO STOCK QUANTITY

**Ngày kiểm tra:** 2025-01-XX  
**Component:** `VariationsBulkEditToolbar.tsx` & `VariationTable.tsx`  
**Vấn đề:** Thiếu validation cho số lượng stock (stockQuantity)

---

## 📋 TÓM TẮT VẤN ĐỀ

User báo cáo rằng component `VariationsBulkEditToolbar.tsx` thiếu validation cho giá trị stock quantity, dẫn đến:
1. ✅ **XÁC THỰC:** Có thể nhập giá trị không phải số
2. ✅ **XÁC THỰC:** Có thể nhập số âm
3. ✅ **XÁC THỰC:** Giá trị không hợp lệ có thể được lưu vào database

---

## 🔍 PHÂN TÍCH CHI TIẾT

### 1. Component VariationsBulkEditToolbar.tsx

**File:** `components/admin/products/ProductDataMetaBox/VariationsBulkEditToolbar.tsx`

**Phát hiện:**
- ✅ Component này **KHÔNG có input field** cho stock quantity
- ✅ Chỉ có chức năng đặt trạng thái kho (instock/outofstock)
- ✅ Tự động set `stockQuantity = 1` (instock) hoặc `0` (outofstock)

**Code hiện tại (line 193-226):**
```typescript
const handleSetStockStatus = async () => {
  setIsApplying(true);
  try {
    const stockQty = stockStatus === 'instock' ? 1 : 0;  // ❌ Hardcoded, không có input
    
    // Update variations
    if (onVariationsChange) {
      const updatedVariations = variations.map((variation) => {
        // ...
        if (matchesFilter) {
          return { ...variation, stockQuantity: stockQty };  // ❌ Không validate
        }
        return variation;
      });
      onVariationsChange(updatedVariations);
    }
    // ...
  }
}
```

**Kết luận:**
- ⚠️ Component này **không có vấn đề validation** vì không có input field
- ⚠️ Nhưng nếu user muốn **thêm tính năng nhập số lượng stock**, cần thêm validation

---

### 2. Component VariationTable.tsx (VẤN ĐỀ THỰC SỰ)

**File:** `components/admin/products/ProductDataMetaBox/VariationTable.tsx`

**Phát hiện:**
- ✅ **CÓ input field** cho stock quantity (line 467-476)
- ❌ **THIẾU validation** cho số âm
- ❌ **THIẾU validation** cho giá trị không hợp lệ

**Code hiện tại (line 107-108):**
```typescript
case 'stockQuantity':
  updated.stockQuantity = editValue.trim() 
    ? (isNaN(numValue) ? undefined : Math.floor(numValue))  // ❌ Chỉ check NaN, không check số âm
    : undefined;
  break;
```

**Vấn đề:**
1. ❌ **Chỉ check `isNaN`**: Nếu nhập "abc", sẽ set `undefined` (OK)
2. ❌ **KHÔNG check số âm**: Nếu nhập "-10", sẽ set `-10` (❌ SAI)
3. ❌ **KHÔNG check số thập phân**: `Math.floor(-10.5)` = `-10` (❌ Vẫn âm)
4. ❌ **Input type="number"**: Browser có thể validate, nhưng không đủ

**Input field (line 467-476):**
```typescript
<Input
  ref={inputRef}
  type="number"
  step="1"
  value={editValue}
  onChange={handleInputChange}
  onBlur={handleSave}
  onKeyDown={handleKeyDown}
  className="h-8 text-xs"
  // ❌ THIẾU: min="0" attribute
/>
```

**Kết luận:**
- ✅ **XÁC THỰC:** Component này có vấn đề validation
- ✅ **XÁC THỰC:** Có thể nhập số âm
- ✅ **XÁC THỰC:** Giá trị không hợp lệ có thể được lưu

---

### 3. API Endpoint Validation

**File:** `app/api/admin/products/[id]/variations/bulk/route.ts`

**Phát hiện:**
- ❌ **Zod schema thiếu validation** cho số âm (line 40)
- ❌ **Không validate trước khi lưu** (line 145-146)

**Code hiện tại:**
```typescript
// Line 40: Zod schema
stockQuantity: z.number().optional(),  // ❌ Chỉ check là number, không check >= 0

// Line 145-146: Save to database
if (updates.stockQuantity !== undefined) {
  updated.stockQuantity = updates.stockQuantity;  // ❌ Lưu trực tiếp, không validate
}
```

**Vấn đề:**
1. ❌ Zod schema không có `.min(0)` hoặc `.nonnegative()`
2. ❌ Không validate trước khi update database
3. ❌ Số âm có thể được lưu vào MongoDB

**Kết luận:**
- ✅ **XÁC THỰC:** API endpoint thiếu validation
- ✅ **XÁC THỰC:** Số âm có thể được lưu vào database

---

## 🚨 XÁC NHẬN CÁC VẤN ĐỀ

### Vấn đề 1: Nhập giá trị không hợp lệ ✅ XÁC THỰC

**Location:** `VariationTable.tsx` line 107-108

**Test case:**
- Nhập "abc" → `isNaN("abc")` = `true` → Set `undefined` ✅ (OK)
- Nhập "123abc" → `parseFloat("123abc")` = `123` → Set `123` ⚠️ (Partial OK)
- Nhập "" → Set `undefined` ✅ (OK)

**Kết luận:** Có một số validation, nhưng không đầy đủ.

---

### Vấn đề 2: Nhập số âm ✅ XÁC THỰC

**Location:** `VariationTable.tsx` line 107-108

**Test case:**
- Nhập "-10" → `parseFloat("-10")` = `-10` → `Math.floor(-10)` = `-10` → Set `-10` ❌
- Nhập "-0.5" → `parseFloat("-0.5")` = `-0.5` → `Math.floor(-0.5)` = `-1` → Set `-1` ❌
- Nhập "0" → Set `0` ✅ (OK)
- Nhập "10" → Set `10` ✅ (OK)

**Kết luận:** ✅ **XÁC THỰC** - Có thể nhập số âm và được lưu.

---

### Vấn đề 3: Cập nhật giá trị không hợp lệ lên database ✅ XÁC THỰC

**Location:** 
- Frontend: `VariationTable.tsx` line 107-108
- Backend: `app/api/admin/products/[id]/variations/bulk/route.ts` line 40, 145-146

**Flow:**
1. User nhập "-10" trong `VariationTable.tsx`
2. `handleSave()` set `stockQuantity = -10` (không validate)
3. `onVariationsChange()` được gọi với `stockQuantity: -10`
4. Data được gửi lên API endpoint
5. API endpoint nhận `stockQuantity: -10` (Zod chỉ check là number)
6. Database được update với `stockQuantity: -10` ❌

**Kết luận:** ✅ **XÁC THỰC** - Giá trị không hợp lệ có thể được lưu vào database.

---

## 📊 TỔNG KẾT XÁC THỰC

| Vấn đề | Trạng thái | Location | Mức độ |
|--------|------------|----------|--------|
| Nhập giá trị không hợp lệ | ✅ XÁC THỰC | `VariationTable.tsx` | MEDIUM |
| Nhập số âm | ✅ XÁC THỰC | `VariationTable.tsx` | HIGH |
| Lưu vào database | ✅ XÁC THỰC | API endpoint | CRITICAL |

---

## 🔧 GIẢI PHÁP ĐỀ XUẤT

### 1. Fix Frontend (VariationTable.tsx)

**Thêm validation trong `handleSave()`:**
```typescript
case 'stockQuantity':
  if (editValue.trim()) {
    const numValue = parseFloat(editValue);
    if (isNaN(numValue)) {
      // Invalid number
      showToast('Số lượng phải là số hợp lệ', 'error');
      return; // Don't save
    }
    const intValue = Math.floor(numValue);
    if (intValue < 0) {
      // Negative number
      showToast('Số lượng không thể là số âm', 'error');
      return; // Don't save
    }
    updated.stockQuantity = intValue;
  } else {
    updated.stockQuantity = undefined;
  }
  break;
```

**Thêm `min="0"` vào Input:**
```typescript
<Input
  ref={inputRef}
  type="number"
  step="1"
  min="0"  // ✅ Thêm min attribute
  value={editValue}
  onChange={handleInputChange}
  onBlur={handleSave}
  onKeyDown={handleKeyDown}
  className="h-8 text-xs"
/>
```

---

### 2. Fix Backend (API Endpoint)

**Cập nhật Zod schema:**
```typescript
// Before
stockQuantity: z.number().optional(),

// After
stockQuantity: z.number().int().nonnegative().optional(),  // ✅ Validate >= 0 và integer
```

**Thêm validation trước khi save:**
```typescript
if (updates.stockQuantity !== undefined) {
  if (updates.stockQuantity < 0) {
    return NextResponse.json(
      { error: 'Stock quantity cannot be negative' },
      { status: 400 }
    );
  }
  updated.stockQuantity = Math.floor(updates.stockQuantity);  // ✅ Ensure integer
}
```

---

### 3. Nếu muốn thêm tính năng vào VariationsBulkEditToolbar

**Thêm input field và validation:**
```typescript
const [stockQuantity, setStockQuantity] = useState('');

const handleSetStockQuantity = async () => {
  if (!stockQuantity || isNaN(parseFloat(stockQuantity))) {
    showToast('Vui lòng nhập số lượng hợp lệ', 'error');
    return;
  }

  const qty = parseInt(stockQuantity);
  if (qty < 0 || !isFinite(qty)) {
    showToast('Số lượng phải là số nguyên không âm', 'error');
    return;
  }

  // ... update logic
};
```

---

## ✅ KẾT LUẬN

**Xác thực:** ✅ **TẤT CẢ CÁC VẤN ĐỀ ĐỀU ĐÚNG**

1. ✅ Có thể nhập giá trị không hợp lệ (một phần)
2. ✅ **Có thể nhập số âm** (xác thực)
3. ✅ **Giá trị không hợp lệ có thể được lưu vào database** (xác thực)

**Priority:** **HIGH** - Cần fix ngay vì có thể gây lỗi trong hệ thống quản lý kho.

**Recommendation:** 
- Fix frontend validation trong `VariationTable.tsx`
- Fix backend validation trong API endpoint
- Test kỹ với các edge cases (số âm, số thập phân, chuỗi, null, undefined)

