# Kế Hoạch Thiết Kế Lại Giao Diện Thêm Sản Phẩm

**Ngày tạo:** 2025-01-XX  
**Mục tiêu:** Thiết kế lại giao diện thêm/sửa sản phẩm với layout 2 cột giống WordPress để cải thiện UX

---

## 🎯 VẤN ĐỀ HIỆN TẠI

### Vấn đề
- Form quá dài, phải cuộn xuống rất nhiều
- Tất cả các chức năng đều nằm trong 1 cột duy nhất
- Khó truy cập các chức năng nhanh (publish, save draft, categories, tags)
- Không có sidebar để quản lý metadata và quick actions

### Mục tiêu
- Layout 2 cột: Form chính (trái) + Sidebar (phải)
- Sidebar chứa các chức năng nhanh và metadata
- Giảm thời gian cuộn trang
- Cải thiện trải nghiệm người dùng

---

## 📐 THIẾT KẾ MỚI

### Layout Structure

```
┌─────────────────────────────────────────────────────────┐
│  Header: Tên sản phẩm (editable)                        │
├──────────────────────────┬──────────────────────────────┤
│                          │                              │
│  FORM CHÍNH (70%)        │  SIDEBAR (30%)               │
│                          │                              │
│  ┌────────────────────┐  │  ┌────────────────────────┐ │
│  │ Mô tả ngắn        │  │  │ 📤 PUBLISH BOX         │ │
│  └────────────────────┘  │  │ - Publish              │ │
│                          │  │ - Save Draft           │ │
│  ┌────────────────────┐  │  │ - Preview             │ │
│  │ Mô tả đầy đủ       │  │  └────────────────────────┘ │
│  └────────────────────┘  │                              │
│                          │  ┌────────────────────────┐ │
│  ┌────────────────────┐  │  │ 📁 CATEGORIES         │ │
│  │ Product Details    │  │  │ - Select categories   │ │
│  │ Section            │  │  └────────────────────────┘ │
│  └────────────────────┘  │                              │
│                          │  ┌────────────────────────┐ │
│  ┌────────────────────┐  │  │ 🏷️ TAGS               │ │
│  │ Variants            │  │  │ - Add tags            │ │
│  └────────────────────┘  │  └────────────────────────┘ │
│                          │                              │
│  ┌────────────────────┐  │  ┌────────────────────────┐ │
│  │ Pricing             │  │  │ 🖼️ PRODUCT IMAGE      │ │
│  └────────────────────┘  │  │ - Featured image       │ │
│                          │  │ - Upload/Change        │ │
│  ┌────────────────────┐  │  └────────────────────────┘ │
│  │ SEO Section         │  │                              │
│  └────────────────────┘  │  ┌────────────────────────┐ │
│                          │  │ 📸 PRODUCT GALLERY     │ │
│  ┌────────────────────┐  │  │ - Add images           │ │
│  │ Gift Features       │  │  │ - Reorder              │ │
│  └────────────────────┘  │  └────────────────────────┘ │
│                          │                              │
│  ┌────────────────────┐  │  ┌────────────────────────┐ │
│  │ Media Extended      │  │  │ 📊 PRODUCT DATA       │ │
│  └────────────────────┘  │  │ - SKU                  │ │
│                          │  │ - Stock status         │ │
│  ┌────────────────────┐  │  │ - Dimensions          │ │
│  │ Collections         │  │  └────────────────────────┘ │
│  └────────────────────┘  │                              │
│                          │  ┌────────────────────────┐ │
│  ... (các sections khác) │  │ 🔗 PRODUCT LINKS       │ │
│                          │  │ - Permalink            │ │
│                          │  └────────────────────────┘ │
└──────────────────────────┴──────────────────────────────┘
```

---

## 🎨 COMPONENT STRUCTURE

### 1. Main Layout Component

**File:** `components/admin/products/ProductFormLayout.tsx`

```typescript
interface ProductFormLayoutProps {
  children: React.ReactNode;
  sidebar: React.ReactNode;
  header?: React.ReactNode;
}

// Layout 2 cột với sticky sidebar
```

### 2. Sidebar Components

#### A. Publish Box
**File:** `components/admin/products/sidebar/PublishBox.tsx`
- Publish button
- Save Draft button
- Preview button
- Status selector
- Visibility settings

#### B. Categories Box
**File:** `components/admin/products/sidebar/CategoriesBox.tsx`
- Category selector (multi-select)
- Search categories
- Add new category (quick)

#### C. Tags Box
**File:** `components/admin/products/sidebar/TagsBox.tsx`
- Tag input (autocomplete)
- Popular tags
- Add new tags

#### D. Featured Image Box
**File:** `components/admin/products/sidebar/FeaturedImageBox.tsx`
- Current featured image preview
- Upload/Change button
- Remove button

#### E. Product Gallery Box
**File:** `components/admin/products/sidebar/ProductGalleryBox.tsx`
- Gallery images grid
- Add images button
- Reorder images (drag & drop)
- Remove images

