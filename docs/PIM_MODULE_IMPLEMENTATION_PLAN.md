# 📋 KẾ HOẠCH TRIỂN KHAI MODULE PIM (Product Information Management)

**Module:** Quản lý Sản phẩm (Product Information Management - PIM)  
**Phiên bản:** 2.2 (Trash Bin Added)  
**Ngày tạo:** 12/12/2025  
**Trạng thái:** Planning  
**Base:** Custom CMS với MongoDB (không phải WordPress/WooCommerce)

---

## 🎯 MỤC TIÊU

Xây dựng màn hình danh sách sản phẩm (Product Listing) mới với:
- Tìm kiếm & lọc đa chiều
- Quản lý nhanh trạng thái/tồn kho (Inline Edit)
- Xóa mềm/Khôi phục (Soft Delete/Trash Management)
- Bulk Actions nâng cao
- Data Grid hiện đại với UX tối ưu

---

## 📊 PHÂN TÍCH HIỆN TRẠNG

### ✅ Đã có sẵn:
- Product Listing cơ bản (`app/admin/products/page.tsx`)
- API routes (`/api/admin/products`)
- MongoDB schema với products collection
- Bulk Actions cơ bản (delete, status change)
- Search functionality
- Pagination

### ❌ Chưa có:
- Soft Delete (deleted_at field)
- Trash Management (Tab Thùng rác)
- Inline Edit (Price, Stock)
- Advanced Filters (Category tree, Brand, Price range)
- Tab Navigation (All, Active, Out of stock, Trash)
- Quick Inventory Management UI
- Data Grid với cột đầy đủ (Thumbnail, Description, Category, Brand, SKU, Price, Stock, Status)
- Auto-delete sau 30 ngày (Cronjob)

---

## 🗄️ DATABASE SCHEMA CHANGES

### 1. Products Collection - Thêm field `deletedAt`

```typescript
interface MongoProduct {
  // ... existing fields ...
  deletedAt?: Date | null;  // Thời điểm xóa mềm. NULL = chưa xóa
  // ... other fields ...
}
```

### 2. Product Variants - Thêm field `deletedAt` (optional)

```typescript
interface MongoVariant {
  // ... existing fields ...
  deletedAt?: Date | null;  // Để đồng bộ xóa mềm với cha hoặc xóa lẻ
  // ... other fields ...
}
```

**Migration Script:** `scripts/migrate-products-soft-delete.ts`

---

## 📐 API DESIGN

### 1. GET /api/admin/products (Enhanced)

**Query Params:**
- `page`: Số trang (default: 1)
- `per_page`: Số items/trang (default: 20)
- `search`: Tìm kiếm (name, SKU, barcode)
- `status`: `active` | `draft` | `trash` (default: `active`)
- `trashed`: `true` | `false` (để lấy list thùng rác, override status)
- `category`: Category ID
- `brand`: Brand ID (nếu có)
- `price_min`: Giá tối thiểu
- `price_max`: Giá tối đa
- `stock_status`: `instock` | `outofstock` | `onbackorder`

**Response:**
```json
{
  "products": [...],
  "pagination": {
    "total": 100,
    "totalPages": 5,
    "currentPage": 1,
    "perPage": 20,
    "hasNextPage": true,
    "hasPrevPage": false
  },
  "filters": {
    "trashCount": 5  // Số lượng sản phẩm trong thùng rác
  }
}
```

### 2. DELETE /api/admin/products/{id} (Soft Delete)

**Logic:** Set `deletedAt = new Date()`, không xóa khỏi database.

**Response:**
```json
{
  "success": true,
  "message": "Đã chuyển vào thùng rác",
  "product": {...}
}
```

### 3. DELETE /api/admin/products/{id}/force (Force Delete)

**Logic:** Xóa hoàn toàn khỏi database (cần xác nhận lần 2).

**Response:**
```json
{
  "success": true,
  "message": "Đã xóa vĩnh viễn"
}
```

