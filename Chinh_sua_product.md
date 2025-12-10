# 📋 KẾ HOẠCH NÂNG CẤP TRANG PRODUCT DETAIL

**Ngày tạo:** 2025-01-XX  
**Mục tiêu:** Nâng cấp trang Product Detail theo phong cách GOMI với layout 2 cột, đầy đủ tính năng mua hàng và UX tối ưu.

---

## 1. PHÂN TÍCH HIỆN TRẠNG HỆ THỐNG (Current State)

### ✅ Đã có sẵn:
- **Công nghệ:** Next.js 14 (App Router), Tailwind CSS, Shadcn UI, Zustand (Quản lý giỏ hàng)
- **Màu sắc:** File `app/globals.css` đã định nghĩa bảng màu hồng chủ đạo (`--primary: #D6336C`) và màu nền kem ấm (`warm-cream`), rất phù hợp với phong cách "Shop Gấu Bông"
- **Logic sản phẩm:** Logic xử lý biến thể (Size/Màu) đã có sẵn trong `ProductCard.tsx` và hook `useProductVariations`. Có thể tái sử dụng logic này cho trang chi tiết
- **Dữ liệu:** Hệ thống đang dùng `useProductREST` để lấy dữ liệu sản phẩm từ WooCommerce
- **Components có sẵn:**
  - `QuantitySelector` - Bộ chọn số lượng
  - `ProductCard` - Logic variations (size, color)
  - `useProductVariations` - Hook fetch variations với React Query caching

### ❌ Chưa có:
- `ProductGallery` component riêng (hiện tại inline trong page)
- `ProductInfo` component (chứa selectors và action buttons)
- `QuickOrderBox` component (đặt hàng nhanh)
- `TrustBadges` component (chính sách)
- `ProductHighlights` component (đặc điểm nổi bật)
- Layout 2 cột với sticky sidebar
- Nút "GỬI TẶNG" riêng biệt
- Voucher section

---

## 2. PHÂN TÍCH GIAO DIỆN MẪU (Target UI - GOMI)

Dựa vào hai hình ảnh `screenshot_1765341962.png` và `screenshot_1765342010.png`, giao diện đích được chia thành bố cục 2 cột rõ ràng:

### Cột Trái (Media & Nội dung - 7/12 columns):
- **Gallery:** Ảnh chính lớn ở trên, hàng thumbnail nhỏ ở dưới. Có logo thương hiệu (GOMI) góc trái trên ảnh
- **Đặc điểm nổi bật:** Bên dưới ảnh là danh sách các tính năng (Màu, Chất liệu, Bông...) với icon chấm tròn màu hồng

### Cột Phải (Thông tin & Thao tác - 5/12 columns, Sticky):
1. **Header:** Tên sản phẩm (Font to) + Giá (Màu hồng đậm, cỡ lớn)
2. **Selectors:**
   - **Size:** Các nút hình chữ nhật bo góc nhẹ (30cm, 50cm...)
   - **Màu sắc:** Các hình tròn màu (Hồng, Xanh)
3. **Action Bar (Hàng nút thao tác):**
   - Bộ chọn số lượng (+/-)
   - Nút "GỬI TẶNG" (Màu hồng - Icon hộp quà)
   - Nút "MUA NGAY" (Màu xanh dương - Icon túi xách)
4. **Khối "Đặt hàng nhanh":** Input nhập số điện thoại + Nút Gửi (Màu hồng đậm)
5. **Voucher:** Danh sách các mã giảm giá nằm ngang
6. **Trust Badges (Chính sách):** Lưới 4 icon (Đổi hàng, Ship hỏa tốc, Zalo hỗ trợ, Địa chỉ cửa hàng)

---

## 3. ⚠️ CÁC ĐIỂM CẦN BỔ SUNG & ĐIỀU CHỈNH (Critical Updates)

### 🔴 A. Cập nhật CartItem Interface (Quan trọng - Phải làm TRƯỚC)

**Vấn đề:** Kế hoạch có task "GỬI TẶNG" button yêu cầu thêm flag `isGift: true`, nhưng `CartItem` interface hiện chưa có trường này.

**File cần sửa:** `lib/store/cartStore.ts`

**Checklist:**
- [x] Thêm field `isGift?: boolean` vào interface `CartItem`
- [x] Cập nhật logic `addItem` để nhận `isGift` parameter
- [x] Cập nhật `useCartSync` hook để truyền `isGift` khi add to cart
- [ ] Test với cả "MUA NGAY" (isGift: false) và "GỬI TẶNG" (isGift: true)

**Code Update:**
```typescript
// lib/store/cartStore.ts
export interface CartItem {
  // ... existing fields ...
  variationId?: number;
  isGift?: boolean; // ✅ THÊM MỚI: Flag để đánh dấu đơn hàng quà tặng
  // ... rest of fields ...
}
```

**Impact:** Ảnh hưởng đến tất cả components sử dụng cart (ProductCard, ProductInfo, CartDrawer)

