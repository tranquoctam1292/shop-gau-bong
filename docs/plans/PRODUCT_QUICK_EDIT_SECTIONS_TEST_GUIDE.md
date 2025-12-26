# 🧪 ProductQuickEditDialog Sections - Manual Test Guide

**Ngày tạo:** 2025-01-XX  
**Mục đích:** Hướng dẫn test manual cho các sections đã extract trong Phase 2  
**Sections đã extract:** 10/11 (ProductOptionsSection skipped)

---

## 📋 Test Checklist

### Pre-Test Setup

1. **Start Development Server:**
   ```bash
   npm run dev
   ```

2. **Login as Admin:**
   - Navigate to: `http://localhost:3000/admin/login`
   - Login với admin credentials

3. **Open Product List:**
   - Navigate to: `http://localhost:3000/admin/products`
   - Chọn một product để test (prefer variable product với variants)

4. **Open Quick Edit Dialog:**
   - Click "Sửa nhanh" button trên product row
   - Verify dialog/sheet opens correctly

---

## 🧪 Section-by-Section Testing

### ✅ 1. BasicInfoSection

**Location:** Accordion → "Thông tin cơ bản"

#### Test Cases:

- [ ] **Section Renders:**
  - [ ] Section header hiển thị với icon Package
  - [ ] Section có thể expand/collapse
  - [ ] Error badge hiển thị nếu có lỗi

- [ ] **Product Name Field:**
  - [ ] Input field hiển thị giá trị hiện tại
  - [ ] Có thể edit và save
  - [ ] Validation: Hiển thị lỗi nếu để trống
  - [ ] Field focus: Border highlight khi focus
  - [ ] Field blur: Border trở về bình thường
  - [ ] Saved field: Green border sau khi save

- [ ] **SKU Field:**
  - [ ] Input field hiển thị giá trị hiện tại
  - [ ] Real-time validation icon hiển thị:
    - [ ] Loading spinner khi validating
    - [ ] Green checkmark khi valid
    - [ ] Red alert icon khi invalid
  - [ ] Validation error message hiển thị nếu SKU trùng
  - [ ] Success message "SKU có sẵn" hiển thị khi valid
  - [ ] Field focus/blur states hoạt động
  - [ ] Saved field highlighting hoạt động

- [ ] **Barcode/GTIN/EAN Fields:**
  - [ ] Tất cả 3 fields hiển thị
  - [ ] Có thể edit và save
  - [ ] Field focus/blur states hoạt động
  - [ ] Saved field highlighting hoạt động

- [ ] **Visual Comparison:**
  - [ ] Layout giống với original
  - [ ] Spacing và padding đúng
  - [ ] Colors và borders đúng

---

### ✅ 2. PricingSection

**Location:** Accordion → "Giá & Trạng thái"

#### Test Cases:

- [ ] **Section Renders:**
  - [ ] Section header hiển thị với icon DollarSign
  - [ ] Section có thể expand/collapse
  - [ ] Error badge hiển thị nếu có lỗi

- [ ] **Status Field:**
  - [ ] Select dropdown hiển thị giá trị hiện tại
  - [ ] Có thể chọn: Draft, Publish, Trash
  - [ ] Warning dialog hiển thị khi chuyển từ Publish → Draft
  - [ ] Status update thành công

- [ ] **Regular Price Field:**
  - [ ] PriceInput component hiển thị với format (VD: 1.000.000 đ)
  - [ ] Có thể edit và save
  - [ ] Validation: Hiển thị lỗi nếu giá < 0
  - [ ] Field focus/blur states hoạt động
  - [ ] Saved field highlighting hoạt động
  - [ ] Flash animation khi save thành công

- [ ] **Sale Price Field:**
  - [ ] PriceInput component hiển thị
  - [ ] Có thể edit và save
  - [ ] Validation: Hiển thị lỗi nếu salePrice >= regularPrice
  - [ ] Có thể xóa (clear) sale price
  - [ ] Field focus/blur states hoạt động
  - [ ] Saved field highlighting hoạt động