### 4. PATCH /api/admin/products/{id}/restore (Restore)

**Logic:** Set `deletedAt = null`.

**Response:**
```json
{
  "success": true,
  "message": "Đã khôi phục",
  "product": {...}
}
```

### 5. PATCH /api/admin/products/{id}/quick-update (Quick Update)

**Body:**
```json
{
  "price": 150000,  // Optional
  "stockQuantity": 50,  // Optional
  "status": "publish"  // Optional
}
```

**Response:**
```json
{
  "success": true,
  "product": {...}
}
```

### 6. POST /api/admin/products/bulk-action (Bulk Actions)

**Body:**
```json
{
  "ids": ["id1", "id2", "id3"],
  "action": "soft_delete" | "force_delete" | "restore" | "update_status" | "update_price" | "update_stock",
  "value": "publish" | 150000 | 50  // Tùy theo action
}
```

**Response:**
```json
{
  "success": true,
  "updated": 3,
  "failed": 0,
  "message": "Đã cập nhật 3 sản phẩm"
}
```

---

## 🎨 UI/UX DESIGN

### 1. Tab Navigation

```
┌─────────────────────────────────────────────────┐
│ [Tất cả] [Đang bán] [Hết hàng] [Thùng rác (5)]  │
└─────────────────────────────────────────────────┘
```

### 2. Filter & Search Bar

```
┌─────────────────────────────────────────────────────────────┐
│ 🔍 [Tìm kiếm sản phẩm, SKU, Barcode...]                    │
│                                                              │
│ [Danh mục ▼] [Thương hiệu ▼] [Giá: Min-Max] [Lọc nâng cao] │
└─────────────────────────────────────────────────────────────┘
```

### 3. Data Grid Columns

| Checkbox | Sản phẩm | Phân loại | SKU | Giá bán | Tồn kho | Trạng thái | Hành động |
|----------|----------|-----------|-----|---------|---------|------------|-----------|
| ☑ | 🖼️ + Tên + Mô tả | Category + Brand | SKU (click to copy) | 💰 (inline edit) | 📦 (inline edit) | Badge + Toggle | ⋮ Menu |

### 4. Bulk Actions Bar

```
┌─────────────────────────────────────────────────────────────┐
│ Đã chọn 5 sản phẩm                                           │
│ [Xóa tạm] [Cập nhật trạng thái] [Cập nhật giá/kho] [Bỏ chọn]│
└─────────────────────────────────────────────────────────────┘
```

### 5. Empty States

- **Thùng rác trống:** Icon vui vẻ "Thùng rác sạch sẽ" + message
- **Không có sản phẩm:** Icon + message + CTA "Thêm sản phẩm"

### 6. Feedback & Notifications

- **Xóa tạm:** Toast "Đã chuyển vào thùng rác. [Hoàn tác]"
- **Xóa vĩnh viễn:** Modal xác nhận màu đỏ cảnh báo
- **Khôi phục:** Toast "Đã khôi phục sản phẩm"
- **Cập nhật nhanh:** Toast "Đã cập nhật giá/kho"

---

## 📅 IMPLEMENTATION PHASES

### **PHASE 1: Database & API Foundation** (Tuần 1)

**Mục tiêu:** Thêm Soft Delete support vào database và API

#### Task 1.1: Database Migration
- [ ] **PIM-001** Tạo migration script `scripts/migrate-products-soft-delete.ts`
  - Thêm field `deletedAt?: Date` vào products collection
  - Thêm field `deletedAt?: Date` vào variants (nếu cần)
  - Tạo index: `{ deletedAt: 1 }` cho performance
  - Chạy migration trên database

#### Task 1.2: API Routes - Soft Delete
- [ ] **PIM-002** Update `GET /api/admin/products`
  - Thêm query param `trashed: boolean`
  - Thêm query param `status: 'active' | 'draft' | 'trash'`
  - Logic: Nếu `trashed=true` hoặc `status='trash'`, query `deletedAt: { $ne: null }`
  - Logic: Mặc định query `deletedAt: null` (chỉ lấy sản phẩm chưa xóa)
  - Trả về `trashCount` trong response