#### F. Product Data Box
**File:** `components/admin/products/sidebar/ProductDataBox.tsx`
- SKU input
- Stock status selector
- Stock quantity input
- Dimensions (quick input)
- Weight input

#### G. Product Links Box
**File:** `components/admin/products/sidebar/ProductLinksBox.tsx`
- Permalink editor
- View product link
- Duplicate product link

---

## 📋 IMPLEMENTATION PLAN

### Phase 1: Layout Structure (Priority: HIGH)

**Tasks:**
1. ✅ Tạo `ProductFormLayout.tsx` với layout 2 cột
2. ✅ Implement sticky sidebar (scroll với page)
3. ✅ Responsive: Sidebar chuyển xuống dưới trên mobile
4. ✅ Update `ProductForm.tsx` để sử dụng layout mới

**Files to create:**
- `components/admin/products/ProductFormLayout.tsx`

**Files to update:**
- `components/admin/ProductForm.tsx`

---

### Phase 2: Publish Box (Priority: HIGH)

**Tasks:**
1. ✅ Tạo `PublishBox.tsx` component
2. ✅ Implement Publish button với confirmation
3. ✅ Implement Save Draft button
4. ✅ Implement Preview button (open in new tab)
5. ✅ Status selector (Draft, Published, Private)
6. ✅ Visibility settings (Public, Private)

**Files to create:**
- `components/admin/products/sidebar/PublishBox.tsx`

---

### Phase 3: Categories & Tags (Priority: HIGH)

**Tasks:**
1. ✅ Tạo `CategoriesBox.tsx` component
2. ✅ Implement multi-select với search
3. ✅ Quick add category (modal)
4. ✅ Tạo `TagsBox.tsx` component
5. ✅ Implement tag input với autocomplete
6. ✅ Show popular tags

**Files to create:**
- `components/admin/products/sidebar/CategoriesBox.tsx`
- `components/admin/products/sidebar/TagsBox.tsx`

---

### Phase 4: Media Management (Priority: MEDIUM)

**Tasks:**
1. ✅ Tạo `FeaturedImageBox.tsx` component
2. ✅ Implement image upload/change/remove
3. ✅ Tạo `ProductGalleryBox.tsx` component
4. ✅ Implement gallery grid với drag & drop reorder
5. ✅ Add/remove images functionality

**Files to create:**
- `components/admin/products/sidebar/FeaturedImageBox.tsx`
- `components/admin/products/sidebar/ProductGalleryBox.tsx`

---

### Phase 5: Product Data (Priority: MEDIUM)

**Tasks:**
1. ✅ Tạo `ProductDataBox.tsx` component
2. ✅ Move SKU, stock, dimensions, weight vào sidebar
3. ✅ Quick input fields
4. ✅ Tạo `ProductLinksBox.tsx` component
5. ✅ Permalink editor
6. ✅ View/Duplicate links

**Files to create:**
- `components/admin/products/sidebar/ProductDataBox.tsx`
- `components/admin/products/sidebar/ProductLinksBox.tsx`

---

### Phase 6: Refactor Main Form (Priority: LOW)

**Tasks:**
1. ✅ Remove các fields đã chuyển vào sidebar
2. ✅ Simplify main form sections
3. ✅ Improve spacing và organization
4. ✅ Add collapsible sections (optional)

**Files to update:**
- `components/admin/ProductForm.tsx`

---

## 🎯 SIDEBAR COMPONENTS DETAILS

### 1. Publish Box

**Features:**
- **Publish Button:** Primary action, saves và publishes product
- **Save Draft:** Saves without publishing
- **Preview:** Opens product preview in new tab
- **Status Dropdown:** Draft, Published, Private
- **Visibility:** Public, Private (future: Password protected)

**State Management:**
- Uses form state from `ProductForm`
- Updates `status` field

---

### 2. Categories Box

**Features:**
- **Multi-select:** Select multiple categories
- **Search:** Filter categories by name
- **Tree View:** Show hierarchical categories (parent/child)
- **Quick Add:** Modal to add new category quickly

**State Management:**
- Uses `category` và `categories` fields from form
- Updates form state on change

---

### 3. Tags Box

**Features:**
- **Tag Input:** Add tags by typing and pressing Enter
- **Autocomplete:** Suggest existing tags
- **Popular Tags:** Show most used tags
- **Tag Chips:** Display selected tags with remove button

**State Management:**
- Uses `tags` array from form
- Updates form state on add/remove

---

### 4. Featured Image Box

**Features:**
- **Image Preview:** Show current featured image (or placeholder)
- **Upload Button:** Open file picker
- **Change Button:** Replace current image
- **Remove Button:** Remove featured image

**State Management:**
- Uses `images[0]` from form
- Updates `images` array on change

---

### 5. Product Gallery Box

**Features:**
- **Gallery Grid:** Display all product images (2x2 or 3x3 grid)
- **Add Images:** Upload multiple images
- **Reorder:** Drag & drop to reorder images
- **Remove:** Remove individual images
- **Set Featured:** Click to set as featured image

**State Management:**
- Uses `images` array from form
- Updates `images` array on change

---

### 6. Product Data Box