- [ ] **Cost Price Field:**
  - [ ] PriceInput component hiển thị
  - [ ] Có thể edit và save
  - [ ] Profit margin calculation hiển thị:
    - [ ] Lợi nhuận (profit) tính đúng
    - [ ] Tỷ suất lợi nhuận (profit margin %) tính đúng
    - [ ] Màu xanh nếu profit > 0, đỏ nếu < 0
  - [ ] Field focus/blur states hoạt động
  - [ ] Saved field highlighting hoạt động

- [ ] **Visual Comparison:**
  - [ ] Layout giống với original
  - [ ] Grid layout (3 columns) đúng
  - [ ] Price formatting consistent

---

### ✅ 3. InventorySection

**Location:** Below Pricing Section (not in Accordion)

#### Test Cases:

- [ ] **Section Renders:**
  - [ ] Section header hiển thị với icon Box
  - [ ] Section luôn hiển thị (không có accordion)

- [ ] **Manage Stock Checkbox:**
  - [ ] Checkbox hiển thị trạng thái hiện tại
  - [ ] Có thể toggle on/off
  - [ ] Khi bật: Các fields bên dưới hiển thị với animation
  - [ ] Khi tắt: Các fields bên dưới ẩn

- [ ] **Stock Quantity Field:**
  - [ ] Input field hiển thị giá trị hiện tại
  - [ ] Có thể edit và save
  - [ ] Auto-sync stock status:
    - [ ] Khi quantity > 0 → stockStatus = 'instock'
    - [ ] Khi quantity = 0 → stockStatus = 'outofstock'
    - [ ] Không auto-sync nếu stockStatus = 'onbackorder'
  - [ ] Field focus/blur states hoạt động
  - [ ] Saved field highlighting hoạt động

- [ ] **Stock Status Field:**
  - [ ] Select dropdown hiển thị giá trị hiện tại
  - [ ] Có thể chọn: Còn hàng, Hết hàng, Đặt hàng trước
  - [ ] Auto-sync với stock quantity (nếu không phải onbackorder)

- [ ] **Low Stock Threshold Field:**
  - [ ] Chỉ hiển thị khi `loadedSections.has('secondary')`
  - [ ] Input field hiển thị giá trị hiện tại
  - [ ] Có thể edit và save
  - [ ] Validation: Chỉ chấp nhận số nguyên >= 0
  - [ ] Field focus/blur states hoạt động
  - [ ] Saved field highlighting hoạt động

- [ ] **Backorders Field:**
  - [ ] Select dropdown hiển thị giá trị hiện tại
  - [ ] Có thể chọn: Không cho phép, Cho phép nhưng thông báo, Cho phép
  - [ ] Auto-sync: Nếu "Không cho phép" và stock = 0 → stockStatus = 'outofstock'
  - [ ] Warning message hiển thị khi điều kiện trên xảy ra

- [ ] **Sold Individually Checkbox:**
  - [ ] Checkbox hiển thị trạng thái hiện tại
  - [ ] Có thể toggle on/off
  - [ ] Save thành công

- [ ] **Visual Comparison:**
  - [ ] Layout giống với original
  - [ ] Conditional rendering hoạt động đúng
  - [ ] Animations smooth

---

### ✅ 4. DimensionsSection

**Location:** Accordion → "Kích thước & Trọng lượng"

#### Test Cases:

- [ ] **Section Renders:**
  - [ ] Section header hiển thị với icon Ruler
  - [ ] Section không có accordion (luôn hiển thị)

- [ ] **Weight Field:**
  - [ ] Input field hiển thị giá trị hiện tại (kg)
  - [ ] Có thể edit và save
  - [ ] Validation: Chỉ chấp nhận số >= 0
  - [ ] Field focus/blur states hoạt động
  - [ ] Saved field highlighting hoạt động

