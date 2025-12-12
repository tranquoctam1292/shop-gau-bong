# 📋 KẾ HOẠCH XÂY DỰNG MODULE QUẢN LÝ DANH MỤC SẢN PHẨM

**Ngày tạo:** 2025-01-XX  
**Dựa trên:** `them_tinh_nang.md` v1.0  
**Tech Stack:** Next.js 14 + MongoDB + Custom CMS API

---

## 🎯 TỔNG QUAN

Xây dựng module quản lý danh mục sản phẩm với đầy đủ tính năng CRUD, phân cấp (hierarchy), soft delete, và tree structure API.

---

## 📊 THAY ĐỔI SCHEMA MONGODB

### Schema hiện tại:
```typescript
{
  _id: ObjectId,
  name: string,
  slug: string,
  description?: string,
  parentId?: string | null,
  imageUrl?: string,
  position: number,
  count?: number,
  createdAt: Date,
  updatedAt: Date
}
```

### Schema mới (cần thêm):
```typescript
{
  // ... existing fields ...
  status: 'active' | 'inactive',        // NEW: Default 'active'
  metaTitle?: string,                    // NEW: SEO title
  metaDesc?: string,                     // NEW: SEO description (max 500 chars)
  deletedAt?: Date | null,               // NEW: Soft delete (null = not deleted)
}
```

### Indexes cần tạo:
```typescript
categories.createIndex({ slug: 1 }, { unique: true });
categories.createIndex({ parentId: 1 });
categories.createIndex({ position: 1 });
categories.createIndex({ status: 1 });           // NEW
categories.createIndex({ deletedAt: 1 });        // NEW: For soft delete queries
```

---

## 🔧 PHASE 1: BACKEND - SCHEMA & API CORE

### 1.1. Cập nhật MongoDB Schema
- [x] Thêm fields: `status`, `metaTitle`, `metaDesc`, `deletedAt` vào schema
- [x] Tạo indexes mới cho `status` và `deletedAt`
- [x] Migration script: Update existing categories với `status: 'active'`, `deletedAt: null`

### 1.2. Cập nhật API Routes hiện có

#### `GET /api/admin/categories`
- [x] Thêm query params: `type` (tree | flat), `status` (active | inactive | all)
- [x] Logic tree structure: Build nested `children` array từ flat list
- [x] Filter `deletedAt: null` (chỉ lấy chưa xóa)
- [ ] Performance: Cache tree structure (Redis hoặc in-memory) nếu < 1000 categories (Optional - có thể thêm sau)

#### `POST /api/admin/categories`
- [x] Validation: `name` required, `slug` auto-generate nếu null
- [x] Slug uniqueness: Auto-add suffix (`-1`, `-2`) nếu trùng
- [x] Default values: `status: 'active'`, `position: 0`, `deletedAt: null`
- [x] Validate `parentId` exists và không phải chính nó

#### `PUT /api/admin/categories/[id]`
- [x] Circular reference check: Validate `parentId` không phải con cháu của chính nó
- [x] Prevent self-reference: `parentId !== id`
- [x] Update `metaTitle`, `metaDesc`, `status`, `imageUrl`

#### `DELETE /api/admin/categories/[id]`
- [x] **Soft Delete**: Set `deletedAt: new Date()` thay vì `deleteOne()`
- [x] Validation: Check có children không (`parentId === id`)
- [x] Validation: Check có products không (`category === id`)
- [x] Return error 400 nếu có children/products

### 1.3. API Endpoints mới

#### `GET /api/admin/categories/tree`
- [x] Trả về tree structure với `children` nested
- [x] Filter `deletedAt: null` và `status: 'active'` (hoặc theo query param)
- [x] Performance: < 200ms với < 1000 categories (tracking duration)

#### `PUT /api/admin/categories/[id]/toggle-status`
- [x] Toggle `status` giữa `active` và `inactive`
- [x] Quick action từ list view

#### `PUT /api/admin/categories/reorder`
- [x] Body: `{ items: [{ id, position }] }`
- [x] Bulk update `position` cho nhiều categories

### 1.4. Helper Functions
- [x] `generateUniqueSlug(name, existingSlugs)`: Auto-generate với suffix
- [x] `checkCircularReference(categoryId, newParentId)`: Recursive check
- [x] `buildCategoryTree(flatList)`: Convert flat → tree structure
- [x] `getCategoryDescendants(categoryId)`: Lấy tất cả con cháu (cho validation)

### 1.5. Cập nhật `mapMongoCategory()`
- [x] Map `status`, `metaTitle`, `metaDesc`, `deletedAt`
- [x] Filter `deletedAt: null` trong default queries

---

## 🎨 PHASE 2: FRONTEND - LIST VIEW & FORM

### 2.1. Cập nhật List Page (`/admin/categories`)

#### Layout 2 cột (theo `them_tinh_nang.md` cũ):
- [x] **Cột trái (30%, sticky)**: Form "Thêm danh mục mới"
- [x] **Cột phải (70%)**: Bảng danh sách với hierarchy tree

#### Bảng danh sách:
- [x] **Tree View**: Expandable rows hoặc indent để hiển thị hierarchy
- [x] **Columns**: Checkbox, Thumbnail (50x50px), Name (với indent), Slug, Status (badge), Count, Actions
- [x] **Status Badge**: Active (green) / Inactive (gray) với toggle button
- [x] **Row Actions**: Edit, Toggle Status, Delete (soft)
- [ ] **Row Actions**: "Add Sub-category" (sẽ làm trong Phase 3)
- [x] **Bulk Actions**: Checkbox selection + bulk delete/toggle status