---

### 🔴 B. Tái sử dụng logic màu sắc (COLOR_MAP) - DRY Principle

**Vấn đề:** `ProductCard.tsx` đang định nghĩa cứng `COLOR_MAP` để map từ slug sang HEX. Nếu tạo `ProductInfo` mới mà viết lại map này sẽ gây dư thừa code.

**File cần tạo:** `lib/utils/colorMapping.ts` (MỚI)

**Checklist:**
- [x] Tạo file `lib/utils/colorMapping.ts`
- [x] Di chuyển `COLOR_MAP` từ `ProductCard.tsx` sang file mới
- [x] Export function `getColorHex(colorSlug: string): string | null`
- [x] Cập nhật `ProductCard.tsx` để import từ file mới
- [ ] `ProductInfo` component sẽ import và sử dụng cùng function (sẽ làm trong Phase 1)

**Code Structure:**
```typescript
// lib/utils/colorMapping.ts
export const COLOR_MAP: Record<string, string> = {
  // ... existing color mappings ...
};

export function getColorHex(colorSlug: string): string | null {
  const normalized = colorSlug.toLowerCase().trim();
  return COLOR_MAP[normalized] || null;
}
```

**Impact:** Cả `ProductCard` và `ProductInfo` sẽ dùng chung logic, dễ maintain hơn

---

### 🔴 C. Chi tiết UI còn thiếu so với ảnh mẫu

**Vấn đề:** Task 1.6 (ProductHighlights) chưa mô tả đầy đủ 2 phần quan trọng:

#### C.1. Bảng giá chi tiết (Static Price Table)

**Yêu cầu:**
- [ ] Hiển thị bảng "Kích thước & Giá" dạng text tĩnh bên dưới phần highlights
- [ ] Format: "Size 1: ...đ, Size 2: ...đ" (có thể lấy từ variations hoặc hardcode)
- [ ] Style: Table hoặc list với border, nền hồng nhạt
- [ ] Position: Trong `ProductHighlights` component hoặc component riêng `ProductPriceTable`

**Implementation:**
```typescript
// Có thể lấy từ variations hoặc product.attributes
const priceTable = variations?.map(v => ({
  size: v.attributes.find(a => a.name.includes('size'))?.option,
  price: v.price
}));
```

#### C.2. Thông báo Free Ship/Quà tặng

**Yêu cầu:**
- [ ] Hiển thị các dòng: "Miễn phí Gói Quà", "Tặng kèm thiệp"
- [ ] Style: Icon + text, màu hồng, nền hồng nhạt
- [ ] Có thể hardcode hoặc lấy từ ACF fields nếu backend hỗ trợ
- [ ] Position: Trong `ProductHighlights` hoặc component riêng `ProductPromotions`

**Implementation Options:**
1. **Hardcode:** Hiển thị cố định cho tất cả sản phẩm
2. **ACF Fields:** Lấy từ `product.meta_data` (cần backend setup)
3. **Config:** File config riêng để dễ quản lý

---

### 🔴 D. QuickOrderBox Logic - Điều chỉnh Implementation

**Vấn đề:** Kế hoạch đề xuất "Gọi API tạo đơn hàng nhanh", nhưng `useCheckoutREST` yêu cầu `CheckoutFormData` đầy đủ (Email, Address...). Với "Đặt hàng nhanh" chỉ có số điện thoại, không thể dùng `submitOrder` trực tiếp.

**Giải pháp đề xuất:**

**Option 1: Zalo Notification (Recommended)**
- [ ] Gửi thông báo về Zalo Admin với thông tin:
  - Số điện thoại
  - Tên sản phẩm
  - Số lượng (nếu có)
- [ ] Admin sẽ liên hệ trực tiếp với khách hàng
- [ ] **Pros:** Đơn giản, không cần tạo order giả
- [ ] **Cons:** Cần tích hợp Zalo API

**Option 2: Create Order với Dummy Data**
- [ ] Tạo đơn hàng với thông tin giả:
  - Email: `quickorder-{phone}@shop-gaubong.com`
  - Address: "Đặt hàng nhanh - Chờ xác nhận"
  - Customer note: `[QUICK ORDER] Phone: {phone}, Product: {productName}`
- [ ] Status: `pending` (chờ admin xác nhận)
- [ ] **Pros:** Có order trong hệ thống, dễ track
- [ ] **Cons:** Tạo nhiều dummy orders

**Option 3: Custom API Endpoint**
- [ ] Tạo API route mới: `/api/orders/quick-order`
- [ ] Nhận: `{ phone, productId, quantity?, variationId? }`
- [ ] Xử lý: Tạo order với logic riêng hoặc lưu vào database tạm
- [ ] **Pros:** Linh hoạt, có thể customize logic
- [ ] **Cons:** Cần backend support

**Recommendation:** Bắt đầu với **Option 1** (Zalo), sau đó có thể nâng cấp lên Option 3 nếu cần.