- [ ] **PIM-003** Update `DELETE /api/admin/products/{id}`
  - Thay đổi từ hard delete sang soft delete
  - Set `deletedAt = new Date()`
  - Set `status = 'trash'` (optional, để dễ filter)
  - Trả về success message

- [ ] **PIM-004** Tạo `DELETE /api/admin/products/{id}/force`
  - Xóa hoàn toàn khỏi database
  - Cần xác nhận lần 2 (client-side)
  - Trả về success message

- [ ] **PIM-005** Tạo `PATCH /api/admin/products/{id}/restore`
  - Set `deletedAt = null`
  - Set `status = 'draft'` (hoặc giữ nguyên status cũ)
  - Trả về product đã restore

#### Task 1.3: API Routes - Quick Update
- [ ] **PIM-006** Tạo `PATCH /api/admin/products/{id}/quick-update`
  - Support update: `price`, `stockQuantity`, `status`
  - Validation: price >= 0, stockQuantity >= 0
  - Trả về product đã update

#### Task 1.4: API Routes - Bulk Actions
- [ ] **PIM-007** Tạo `POST /api/admin/products/bulk-action`
  - Support actions: `soft_delete`, `force_delete`, `restore`, `update_status`, `update_price`, `update_stock`
  - Validation: ids array không rỗng
  - Xử lý từng product, trả về số lượng thành công/thất bại
  - Transaction support (nếu cần)

#### Task 1.5: Testing
- [ ] **PIM-008** Tạo test script `scripts/test-pim-api.ts`
  - Test soft delete
  - Test restore
  - Test force delete
  - Test bulk actions
  - Test quick update

**Deliverables:**
- ✅ Migration script hoàn thành
- ✅ API routes đầy đủ với soft delete
- ✅ Test scripts pass

---

### **PHASE 2: Frontend - Data Grid & Tab Navigation** (Tuần 2)

**Mục tiêu:** Xây dựng UI Data Grid với Tab Navigation và cột đầy đủ

#### Task 2.1: Component Structure
- [ ] **PIM-009** Tạo component `components/admin/products/ProductDataGrid.tsx`
  - Data Grid với Table component từ shadcn/ui
  - Columns: Checkbox, Sản phẩm, Phân loại, SKU, Giá bán, Tồn kho, Trạng thái, Hành động
  - Loading state với Skeleton
  - Empty state

- [ ] **PIM-010** Tạo component `components/admin/products/ProductListTabs.tsx`
  - Tab Navigation: Tất cả, Đang bán, Hết hàng, Thùng rác
  - Hiển thị số lượng trong tab "Thùng rác" (VD: "Thùng rác (5)")
  - Active tab state management

- [ ] **PIM-011** Tạo component `components/admin/products/ProductRow.tsx`
  - Row component với đầy đủ thông tin
  - Thumbnail image với Next.js Image
  - Product name (click để edit)
  - Short description (3 dòng đầu, truncate)
  - Category + Brand display
  - SKU với click to copy
  - Price display (với format VND)
  - Stock display với color labels (Xanh >10, Vàng <10, Đỏ =0)
  - Status badge + Toggle switch
  - Action menu (⋮) với dropdown

#### Task 2.2: Product Listing Page Update
- [ ] **PIM-012** Refactor `app/admin/products/page.tsx`
  - Tích hợp ProductListTabs
  - Tích hợp ProductDataGrid
  - State management cho active tab
  - Fetch products dựa trên active tab
  - Update URL query params khi đổi tab

#### Task 2.3: Product Cell Components
- [ ] **PIM-013** Tạo `components/admin/products/ProductCell.tsx`
  - Thumbnail + Name + Description
  - Click name để navigate to edit page

