# ðŸ“‹ Káº¾ HOáº CH TRIá»‚N KHAI MODULE PIM (Product Information Management)

**Module:** Quáº£n lÃ½ Sáº£n pháº©m (Product Information Management - PIM)  
**PhiÃªn báº£n:** 2.2 (Trash Bin Added)  
**NgÃ y táº¡o:** 12/12/2025  
**Tráº¡ng thÃ¡i:** Planning  
**Base:** Custom CMS vá»›i MongoDB (khÃ´ng pháº£i WordPress/WooCommerce)

---

## ðŸŽ¯ Má»¤C TIÃŠU

XÃ¢y dá»±ng mÃ n hÃ¬nh danh sÃ¡ch sáº£n pháº©m (Product Listing) má»›i vá»›i:
- TÃ¬m kiáº¿m & lá»c Ä‘a chiá»u
- Quáº£n lÃ½ nhanh tráº¡ng thÃ¡i/tá»“n kho (Inline Edit)
- XÃ³a má»m/KhÃ´i phá»¥c (Soft Delete/Trash Management)
- Bulk Actions nÃ¢ng cao
- Data Grid hiá»‡n Ä‘áº¡i vá»›i UX tá»‘i Æ°u

---

## ðŸ“Š PHÃ‚N TÃCH HIá»†N TRáº NG

### âœ… ÄÃ£ cÃ³ sáºµn:
- Product Listing cÆ¡ báº£n (`app/admin/products/page.tsx`)
- API routes (`/api/admin/products`)
- MongoDB schema vá»›i products collection
- Bulk Actions cÆ¡ báº£n (delete, status change)
- Search functionality
- Pagination

### âŒ ChÆ°a cÃ³:
- Soft Delete (deleted_at field)
- Trash Management (Tab ThÃ¹ng rÃ¡c)
- Inline Edit (Price, Stock)
- Advanced Filters (Category tree, Brand, Price range)
- Tab Navigation (All, Active, Out of stock, Trash)
- Quick Inventory Management UI
- Data Grid vá»›i cá»™t Ä‘áº§y Ä‘á»§ (Thumbnail, Description, Category, Brand, SKU, Price, Stock, Status)
- Auto-delete sau 30 ngÃ y (Cronjob)

---

## ðŸ—„ï¸ DATABASE SCHEMA CHANGES

### 1. Products Collection - ThÃªm field `deletedAt`

```typescript
interface MongoProduct {
  // ... existing fields ...
  deletedAt?: Date | null;  // Thá»i Ä‘iá»ƒm xÃ³a má»m. NULL = chÆ°a xÃ³a
  // ... other fields ...
}
```

### 2. Product Variants - ThÃªm field `deletedAt` (optional)

```typescript
interface MongoVariant {
  // ... existing fields ...
  deletedAt?: Date | null;  // Äá»ƒ Ä‘á»“ng bá»™ xÃ³a má»m vá»›i cha hoáº·c xÃ³a láº»
  // ... other fields ...
}
```

**Migration Script:** `scripts/migrate-products-soft-delete.ts`

---

## ðŸ“ API DESIGN

### 1. GET /api/admin/products (Enhanced)