- [ ] **Length/Width/Height Fields:**
  - [ ] Tất cả 3 fields hiển thị (cm)
  - [ ] Có thể edit và save
  - [ ] Validation: Chỉ chấp nhận số >= 0
  - [ ] Field focus/blur states hoạt động
  - [ ] Saved field highlighting hoạt động

- [ ] **Volumetric Weight Calculation:**
  - [ ] Khi có đủ L, W, H > 0:
    - [ ] Hiển thị "Trọng lượng thể tích: X.XX kg"
    - [ ] Calculation đúng: (L × W × H) / 6000
  - [ ] Khi thiếu bất kỳ field nào: Không hiển thị

- [ ] **Visual Comparison:**
  - [ ] Layout giống với original
  - [ ] Grid layout (4 columns) đúng
  - [ ] Volumetric weight display đúng

---

### ✅ 5. ShippingSection

**Location:** Accordion → "Giao hàng & Thuế"

#### Test Cases:

- [ ] **Section Renders:**
  - [ ] Section header hiển thị với icon Ruler
  - [ ] Section có thể expand/collapse
  - [ ] Error badge hiển thị nếu có lỗi

- [ ] **Shipping Class Field:**
  - [ ] Select dropdown hiển thị giá trị hiện tại
  - [ ] Có thể chọn: Không có, Hàng thường, Hàng dễ vỡ, Hàng cồng kềnh, Giao hàng nhanh
  - [ ] Có thể set về "Không có" (undefined)
  - [ ] Save thành công

- [ ] **Tax Status Field:**
  - [ ] Select dropdown hiển thị giá trị hiện tại
  - [ ] Có thể chọn: Có thuế, Chỉ thuế vận chuyển, Không có thuế
  - [ ] Save thành công

- [ ] **Tax Class Field:**
  - [ ] Select dropdown hiển thị giá trị hiện tại
  - [ ] Có thể chọn: Mặc định, Thuế tiêu chuẩn, Thuế giảm, Thuế 0%
  - [ ] Có thể set về "Mặc định" (undefined)
  - [ ] Save thành công

- [ ] **Visual Comparison:**
  - [ ] Layout giống với original
  - [ ] Grid layout (2 columns) đúng

---

### ✅ 6. ProductTypeSection

**Location:** Accordion → "Loại sản phẩm & Hiển thị"

#### Test Cases:

- [ ] **Section Renders:**
  - [ ] Section header hiển thị với icon Package
  - [ ] Section có thể expand/collapse
  - [ ] Error badge hiển thị nếu có lỗi

- [ ] **Product Type Field:**
  - [ ] Select dropdown hiển thị giá trị hiện tại
  - [ ] Có thể chọn: Đơn giản, Có biến thể, Nhóm sản phẩm, Sản phẩm ngoài
  - [ ] Warning dialog hiển thị khi chuyển từ Variable → Simple/Grouped/External và có variants
  - [ ] Warning có thể cancel hoặc confirm
  - [ ] Save thành công

- [ ] **Visibility Field:**
  - [ ] Select dropdown hiển thị giá trị hiện tại
  - [ ] Có thể chọn: Công khai, Riêng tư, Bảo vệ bằng mật khẩu
  - [ ] Save thành công

- [ ] **Password Field:**
  - [ ] Chỉ hiển thị khi visibility = 'password'
  - [ ] Input field hiển thị với animation
  - [ ] Có thể edit và save
  - [ ] Field focus/blur states hoạt động
  - [ ] Saved field highlighting hoạt động
  - [ ] Khi chuyển visibility khác 'password': Password field ẩn và giá trị clear

- [ ] **Visual Comparison:**
  - [ ] Layout giống với original
  - [ ] Conditional rendering hoạt động đúng
  - [ ] Animations smooth

---

### ✅ 7. SeoSection

**Location:** Below Accordion (not in Accordion)