- [ ] **PIM-014** Tạo `components/admin/products/CategoryBrandCell.tsx`
  - Display category name
  - Display brand name (nếu có)
  - Link to category page (nếu cần)

- [ ] **PIM-015** Tạo `components/admin/products/SKUCell.tsx`
  - Display SKU
  - Click to copy functionality
  - Toast notification khi copy thành công

- [ ] **PIM-016** Tạo `components/admin/products/PriceCell.tsx`
  - Display price với format VND
  - Hiển thị khoảng giá (Min - Max) cho variable products
  - Icon bút chì để inline edit (sẽ implement ở Phase 3)

- [ ] **PIM-017** Tạo `components/admin/products/StockCell.tsx`
  - Display stock quantity
  - Color labels: Xanh (>10), Vàng (<10), Đỏ (0)
  - Icon bút chì để inline edit (sẽ implement ở Phase 3)

- [ ] **PIM-018** Tạo `components/admin/products/StatusCell.tsx`
  - Status badge (Active/Inactive/Draft/Trash)
  - Toggle switch để bật/tắt nhanh
  - Update status via API

#### Task 2.4: Action Menu
- [ ] **PIM-019** Tạo `components/admin/products/ProductActionMenu.tsx`
  - Dropdown menu với options:
    - Xem chi tiết
    - Nhân bản (Duplicate)
    - Xóa tạm (Move to Trash) - chỉ hiện khi không ở tab Trash
    - Khôi phục (Restore) - chỉ hiện khi ở tab Trash
    - Xóa vĩnh viễn (Force Delete) - chỉ hiện khi ở tab Trash
  - Icons cho mỗi action
  - Confirmation dialogs

**Deliverables:**
- ✅ Data Grid component hoàn chỉnh
- ✅ Tab Navigation hoạt động
- ✅ Tất cả columns hiển thị đúng
- ✅ Action menu đầy đủ

---

### **PHASE 3: Inline Edit & Quick Update** (Tuần 3)

**Mục tiêu:** Implement Inline Edit cho Price và Stock

#### Task 3.1: Inline Edit Components
- [ ] **PIM-020** Tạo `components/admin/products/InlinePriceEditor.tsx`
  - Click icon bút chì → hiện input field
  - Input với format VND
  - Validation: price >= 0
  - Save button + Cancel button
  - Loading state khi đang save
  - Toast notification khi save thành công/thất bại
  - Call API `PATCH /api/admin/products/{id}/quick-update`

- [ ] **PIM-021** Tạo `components/admin/products/InlineStockEditor.tsx`
  - Click icon bút chì → hiện input field
  - Input với type number
  - Validation: stockQuantity >= 0
  - +/- buttons để điều chỉnh nhanh
  - Save button + Cancel button
  - Loading state khi đang save
  - Toast notification khi save thành công/thất bại
  - Call API `PATCH /api/admin/products/{id}/quick-update`

#### Task 3.2: Integrate Inline Edit
- [ ] **PIM-022** Update `PriceCell.tsx`
  - Tích hợp InlinePriceEditor
  - Show/hide editor based on state

- [ ] **PIM-023** Update `StockCell.tsx`
  - Tích hợp InlineStockEditor
  - Show/hide editor based on state

#### Task 3.3: Quick Update Hook
- [ ] **PIM-024** Tạo `lib/hooks/useQuickUpdateProduct.ts`
  - Hook để handle quick update
  - Optimistic update (update UI trước, rollback nếu fail)
  - Error handling
  - Loading state

**Deliverables:**
- ✅ Inline Edit cho Price hoạt động
- ✅ Inline Edit cho Stock hoạt động
- ✅ Optimistic update smooth
- ✅ Error handling đầy đủ

---

### **PHASE 4: Advanced Filters & Search** (Tuần 4)

**Mục tiêu:** Implement Advanced Filters và Search nâng cao

