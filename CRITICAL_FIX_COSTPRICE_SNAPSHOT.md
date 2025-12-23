# 🚨 CRITICAL FIX: CostPrice Snapshot in Order Items

**Ngày fix:** 2025-01-XX  
**Mức độ:** **CRITICAL**  
**Files:** 
- `app/api/cms/orders/route.ts` (Public order creation)
- `app/api/admin/orders/[id]/items/route.ts` (Admin add item)

---

## 🔴 VẤN ĐỀ NGHIÊM TRỌNG

### Mô tả
Khi tạo đơn hàng, hệ thống chỉ lưu `price` (giá bán) vào `order_items`, **hoàn toàn thiếu** việc snapshot `costPrice` (giá vốn) tại thời điểm mua.

### Hệ quả
1. ❌ **Không thể tính toán lợi nhuận gộp (Gross Profit)** - Khi xem báo cáo cho các đơn hàng cũ, không có `costPrice` snapshot nên không thể tính chính xác lợi nhuận
2. ❌ **Giá vốn thay đổi theo thời gian** - `costPrice` của sản phẩm có thể thay đổi, nhưng đơn hàng cũ không lưu giá vốn tại thời điểm mua
3. ❌ **Báo cáo không chính xác** - Không thể phân tích profitability của các đơn hàng trong quá khứ

### Ví dụ
- **Ngày 1/1/2025:** Sản phẩm A có `costPrice = 100,000đ`, `price = 200,000đ`
- **Đơn hàng #123:** Mua 5 sản phẩm A → Chỉ lưu `price = 200,000đ`, **KHÔNG lưu `costPrice`**
- **Ngày 15/1/2025:** Sản phẩm A có `costPrice = 120,000đ` (giá vốn tăng)
- **Xem báo cáo đơn hàng #123:** Không thể tính lợi nhuận vì không biết `costPrice` tại thời điểm mua

---

## ✅ GIẢI PHÁP ĐÃ ÁP DỤNG

### 1. Fetch và lưu `costPrice` khi tạo đơn hàng (Public API)

**Location:** `app/api/cms/orders/route.ts`

**Logic:**
1. ✅ Fetch tất cả products cần thiết từ DB trước khi tạo order items
2. ✅ Với mỗi lineItem:
   - Nếu có `variationId`: Tìm variant trong product và lấy `costPrice` từ variant (nếu có)
   - Nếu variant không có `costPrice`: Fallback về `costPrice` của product
   - Nếu không có `variationId`: Lấy `costPrice` trực tiếp từ product
3. ✅ Lưu `costPrice` vào `order_items` như snapshot tại thời điểm mua

**Code:**
```typescript
// Fetch products to get costPrice snapshot
const { products } = await getCollections();
const productIds = [...new Set(validatedData.lineItems.map((item) => item.productId))];
const productDocs = await products
  .find({ _id: { $in: productIds.map((id) => new ObjectId(id)) } })
  .toArray();

const productsMap = new Map(
  productDocs.map((p) => [p._id.toString(), p])
);

// Create order items with costPrice snapshot
const itemsToInsert = validatedData.lineItems.map((item) => {
  const product = productsMap.get(item.productId);
  let costPrice: number | undefined = undefined;
  
  // Get costPrice from product or variant
  if (product) {
    // For variable products, check variant costPrice first
    if (item.variationId && product.productDataMetaBox?.variations) {
      const variant = product.productDataMetaBox.variations.find(
        (v: any) => v.id === item.variationId || ...
      );
      if (variant && typeof variant.costPrice === 'number') {
        costPrice = variant.costPrice;
      }
    }
    
    // Fallback to product costPrice if variant doesn't have it
    if (costPrice === undefined && product.productDataMetaBox?.costPrice !== undefined) {
      costPrice = product.productDataMetaBox.costPrice;
    }
  }
  
  return {
    orderId,
    productId: item.productId,
    variationId: item.variationId,
    productName: item.productName,
    quantity: item.quantity,
    price: item.price,
    costPrice: costPrice, // Snapshot costPrice at time of order
    subtotal: item.price * item.quantity,
    total: item.price * item.quantity,
    createdAt: new Date(),
  };
});
```

