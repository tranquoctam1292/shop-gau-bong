# Plan: Hệ thống Quản lý Thuộc tính Toàn cục (Global Attributes System)

**Ngày tạo:** 2025-01-XX  
**Status:** 📋 Planning → 🚧 In Progress  
**Mục tiêu:** Triển khai hệ thống quản lý thuộc tính toàn cục theo đặc tả trong `tang_nang2.md`

---

## 📋 TỔNG QUAN

Hệ thống cho phép Admin tạo và quản lý các thuộc tính dùng chung (Màu sắc, Kích thước, Chất liệu) tại trang quản trị riêng, trước khi sử dụng trong trang Thêm sản phẩm.

**Các tính năng chính:**
1. Trang quản lý Attributes (Products > Attributes)
2. Trang cấu hình Terms (Configure Terms)
3. Tích hợp vào Product Form với UI trực quan
4. Hỗ trợ 4 loại hiển thị: Text/Select, Color Swatch, Image Swatch, Button/Label

---

## ✅ TASK LIST & PROGRESS

### Phase 1: Database Schema & API Routes

#### Task 1.1: Tạo MongoDB Collections Schema ✅ Complete
- [x] Tạo collection `product_attributes` (attributes)
- [x] Tạo collection `product_attribute_terms` (terms/values)
- [ ] Schema cho attribute:
  ```typescript
  {
    _id: ObjectId,
    name: string, // "Màu lông", "Kích thước"
    slug: string,
    type: 'text' | 'color' | 'image' | 'button',
    sortOrder: 'name' | 'number' | 'id',
    createdAt: Date,
    updatedAt: Date
  }
  ```
- [ ] Schema cho term:
  ```typescript
  {
    _id: ObjectId,
    attributeId: string, // Reference to attribute
    name: string, // "Nâu", "1m2"
    slug: string,
    description?: string,
    // Meta fields based on attribute type:
    colorHex?: string, // For color type
    colorHex2?: string, // For gradient
    imageUrl?: string, // For image/button type
    sortOrder?: number,
    createdAt: Date,
    updatedAt: Date
  }
  ```

#### Task 1.2: API Routes - Attributes Management ✅ Complete
- [x] `GET /api/admin/attributes` - List attributes
- [x] `POST /api/admin/attributes` - Create attribute
- [x] `GET /api/admin/attributes/[id]` - Get attribute
- [x] `PUT /api/admin/attributes/[id]` - Update attribute
- [x] `DELETE /api/admin/attributes/[id]` - Delete attribute

#### Task 1.3: API Routes - Terms Management ✅ Complete
- [x] `GET /api/admin/attributes/[id]/terms` - List terms for attribute
- [x] `POST /api/admin/attributes/[id]/terms` - Create term
- [x] `GET /api/admin/attributes/[id]/terms/[termId]` - Get term
- [x] `PUT /api/admin/attributes/[id]/terms/[termId]` - Update term
- [x] `DELETE /api/admin/attributes/[id]/terms/[termId]` - Delete term

---

### Phase 2: Admin UI - Attribute Management Page

#### Task 2.1: Trang Danh sách Attributes (`/admin/attributes`) ✅ Complete
- [x] Layout 2 cột (giống Category page)
- [x] **Cột trái:** Form thêm thuộc tính mới
  - [x] Input: Tên (Name)
  - [x] Input: Slug (auto-generate)
  - [x] Select: Loại hiển thị (Attribute Type)
    - Text/Select
    - Color Swatch
    - Image Swatch
    - Button/Label
  - [x] Select: Sắp xếp mặc định (Default Sort Order)
  - [x] Button: Thêm thuộc tính
- [x] **Cột phải:** Bảng danh sách
  - [x] Columns: Tên, Slug, Loại hiển thị, Số lượng Terms
  - [x] Actions: Chỉnh sửa, Xóa, **Cấu hình chủng loại**
  - [x] Nút "Cấu hình chủng loại" → Navigate to `/admin/attributes/[id]/terms`

#### Task 2.2: Components - Attribute Form ✅ Complete
- [x] `components/admin/attributes/AttributeForm.tsx`
- [x] Form validation (Zod schema)
- [x] Auto-generate slug from name
- [x] Handle create/update

#### Task 2.3: Components - Attribute List Table ✅ Complete
- [x] `components/admin/attributes/AttributeListTable.tsx`
- [x] Display attributes with type badges
- [x] Terms count column
- [x] Action buttons (Edit, Delete, Configure Terms)