#### Test Cases:

- [ ] **Section Renders:**
  - [ ] Section header hiển thị với icon Search
  - [ ] Section luôn hiển thị (không có accordion)
  - [ ] "Chỉnh sửa SEO đầy đủ" button hiển thị (nếu không phải bulk mode)

- [ ] **Meta Title Field:**
  - [ ] Input field hiển thị giá trị hiện tại
  - [ ] Character counter hiển thị (X/60)
  - [ ] Counter màu đỏ nếu > 60 ký tự
  - [ ] Max length = 60 ký tự
  - [ ] Có thể edit và save
  - [ ] Validation: Hiển thị lỗi nếu > 60 ký tự
  - [ ] Field focus/blur states hoạt động
  - [ ] Saved field highlighting hoạt động

- [ ] **Meta Description Field:**
  - [ ] Textarea hiển thị giá trị hiện tại
  - [ ] Character counter hiển thị (X/160)
  - [ ] Counter màu đỏ nếu > 160 ký tự
  - [ ] Max length = 160 ký tự
  - [ ] Có thể edit và save
  - [ ] Validation: Hiển thị lỗi nếu > 160 ký tự
  - [ ] Field focus/blur states hoạt động
  - [ ] Saved field highlighting hoạt động

- [ ] **URL Slug Field:**
  - [ ] Input field hiển thị giá trị hiện tại
  - [ ] Có thể edit và save
  - [ ] Validation:
    - [ ] Hiển thị lỗi nếu để trống
    - [ ] Hiển thị lỗi nếu có ký tự không hợp lệ (chỉ cho phép a-z, 0-9, -)
  - [ ] Field focus/blur states hoạt động
  - [ ] Saved field highlighting hoạt động

- [ ] **SEO Preview:**
  - [ ] Preview box hiển thị (nếu không phải bulk mode)
  - [ ] Preview URL đúng format: `https://shop-gaubong.com/products/{slug}`
  - [ ] Preview title: Dùng seoTitle hoặc product.name
  - [ ] Preview description: Dùng seoDescription hoặc product.shortDescription
  - [ ] Preview truncates nếu quá dài (60/160 chars)

- [ ] **"Chỉnh sửa SEO đầy đủ" Button:**
  - [ ] Button hiển thị (nếu không phải bulk mode)
  - [ ] Click button: Navigate đến full edit page và close dialog
  - [ ] URL đúng: `/admin/products/{id}/edit`

- [ ] **Visual Comparison:**
  - [ ] Layout giống với original
  - [ ] Preview box styling đúng

---

### ✅ 8. CategoriesSection

**Location:** Accordion → "Danh mục & Thẻ"

#### Test Cases:

- [ ] **Section Renders:**
  - [ ] Section header hiển thị với icon Tag
  - [ ] Section có thể expand/collapse
  - [ ] Error badge hiển thị nếu có lỗi
  - [ ] Skeleton loader hiển thị nếu `!loadedSections.has('secondary')`

- [ ] **Categories Multi-select:**
  - [ ] Popover trigger button hiển thị
  - [ ] Button text: "Chọn danh mục..." hoặc "X danh mục đã chọn"
  - [ ] Click button: Popover mở
  - [ ] Popover có search input
  - [ ] Categories list hiển thị với loading state
  - [ ] Có thể select/deselect categories (checkbox)
  - [ ] Selected categories hiển thị dưới dạng Badge
  - [ ] Có thể xóa từng category (X button trên Badge)
  - [ ] "Xóa tất cả" button hiển thị khi có selected categories
  - [ ] Click "Xóa tất cả": Tất cả categories bị xóa
  - [ ] Save thành công

- [ ] **Tags Input:**
  - [ ] Tags input container hiển thị
  - [ ] Selected tags hiển thị dưới dạng Badge
  - [ ] Có thể xóa từng tag (X button trên Badge)
  - [ ] Input field cho phép nhập tag mới
  - [ ] Nhấn Enter: Tag mới được thêm
  - [ ] Không thêm tag trùng lặp
  - [ ] Save thành công