#### Filter & Search:
- [x] Filter by status (Active / Inactive / All)
- [x] Search by name/slug
- [x] View mode: Tree / Flat

### 2.2. Form Component (`CategoryForm`)

#### Fields:
- [x] **Name**: Text input, required, auto-generate slug on blur
- [x] **Slug**: Text input với nút "Regenerate" bên cạnh
- [x] **Parent Category**: Searchable dropdown (Select2-like) với hierarchy display
  - [x] Trong Edit mode: Disable chính nó và các con của nó
- [x] **Description**: Textarea
- [x] **Image Upload**: Widget upload ảnh (URL-based - file upload sẽ làm trong Phase 3)
  - [x] Validation: Max 2MB, JPG/PNG/WEBP, khuyến nghị 500x500px (hiển thị trong placeholder)
- [x] **Status**: Toggle switch (Active/Inactive) - Radio buttons
- [x] **SEO Section**:
  - [x] Meta Title: Text input (max 255 chars)
  - [x] Meta Description: Textarea (max 500 chars)
- [x] **Position**: Number input (default 0)

#### Validation:
- [x] Realtime validation cho Name, Slug
- [x] Slug uniqueness check (debounced 500ms)
- [x] Circular reference warning khi chọn parent

---

## ⚡ PHASE 3: TÍNH NĂNG NÂNG CAO

### 3.1. Drag & Drop Sorting
- [x] Tích hợp `@dnd-kit/core` (đã có sẵn trong project)
- [x] Drag handle icon (GripVertical) ở đầu mỗi row
- [x] Update `position` khi drag & drop
- [x] API: `PUT /api/admin/categories/reorder` (✅ đã có)
- [ ] Support re-parenting: Kéo category con sang parent khác (Advanced - có thể làm sau)

### 3.2. Quick Edit (Inline)
- [x] Button "Quick Edit" (Pencil icon) → Inline input cho Name/Slug
- [x] API: `PUT /api/admin/categories/[id]` (sử dụng endpoint hiện có)
- [x] Save button với keyboard shortcuts (Ctrl+Enter, Esc)

### 3.3. Add Sub-category Quick Action
- [x] Button "Add Sub-category" trong row actions
- [x] Mở modal/form với `parentId` đã pre-filled
- [x] Sau khi tạo → Auto-expand parent row trong tree view

### 3.4. Image Upload Widget
- [x] Tích hợp MediaLibraryModal (đã có sẵn) + URL input fallback
- [x] Preview thumbnail
- [x] Validation: File size, format, dimensions (hiển thị trong placeholder)

---

## 🔗 PHASE 4: TÍCH HỢP & POLISH

### 4.1. Tích hợp vào ProductForm
- [x] Widget chọn danh mục trong sidebar ProductForm
- [x] Tabs: "All Categories" / "Most Used"
- [x] Hierarchy tree với checkbox (indent)
- [x] Primary Category selection (Star icon)
- [x] Inline "Add Category" form

### 4.2. Mobile Responsive
- [x] Form và table stack trên mobile (không 2 cột)
- [x] Touch-friendly drag handles (min-h-[44px])
- [x] Mobile-optimized tree view (collapse/expand)

### 4.3. Performance & Caching
- [x] Cache tree structure API response (React Query - useCategories hook)
- [x] Debounce search/filter (300ms)
- [ ] Lazy load children trong tree view (nếu > 100 categories) - Optional

### 4.4. Error Handling & UX
- [x] Toast notifications cho success/error (thay thế alert)
- [x] Loading states cho async operations
- [x] Confirm dialog cho delete/toggle status (browser confirm - có thể nâng cấp sau)
- [x] Error messages rõ ràng (Vietnamese)

---

## 🧪 TESTING CHECKLIST

### Backend:
- [ ] Tạo danh mục root thành công
- [ ] Tạo danh mục con (Level 2, 3) thành công
- [ ] Chọn parent là chính nó → Fail validation
- [ ] Chọn parent là con của chính nó → Fail (circular reference)
- [ ] Xóa danh mục có con → Error 400
- [ ] Xóa danh mục có products → Error 400
- [ ] Soft delete: `deletedAt` được set, không xuất hiện trong list
- [ ] Slug trùng → Auto-add suffix (`-1`, `-2`)
- [ ] Tree API trả về < 200ms với 1000 categories

### Frontend:
- [ ] Form validation hoạt động đúng
- [ ] Tree view hiển thị hierarchy đúng
- [ ] Drag & drop update position
- [ ] Quick edit save thành công
- [ ] Toggle status hoạt động
- [ ] Mobile responsive

---

## 📝 NOTES & ADJUSTMENTS

### Khác biệt với spec gốc:
1. **API Routes**: Sử dụng `/api/admin/categories` (không phải `/api/v1/admin/categories`)
2. **MongoDB**: Không có Foreign Key, validate trong code
3. **Soft Delete**: Implement `deletedAt` thay vì hard delete
4. **Image Upload**: URL-based hoặc file upload (tùy infrastructure)
5. **Caching**: React Query cho frontend, có thể thêm Redis cho backend nếu cần

### Performance Targets:
- Tree API: < 200ms với < 1000 categories
- Form submit: < 500ms
- List render: < 100ms với < 100 categories visible

---

## 🚀 ESTIMATED TIMELINE

- **Phase 1 (Backend)**: 2-3 ngày
- **Phase 2 (Frontend Core)**: 3-4 ngày
- **Phase 3 (Advanced Features)**: 2-3 ngày
- **Phase 4 (Integration & Polish)**: 1-2 ngày

**Total**: ~8-12 ngày làm việc

---

**Status**: 📋 Planning Complete - Ready for Implementation