**Kết quả:**
- ✅ `costPrice` được snapshot vào `order_items` khi tạo đơn
- ✅ Hỗ trợ cả simple products và variable products
- ✅ Fallback logic đảm bảo lấy được `costPrice` nếu có

---

### 2. Fetch và lưu `costPrice` khi admin thêm item (Admin API)

**Location:** `app/api/admin/orders/[id]/items/route.ts`

**Logic:**
- Tương tự như Public API, fetch product và lấy `costPrice` từ product/variant
- Lưu `costPrice` vào `order_items` khi thêm item mới

**Code:**
```typescript
// Fetch product to get costPrice snapshot
const { products } = await getCollections();
const product = await products.findOne({ _id: new ObjectId(validatedData.productId) });

let costPrice: number | undefined = undefined;

// Get costPrice from product or variant
if (product) {
  // For variable products, check variant costPrice first
  if (validatedData.variationId && product.productDataMetaBox?.variations) {
    const variant = product.productDataMetaBox.variations.find(...);
    if (variant && typeof variant.costPrice === 'number') {
      costPrice = variant.costPrice;
    }
  }
  
  // Fallback to product costPrice if variant doesn't have it
  if (costPrice === undefined && product.productDataMetaBox?.costPrice !== undefined) {
    costPrice = product.productDataMetaBox.costPrice;
  }
}

// Create new order item with costPrice snapshot
const newItem = {
  orderId: orderId.toString(),
  productId: validatedData.productId,
  variationId: validatedData.variationId,
  productName: validatedData.productName,
  quantity: validatedData.quantity,
  price: validatedData.price,
  costPrice: costPrice, // Snapshot costPrice at time of order
  total: validatedData.price * validatedData.quantity,
  createdAt: new Date(),
};
```

**Kết quả:**
- ✅ Admin thêm item cũng có `costPrice` snapshot
- ✅ Đảm bảo consistency giữa Public API và Admin API

---

## 📊 SO SÁNH TRƯỚC/SAU

### Trước khi fix:

| Field | Value | Status |
|-------|-------|--------|
| `price` | 200,000đ | ✅ Lưu |
| `costPrice` | ❌ **KHÔNG lưu** | ❌ Missing |
| `quantity` | 5 | ✅ Lưu |
| `subtotal` | 1,000,000đ | ✅ Lưu |

**Vấn đề:** Không thể tính lợi nhuận gộp cho đơn hàng cũ.

---

### Sau khi fix:

| Field | Value | Status |
|-------|-------|--------|
| `price` | 200,000đ | ✅ Lưu |
| `costPrice` | 100,000đ | ✅ **Lưu (snapshot)** |
| `quantity` | 5 | ✅ Lưu |
| `subtotal` | 1,000,000đ | ✅ Lưu |

**Kết quả:** Có thể tính lợi nhuận gộp:
- **Revenue:** 1,000,000đ (5 × 200,000đ)
- **Cost:** 500,000đ (5 × 100,000đ)
- **Gross Profit:** 500,000đ (1,000,000đ - 500,000đ)
- **Gross Profit Margin:** 50% (500,000đ / 1,000,000đ)

---

## 🔍 CHI TIẾT IMPLEMENTATION

### File 1: `app/api/cms/orders/route.ts`

**Changes:**
1. ✅ Import `products` collection
2. ✅ Fetch products trước khi tạo order items (batch fetch để optimize)
3. ✅ Map `costPrice` cho mỗi lineItem:
   - Check variant `costPrice` trước (nếu có `variationId`)
   - Fallback về product `costPrice` nếu variant không có
4. ✅ Lưu `costPrice` vào `order_items`

**Code location:** Line 105-157

**Performance:**
- ✅ Batch fetch products (không fetch từng product một)
- ✅ Sử dụng Map để O(1) lookup
- ✅ Chỉ fetch products cần thiết (unique productIds)

---

### File 2: `app/api/admin/orders/[id]/items/route.ts`

**Changes:**
1. ✅ Import `products` collection
2. ✅ Fetch product khi thêm item mới
3. ✅ Map `costPrice` từ product/variant
4. ✅ Lưu `costPrice` vào `order_items`

**Code location:** Line 141-154

---

## 📝 COSTPRICE SOURCE LOGIC

### Priority Order (từ cao đến thấp):