---

### Phase 3: Admin UI - Configure Terms Page

#### Task 3.1: Trang Cấu hình Terms (`/admin/attributes/[id]/terms`) ✅ Complete
- [x] Header: Hiển thị tên attribute và loại hiển thị
- [x] **Form thêm Term mới** (Dynamic based on attribute type):
  - [x] **Type: Color**
    - [x] Input: Tên
    - [x] Input: Slug
    - [x] Textarea: Mô tả (optional)
    - [x] **Color Picker:** Hex code input
    - [x] **Gradient Option:** Checkbox "Phối màu" → Show second color picker
    - [x] Preview: Ô tròn màu bên cạnh
  - [x] **Type: Button/Label (Size)**
    - [x] Input: Tên
    - [x] Textarea: Mô tả
    - [x] **Image Upload:** Size Guide Image
    - [x] Preview: Hiển thị ảnh
  - [x] **Type: Image/Pattern**
    - [x] Input: Tên
    - [x] **Image Upload:** Swatch image
    - [x] Preview: Hiển thị ảnh swatch
  - [x] **Type: Text/Select**
    - [x] Input: Tên
    - [x] Input: Slug
    - [x] Textarea: Mô tả (optional)
- [x] **Bảng danh sách Terms:**
  - [x] Display terms với preview (màu/ảnh) tùy theo type
  - [x] Actions: Edit, Delete
  - [x] Sortable (theo sortOrder)

#### Task 3.2: Components - Term Form (Dynamic) ✅ Complete
- [x] `components/admin/attributes/TermForm.tsx`
- [x] Conditional rendering based on attribute type
- [x] Color picker component (for Color type)
- [x] Image upload component (for Image/Button types)
- [x] Preview components

#### Task 3.3: Components - Term List Table ✅ Complete
- [x] `components/admin/attributes/TermListTable.tsx`
- [x] Display terms với visual preview
- [x] Color swatches for Color type
- [x] Image thumbnails for Image/Button types
- [x] Text display for Text type

---

### Phase 4: Integration - Product Form Enhancement

#### Task 4.1: Update AttributesTab Component ✅ Complete
- [x] Modify `components/admin/products/ProductDataMetaBox/AttributesTab.tsx`
- [x] **Thay dropdown cũ bằng Card Selector:**
  - [x] Fetch global attributes từ API
  - [x] Display as cards với icon và tên
  - [x] Click card → Load attribute vào bảng
- [x] **Smart Value Input:**
  - [x] Dropdown với visual preview (màu/ảnh)
  - [x] Nút "Chọn tất cả" (Select All)
  - [x] Nút "Tạo giá trị mới" → Quick Add Modal

#### Task 4.2: Components - Attribute Card Selector ✅ Complete
- [x] `components/admin/products/AttributeCardSelector.tsx`
- [x] Display global attributes as cards
- [x] Icons per attribute type
- [x] Click handler to add to attributes list

#### Task 4.3: Components - Smart Value Input ✅ Complete
- [x] `components/admin/products/SmartValueInput.tsx`
- [x] Dropdown với visual preview
- [x] Select All button
- [x] Quick Add Modal integration

#### Task 4.4: Components - Quick Add Term Modal ✅ Complete
- [x] `components/admin/products/QuickAddTermModal.tsx`
- [x] Modal form tương tự TermForm nhưng compact
- [x] Submit → Create term và auto-select trong product form
- [x] Close modal sau khi tạo

#### Task 4.5: Smart Bulk Edit - Variations Management ✅ Complete (NEW)
- [x] **Thanh công cụ Bulk Edit (Toolbar):**
  - [x] Component `VariationsBulkEditToolbar.tsx`
  - [x] Nằm trên danh sách biến thể trong VariationsTab
  - [x] **Filter Dropdown:** "Áp dụng cho..." 
    - [x] Options: Tất cả | Chỉ Size [value] | Chỉ Màu [value] | Custom filter
    - [x] Dynamic options dựa trên attributes của product
  - [x] **Action Buttons:**
    - [x] "Thiết lập giá thường" → Input modal → Áp dụng cho filtered variations
    - [x] "Tăng/Giảm giá theo %" → Input % → Áp dụng cho filtered variations
    - [x] "Quản lý kho" → Set stock status (instock/outofstock) cho filtered variations