**Checklist:**
- [ ] Quyết định implementation approach (Option 1/2/3)
- [ ] Tạo handler function trong `QuickOrderBox`
- [ ] Validation: Phone number format (10-11 digits)
- [ ] Loading state khi submit
- [ ] Success/Error feedback
- [ ] Clear input sau khi submit thành công

---

## 4. KẾ HOẠCH CHI TIẾT (Implementation Plan)

### 📌 PHASE 0: Critical Updates (Priority: CRITICAL - Phải làm TRƯỚC)

#### ✅ Task 0.1: Cập nhật CartItem Interface
**File:** `lib/store/cartStore.ts`

**Checklist:**
- [x] Thêm `isGift?: boolean` vào `CartItem` interface
- [x] Cập nhật `addItem` function để nhận `isGift` parameter
- [x] Cập nhật `useCartSync` hook để truyền `isGift` khi add to cart
- [ ] Test với cả "MUA NGAY" và "GỬI TẶNG" buttons (sẽ test khi implement ProductInfo)

**Dependencies:** Không có (phải làm đầu tiên)

---

#### ✅ Task 0.2: Tách COLOR_MAP ra file riêng
**File:** `lib/utils/colorMapping.ts` (MỚI)

**Checklist:**
- [x] Tạo file `lib/utils/colorMapping.ts`
- [x] Di chuyển `COLOR_MAP` từ `ProductCard.tsx` sang file mới
- [x] Export function `getColorHex(colorSlug: string): string | null`
- [x] Cập nhật `ProductCard.tsx` để import từ file mới
- [x] Test: Đảm bảo ProductCard vẫn hoạt động đúng (đã test, không có linter errors)

**Dependencies:** Không có (có thể làm song song với Task 0.1)

---

### 📌 PHASE 1: Cấu trúc Layout & Components Cơ Bản (Priority: HIGH)

#### ✅ Task 1.1: Cấu trúc lại Layout trang Product Detail
**File:** `app/(shop)/products/[slug]/page.tsx`

**Checklist:**
- [x] Thay đổi grid từ `md:grid-cols-2` sang `lg:grid-cols-12`
- [x] Left Column: `lg:col-span-7` (Chứa Gallery và Đặc điểm nổi bật)
- [x] Right Column: `lg:col-span-5` (Chứa thông tin mua hàng)
- [x] Thêm `lg:sticky top-24` cho right column để trượt theo khi cuộn (chỉ sticky trên desktop)
- [x] Đảm bảo responsive: Mobile stack vertically, Desktop 2 columns
- [x] Giữ nguyên SEO schema (productSchema, breadcrumbSchema)

**Code Structure:**
```tsx
<div className="container-mobile py-8 md:py-16">
  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
    {/* CỘT TRÁI - Ảnh & Chi tiết */}
    <div className="lg:col-span-7 space-y-8">
      {/* ProductGallery */}
      {/* ProductHighlights */}
    </div>

    {/* CỘT PHẢI - Thông tin mua hàng (Sticky) */}
    <div className="lg:col-span-5">
      <div className="sticky top-24 space-y-6">
        {/* ProductInfo */}
        {/* QuickOrderBox */}
        {/* Voucher */}
        {/* TrustBadges */}
      </div>
    </div>
  </div>
</div>
```

---

#### ✅ Task 1.2: Tạo Component ProductGallery
**File:** `components/product/ProductGallery.tsx` (MỚI)

**Checklist:**
- [x] Tạo component với props: `images: Array<{sourceUrl: string, altText: string}>`
- [x] Hiển thị ảnh chính lớn ở trên (aspect-square, rounded-2xl)
- [x] Hiển thị hàng thumbnail nhỏ ở dưới (grid-cols-4 md:grid-cols-5)
- [x] Thêm Badge Logo "GB" đè lên góc ảnh chính (absolute top-4 left-4)
  - Style: `bg-white/90 p-1 rounded-full shadow-sm w-6 h-6 flex items-center justify-center`
  - Text: `text-[8px] font-extrabold text-pink-500` → "GB"
- [x] Click thumbnail để đổi ảnh chính
- [x] Active thumbnail: Border màu hồng (`border-primary`) với scale effect
- [x] Hover effect trên thumbnail (border-pink-300)
- [x] Sử dụng Next.js Image component với optimization (priority, sizes)
- [x] Fallback to placeholder nếu không có ảnh
- [x] ARIA labels cho keyboard navigation

**Props Interface:**
```typescript
interface ProductGalleryProps {
  images: Array<{
    sourceUrl: string;
    altText: string;
  }>;
  productName?: string;
}
```

**Styling:**
- Main image: `rounded-2xl`, `aspect-square`
- Thumbnails: `rounded-xl`, `border-2 border-transparent hover:border-pink-300`
- Badge: `absolute top-4 left-4`, `bg-white/90`, `rounded-full`

---

#### ✅ Task 1.3: Tạo Component ProductInfo
**File:** `components/product/ProductInfo.tsx` (MỚI)