- [ ] **Visual Comparison:**
  - [ ] Layout giống với original
  - [ ] Popover styling đúng
  - [ ] Badge styling đúng

---

### ✅ 9. ImagesSection

**Location:** Accordion → "Hình ảnh sản phẩm"

#### Test Cases:

- [ ] **Section Renders:**
  - [ ] Section header hiển thị với icon ImageIcon
  - [ ] Section có thể expand/collapse
  - [ ] Error badge hiển thị nếu có lỗi
  - [ ] Skeleton loader hiển thị nếu `!loadedSections.has('secondary')`

- [ ] **Featured Image:**
  - [ ] Image preview hiển thị nếu có featured image
  - [ ] Placeholder hiển thị nếu không có featured image
  - [ ] "Chọn ảnh" / "Thay đổi" button hiển thị
  - [ ] Click button: MediaLibraryModal mở với mode='single'
  - [ ] Select image: Featured image được update
  - [ ] "Xóa" button hiển thị nếu có featured image
  - [ ] Click "Xóa": Featured image bị xóa
  - [ ] X button trên image preview: Xóa featured image
  - [ ] Save thành công

- [ ] **Gallery Images:**
  - [ ] Gallery images grid hiển thị
  - [ ] Mỗi image có X button để xóa
  - [ ] "+" button để thêm image mới
  - [ ] Click "+" button: MediaLibraryModal mở với mode='multiple'
  - [ ] Select multiple images: Images được thêm vào gallery
  - [ ] Click X button trên image: Image bị xóa khỏi gallery
  - [ ] Save thành công

- [ ] **MediaLibraryModal Integration:**
  - [ ] Modal mở đúng mode (single/multiple)
  - [ ] Selected IDs được pass đúng
  - [ ] onSelect callback hoạt động đúng
  - [ ] Modal đóng sau khi select

- [ ] **Visual Comparison:**
  - [ ] Layout giống với original
  - [ ] Image previews đúng size
  - [ ] Buttons styling đúng

---

### ✅ 10. VariantsSection

**Location:** Below Accordion (not in Accordion)

#### Test Cases:

- [ ] **Section Renders:**
  - [ ] Section chỉ hiển thị nếu:
    - [ ] `loadedSections.has('secondary')` HOẶC
    - [ ] `formData.variants && formData.variants.length > 0`
  - [ ] Section header hiển thị: "Biến thể (X)"
  - [ ] Badge "Sửa trực tiếp trên bảng" hiển thị

- [ ] **VariantQuickEditTable:**
  - [ ] Table hiển thị tất cả variants
  - [ ] Table có virtual scrolling (nếu > 20 variants)
  - [ ] Có thể edit SKU, Price, Stock trực tiếp trên table
  - [ ] Changes được sync với form state
  - [ ] Bulk update mode hoạt động
  - [ ] Save thành công

- [ ] **Variant Data Preservation:**
  - [ ] Display fields (size, color, colorCode, image) được preserve khi edit
  - [ ] Editable fields (sku, price, stock) được update đúng
  - [ ] Variant mapping logic hoạt động đúng

- [ ] **Visual Comparison:**
  - [ ] Table layout giống với original
  - [ ] Virtual scrolling smooth (nếu có)

---

## 🔍 Cross-Section Testing

### Form State Management

- [ ] **Context API:**
  - [ ] Tất cả sections có thể access form state qua Context
  - [ ] Form methods (setValue, watch, register) hoạt động đúng
  - [ ] No props drilling issues

- [ ] **Field States:**
  - [ ] Focus states: Border highlight khi focus
  - [ ] Blur states: Border trở về bình thường
  - [ ] Saved states: Green border sau khi save
  - [ ] Error states: Red border khi có lỗi
  - [ ] Validation success states: Green border khi valid (SKU)