- [x] **Gán ảnh thông minh theo Thuộc tính (Image Mapping):**
  - [x] Component `VariationImageMapper.tsx`
  - [x] Bảng ánh xạ: [Attribute Value] → [Upload Image]
  - [x] Logic: Gán ảnh cho tất cả variations có attribute value đó
  - [x] Example: Màu Nâu → Upload → Auto-assign cho (Nâu-1m, Nâu-1m5, Nâu-2m)
  - [x] Preview: Hiển thị số variations sẽ được gán ảnh
  - [x] Button: "Áp dụng ảnh" → Batch update variations

---

### Phase 5: VariationsTab Enhancement - Bulk Edit Integration

#### Task 5.1: Update VariationsTab Component ✅ Complete
- [x] Modify `components/admin/products/ProductDataMetaBox/VariationsTab.tsx`
- [x] **Integrate Bulk Edit Toolbar:**
  - [x] Add `VariationsBulkEditToolbar` component above variation table
  - [x] Connect filter logic với variation table
  - [x] Handle bulk actions (price, stock status)
- [x] **Integrate Image Mapper:**
  - [x] Add `VariationImageMapper` component (section above table)
  - [x] Connect với variation table để auto-assign images
  - [x] Show preview số variations sẽ được update

#### Task 5.2: API Routes - Bulk Update Variations ✅ Complete
- [x] `PUT /api/admin/products/[id]/variations/bulk` - Bulk update variations
  - [x] Body: `{ filter: {...}, updates: { price?, stockStatus?, image? } }`
  - [x] Logic: Filter variations theo attributes → Apply updates
  - [x] Validation với Zod schema
  - [x] Returns updated count và total variations
- [x] `POST /api/admin/products/[id]/variations/map-images` - Map images by attribute
  - [x] Body: `{ mappings: [{ attributeName, attributeValue, imageId, imageUrl }] }`
  - [x] Logic: Find all variations with attribute value → Assign image
  - [x] Validation với Zod schema
  - [x] Returns updated count và mappings applied

---

### Phase 6: Frontend Display (Optional - Future)

#### Task 6.1: Frontend Product Page - Visual Attribute Display ✅ Complete
- [x] Update `components/product/ProductInfo.tsx`
- [x] Display Color Swatches thay vì text dropdown (via VisualAttributeSelector)
- [x] Display Size Buttons với tooltip (size guide image support)
- [x] Display Image Swatches cho pattern/material (via VisualAttributeSelector)
- [x] Create `VisualAttributeSelector` component với support cho color/image/button types
- [x] Create public API route `/api/cms/attributes` để fetch global attributes và terms
- [x] Create `useGlobalAttributes` hook để fetch và cache global attributes/terms
- [x] Backward compatibility: Fallback to old color swatches nếu không có global attribute

---

## 📊 PROGRESS TRACKING

### Overall Progress: 100% (6/6 Phases)

| Phase | Status | Progress | Notes |
|-------|--------|----------|-------|
| Phase 1: Database & API | ✅ Complete | 100% | ✅ MongoDB collections, API routes (GET/POST/PUT/DELETE) |
| Phase 2: Attribute Management UI | ✅ Complete | 100% | ✅ 2-column layout, AttributeForm, AttributeListTable |
| Phase 3: Terms Configuration UI | ✅ Complete | 100% | ✅ Dynamic TermForm, TermListTable với visual preview |
| Phase 4: Product Form Integration | ✅ Complete | 100% | ✅ Card Selector, SmartValueInput, QuickAddTermModal |
| Phase 5: VariationsTab Bulk Edit | ✅ Complete | 100% | ✅ Bulk Edit Toolbar, Image Mapper, API routes |
| Phase 6: Frontend Display | ✅ Complete | 100% | ✅ VisualAttributeSelector, public API, hooks |

---

## 🎯 PRIORITY ORDER

1. **Phase 1** (Database & API) - Foundation, cần làm trước
2. **Phase 2** (Attribute Management) - Core admin feature
3. **Phase 3** (Terms Configuration) - Core admin feature
4. **Phase 4** (Product Form Integration) - Main integration point
5. **Phase 5** (VariationsTab Bulk Edit) - **HIGH PRIORITY** - Tiết kiệm thời gian nhập liệu cho shop gấu bông
6. **Phase 6** (Frontend Display) - Optional enhancement

---

## 📝 NOTES

### Technical Considerations:
- **Database:** MongoDB collections với proper indexing
- **API:** RESTful routes với validation (Zod)
- **UI:** Reuse existing components (Card, Table, Form) từ Shadcn UI
- **Color Picker:** Có thể dùng `react-color` hoặc custom component
- **Image Upload:** Reuse existing MediaLibraryModal