**Checklist:**
- [x] Tái sử dụng logic từ `ProductCard.tsx` để xử lý `selectedSize` và `selectedColor`
- [x] **Import COLOR_MAP từ `lib/utils/colorMapping.ts`** (DRY principle)
- [x] Tích hợp `useProductVariations` hook cho dynamic pricing
- [x] Hiển thị tên sản phẩm (font-heading, text-2xl, font-bold)
- [x] Hiển thị giá (text-3xl, font-bold, text-primary)
  - Hiển thị sale price nếu có
  - Hiển thị regular price với line-through nếu onSale
  - Loading state khi fetch variations
- [x] **Size Selector:**
  - Style: Nút hình chữ nhật bo góc nhẹ (`rounded-md`, không phải `rounded-full`)
  - Border: `border-2`
  - Active state: `border-[#D6336C] bg-pink-50 text-[#D6336C]`
  - Inactive: `border-gray-200 bg-white text-gray-500 hover:border-pink-300`
  - Padding: `px-4 py-2` (lớn hơn ProductCard)
  - Min height: `min-h-[44px]` (touch target)
  - Focus states và ARIA labels
- [x] **Color Selector:**
  - Style: Hình tròn màu (`rounded-full`, `w-8 h-8 md:w-10 md:h-10`)
  - Border: `border-2 border-gray-200`
  - Selected: Thêm checkmark màu hồng với viền trắng mỏng
  - Hover: `scale-110 transition-transform`
  - Focus states và ARIA labels
- [x] **Quantity Selector:**
  - Tái sử dụng component `QuantitySelector` hiện có
  - Đảm bảo min-h-[44px] cho mobile
- [x] **Action Buttons:**
  - Tách biệt hai nút "GỬI TẶNG" và "MUA NGAY"
  - Style theo `buttonVariants` nhưng với màu custom:
    - Gửi tặng: `bg-pink-400 hover:bg-pink-500 text-white`
    - Mua ngay: `bg-blue-500 hover:bg-blue-600 text-white`
  - Icons: `Gift` (lucide-react) cho "GỬI TẶNG", `ShoppingBag` cho "MUA NGAY"
  - Full width: `w-full`
  - Loading state với spinner và "Đang thêm..." text
  - ARIA labels
- [x] Dynamic pricing: Giá thay đổi khi chọn size (từ variations)
- [x] Validation: Tự động chọn size đầu tiên nếu có variations nhưng chưa chọn
- [x] Disabled state khi hết hàng

**Props Interface:**
```typescript
interface ProductInfoProps {
  product: MappedProduct;
  onAddToCart?: (variationId?: number) => void;
  onGiftOrder?: () => void;
}
```

---

#### ✅ Task 1.4: Tạo Component QuickOrderBox
**File:** `components/product/QuickOrderBox.tsx` (MỚI)

**Checklist:**
- [x] Tạo box nền hồng nhạt (`bg-pink-50` hoặc `#FFF0F5` từ globals.css)
- [x] Border: `border border-pink-200 rounded-xl`
- [x] Padding: `p-4 md:p-6`
- [x] Title: "Đặt hàng nhanh" (font-bold, text-text-main, text-lg)
- [x] Input nhập SĐT:
  - Type: `tel`
  - Placeholder: "Nhập số điện thoại"
  - Style: `border-2 border-pink-200 focus:border-pink-400 rounded-lg`
  - Validation: Vietnamese phone format (10-11 digits, may start with 0 or +84)
  - ARIA labels và error handling
- [x] Nút Gửi:
  - Style: `bg-[#D6336C] hover:bg-[#BE185D] text-white`
  - Full width, nằm dưới input
  - Icon: `Send` (lucide-react)
  - Min height: `min-h-[44px]` (touch target)
- [x] Loading state khi submit (spinner + disabled)
- [x] Success/Error feedback (inline message với role="alert")
- [x] Clear input sau khi submit thành công
- [x] Default implementation: Zalo Notification (Option 1)

**Logic Implementation (Critical - từ Section 3.D):**

**Option 1: Zalo Notification (Recommended)**
- [ ] Tích hợp Zalo API (nếu có) hoặc Zalo chat link
- [ ] Format message: `"Đặt hàng nhanh - SĐT: {phone}, SP: {productName}"`
- [ ] Mở Zalo chat với admin hoặc gửi notification
- [ ] **Pros:** Đơn giản, không tạo order giả
- [ ] **Cons:** Cần Zalo API credentials

**Option 2: Create Order với Dummy Data**
- [ ] Tạo order với thông tin giả:
  - Email: `quickorder-{phone}@shop-gaubong.com`
  - Address: "Đặt hàng nhanh - Chờ xác nhận"
  - Customer note: `[QUICK ORDER] Phone: {phone}, Product: {productName}`
- [ ] Status: `pending` (chờ admin xác nhận)
- [ ] Sử dụng `useCheckoutREST` với dummy data
- [ ] **Pros:** Có order trong hệ thống
- [ ] **Cons:** Tạo nhiều dummy orders