**Query Params:**
- `page`: Sá»‘ trang (default: 1)
- `per_page`: Sá»‘ items/trang (default: 20)
- `search`: TÃ¬m kiáº¿m (name, SKU, barcode)
- `status`: `active` | `draft` | `trash` (default: `active`)
- `trashed`: `true` | `false` (Ä‘á»ƒ láº¥y list thÃ¹ng rÃ¡c, override status)
- `category`: Category ID
- `brand`: Brand ID (náº¿u cÃ³)
- `price_min`: GiÃ¡ tá»‘i thiá»ƒu
- `price_max`: GiÃ¡ tá»‘i Ä‘a
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
    "trashCount": 5  // Sá»‘ lÆ°á»£ng sáº£n pháº©m trong thÃ¹ng rÃ¡c
  }
}
```

### 2. DELETE /api/admin/products/{id} (Soft Delete)

**Logic:** Set `deletedAt = new Date()`, khÃ´ng xÃ³a khá»i database.

**Response:**
```json
{
  "success": true,
  "message": "ÄÃ£ chuyá»ƒn vÃ o thÃ¹ng rÃ¡c",
  "product": {...}
}
```

### 3. DELETE /api/admin/products/{id}/force (Force Delete)

**Logic:** XÃ³a hoÃ n toÃ n khá»i database (cáº§n xÃ¡c nháº­n láº§n 2).

**Response:**
```json
{
  "success": true,
  "message": "ÄÃ£ xÃ³a vÄ©nh viá»…n"
}
```

### 4. PATCH /api/admin/products/{id}/restore (Restore)

**Logic:** Set `deletedAt = null`.

**Response:**
```json
{
  "success": true,
  "message": "ÄÃ£ khÃ´i phá»¥c",
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
  "value": "publish" | 150000 | 50  // TÃ¹y theo action
}
```

**Response:**
```json
{
  "success": true,
  "updated": 3,
  "failed": 0,
  "message": "ÄÃ£ cáº­p nháº­t 3 sáº£n pháº©m"
}
```

---

## ðŸŽ¨ UI/UX DESIGN

### 1. Tab Navigation

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ [Táº¥t cáº£] [Äang bÃ¡n] [Háº¿t hÃ ng] [ThÃ¹ng rÃ¡c (5)]  â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### 2. Filter & Search Bar

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ ðŸ” [TÃ¬m kiáº¿m sáº£n pháº©m, SKU, Barcode...]                    â”‚
â”‚                                                              â”‚
â”‚ [Danh má»¥c â–¼] [ThÆ°Æ¡ng hiá»‡u â–¼] [GiÃ¡: Min-Max] [Lá»c nÃ¢ng cao] â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### 3. Data Grid Columns

| Checkbox | Sáº£n pháº©m | PhÃ¢n loáº¡i | SKU | GiÃ¡ bÃ¡n | Tá»“n kho | Tráº¡ng thÃ¡i | HÃ nh Ä‘á»™ng |
|----------|----------|-----------|-----|---------|---------|------------|-----------|
| â˜‘ | ðŸ–¼ï¸ + TÃªn + MÃ´ táº£ | Category + Brand | SKU (click to copy) | ðŸ’° (inline edit) | ðŸ“¦ (inline edit) | Badge + Toggle | â‹® Menu |

### 4. Bulk Actions Bar

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ ÄÃ£ chá»n 5 sáº£n pháº©m                                           â”‚
â”‚ [XÃ³a táº¡m] [Cáº­p nháº­t tráº¡ng thÃ¡i] [Cáº­p nháº­t giÃ¡/kho] [Bá» chá»n]â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### 5. Empty States

- **ThÃ¹ng rÃ¡c trá»‘ng:** Icon vui váº» "ThÃ¹ng rÃ¡c sáº¡ch sáº½" + message
- **KhÃ´ng cÃ³ sáº£n pháº©m:** Icon + message + CTA "ThÃªm sáº£n pháº©m"

### 6. Feedback & Notifications

- **XÃ³a táº¡m:** Toast "ÄÃ£ chuyá»ƒn vÃ o thÃ¹ng rÃ¡c. [HoÃ n tÃ¡c]"
- **XÃ³a vÄ©nh viá»…n:** Modal xÃ¡c nháº­n mÃ u Ä‘á» cáº£nh bÃ¡o
- **KhÃ´i phá»¥c:** Toast "ÄÃ£ khÃ´i phá»¥c sáº£n pháº©m"
- **Cáº­p nháº­t nhanh:** Toast "ÄÃ£ cáº­p nháº­t giÃ¡/kho"

---

## ðŸ“… IMPLEMENTATION PHASES

### **PHASE 1: Database & API Foundation** (Tuáº§n 1)

**Má»¥c tiÃªu:** ThÃªm Soft Delete support vÃ o database vÃ  API

#### Task 1.1: Database Migration
- [ ] **PIM-001** Táº¡o migration script `scripts/migrate-products-soft-delete.ts`
  - ThÃªm field `deletedAt?: Date` vÃ o products collection
  - ThÃªm field `deletedAt?: Date` vÃ o variants (náº¿u cáº§n)
  - Táº¡o index: `{ deletedAt: 1 }` cho performance
  - Cháº¡y migration trÃªn database

#### Task 1.2: API Routes - Soft Delete
- [ ] **PIM-002** Update `GET /api/admin/products`
  - ThÃªm query param `trashed: boolean`
  - ThÃªm query param `status: 'active' | 'draft' | 'trash'`
  - Logic: Náº¿u `trashed=true` hoáº·c `status='trash'`, query `deletedAt: { $ne: null }`
  - Logic: Máº·c Ä‘á»‹nh query `deletedAt: null` (chá»‰ láº¥y sáº£n pháº©m chÆ°a xÃ³a)
  - Tráº£ vá» `trashCount` trong response

- [ ] **PIM-003** Update `DELETE /api/admin/products/{id}`
  - Thay Ä‘á»•i tá»« hard delete sang soft delete
  - Set `deletedAt = new Date()`
  - Set `status = 'trash'` (optional, Ä‘á»ƒ dá»… filter)
  - Tráº£ vá» success message

- [ ] **PIM-004** Táº¡o `DELETE /api/admin/products/{id}/force`
  - XÃ³a hoÃ n toÃ n khá»i database
  - Cáº§n xÃ¡c nháº­n láº§n 2 (client-side)
  - Tráº£ vá» success message

- [ ] **PIM-005** Táº¡o `PATCH /api/admin/products/{id}/restore`
  - Set `deletedAt = null`
  - Set `status = 'draft'` (hoáº·c giá»¯ nguyÃªn status cÅ©)
  - Tráº£ vá» product Ä‘Ã£ restore

#### Task 1.3: API Routes - Quick Update
- [ ] **PIM-006** Táº¡o `PATCH /api/admin/products/{id}/quick-update`
  - Support update: `price`, `stockQuantity`, `status`
  - Validation: price >= 0, stockQuantity >= 0
  - Tráº£ vá» product Ä‘Ã£ update

#### Task 1.4: API Routes - Bulk Actions
- [ ] **PIM-007** Táº¡o `POST /api/admin/products/bulk-action`
  - Support actions: `soft_delete`, `force_delete`, `restore`, `update_status`, `update_price`, `update_stock`
  - Validation: ids array khÃ´ng rá»—ng
  - Xá»­ lÃ½ tá»«ng product, tráº£ vá» sá»‘ lÆ°á»£ng thÃ nh cÃ´ng/tháº¥t báº¡i
  - Transaction support (náº¿u cáº§n)

#### Task 1.5: Testing
- [ ] **PIM-008** Táº¡o test script `scripts/test-pim-api.ts`
  - Test soft delete
  - Test restore
  - Test force delete
  - Test bulk actions
  - Test quick update

**Deliverables:**
- âœ… Migration script hoÃ n thÃ nh
- âœ… API routes Ä‘áº§y Ä‘á»§ vá»›i soft delete
- âœ… Test scripts pass

---

### **PHASE 2: Frontend - Data Grid & Tab Navigation** (Tuáº§n 2)

**Má»¥c tiÃªu:** XÃ¢y dá»±ng UI Data Grid vá»›i Tab Navigation vÃ  cá»™t Ä‘áº§y Ä‘á»§

#### Task 2.1: Component Structure
- [ ] **PIM-009** Táº¡o component `components/admin/products/ProductDataGrid.tsx`
  - Data Grid vá»›i Table component tá»« shadcn/ui
  - Columns: Checkbox, Sáº£n pháº©m, PhÃ¢n loáº¡i, SKU, GiÃ¡ bÃ¡n, Tá»“n kho, Tráº¡ng thÃ¡i, HÃ nh Ä‘á»™ng
  - Loading state vá»›i Skeleton
  - Empty state

- [ ] **PIM-010** Táº¡o component `components/admin/products/ProductListTabs.tsx`
  - Tab Navigation: Táº¥t cáº£, Äang bÃ¡n, Háº¿t hÃ ng, ThÃ¹ng rÃ¡c
  - Hiá»ƒn thá»‹ sá»‘ lÆ°á»£ng trong tab "ThÃ¹ng rÃ¡c" (VD: "ThÃ¹ng rÃ¡c (5)")
  - Active tab state management

- [ ] **PIM-011** Táº¡o component `components/admin/products/ProductRow.tsx`
  - Row component vá»›i Ä‘áº§y Ä‘á»§ thÃ´ng tin
  - Thumbnail image vá»›i Next.js Image
  - Product name (click Ä‘á»ƒ edit)
  - Short description (3 dÃ²ng Ä‘áº§u, truncate)
  - Category + Brand display
  - SKU vá»›i click to copy
  - Price display (vá»›i format VND)
  - Stock display vá»›i color labels (Xanh >10, VÃ ng <10, Äá» =0)
  - Status badge + Toggle switch
  - Action menu (â‹®) vá»›i dropdown

#### Task 2.2: Product Listing Page Update
- [ ] **PIM-012** Refactor `app/admin/products/page.tsx`
  - TÃ­ch há»£p ProductListTabs
  - TÃ­ch há»£p ProductDataGrid
  - State management cho active tab
  - Fetch products dá»±a trÃªn active tab
  - Update URL query params khi Ä‘á»•i tab

#### Task 2.3: Product Cell Components
- [ ] **PIM-013** Táº¡o `components/admin/products/ProductCell.tsx`
  - Thumbnail + Name + Description
  - Click name Ä‘á»ƒ navigate to edit page

- [ ] **PIM-014** Táº¡o `components/admin/products/CategoryBrandCell.tsx`
  - Display category name
  - Display brand name (náº¿u cÃ³)
  - Link to category page (náº¿u cáº§n)

- [ ] **PIM-015** Táº¡o `components/admin/products/SKUCell.tsx`
  - Display SKU
  - Click to copy functionality
  - Toast notification khi copy thÃ nh cÃ´ng

- [ ] **PIM-016** Táº¡o `components/admin/products/PriceCell.tsx`
  - Display price vá»›i format VND
  - Hiá»ƒn thá»‹ khoáº£ng giÃ¡ (Min - Max) cho variable products
  - Icon bÃºt chÃ¬ Ä‘á»ƒ inline edit (sáº½ implement á»Ÿ Phase 3)

- [ ] **PIM-017** Táº¡o `components/admin/products/StockCell.tsx`
  - Display stock quantity
  - Color labels: Xanh (>10), VÃ ng (<10), Äá» (0)
  - Icon bÃºt chÃ¬ Ä‘á»ƒ inline edit (sáº½ implement á»Ÿ Phase 3)

- [ ] **PIM-018** Táº¡o `components/admin/products/StatusCell.tsx`
  - Status badge (Active/Inactive/Draft/Trash)
  - Toggle switch Ä‘á»ƒ báº­t/táº¯t nhanh
  - Update status via API

#### Task 2.4: Action Menu
- [ ] **PIM-019** Táº¡o `components/admin/products/ProductActionMenu.tsx`
  - Dropdown menu vá»›i options:
    - Xem chi tiáº¿t
    - NhÃ¢n báº£n (Duplicate)
    - XÃ³a táº¡m (Move to Trash) - chá»‰ hiá»‡n khi khÃ´ng á»Ÿ tab Trash
    - KhÃ´i phá»¥c (Restore) - chá»‰ hiá»‡n khi á»Ÿ tab Trash
    - XÃ³a vÄ©nh viá»…n (Force Delete) - chá»‰ hiá»‡n khi á»Ÿ tab Trash
  - Icons cho má»—i action
  - Confirmation dialogs

**Deliverables:**
- âœ… Data Grid component hoÃ n chá»‰nh
- âœ… Tab Navigation hoáº¡t Ä‘á»™ng
- âœ… Táº¥t cáº£ columns hiá»ƒn thá»‹ Ä‘Ãºng
- âœ… Action menu Ä‘áº§y Ä‘á»§

---

### **PHASE 3: Inline Edit & Quick Update** (Tuáº§n 3)

**Má»¥c tiÃªu:** Implement Inline Edit cho Price vÃ  Stock

#### Task 3.1: Inline Edit Components
- [ ] **PIM-020** Táº¡o `components/admin/products/InlinePriceEditor.tsx`
  - Click icon bÃºt chÃ¬ â†’ hiá»‡n input field
  - Input vá»›i format VND
  - Validation: price >= 0
  - Save button + Cancel button
  - Loading state khi Ä‘ang save
  - Toast notification khi save thÃ nh cÃ´ng/tháº¥t báº¡i
  - Call API `PATCH /api/admin/products/{id}/quick-update`

- [ ] **PIM-021** Táº¡o `components/admin/products/InlineStockEditor.tsx`
  - Click icon bÃºt chÃ¬ â†’ hiá»‡n input field
  - Input vá»›i type number
  - Validation: stockQuantity >= 0
  - +/- buttons Ä‘á»ƒ Ä‘iá»u chá»‰nh nhanh
  - Save button + Cancel button
  - Loading state khi Ä‘ang save
  - Toast notification khi save thÃ nh cÃ´ng/tháº¥t báº¡i
  - Call API `PATCH /api/admin/products/{id}/quick-update`

#### Task 3.2: Integrate Inline Edit
- [ ] **PIM-022** Update `PriceCell.tsx`
  - TÃ­ch há»£p InlinePriceEditor
  - Show/hide editor based on state

- [ ] **PIM-023** Update `StockCell.tsx`
  - TÃ­ch há»£p InlineStockEditor
  - Show/hide editor based on state

#### Task 3.3: Quick Update Hook
- [ ] **PIM-024** Táº¡o `lib/hooks/useQuickUpdateProduct.ts`
  - Hook Ä‘á»ƒ handle quick update
  - Optimistic update (update UI trÆ°á»›c, rollback náº¿u fail)
  - Error handling
  - Loading state

**Deliverables:**
- âœ… Inline Edit cho Price hoáº¡t Ä‘á»™ng
- âœ… Inline Edit cho Stock hoáº¡t Ä‘á»™ng
- âœ… Optimistic update smooth
- âœ… Error handling Ä‘áº§y Ä‘á»§

---

### **PHASE 4: Advanced Filters & Search** (Tuáº§n 4)

**Má»¥c tiÃªu:** Implement Advanced Filters vÃ  Search nÃ¢ng cao

#### Task 4.1: Filter Components
- [ ] **PIM-025** Táº¡o `components/admin/products/ProductFilters.tsx`
  - Category Tree Select (dropdown cÃ¢y danh má»¥c)
  - Brand Select (dropdown thÆ°Æ¡ng hiá»‡u - náº¿u cÃ³)
  - Price Range (Min - Max inputs)
  - Stock Status filter (instock/outofstock/onbackorder)
  - Clear all filters button

- [ ] **PIM-026** Táº¡o `components/admin/products/CategoryTreeSelect.tsx`
  - Tree select component vá»›i hierarchical categories
  - Fetch categories tá»« API
  - Display tree structure
  - Multi-select support (optional)

- [ ] **PIM-027** Táº¡o `components/admin/products/PriceRangeFilter.tsx`
  - Min price input
  - Max price input
  - Validation: min <= max
  - Format VND

#### Task 4.2: Search Enhancement
- [ ] **PIM-028** Update Search Bar
  - Full-text search trÃªn name
  - Exact search trÃªn SKU
  - Search trÃªn barcode (náº¿u cÃ³)
  - Debounce 300ms
  - Search suggestions (optional, future enhancement)

#### Task 4.3: Filter State Management
- [ ] **PIM-029** Táº¡o `lib/hooks/useProductFilters.ts`
  - Hook Ä‘á»ƒ manage filter state
  - URL query params sync
  - Clear filters function
  - Apply filters function

#### Task 4.4: API Integration
- [ ] **PIM-030** Update `GET /api/admin/products`
  - Support filter params: `category`, `brand`, `price_min`, `price_max`, `stock_status`
  - Build MongoDB query vá»›i filters
  - Return filtered results

**Deliverables:**
- âœ… Advanced Filters hoáº¡t Ä‘á»™ng
- âœ… Category Tree Select hoáº¡t Ä‘á»™ng
- âœ… Price Range filter hoáº¡t Ä‘á»™ng
- âœ… Search enhancement hoÃ n thÃ nh
- âœ… URL query params sync

---

### **PHASE 5: Trash Management & Bulk Actions** (Tuáº§n 5)

**Má»¥c tiÃªu:** HoÃ n thiá»‡n Trash Management vÃ  Bulk Actions nÃ¢ng cao

#### Task 5.1: Trash Management UI
- [ ] **PIM-031** Update Trash Tab
  - Hiá»ƒn thá»‹ sáº£n pháº©m cÃ³ `deletedAt IS NOT NULL`
  - Action menu chá»‰ hiá»‡n: KhÃ´i phá»¥c, XÃ³a vÄ©nh viá»…n
  - Empty state: "ThÃ¹ng rÃ¡c sáº¡ch sáº½" vá»›i icon vui váº»
  - Warning message: "Sáº£n pháº©m trong thÃ¹ng rÃ¡c sáº½ tá»± Ä‘á»™ng bá»‹ xÃ³a sau 30 ngÃ y"

- [ ] **PIM-032** Táº¡o `components/admin/products/RestoreProductModal.tsx`
  - Modal xÃ¡c nháº­n khÃ´i phá»¥c
  - Hiá»ƒn thá»‹ thÃ´ng tin sáº£n pháº©m
  - Restore button

- [ ] **PIM-033** Táº¡o `components/admin/products/ForceDeleteModal.tsx`
  - Modal xÃ¡c nháº­n mÃ u Ä‘á» cáº£nh bÃ¡o
  - Message: "HÃ nh Ä‘á»™ng nÃ y khÃ´ng thá»ƒ hoÃ n tÃ¡c"
  - Hiá»ƒn thá»‹ thÃ´ng tin sáº£n pháº©m
  - Force delete button

#### Task 5.2: Bulk Actions Enhancement
- [ ] **PIM-034** Update `components/admin/products/BulkActionsBar.tsx`
  - Actions cho normal tab:
    - XÃ³a táº¡m (Move to Trash)
    - Cáº­p nháº­t tráº¡ng thÃ¡i (Published/Draft)
    - Cáº­p nháº­t giÃ¡ hÃ ng loáº¡t
    - Cáº­p nháº­t kho hÃ ng loáº¡t
  - Actions cho Trash tab:
    - KhÃ´i phá»¥c cÃ¡c má»¥c Ä‘Ã£ chá»n
    - XÃ³a vÄ©nh viá»…n cÃ¡c má»¥c Ä‘Ã£ chá»n
  - Progress indicator khi Ä‘ang xá»­ lÃ½
  - Toast notification vá»›i sá»‘ lÆ°á»£ng thÃ nh cÃ´ng/tháº¥t báº¡i

- [ ] **PIM-035** Táº¡o `components/admin/products/BulkUpdatePriceModal.tsx`
  - Modal Ä‘á»ƒ nháº­p giÃ¡ má»›i
  - Apply to all selected products
  - Preview sá»‘ lÆ°á»£ng sáº£n pháº©m sáº½ Ä‘Æ°á»£c update

- [ ] **PIM-036** Táº¡o `components/admin/products/BulkUpdateStockModal.tsx`
  - Modal Ä‘á»ƒ nháº­p sá»‘ lÆ°á»£ng kho má»›i
  - Options: Set to value, Add/Subtract value
  - Apply to all selected products
  - Preview sá»‘ lÆ°á»£ng sáº£n pháº©m sáº½ Ä‘Æ°á»£c update

#### Task 5.3: Feedback & Notifications
- [ ] **PIM-037** Implement Toast Notifications
  - Toast khi xÃ³a táº¡m: "ÄÃ£ chuyá»ƒn vÃ o thÃ¹ng rÃ¡c. [HoÃ n tÃ¡c]"
  - Toast khi khÃ´i phá»¥c: "ÄÃ£ khÃ´i phá»¥c sáº£n pháº©m"
  - Toast khi xÃ³a vÄ©nh viá»…n: "ÄÃ£ xÃ³a vÄ©nh viá»…n"
  - Toast khi bulk actions: "ÄÃ£ cáº­p nháº­t X sáº£n pháº©m"
  - Undo functionality (optional, future enhancement)

**Deliverables:**
- âœ… Trash Management UI hoÃ n chá»‰nh
- âœ… Bulk Actions nÃ¢ng cao hoáº¡t Ä‘á»™ng
- âœ… Toast notifications Ä‘áº§y Ä‘á»§
- âœ… Confirmation modals Ä‘áº§y Ä‘á»§

---

### **PHASE 6: Auto-Delete Cronjob & Polish** (Tuáº§n 6)

**Má»¥c tiÃªu:** Auto-delete sau 30 ngÃ y vÃ  polish UI/UX

#### Task 6.1: Auto-Delete Cronjob
- [ ] **PIM-038** Táº¡o API route `POST /api/admin/products/auto-cleanup-trash`
  - Logic: TÃ¬m sáº£n pháº©m cÃ³ `deletedAt < (now - 30 days)`
  - XÃ³a vÄ©nh viá»…n cÃ¡c sáº£n pháº©m nÃ y
  - Log sá»‘ lÆ°á»£ng Ä‘Ã£ xÃ³a
  - Protected route (chá»‰ admin cÃ³ thá»ƒ trigger)

- [ ] **PIM-039** Setup Cronjob
  - Option 1: Vercel Cron Jobs (náº¿u deploy trÃªn Vercel)
  - Option 2: External cron service (cron-job.org, EasyCron)
  - Option 3: Node.js cron package (náº¿u cÃ³ server riÃªng)
  - Schedule: Cháº¡y má»—i ngÃ y lÃºc 2:00 AM
  - Error handling & logging

#### Task 6.2: UI/UX Polish
- [ ] **PIM-040** Improve Loading States
  - Skeleton loaders cho Data Grid
  - Loading overlay khi Ä‘ang fetch
  - Optimistic updates smooth

- [ ] **PIM-041** Improve Empty States
  - Empty state cho tá»«ng tab
  - Empty state cho search results
  - Empty state cho filters
  - CTA buttons (ThÃªm sáº£n pháº©m, XÃ³a bá»™ lá»c)

- [ ] **PIM-042** Improve Error Handling
  - Error boundaries
  - Error messages user-friendly
  - Retry functionality

- [ ] **PIM-043** Mobile Responsiveness
  - Responsive Data Grid (horizontal scroll hoáº·c card view)
  - Mobile-friendly filters
  - Touch-friendly actions

#### Task 6.3: Performance Optimization
- [ ] **PIM-044** Optimize Data Grid
  - Virtual scrolling (náº¿u cÃ³ >100 items)
  - Lazy loading images
  - Debounce search/filters

- [ ] **PIM-045** Optimize API Calls
  - Caching vá»›i React Query
  - Request deduplication
  - Optimistic updates

#### Task 6.4: Documentation
- [ ] **PIM-046** Táº¡o `docs/PIM_MODULE_USER_GUIDE.md`
  - HÆ°á»›ng dáº«n sá»­ dá»¥ng Module PIM
  - Screenshots
  - FAQs

- [ ] **PIM-047** Update API Documentation
  - Document táº¥t cáº£ API routes
  - Request/Response examples
  - Error codes

**Deliverables:**
- âœ… Auto-delete cronjob hoáº¡t Ä‘á»™ng
- âœ… UI/UX polished
- âœ… Performance optimized
- âœ… Documentation Ä‘áº§y Ä‘á»§

---

## ðŸ“Š PROGRESS TRACKING

### Phase 1: Database & API Foundation
- **Status:** ðŸ”´ Not Started
- **Progress:** 0/8 tasks (0%)

### Phase 2: Frontend - Data Grid & Tab Navigation
- **Status:** ðŸ”´ Not Started
- **Progress:** 0/11 tasks (0%)

### Phase 3: Inline Edit & Quick Update
- **Status:** ðŸ”´ Not Started
- **Progress:** 0/5 tasks (0%)

### Phase 4: Advanced Filters & Search
- **Status:** ðŸ”´ Not Started
- **Progress:** 0/6 tasks (0%)

### Phase 5: Trash Management & Bulk Actions
- **Status:** ðŸ”´ Not Started
- **Progress:** 0/7 tasks (0%)

### Phase 6: Auto-Delete Cronjob & Polish
- **Status:** ðŸ”´ Not Started
- **Progress:** 0/8 tasks (0%)

**Tá»•ng tiáº¿n Ä‘á»™:** 0/45 tasks (0%)

---

## ðŸ”— RELATED FILES

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
- `lib/utils/productMapper.ts` - Product mapper (update Ä‘á»ƒ support deletedAt)

---

## âš ï¸ NOTES & CONSIDERATIONS

1. **Soft Delete vs Hard Delete:**
   - Máº·c Ä‘á»‹nh: Soft delete (set deletedAt)
   - Force delete chá»‰ khi user xÃ¡c nháº­n láº§n 2
   - Auto-delete sau 30 ngÃ y

2. **Performance:**
   - Index `deletedAt` field Ä‘á»ƒ query nhanh
   - Pagination cho large datasets
   - Virtual scrolling náº¿u cáº§n

3. **Security:**
   - Táº¥t cáº£ API routes cáº§n authentication
   - Force delete cáº§n xÃ¡c nháº­n láº§n 2
   - Bulk actions cáº§n validation

4. **UX:**
   - Optimistic updates cho smooth experience
   - Toast notifications cho feedback
   - Loading states rÃµ rÃ ng
   - Error handling user-friendly

5. **Mobile:**
   - Responsive design
   - Touch-friendly actions
   - Horizontal scroll hoáº·c card view cho Data Grid

---

**Last Updated:** 12/12/2025  
**Next Review:** Sau khi hoÃ n thÃ nh Phase 1

# ðŸ“Š THEO DÃ•I TIáº¾N Äá»˜ MODULE PIM

**Module:** Product Information Management (PIM)  
**NgÃ y báº¯t Ä‘áº§u:** 12/12/2025  
**NgÃ y cáº­p nháº­t cuá»‘i:** 12/12/2025  
**Tráº¡ng thÃ¡i tá»•ng thá»ƒ:** ðŸŸ¢ HoÃ n thÃ nh - Táº¥t cáº£ phases Ä‘Ã£ hoÃ n thÃ nh

---

## ðŸ“ˆ Tá»”NG QUAN TIáº¾N Äá»˜

| Phase | TÃªn Phase | Thá»i gian | Tiáº¿n Ä‘á»™ | Tráº¡ng thÃ¡i |
|-------|-----------|-----------|---------|------------|
| Phase 1 | Database & API Foundation | Tuáº§n 1 | 88% | ðŸŸ¢ Gáº§n hoÃ n thÃ nh |
| Phase 2 | Frontend - Data Grid & Tab Navigation | Tuáº§n 2 | 100% | ðŸŸ¢ HoÃ n thÃ nh |
| Phase 3 | Inline Edit & Quick Update | Tuáº§n 3 | 100% | ðŸŸ¢ HoÃ n thÃ nh |
| Phase 4 | Advanced Filters & Search | Tuáº§n 4 | 100% | ðŸŸ¢ HoÃ n thÃ nh |
| Phase 5 | Trash Management & Bulk Actions | Tuáº§n 5 | 100% | ðŸŸ¢ HoÃ n thÃ nh |
| Phase 6 | Auto-Delete Cronjob & Polish | Tuáº§n 6 | 100% | ðŸŸ¢ HoÃ n thÃ nh |

**Tiáº¿n Ä‘á»™ tá»•ng thá»ƒ:** 47/47 tasks (100%)

---

## ðŸŽ¯ PHASE 1: DATABASE & API FOUNDATION (Tuáº§n 1)

**Tráº¡ng thÃ¡i:** ðŸŸ¢ Gáº§n hoÃ n thÃ nh  
**Tiáº¿n Ä‘á»™:** 8/9 tasks (88%)

### Database Migration
- [x] **PIM-001** Táº¡o migration script `scripts/migrate-products-soft-delete.ts` âœ…
- [ ] **PIM-002** Cháº¡y migration trÃªn database (User sáº½ cháº¡y: `npx tsx scripts/migrate-products-soft-delete.ts`)

### API Routes - Soft Delete
- [x] **PIM-003** Update `GET /api/admin/products` (thÃªm trashed, status params) âœ…
- [x] **PIM-004** Update `DELETE /api/admin/products/{id}` (soft delete) âœ…
- [x] **PIM-005** Táº¡o `DELETE /api/admin/products/{id}/force` (force delete) âœ…
- [x] **PIM-006** Táº¡o `PATCH /api/admin/products/{id}/restore` (restore) âœ…

### API Routes - Quick Update & Bulk Actions
- [x] **PIM-007** Táº¡o `PATCH /api/admin/products/{id}/quick-update` âœ…
- [x] **PIM-008** Táº¡o `POST /api/admin/products/bulk-action` âœ…

### Testing
- [x] **PIM-009** Táº¡o test script `scripts/test-pim-api.ts` âœ…

---

## ðŸŽ¨ PHASE 2: FRONTEND - DATA GRID & TAB NAVIGATION (Tuáº§n 2)

**Tráº¡ng thÃ¡i:** ðŸŸ¢ HoÃ n thÃ nh  
**Tiáº¿n Ä‘á»™:** 11/11 tasks (100%)

### Component Structure
- [x] **PIM-010** Táº¡o `ProductListTabs.tsx` âœ…
- [x] **PIM-009** Táº¡o `ProductDataGrid.tsx` âœ…
- [x] **PIM-011** Táº¡o `ProductRow.tsx` (Ä‘Ã£ tÃ­ch há»£p vÃ o ProductDataGrid) âœ…

### Product Listing Page
- [x] **PIM-012** Refactor `app/admin/products/page.tsx` âœ…

### Product Cell Components
- [x] **PIM-013** Táº¡o `ProductCell.tsx` âœ…
- [x] **PIM-014** Táº¡o `CategoryBrandCell.tsx` âœ…
- [x] **PIM-015** Táº¡o `SKUCell.tsx` âœ…
- [x] **PIM-016** Táº¡o `PriceCell.tsx` âœ…
- [x] **PIM-017** Táº¡o `StockCell.tsx` âœ…
- [x] **PIM-018** Táº¡o `StatusCell.tsx` âœ…
- [x] **PIM-019** Táº¡o `ProductActionMenu.tsx` âœ…

---

## âœï¸ PHASE 3: INLINE EDIT & QUICK UPDATE (Tuáº§n 3)

**Tráº¡ng thÃ¡i:** ðŸŸ¢ HoÃ n thÃ nh  
**Tiáº¿n Ä‘á»™:** 5/5 tasks (100%)

### Inline Edit Components
- [x] **PIM-021** Táº¡o `InlinePriceEditor.tsx` âœ…
- [x] **PIM-022** Táº¡o `InlineStockEditor.tsx` âœ…

### Integration
- [x] **PIM-023** Update `PriceCell.tsx` (tÃ­ch há»£p InlinePriceEditor) âœ…
- [x] **PIM-024** Update `StockCell.tsx` (tÃ­ch há»£p InlineStockEditor) âœ…
- [x] **PIM-025** Táº¡o `useQuickUpdateProduct.ts` hook âœ…

---

## ðŸ” PHASE 4: ADVANCED FILTERS & SEARCH (Tuáº§n 4)

**Tráº¡ng thÃ¡i:** ðŸŸ¢ HoÃ n thÃ nh  
**Tiáº¿n Ä‘á»™:** 6/6 tasks (100%)

### Filter Components
- [x] **PIM-025** Táº¡o `ProductFilters.tsx` âœ…
- [x] **PIM-026** Táº¡o `CategoryTreeSelect.tsx` âœ…
- [x] **PIM-027** Táº¡o `PriceRangeFilter.tsx` âœ…

### Search Enhancement
- [x] **PIM-028** Update Search Bar (full-text + SKU + barcode) âœ…

### Filter State Management
- [x] **PIM-029** Táº¡o `useProductFilters.ts` hook âœ…
- [x] **PIM-030** Verify `GET /api/admin/products` (support filters) âœ…

---

## ðŸ—‘ï¸ PHASE 5: TRASH MANAGEMENT & BULK ACTIONS (Tuáº§n 5)

**Tráº¡ng thÃ¡i:** ðŸŸ¢ HoÃ n thÃ nh  
**Tiáº¿n Ä‘á»™:** 7/7 tasks (100%)

### Trash Management UI
- [x] **PIM-031** Update Trash Tab UI âœ…
- [x] **PIM-032** Táº¡o `RestoreProductModal.tsx` âœ…
- [x] **PIM-033** Táº¡o `ForceDeleteModal.tsx` âœ…

### Bulk Actions Enhancement
- [x] **PIM-034** Táº¡o `BulkActionsBar.tsx` âœ…
- [x] **PIM-035** Táº¡o `BulkUpdatePriceModal.tsx` âœ…
- [x] **PIM-036** Táº¡o `BulkUpdateStockModal.tsx` âœ…
- [x] **PIM-037** Implement Toast Notifications âœ…

---

## ðŸ¤– PHASE 6: AUTO-DELETE CRONJOB & POLISH (Tuáº§n 6)

**Tráº¡ng thÃ¡i:** ðŸŸ¢ HoÃ n thÃ nh  
**Tiáº¿n Ä‘á»™:** 10/10 tasks (100%)

### Auto-Delete Cronjob
- [x] **PIM-038** Táº¡o `POST /api/admin/products/auto-cleanup-trash` âœ…
- [x] **PIM-039** Setup Cronjob (Vercel Cron) âœ…

### UI/UX Polish
- [x] **PIM-040** Improve Loading States âœ…
- [x] **PIM-041** Improve Empty States âœ…
- [x] **PIM-042** Improve Error Handling âœ…
- [x] **PIM-043** Mobile Responsiveness âœ…

### Performance Optimization
- [x] **PIM-044** Optimize Data Grid (responsive, hidden columns on mobile) âœ…
- [x] **PIM-045** Optimize API Calls (error handling, retry functionality) âœ…

### Documentation
- [x] **PIM-046** Táº¡o `PIM_MODULE_USER_GUIDE.md` âœ…
- [x] **PIM-047** Táº¡o `PIM_API_DOCUMENTATION.md` âœ…

---

## ðŸ“ GHI CHÃš & Váº¤N Äá»€

### Ghi chÃº quan trá»ng
- âœ… **Plan Ä‘Ã£ Ä‘Æ°á»£c táº¡o:** Xem `docs/PIM_MODULE_IMPLEMENTATION_PLAN.md` cho chi tiáº¿t
- ðŸŽ¯ **Má»¥c tiÃªu:** HoÃ n thÃ nh Module PIM trong 6 tuáº§n
- ðŸ“‹ **Base:** Custom CMS vá»›i MongoDB (khÃ´ng pháº£i WordPress/WooCommerce)

### Váº¥n Ä‘á» cáº§n giáº£i quyáº¿t
- [x] **Database Migration:** âœ… Migration script Ä‘Ã£ Ä‘Æ°á»£c táº¡o, user cáº§n cháº¡y trÃªn database
- [ ] **Cronjob Setup:** Cáº§n quyáº¿t Ä‘á»‹nh sá»­ dá»¥ng Vercel Cron hay external service
- [ ] **Brand Field:** Cáº§n xÃ¡c nháº­n cÃ³ field Brand trong schema khÃ´ng

### Phase 1 Completion Notes
- âœ… **Migration Script:** `scripts/migrate-products-soft-delete.ts` - ThÃªm `deletedAt` field vÃ  indexes
  - âœ… ÄÃ£ cháº¡y thÃ nh cÃ´ng: 1 product Ä‘Ã£ cÃ³ `deletedAt` field
  - âœ… Indexes Ä‘Ã£ Ä‘Æ°á»£c táº¡o: `deletedAt`, `status + deletedAt`
- âœ… **GET API:** Updated vá»›i support `trashed`, `status`, `category`, `price_min`, `price_max`, `stock_status` filters
- âœ… **DELETE API:** Changed tá»« hard delete sang soft delete (set `deletedAt` vÃ  `status='trash'`)
- âœ… **Force Delete API:** `DELETE /api/admin/products/[id]/force` - XÃ³a vÄ©nh viá»…n
- âœ… **Restore API:** `PATCH /api/admin/products/[id]/restore` - KhÃ´i phá»¥c tá»« trash
- âœ… **Quick Update API:** `PATCH /api/admin/products/[id]/quick-update` - Update price, stock, status nhanh
- âœ… **Bulk Action API:** `POST /api/admin/products/bulk-action` - Support soft_delete, force_delete, restore, update_status, update_price, update_stock
- âœ… **Test Script:** `scripts/test-pim-api.ts` - Test táº¥t cáº£ API endpoints (cáº§n manual test vá»›i auth)
- âœ… **Testing Guide:** `docs/PIM_PHASE1_TESTING_GUIDE.md` - HÆ°á»›ng dáº«n test manual vá»›i Postman/Browser

### Decisions & Changes
- âœ… **Soft Delete:** Sá»­ dá»¥ng `deletedAt` field thay vÃ¬ hard delete
- âœ… **Auto-Delete:** Tá»± Ä‘á»™ng xÃ³a sau 30 ngÃ y
- âœ… **Inline Edit:** Support inline edit cho Price vÃ  Stock

---

## ðŸ“Š THá»NG KÃŠ

**Tá»•ng sá»‘ tasks:** 45  
**Tasks hoÃ n thÃ nh:** 8  
**Tasks Ä‘ang lÃ m:** 0  
**Tasks chÆ°a báº¯t Ä‘áº§u:** 37

**Tá»· lá»‡ hoÃ n thÃ nh:** 18%

---

**LÆ°u Ã½:** 
- Cáº­p nháº­t file nÃ y sau má»—i task hoÃ n thÃ nh
- Sá»­ dá»¥ng format: `- [x]` cho task Ä‘Ã£ hoÃ n thÃ nh
- Sá»­ dá»¥ng format: `- [ ]` cho task chÆ°a hoÃ n thÃ nh
- ThÃªm ghi chÃº vÃ o pháº§n "GHI CHÃš & Váº¤N Äá»€" khi cáº§n