**Features:**
- **SKU Input:** Product SKU
- **Stock Status:** Dropdown (In Stock, Out of Stock, On Backorder)
- **Stock Quantity:** Number input
- **Dimensions:** Quick inputs for Length, Width, Height
- **Weight:** Weight input

**State Management:**
- Uses form fields: `sku`, `stockStatus`, `stockQuantity`, `length`, `width`, `height`, `weight`
- Updates form state on change

---

### 7. Product Links Box

**Features:**
- **Permalink Editor:** Edit product slug
- **View Product:** Link to view product (if published)
- **Duplicate Product:** Link to duplicate product

**State Management:**
- Uses `slug` from form
- Updates `slug` on change

---

## 📱 RESPONSIVE DESIGN

### Desktop (> 1024px)
- **Layout:** 2 cột (70% form, 30% sidebar)
- **Sidebar:** Sticky, scrolls with page
- **Form:** Full width trong cột trái

### Tablet (768px - 1024px)
- **Layout:** 2 cột (65% form, 35% sidebar)
- **Sidebar:** Sticky
- **Form:** Full width trong cột trái

### Mobile (< 768px)
- **Layout:** 1 cột (stacked)
- **Sidebar:** Chuyển xuống dưới form
- **Form:** Full width
- **Sidebar:** Full width, không sticky

---

## 🎨 UI/UX IMPROVEMENTS

### 1. Sticky Sidebar
- Sidebar cố định khi scroll form
- Luôn hiển thị các actions quan trọng
- Easy access to publish/save

### 2. Visual Hierarchy
- **Primary Actions:** Publish box ở đầu sidebar
- **Metadata:** Categories, Tags, Images
- **Advanced:** Product Data, Links

### 3. Quick Actions
- Keyboard shortcuts (Ctrl+S to save, Ctrl+P to publish)
- Auto-save draft (optional, future)
- Unsaved changes warning

### 4. Loading States
- Show loading khi save/publish
- Disable buttons during save
- Success/error notifications

---

## 🔧 TECHNICAL IMPLEMENTATION

### State Management

**Option 1: Lift State Up (Recommended)**
- All form state trong `ProductForm.tsx`
- Sidebar components receive state và callbacks
- Single source of truth

**Option 2: Context API**
- `ProductFormContext` để share state
- Sidebar components use context
- More flexible nhưng phức tạp hơn

**Decision:** Use Option 1 (Lift State Up)

### Form Validation

- Validate on submit (Publish/Save Draft)
- Show errors in sidebar nếu có
- Highlight invalid fields

### Image Upload

- Use Next.js API route: `/api/admin/upload`
- Support drag & drop
- Preview before upload
- Progress indicator

---

## 📊 COMPONENT TREE

```
ProductForm
├── ProductFormLayout
│   ├── Header (Product Name)
│   ├── Main Form (70%)
│   │   ├── ShortDescriptionSection
│   │   ├── DescriptionSection
│   │   ├── ProductDetailsSection
│   │   ├── VariantFormEnhanced
│   │   ├── SEOSection
│   │   ├── GiftFeaturesSection
│   │   ├── MediaExtendedSection
│   │   └── CollectionComboSection
│   └── Sidebar (30%)
│       ├── PublishBox
│       ├── CategoriesBox
│       ├── TagsBox
│       ├── FeaturedImageBox
│       ├── ProductGalleryBox
│       ├── ProductDataBox
│       └── ProductLinksBox
└── Actions (Bottom buttons - optional, có thể remove)
```

---

## ✅ CHECKLIST

### Phase 1: Layout
- [ ] Create `ProductFormLayout.tsx`
- [ ] Implement 2-column layout
- [ ] Implement sticky sidebar
- [ ] Responsive design
- [ ] Update `ProductForm.tsx`

### Phase 2: Publish Box
- [x] Create `PublishBox.tsx`
- [x] Implement Publish button
- [x] Implement Save Draft button
- [x] Implement Preview button
- [x] Status selector
- [x] Visibility settings

### Phase 3: Categories & Tags
- [x] Create `CategoriesBox.tsx`
- [x] Multi-select với search
- [x] Create `TagsBox.tsx`
- [x] Tag input với autocomplete

### Phase 4: Media
- [x] Create `FeaturedImageBox.tsx`
- [x] Create `ProductGalleryBox.tsx`
- [x] Image upload functionality
- [x] Drag & drop reorder

### Phase 5: Product Data
- [x] Create `ProductDataBox.tsx`
- [x] Create `ProductLinksBox.tsx`
- [x] Move fields từ main form

### Phase 6: Refactor
- [x] Remove duplicate fields
- [x] Simplify main form
- [x] Test all functionality
- [x] Update documentation

---

## 🚀 NEXT STEPS

1. **Review plan** với team/stakeholder
2. **Start Phase 1:** Create layout structure
3. **Iterate:** Build từng component một
4. **Test:** Test thoroughly trước khi move to next phase
5. **Document:** Update documentation sau khi hoàn thành

---

**Status:** 📋 Ready for Implementation  
**Estimated Time:** 2-3 days for full implementation

