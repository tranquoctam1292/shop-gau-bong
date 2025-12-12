# Review: SEO Meta Box Implementation

**Ngày review:** 2025-01-XX  
**File spec:** `seo_meta_box.md`  
**Component:** `components/admin/products/SEOMetaBox.tsx`

---

## ✅ ĐÃ HOÀN THÀNH

| # | Tính năng | Mô tả | Status | Notes |
|---|-----------|-------|--------|-------|
| 1.1 | Product Snippet Preview | Giả lập Google Rich Result với breadcrumb, title, rating, price, stock, description | ✅ | Đã implement đầy đủ |
| 1.2 | Length Progress Bar | Thanh tiến trình màu cho SEO Title (~580px) và Meta Description (160 chars) | ✅ | Đã implement với color coding |
| 2.1 | Focus Keyword | Input với auto-suggest từ tên sản phẩm | ✅ | Đã implement |
| 2.2 | SEO Title Template | Hỗ trợ %title%, %price%, %sku%, %category%, %brand%, %sitename% | ✅ | Đã implement đầy đủ |
| 2.3 | Slug/URL | Tự động convert từ tên sản phẩm | ✅ | Thiếu validation real-time |
| 2.4 | Meta Description Fallback | Tự động lấy từ mô tả ngắn hoặc mô tả chi tiết | ✅ | Đã implement |
| 3.1 | SEO Analysis Checklist | Checklist với status icons | ✅ | Thiếu 2 items (xem bên dưới) |
| 4 | Advanced Tab | Canonical URL, Meta Robots | ✅ | Đã implement |
| 5 | Social Sharing Tab | OG Image, Social Description | ✅ | Đã implement |

---

## ⚠️ THIẾU HOẶC CHƯA ĐẦY ĐỦ

| # | Tính năng | Mô tả | Status | Cần bổ sung |
|---|-----------|-------|--------|------------|
| 2.3 | Slug Validation | Check trùng lặp real-time | ✅ | Đã implement với API endpoint và debounce |
| 3.1.4 | Content Keyword Check | Kiểm tra mô tả có chứa từ khóa không | ✅ | Đã implement - check keyword trong description |
| 3.1.5 | Internal Link Check | Kiểm tra có link trỏ về sản phẩm liên quan | ✅ | Đã implement - cần truyền hasRelatedProducts từ ProductForm |
| 6 | Schema Markup (JSON-LD) | Tự động sinh Product Schema | ❌ | Cần tích hợp vào backend (hiện chỉ có ở frontend page) |
| 8.1 | Schema Size | Inject size attribute cho biến thể | ❌ | Cần thêm vào schema generation |
| 8.2 | Auto-Alt Text | Tự động thêm "Shop [Tên Shop]" vào alt text | ❌ | Cần implement khi upload/save ảnh |

---

## 📋 CHI TIẾT CẦN BỔ SUNG

### 1. Slug Validation Real-time ✅ HOÀN THÀNH
- **Yêu cầu:** Check trùng lặp slug khi user nhập
- **Đã làm:** 
  - ✅ Tạo API endpoint `/api/admin/products/validate-slug?slug=xxx&excludeId=yyy`
  - ✅ Debounce input 500ms và gọi API
  - ✅ Hiển thị warning (màu đỏ) nếu slug đã tồn tại, màu xanh nếu hợp lệ

### 2. Content Keyword Check ✅ HOÀN THÀNH
- **Yêu cầu:** Kiểm tra mô tả có chứa focus keyword không
- **Đã làm:**
  - ✅ Check `data.focusKeyword` có trong `productDescription` hoặc `productShortDescription` (case-insensitive)
  - ✅ Update checklist status: 🟢 nếu có keyword, 🟠 nếu không có

### 3. Internal Link Check ✅ HOÀN THÀNH (Cần tích hợp data)
- **Yêu cầu:** Kiểm tra có sản phẩm liên quan (upsell/cross-sell)
- **Đã làm:**
  - ✅ Thêm prop `hasRelatedProducts` vào SEOMetaBox
  - ⚠️ Cần truyền giá trị từ ProductForm (hiện đang hardcode `false`)
  - ⚠️ Cần check từ ProductLinksBox hoặc upsell/cross-sell fields nếu có

### 4. Schema Markup Backend Integration
- **Yêu cầu:** Tự động sinh JSON-LD Product Schema khi save product
- **Cách làm:**
  - Tạo utility function để generate schema từ product data
  - Lưu schema vào database hoặc generate khi render page
  - Map từ ProductDataMetaBox fields

### 5. Schema Size Attribute
- **Yêu cầu:** Thêm size vào schema nếu sản phẩm có biến thể với kích thước
- **Cách làm:**
  - Check variations có attribute "Size"
  - Inject vào schema: `additionalProperty: { name: "Size", value: "1m2" }`

### 6. Auto-Alt Text
- **Yêu cầu:** Tự động thêm "Shop Gấu Bông" vào alt text của ảnh
- **Cách làm:**
  - Khi save product, update alt text của featured image và gallery images
  - Format: `{originalAlt} - Shop Gấu Bông`

---

## 🎯 ƯU TIÊN

**High Priority:**
1. Slug Validation Real-time
2. Content Keyword Check
3. Schema Markup Backend Integration

**Medium Priority:**
4. Internal Link Check
5. Schema Size Attribute

**Low Priority:**
6. Auto-Alt Text (có thể làm sau)

---

## 📝 NOTES

- Schema Markup hiện đã có ở frontend (`app/(shop)/products/[slug]/page.tsx`) nhưng cần tích hợp vào backend để tự động generate
- Auto-Alt Text cần implement ở phần upload/save ảnh, không phải trong SEO Meta Box
- Internal Link check cần tích hợp với ProductLinksBox (đã bị xóa) hoặc upsell/cross-sell fields