#### Task 4.1: Filter Components
- [ ] **PIM-025** Tạo `components/admin/products/ProductFilters.tsx`
  - Category Tree Select (dropdown cây danh mục)
  - Brand Select (dropdown thương hiệu - nếu có)
  - Price Range (Min - Max inputs)
  - Stock Status filter (instock/outofstock/onbackorder)
  - Clear all filters button

- [ ] **PIM-026** Tạo `components/admin/products/CategoryTreeSelect.tsx`
  - Tree select component với hierarchical categories
  - Fetch categories từ API
  - Display tree structure
  - Multi-select support (optional)

- [ ] **PIM-027** Tạo `components/admin/products/PriceRangeFilter.tsx`
  - Min price input
  - Max price input
  - Validation: min <= max
  - Format VND

#### Task 4.2: Search Enhancement
- [ ] **PIM-028** Update Search Bar
  - Full-text search trên name
  - Exact search trên SKU
  - Search trên barcode (nếu có)
  - Debounce 300ms
  - Search suggestions (optional, future enhancement)

#### Task 4.3: Filter State Management
- [ ] **PIM-029** Tạo `lib/hooks/useProductFilters.ts`
  - Hook để manage filter state
  - URL query params sync
  - Clear filters function
  - Apply filters function

#### Task 4.4: API Integration
- [ ] **PIM-030** Update `GET /api/admin/products`
  - Support filter params: `category`, `brand`, `price_min`, `price_max`, `stock_status`
  - Build MongoDB query với filters
  - Return filtered results

**Deliverables:**
- ✅ Advanced Filters hoạt động
- ✅ Category Tree Select hoạt động
- ✅ Price Range filter hoạt động
- ✅ Search enhancement hoàn thành
- ✅ URL query params sync

---

### **PHASE 5: Trash Management & Bulk Actions** (Tuần 5)

**Mục tiêu:** Hoàn thiện Trash Management và Bulk Actions nâng cao

#### Task 5.1: Trash Management UI
- [ ] **PIM-031** Update Trash Tab
  - Hiển thị sản phẩm có `deletedAt IS NOT NULL`
  - Action menu chỉ hiện: Khôi phục, Xóa vĩnh viễn
  - Empty state: "Thùng rác sạch sẽ" với icon vui vẻ
  - Warning message: "Sản phẩm trong thùng rác sẽ tự động bị xóa sau 30 ngày"

- [ ] **PIM-032** Tạo `components/admin/products/RestoreProductModal.tsx`
  - Modal xác nhận khôi phục
  - Hiển thị thông tin sản phẩm
  - Restore button

- [ ] **PIM-033** Tạo `components/admin/products/ForceDeleteModal.tsx`
  - Modal xác nhận màu đỏ cảnh báo
  - Message: "Hành động này không thể hoàn tác"
  - Hiển thị thông tin sản phẩm
  - Force delete button

#### Task 5.2: Bulk Actions Enhancement
- [ ] **PIM-034** Update `components/admin/products/BulkActionsBar.tsx`
  - Actions cho normal tab:
    - Xóa tạm (Move to Trash)
    - Cập nhật trạng thái (Published/Draft)
    - Cập nhật giá hàng loạt
    - Cập nhật kho hàng loạt
  - Actions cho Trash tab:
    - Khôi phục các mục đã chọn
    - Xóa vĩnh viễn các mục đã chọn
  - Progress indicator khi đang xử lý
  - Toast notification với số lượng thành công/thất bại

- [ ] **PIM-035** Tạo `components/admin/products/BulkUpdatePriceModal.tsx`
  - Modal để nhập giá mới
  - Apply to all selected products
  - Preview số lượng sản phẩm sẽ được update

- [ ] **PIM-036** Tạo `components/admin/products/BulkUpdateStockModal.tsx`
  - Modal để nhập số lượng kho mới
  - Options: Set to value, Add/Subtract value
  - Apply to all selected products
  - Preview số lượng sản phẩm sẽ được update