- [ ] **Saved Fields Highlighting:**
  - [ ] Green border flash animation khi save thành công
  - [ ] Animation tự động fade out sau 2s
  - [ ] Multiple fields có thể flash cùng lúc

- [ ] **Error Handling:**
  - [ ] Error badges trên section headers hiển thị đúng số lỗi
  - [ ] Error messages hiển thị dưới mỗi field
  - [ ] Error summary có thể click để scroll đến field lỗi
  - [ ] Auto-scroll to first error khi submit

### Accordion Functionality

- [ ] **Expand/Collapse:**
  - [ ] Tất cả accordion sections có thể expand/collapse
  - [ ] Default expanded sections: 'section-basic-info', 'section-pricing'
  - [ ] Expanded state được persist trong `expandedSections` state
  - [ ] Click section header: Toggle expand/collapse
  - [ ] Smooth animation khi expand/collapse

- [ ] **Skip Links:**
  - [ ] Skip links hiển thị ở đầu form
  - [ ] Click skip link: Scroll đến section tương ứng
  - [ ] Section được focus và expand

### Progressive Loading

- [ ] **Critical Sections:**
  - [ ] Basic Info, Pricing, Inventory luôn hiển thị ngay
  - [ ] Không có skeleton loader

- [ ] **Secondary Sections:**
  - [ ] Categories, Images, SEO, Variants có skeleton loader ban đầu
  - [ ] Skeleton loader hiển thị trong ~100ms
  - [ ] Sau đó sections thực tế hiển thị
  - [ ] Smooth transition

### Mobile vs Desktop

- [ ] **Mobile (Sheet):**
  - [ ] Sheet opens từ bottom
  - [ ] Sheet có scroll progress bar
  - [ ] Scroll to top button hiển thị khi scroll > 200px
  - [ ] Keyboard handling hoạt động
  - [ ] Touch targets >= 44x44px

- [ ] **Desktop (Dialog):**
  - [ ] Dialog opens centered
  - [ ] Dialog có max-width và max-height
  - [ ] Scroll behavior smooth
  - [ ] Keyboard shortcuts hoạt động

---

## 🐛 Common Issues to Check

### TypeScript Errors

- [ ] Run `npm run type-check` - No errors
- [ ] All imports resolve correctly
- [ ] All types are correct

### Runtime Errors

- [ ] Open browser console - No errors
- [ ] No React warnings (missing keys, etc.)
- [ ] No hydration mismatches

### Performance Issues

- [ ] React DevTools: Check unnecessary re-renders
- [ ] Sections wrapped with React.memo should not re-render unnecessarily
- [ ] Virtual scrolling works for large variant tables

### Visual Issues

- [ ] Compare với original version side-by-side
- [ ] Check spacing, padding, borders
- [ ] Check colors, fonts, icons
- [ ] Check responsive behavior (mobile/desktop)

---

## 📝 Test Results Template

```markdown
## Test Results - [Date]

### Sections Tested
- [x] BasicInfoSection
- [x] PricingSection
- [x] InventorySection
- [x] DimensionsSection
- [x] ShippingSection
- [x] ProductTypeSection
- [x] SeoSection
- [x] CategoriesSection
- [x] ImagesSection
- [x] VariantsSection

### Issues Found
1. [Issue description]
   - Section: [Section name]
   - Severity: [Critical/High/Medium/Low]
   - Status: [Open/Fixed]

### Performance
- Initial render time: [X]ms
- Re-render count: [X]
- Memory usage: [X]MB

### Notes
[Any additional notes]
```

---

## ✅ Sign-off

- [ ] All sections tested
- [ ] All test cases passed
- [ ] No critical issues found
- [ ] Visual comparison passed
- [ ] Performance acceptable
- [ ] Ready for commit

**Tester:** _________________  
**Date:** _________________  
**Status:** ✅ PASS / ❌ FAIL