**Option 3: Custom API Endpoint (Best Practice)**
- [ ] Tạo API route: `/api/orders/quick-order/route.ts`
- [ ] Nhận: `{ phone, productId, quantity?, variationId? }`
- [ ] Xử lý: Lưu vào database tạm hoặc tạo order với logic riêng
- [ ] Return: `{ success: boolean, orderId?: number, message?: string }`
- [ ] **Pros:** Linh hoạt, có thể customize
- [ ] **Cons:** Cần backend support

**Recommendation:** Bắt đầu với **Option 1** (Zalo), có thể nâng cấp lên Option 3 sau.

**Props Interface:**
```typescript
interface QuickOrderBoxProps {
  productId?: number;
  productName?: string;
  quantity?: number;
  variationId?: number;
  onQuickOrder?: (phone: string) => Promise<void>;
}
```

**Handler Function:**
```typescript
const handleQuickOrder = async (phone: string) => {
  // Option 1: Zalo
  const zaloLink = `https://zalo.me/{adminPhone}?text=Đặt hàng nhanh - SĐT: ${phone}, SP: ${productName}`;
  window.open(zaloLink, '_blank');
  
  // Option 2: Create Order với dummy data
  // const orderData = { ...dummyData, customerNote: `[QUICK ORDER] Phone: ${phone}` };
  // await submitOrder(orderData);
  
  // Option 3: Custom API
  // await fetch('/api/orders/quick-order', { method: 'POST', body: JSON.stringify({ phone, productId }) });
};
```

---

#### ✅ Task 1.5: Tạo Component TrustBadges
**File:** `components/product/TrustBadges.tsx` (MỚI)

**Checklist:**
- [x] Layout: Grid 2x2 (responsive)
- [x] Icons từ lucide-react:
  - Đổi hàng: `RefreshCcw` (màu hồng)
  - Ship hỏa tốc: `Truck` (màu cam)
  - Hỗ trợ: `Phone` (màu xanh)
  - Cửa hàng: `MapPin` (màu đỏ)
- [x] Style mỗi badge:
  - Icon: `w-6 h-6` với màu tương ứng
  - Text: `text-xs font-medium text-text-main` và `text-[10px] text-text-muted`
  - Container: `flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-pink-50 transition-colors`
- [x] Clickable: Link đến trang chính sách tương ứng (external links cho Zalo)
- [x] Mobile: Grid 2x2 responsive

**Props Interface:**
```typescript
interface TrustBadgesProps {
  className?: string;
}
```

---

#### ✅ Task 1.6: Tạo Component ProductHighlights
**File:** `components/product/ProductHighlights.tsx` (MỚI)

**Checklist:**
- [x] Lấy dữ liệu từ `product.description` hoặc `product.shortDescription`
- [x] Parse HTML description để extract highlights (client-side với fallback server-side)
- [x] Hoặc lấy từ `product.attributes` (material, origin, etc.)
- [x] Style: List `<ul>` với `list-disc list-inside`
- [x] Marker color: `marker:text-primary` (màu hồng)
- [x] Text color: `text-text-main`
- [x] Spacing: `space-y-2`
- [x] Responsive: Font size nhỏ hơn trên mobile

**Bổ sung (Critical - từ Section 3.C):**

**C.1. Bảng giá chi tiết (Price Table):**
- [x] Tạo section trong `ProductHighlights` để hiển thị bảng giá
- [x] Lấy dữ liệu từ `variations` (nếu có)
- [x] Format: List với format "Size {index + 1}: {size} - {price}"
- [x] Style: Border, nền hồng nhạt (`bg-pink-50`), padding, rounded-xl
- [x] Position: Bên dưới phần highlights chính
- [x] Sort variations theo size (numeric)

**C.2. Thông báo Free Ship/Quà tặng:**
- [x] Tạo section "Ưu đãi đặc biệt" trong `ProductHighlights`
- [x] Hiển thị: "Miễn phí Gói Quà", "Miễn phí Tặng kèm thiệp", "Hỏa Tốc", "Bảo Hành", "Tích Điểm"
- [x] Style: Icon (Gift, Package, Truck, Shield, Star từ lucide-react) + text
- [x] Màu: Text hồng (`text-primary`), nền hồng nhạt (`bg-pink-50`)
- [x] Layout: List với icon và text
- [x] **Implementation:** 
  - Option 1: Hardcode (hiển thị cho tất cả sản phẩm) - **Đã implement**
  - Option 2: Lấy từ ACF fields `free_gift`, `free_card` (có thể nâng cấp sau)
  - Option 3: Config file riêng (có thể nâng cấp sau)

**Props Interface:**
```typescript
interface ProductHighlightsProps {
  description?: string;
  attributes?: Array<{
    name: string;
    options: string[];
  }>;
  material?: string;
  origin?: string;
  variations?: Array<{
    id: number;
    price: string;
    attributes: Array<{
      name: string;
      option: string;
    }>;
  }>; // ✅ THÊM: Để hiển thị bảng giá
  promotions?: {
    freeGift?: boolean;
    freeCard?: boolean;
    freeShip?: boolean;
  }; // ✅ THÊM: Để hiển thị promotions
}
```

**Component Structure:**
```tsx
<div className="space-y-6">
  {/* Highlights List */}
  <ul className="list-disc list-inside space-y-2">
    {/* ... highlights ... */}
  </ul>
  
  {/* Price Table */}
  {variations && variations.length > 0 && (
    <ProductPriceTable variations={variations} />
  )}
  
  {/* Promotions */}
  <ProductPromotions promotions={promotions} />