#### Task 5.3: Feedback & Notifications
- [ ] **PIM-037** Implement Toast Notifications
  - Toast khi xóa tạm: "Đã chuyển vào thùng rác. [Hoàn tác]"
  - Toast khi khôi phục: "Đã khôi phục sản phẩm"
  - Toast khi xóa vĩnh viễn: "Đã xóa vĩnh viễn"
  - Toast khi bulk actions: "Đã cập nhật X sản phẩm"
  - Undo functionality (optional, future enhancement)

**Deliverables:**
- ✅ Trash Management UI hoàn chỉnh
- ✅ Bulk Actions nâng cao hoạt động
- ✅ Toast notifications đầy đủ
- ✅ Confirmation modals đầy đủ

---

### **PHASE 6: Auto-Delete Cronjob & Polish** (Tuần 6)

**Mục tiêu:** Auto-delete sau 30 ngày và polish UI/UX

#### Task 6.1: Auto-Delete Cronjob
- [ ] **PIM-038** Tạo API route `POST /api/admin/products/auto-cleanup-trash`
  - Logic: Tìm sản phẩm có `deletedAt < (now - 30 days)`
  - Xóa vĩnh viễn các sản phẩm này
  - Log số lượng đã xóa
  - Protected route (chỉ admin có thể trigger)

- [ ] **PIM-039** Setup Cronjob
  - Option 1: Vercel Cron Jobs (nếu deploy trên Vercel)
  - Option 2: External cron service (cron-job.org, EasyCron)
  - Option 3: Node.js cron package (nếu có server riêng)
  - Schedule: Chạy mỗi ngày lúc 2:00 AM
  - Error handling & logging

#### Task 6.2: UI/UX Polish
- [ ] **PIM-040** Improve Loading States
  - Skeleton loaders cho Data Grid
  - Loading overlay khi đang fetch
  - Optimistic updates smooth

- [ ] **PIM-041** Improve Empty States
  - Empty state cho từng tab
  - Empty state cho search results
  - Empty state cho filters
  - CTA buttons (Thêm sản phẩm, Xóa bộ lọc)

- [ ] **PIM-042** Improve Error Handling
  - Error boundaries
  - Error messages user-friendly
  - Retry functionality

- [ ] **PIM-043** Mobile Responsiveness
  - Responsive Data Grid (horizontal scroll hoặc card view)
  - Mobile-friendly filters
  - Touch-friendly actions

#### Task 6.3: Performance Optimization
- [ ] **PIM-044** Optimize Data Grid
  - Virtual scrolling (nếu có >100 items)
  - Lazy loading images
  - Debounce search/filters

- [ ] **PIM-045** Optimize API Calls
  - Caching với React Query
  - Request deduplication
  - Optimistic updates

#### Task 6.4: Documentation
- [ ] **PIM-046** Tạo `docs/PIM_MODULE_USER_GUIDE.md`
  - Hướng dẫn sử dụng Module PIM
  - Screenshots
  - FAQs

- [ ] **PIM-047** Update API Documentation
  - Document tất cả API routes
  - Request/Response examples
  - Error codes

**Deliverables:**
- ✅ Auto-delete cronjob hoạt động
- ✅ UI/UX polished
- ✅ Performance optimized
- ✅ Documentation đầy đủ

---

## 📊 PROGRESS TRACKING

### Phase 1: Database & API Foundation
- **Status:** 🔴 Not Started
- **Progress:** 0/8 tasks (0%)

### Phase 2: Frontend - Data Grid & Tab Navigation
- **Status:** 🔴 Not Started
- **Progress:** 0/11 tasks (0%)

### Phase 3: Inline Edit & Quick Update
- **Status:** 🔴 Not Started
- **Progress:** 0/5 tasks (0%)

### Phase 4: Advanced Filters & Search
- **Status:** 🔴 Not Started
- **Progress:** 0/6 tasks (0%)