1. **Variant `costPrice`** (nếu có `variationId` và variant có `costPrice`)
2. **Product `costPrice`** (nếu variant không có hoặc không có `variationId`)
3. **`undefined`** (nếu product không có `costPrice`)

### Example:

```typescript
// Case 1: Variable product with variant costPrice
product.productDataMetaBox.variations[0].costPrice = 100,000đ
→ costPrice = 100,000đ

// Case 2: Variable product without variant costPrice, but product has costPrice
product.productDataMetaBox.costPrice = 90,000đ
product.productDataMetaBox.variations[0].costPrice = undefined
→ costPrice = 90,000đ (fallback to product)

// Case 3: Simple product
product.productDataMetaBox.costPrice = 80,000đ
→ costPrice = 80,000đ

// Case 4: No costPrice
product.productDataMetaBox.costPrice = undefined
→ costPrice = undefined (OK, will be stored as undefined)
```

---

## ✅ TESTING CHECKLIST

### Test Cases

1. **Simple Product với costPrice:**
   - [ ] Tạo đơn với simple product có `costPrice`
   - [ ] `order_items` có field `costPrice` với giá trị đúng

2. **Variable Product với variant costPrice:**
   - [ ] Tạo đơn với variable product, variant có `costPrice`
   - [ ] `order_items` có field `costPrice` từ variant

3. **Variable Product không có variant costPrice:**
   - [ ] Tạo đơn với variable product, variant không có `costPrice`
   - [ ] `order_items` có field `costPrice` từ product (fallback)

4. **Product không có costPrice:**
   - [ ] Tạo đơn với product không có `costPrice`
   - [ ] `order_items` có field `costPrice = undefined` (OK)

5. **Admin thêm item:**
   - [ ] Admin thêm item mới vào order
   - [ ] Item mới có `costPrice` snapshot

6. **Multiple items trong một đơn:**
   - [ ] Tạo đơn với nhiều items (simple + variable)
   - [ ] Tất cả items đều có `costPrice` snapshot đúng

---

## 📊 REPORTING IMPACT

### Before Fix:
```typescript
// Cannot calculate gross profit
const revenue = orderItem.price * orderItem.quantity;
const cost = ???; // costPrice not available
const grossProfit = revenue - cost; // ❌ Cannot calculate
```

### After Fix:
```typescript
// Can calculate gross profit accurately
const revenue = orderItem.price * orderItem.quantity;
const cost = (orderItem.costPrice || 0) * orderItem.quantity;
const grossProfit = revenue - cost; // ✅ Accurate calculation
const grossProfitMargin = (grossProfit / revenue) * 100; // ✅ Accurate margin
```

---

## 🔄 RELATED FILES

- `app/api/cms/orders/route.ts` - Public order creation API
- `app/api/admin/orders/[id]/items/route.ts` - Admin add/remove/update items API
- `docs/SCHEMA_CONTEXT_ORDERS.md` - Order schema documentation (cần update để include `costPrice`)
- `types/mongodb.ts` - MongoDB type definitions (cần update `MongoOrderItem` interface)

---

## 📝 SCHEMA UPDATE NEEDED

### Order Items Schema (cần update documentation):

```typescript
interface MongoOrderItem {
  _id: ObjectId;
  orderId: string;
  productId: string;
  variationId?: string;
  
  // Snapshot Data (at time of order)
  productName: string;
  productSku?: string;
  productImage?: string;
  price: number;                    // Unit price at time of order
  costPrice?: number;               // ✅ NEW: Unit cost price at time of order (snapshot)
  quantity: number;
  subtotal: number;
  total: number;
  
  // ... other fields
}
```

---

## ✅ KẾT LUẬN

**Fix đã được apply:**
- ✅ `costPrice` được snapshot vào `order_items` khi tạo đơn (Public API)
- ✅ `costPrice` được snapshot khi admin thêm item (Admin API)
- ✅ Hỗ trợ cả simple products và variable products
- ✅ Fallback logic đảm bảo lấy được `costPrice` nếu có
- ✅ Batch fetch để optimize performance
- ✅ Type checking pass

**Status:** ✅ **FIXED** - Sẵn sàng để test và deploy

---

**Lưu ý:** 
- Các đơn hàng cũ (trước khi fix) sẽ không có `costPrice` snapshot. Cần migration script nếu muốn backfill.
- Cần update schema documentation để reflect thay đổi này.