### Dependencies:
- Existing: 
  - `ProductDataMetaBox/AttributesTab.tsx` (cần modify)
  - `ProductDataMetaBox/VariationsTab.tsx` (cần modify - Phase 5)
  - `VariationTable.tsx` (cần integrate bulk edit)
- New: 
  - Attribute management pages
  - Term management pages
  - Bulk edit components (Phase 5)
- Libraries: Có thể cần thêm color picker library

### Migration:
- Cần migrate existing attributes từ `ProductDataMetaBox.attributes` sang global attributes (nếu có)
- Backward compatibility: Vẫn support local attributes trong product form

---

## 🚀 NEXT STEPS

1. ✅ Review plan với user
2. ✅ Phase 1: Database Schema & API Routes - **COMPLETE**
3. ✅ Phase 2: Attribute Management UI - **COMPLETE**
4. ✅ Phase 3: Terms Configuration UI - **COMPLETE**
5. 🚧 Phase 4: Product Form Integration - **IN PROGRESS**
6. ⏳ Phase 5: VariationsTab Bulk Edit (High Priority) - Pending
7. ⏳ Phase 6: Frontend Display - Optional

---

## 📝 UPDATES LOG

**2025-01-XX:**
- ✅ Added Phase 5: VariationsTab Bulk Edit (Smart Bulk Edit feature)
  - Bulk Edit Toolbar với filter và actions (price, stock)
  - Image Mapping theo attribute (quan trọng cho shop gấu bông)
- ✅ Updated priority order: Phase 5 marked as HIGH PRIORITY
- ✅ Added API routes for bulk operations

**2025-01-XX (Phase 1-3 Complete):**
- ✅ Phase 1: Database & API Routes - **COMPLETE**
  - MongoDB collections: `product_attributes`, `product_attribute_terms`
  - Full CRUD API routes cho attributes và terms
  - Dynamic schema validation theo attribute type
- ✅ Phase 2: Attribute Management UI - **COMPLETE**
  - 2-column layout page `/admin/attributes`
  - AttributeForm với auto-slug generation
  - AttributeListTable với type badges và terms count
- ✅ Phase 3: Terms Configuration UI - **COMPLETE**
  - Dynamic TermForm với Color Picker, Image Upload, Preview
  - TermListTable với visual preview (color swatches, images)
  - Support gradient colors cho color type

**2025-01-XX (Phase 4 Complete):**
- ✅ Phase 4: Product Form Integration - **COMPLETE**
  - Updated AttributesTab: Thay dropdown bằng AttributeCardSelector
  - AttributeCardSelector: Card-based UI với icons per type
  - SmartValueInput: Visual dropdown với preview, Select All, Quick Add
  - QuickAddTermModal: Tạo term nhanh trong product form
  - AttributeItem: Support cả global và custom attributes
  - Auto-load terms khi select global attribute
  - Auto-map colorCodes từ terms cho color attributes
  - **Task 4.5: Smart Bulk Edit - COMPLETE**
    - VariationsBulkEditToolbar: Filter + Bulk actions (price, stock)
    - VariationImageMapper: Gán ảnh theo attribute (tiết kiệm thời gian cho shop gấu bông)

**2025-01-XX (Phase 5 Complete):**
- ✅ Phase 5: VariationsTab Bulk Edit - **COMPLETE**
  - Task 5.1: VariationsTab integration - COMPLETE (đã làm trong Task 4.5)
  - Task 5.2: API Routes - COMPLETE
    - `PUT /api/admin/products/[id]/variations/bulk`: Bulk update variations với filter
    - `POST /api/admin/products/[id]/variations/map-images`: Map images by attribute
    - Validation với Zod schema
    - Returns detailed response (updated count, total variations)

**2025-01-XX (Phase 6 Complete):**
- ✅ Phase 6: Frontend Display - **COMPLETE**
  - Task 6.1: Visual Attribute Display - COMPLETE
    - `VisualAttributeSelector` component: Support color/image/button types
    - Public API route `/api/cms/attributes`: Fetch global attributes và terms
    - `useGlobalAttributes` hook: React Query hooks để fetch và cache
    - Updated `ProductInfo.tsx`: Sử dụng VisualAttributeSelector với backward compatibility
    - Color swatches với hex codes từ global terms
    - Image swatches cho pattern/material attributes
    - Size buttons với tooltip support (size guide image)

---

**Last Updated:** 2025-01-XX