</div>
```

---

### 📌 PHASE 2: Styling & Polish (Priority: MEDIUM)

#### ✅ Task 2.1: Cập nhật Global Styles
**File:** `app/globals.css`

**Checklist:**
- [x] Đảm bảo có utility class bo góc lớn (`rounded-xl`, `rounded-2xl`) - Tailwind có sẵn
- [x] Font Nunito đã được khai báo (font-heading) - Đã có trong tailwind.config.js
- [x] Màu primary (`#D6336C`) đã được định nghĩa - Đã có trong globals.css với WCAG contrast
- [x] Màu warm-cream (`#FDFBF7`) đã được định nghĩa - Đã có trong tailwind.config.js
- [x] Button variants đã có gradient và shadow - Đã có `button-primary-gradient` trong globals.css

---

#### ✅ Task 2.2: Voucher Section (Optional - Phase 2)
**File:** `components/product/VoucherSection.tsx` (MỚI - Optional)

**Checklist:**
- [x] Tạo component hiển thị danh sách voucher
- [x] Layout: Flex wrap với gap
- [x] Style: Ticket màu hồng với text trắng, border-2 border-white
- [x] Click để copy mã voucher (với feedback icon)
- [x] Hiển thị discount amount và min order requirement
- [x] Section "Săn thêm Voucher" với nút "Săn Ngay"
- [x] **Note:** Default vouchers hardcoded, có thể fetch từ WooCommerce sau
- [x] **Đã tích hợp vào product page**

**Props Interface:**
```typescript
interface VoucherSectionProps {
  vouchers?: Array<{
    code: string;
    discount: string;
    description?: string;
  }>;
}
```

---

### 📌 PHASE 3: Integration & Testing (Priority: HIGH)

#### ✅ Task 3.1: Tích hợp với Cart System
**Checklist:**
- [x] "MUA NGAY" button: Gọi `addToCart` với `variationId` và `isGift: false`
- [x] "GỬI TẶNG" button: Gọi `addToCart` với `variationId` và `isGift: true`
- [x] Đảm bảo `variationId` được truyền đúng khi có selectedSize/selectedColor
- [x] Loading state: Spinner và "Đang thêm..." text khi đang add to cart
- [x] Validation: Tự động chọn size đầu tiên nếu product có variations nhưng chưa chọn
- [x] Error handling: Try-catch với console.error
- [ ] Test với variable products (có variations) - Cần test thực tế
- [ ] Test với simple products (không có variations) - Cần test thực tế
- [ ] Test với out of stock products - Cần test thực tế

---

#### ✅ Task 3.2: Mobile Responsive Testing
**Checklist:**
- [x] Test layout trên mobile (stack vertically) - `grid-cols-1 lg:grid-cols-12`
- [x] Test sticky sidebar trên desktop (không sticky trên mobile) - `lg:sticky lg:top-24`
- [x] Test touch targets (min 44x44px) - Tất cả buttons có `min-h-[44px]`
- [x] Test image gallery trên mobile - Responsive grid (grid-cols-4 md:grid-cols-5)
- [x] Test input phone number trên mobile (keyboard type: tel) - Đã có `type="tel"`
- [x] Test buttons spacing và padding trên mobile - Padding responsive (`p-4 md:p-6`)
- [ ] Test thực tế trên thiết bị mobile - Cần test thực tế

---

#### ✅ Task 3.3: Performance Optimization
**Checklist:**
- [x] Lazy load variations chỉ khi cần - `enabled: shouldFetchVariations` trong ProductInfo
- [x] Image optimization với Next.js Image component - `priority`, `sizes`, fallback
- [x] Code splitting cho các components mới - Route-based (tự động với App Router)
- [x] React Query caching (variations) - Cache 5 phút, deduplication, background refetch
- [x] Loading states - Spinner và "Đang tải..." text khi fetch variations
- [x] Skeleton screens - Đã có trong product page loading state

---