### Phase 5: Trash Management & Bulk Actions
- **Status:** 🔴 Not Started
- **Progress:** 0/7 tasks (0%)

### Phase 6: Auto-Delete Cronjob & Polish
- **Status:** 🔴 Not Started
- **Progress:** 0/8 tasks (0%)

**Tổng tiến độ:** 0/45 tasks (0%)

---

## 🔗 RELATED FILES

### Backend
- `app/api/admin/products/route.ts` - Main products API
- `app/api/admin/products/[id]/route.ts` - Single product API
- `app/api/admin/products/[id]/quick-update/route.ts` - Quick update API (new)
- `app/api/admin/products/[id]/restore/route.ts` - Restore API (new)
- `app/api/admin/products/bulk-action/route.ts` - Bulk actions API (new)
- `app/api/admin/products/auto-cleanup-trash/route.ts` - Auto cleanup API (new)
- `scripts/migrate-products-soft-delete.ts` - Migration script (new)

### Frontend
- `app/admin/products/page.tsx` - Main listing page (refactor)
- `components/admin/products/ProductDataGrid.tsx` - Data Grid component (new)
- `components/admin/products/ProductListTabs.tsx` - Tab navigation (new)
- `components/admin/products/ProductRow.tsx` - Row component (new)
- `components/admin/products/ProductCell.tsx` - Product cell (new)
- `components/admin/products/CategoryBrandCell.tsx` - Category/Brand cell (new)
- `components/admin/products/SKUCell.tsx` - SKU cell (new)
- `components/admin/products/PriceCell.tsx` - Price cell (new)
- `components/admin/products/StockCell.tsx` - Stock cell (new)
- `components/admin/products/StatusCell.tsx` - Status cell (new)
- `components/admin/products/ProductActionMenu.tsx` - Action menu (new)
- `components/admin/products/InlinePriceEditor.tsx` - Inline price editor (new)
- `components/admin/products/InlineStockEditor.tsx` - Inline stock editor (new)
- `components/admin/products/ProductFilters.tsx` - Advanced filters (new)
- `components/admin/products/CategoryTreeSelect.tsx` - Category tree (new)
- `components/admin/products/PriceRangeFilter.tsx` - Price range (new)
- `components/admin/products/BulkActionsBar.tsx` - Bulk actions bar (new)
- `components/admin/products/RestoreProductModal.tsx` - Restore modal (new)
- `components/admin/products/ForceDeleteModal.tsx` - Force delete modal (new)
- `components/admin/products/BulkUpdatePriceModal.tsx` - Bulk price modal (new)
- `components/admin/products/BulkUpdateStockModal.tsx` - Bulk stock modal (new)

### Hooks
- `lib/hooks/useQuickUpdateProduct.ts` - Quick update hook (new)
- `lib/hooks/useProductFilters.ts` - Filters hook (new)

### Utils
- `lib/utils/productMapper.ts` - Product mapper (update để support deletedAt)

---

## ⚠️ NOTES & CONSIDERATIONS

1. **Soft Delete vs Hard Delete:**
   - Mặc định: Soft delete (set deletedAt)
   - Force delete chỉ khi user xác nhận lần 2
   - Auto-delete sau 30 ngày

2. **Performance:**
   - Index `deletedAt` field để query nhanh
   - Pagination cho large datasets
   - Virtual scrolling nếu cần

3. **Security:**
   - Tất cả API routes cần authentication
   - Force delete cần xác nhận lần 2
   - Bulk actions cần validation

4. **UX:**
   - Optimistic updates cho smooth experience
   - Toast notifications cho feedback
   - Loading states rõ ràng
   - Error handling user-friendly

5. **Mobile:**
   - Responsive design
   - Touch-friendly actions
   - Horizontal scroll hoặc card view cho Data Grid

---

**Last Updated:** 12/12/2025  
**Next Review:** Sau khi hoàn thành Phase 1