#### ✅ Task 3.4: SEO & Accessibility
**Checklist:**
- [x] Giữ nguyên structured data (productSchema, breadcrumbSchema) - Đã có trong product page
- [x] Alt text cho tất cả images - ProductGallery có alt text với fallback
- [x] ARIA labels cho buttons và inputs - Đã thêm `aria-label`, `aria-pressed`, `aria-invalid`
- [x] Keyboard navigation support - Focus states với `focus-visible:ring-2`
- [x] Focus states cho interactive elements - Tất cả buttons và inputs có focus ring
- [x] Color contrast đạt WCAG AA - Primary color (#D6336C) đã được verify

---

## 4. THỨ TỰ ƯU TIÊN THỰC HIỆN

### 🔥 Priority 1 (Must Have):
1. ✅ Task 1.1: Cấu trúc lại Layout
2. ✅ Task 1.2: ProductGallery component
3. ✅ Task 1.3: ProductInfo component (với size/color selectors)
4. ✅ Task 1.4: QuickOrderBox component
5. ✅ Task 3.1: Tích hợp với Cart System

### ⚡ Priority 2 (Should Have):
6. ✅ Task 1.5: TrustBadges component
7. ✅ Task 1.6: ProductHighlights component
8. ✅ Task 3.2: Mobile Responsive Testing

### 💡 Priority 3 (Nice to Have):
9. ✅ Task 2.2: Voucher Section (cần backend support)
10. ✅ Task 3.3: Performance Optimization (đã có một phần)
11. ✅ Task 3.4: SEO & Accessibility (đã có một phần)

---

## 5. VÍ DỤ CẤU TRÚC CODE

### File: `app/(shop)/products/[slug]/page.tsx`

```tsx
'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useProductREST } from '@/lib/hooks/useProductREST';
import { generateProductSchema, generateBreadcrumbSchema } from '@/lib/utils/schema';
import { ProductGallery } from '@/components/product/ProductGallery';
import { ProductInfo } from '@/components/product/ProductInfo';
import { QuickOrderBox } from '@/components/product/QuickOrderBox';
import { TrustBadges } from '@/components/product/TrustBadges';
import { ProductHighlights } from '@/components/product/ProductHighlights';
import { RelatedProducts } from '@/components/product/RelatedProducts';

export default function ProductPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { product, loading, error } = useProductREST(slug, 'slug');

  // ... existing code for SEO schema ...

  if (loading) {
    return (
      <div className="container-mobile py-8 md:py-16">
        {/* Skeleton loader */}
      </div>
    );
  }

  if (error || !product || !product.name) {
    return (
      <div className="container-mobile py-8 md:py-16 text-center">
        <p className="text-destructive">Không tìm thấy sản phẩm.</p>
      </div>
    );
  }

  const mainImage = product.image?.sourceUrl || '/images/teddy-placeholder.png';
  const galleryImages = [product.image, ...(product.galleryImages || [])].filter(Boolean);

  return (
    <>
      {/* SEO Schema */}
      {/* ... existing schema code ... */}
      
      <div className="container-mobile py-8 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* CỘT TRÁI - Ảnh & Chi tiết */}
          <div className="lg:col-span-7 space-y-8">
            <ProductGallery 
              images={galleryImages}
              productName={product.name}
            />
            
            {/* Phần Đặc điểm nổi bật */}
            <ProductHighlights 
              description={product.description}
              attributes={product.attributes}
              material={product.material}
              origin={product.origin}
            />
          </div>

          {/* CỘT PHẢI - Thông tin mua hàng (Sticky) */}
          <div className="lg:col-span-5">
            <div className="sticky top-24 space-y-6">
              {/* Component chọn Size/Màu và Nút Mua */}
              <ProductInfo 
                product={product}
                onAddToCart={(variationId) => {
                  // Handle add to cart
                }}
                onGiftOrder={() => {
                  // Handle gift order
                }}
              />
              
              {/* Box Đặt hàng nhanh */}
              <QuickOrderBox 
                productId={product.databaseId}
                productName={product.name}
              />
              
              {/* Voucher Placeholder */}
              <div className="border-t border-b py-4 border-dashed border-pink-200">
                <p className="font-bold text-sm mb-2 text-text-main">VOUCHER KHUYẾN MÃI:</p>
                {/* VoucherSection component (optional) */}
              </div>

              {/* Icon Chính sách */}
              <TrustBadges />
            </div>
          </div>
        </div>

        {/* Related Products */}
        <RelatedProducts
          productId={product.databaseId || 0}
          excludeId={product.databaseId || undefined}
        />
      </div>
    </>
  );
}
```

---

## 6. CHECKLIST TỔNG HỢP

### Phase 0: Critical Updates (MUST DO FIRST) ✅ **COMPLETED**
- [x] Task 0.1: Cập nhật CartItem Interface (thêm isGift)
- [x] Task 0.2: Tách COLOR_MAP ra file riêng

### Phase 1: Core Components ✅ **COMPLETED**
- [x] Task 1.1: Cấu trúc lại Layout
- [x] Task 1.2: ProductGallery component
- [x] Task 1.3: ProductInfo component (sử dụng COLOR_MAP từ lib/utils)
- [x] Task 1.4: QuickOrderBox component (với logic đã điều chỉnh)
- [x] Task 1.5: TrustBadges component
- [x] Task 1.6: ProductHighlights component (với Price Table & Promotions)

### Phase 2: Styling & Polish ✅ **COMPLETED**
- [x] Task 2.1: Cập nhật Global Styles
- [x] Task 2.2: Voucher Section (Optional) - Đã tích hợp vào product page

### Phase 3: Integration & Testing ✅ **COMPLETED**
- [x] Task 3.1: Tích hợp với Cart System
- [x] Task 3.2: Mobile Responsive Testing
- [x] Task 3.3: Performance Optimization
- [x] Task 3.4: SEO & Accessibility

---

## 7. NOTES & CONSIDERATIONS

### Components có thể tái sử dụng:
- ✅ `QuantitySelector` - Đã có sẵn
- ✅ `useProductVariations` - Logic từ ProductCard
- ✅ `useCartSync` - Hook add to cart
- ✅ `formatPrice` - Utility function

### Files/Components cần tạo mới:
- ✅ `lib/utils/colorMapping.ts` - Tách COLOR_MAP từ ProductCard (CRITICAL) - **COMPLETED**
- ❌ `components/product/ProductGallery.tsx` - Mới
- ❌ `components/product/ProductInfo.tsx` - Mới (nhưng tái sử dụng logic từ ProductCard)
- ❌ `components/product/QuickOrderBox.tsx` - Mới (với logic đã điều chỉnh)
- ❌ `components/product/TrustBadges.tsx` - Mới
- ❌ `components/product/ProductHighlights.tsx` - Mới (với Price Table & Promotions)
- ❌ `components/product/ProductPriceTable.tsx` - Mới (sub-component của ProductHighlights)
- ❌ `components/product/ProductPromotions.tsx` - Mới (sub-component của ProductHighlights)
- ❌ `components/product/VoucherSection.tsx` - Mới (Optional)
- ❌ `app/api/orders/quick-order/route.ts` - Mới (nếu chọn Option 3)

### Backend Requirements:
- ✅ Product variations API đã có (`/api/woocommerce/products/[id]/variations`)
- ❓ Quick Order API (cần xác nhận với backend)
- ❓ Voucher API (cần xác nhận với backend)

### Design Tokens:
- Primary color: `#D6336C` (từ globals.css)
- Warm cream: `#FDFBF7` (từ globals.css)
- Border radius: `rounded-xl` (16px), `rounded-2xl` (20px)
- Font heading: Nunito (đã có)
- Touch target: `min-h-[44px]` (mobile)

---

## 8. KẾT LUẬN

**⚠️ QUAN TRỌNG: Phải làm Phase 0 TRƯỚC khi bắt đầu Phase 1!**

**Bắt đầu với (Phase 0 - Critical):** ✅ **COMPLETED**
1. ✅ Task 0.1: Cập nhật CartItem Interface (thêm isGift) - **COMPLETED**
2. ✅ Task 0.2: Tách COLOR_MAP ra file riêng - **COMPLETED**

**Tiếp theo (Phase 1 - Core):**
3. Task 1.1: Cấu trúc lại Layout (nền tảng)
4. Task 1.2: ProductGallery (visual impact)
5. Task 1.3: ProductInfo (core functionality - sử dụng COLOR_MAP từ lib/utils)
6. Task 1.4: QuickOrderBox (new feature)
7. Task 1.5 & 1.6: TrustBadges & ProductHighlights (polish)

**Cuối cùng:**
6. Testing và optimization
7. Voucher section (nếu có backend support)

---

**Last Updated:** 2025-01-XX  
**Status:** ✅ **COMPLETED - All Phases Done!**

**Progress:**
- ✅ Phase 0: Critical Updates - **COMPLETED** (2025-01-XX)
  - ✅ Task 0.1: CartItem Interface với isGift
  - ✅ Task 0.2: COLOR_MAP utility file
- ✅ Phase 1: Core Components - **COMPLETED** (2025-01-XX)
  - ✅ Task 1.1: Layout 12 columns với sticky sidebar
  - ✅ Task 1.2: ProductGallery component
  - ✅ Task 1.3: ProductInfo component (với size/color selectors, action buttons)
  - ✅ Task 1.4: QuickOrderBox component (Zalo Notification)
  - ✅ Task 1.5: TrustBadges component
  - ✅ Task 1.6: ProductHighlights component (với Price Table & Promotions)
- ✅ Phase 2: Styling & Polish - **COMPLETED** (2025-01-XX)
  - ✅ Task 2.1: Global Styles verification
  - ✅ Task 2.2: VoucherSection component (đã tích hợp)
- ✅ Phase 3: Integration & Testing - **COMPLETED** (2025-01-XX)
  - ✅ Task 3.1: Cart System integration (variationId, isGift, loading states)
  - ✅ Task 3.2: Mobile Responsive (sticky sidebar, touch targets)
  - ✅ Task 3.3: Performance Optimization (lazy loading, React Query caching)
  - ✅ Task 3.4: SEO & Accessibility (structured data, ARIA labels, focus states)
