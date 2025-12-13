# 📋 KẾ HOẠCH TRIỂN KHAI MODULE MENU MANAGEMENT

**Module:** Quản lý Menu & Điều hướng (Menu Management)  
**Phiên bản:** 1.0  
**Ngày tạo:** 12/12/2025  
**Trạng thái:** Planning  
**Base:** Custom CMS với MongoDB (không phải WordPress/WooCommerce)

---

## 🎯 MỤC TIÊU

Xây dựng module cho phép quản trị viên (Admin) cấu hình các thanh điều hướng (Navigation Bars) trên website:
- Quản lý Menu Locations (Header, Footer, Sidebar)
- Quản lý Menu Items với Drag & Drop
- Dynamic Linking (tự động cập nhật URL khi đối tượng tham chiếu thay đổi)
- Hỗ trợ đa cấp (tối đa 3 cấp)
- Frontend render menu từ API

---

## 📊 PHÂN TÍCH HIỆN TRẠNG

### ✅ Đã có sẵn:
- NavigationMenu component (hardcoded)
- MobileMenu component (hardcoded)
- MongoDB connection & collections
- Admin panel structure (`app/admin/*`)
- API routes pattern (`/api/admin/*`, `/api/cms/*`)
- Categories API (để tham chiếu)
- Products API (để tham chiếu)

### ❌ Chưa có:
- MongoDB collections: `menus`, `menu_items`
- Menu Management API routes
- Admin UI cho Menu Management
- Drag & Drop interface
- Dynamic link resolution logic
- Menu caching mechanism
- Frontend menu renderer từ API

---

## 🗄️ DATABASE SCHEMA

### 1. Collections: `menus`

```typescript
interface Menu {
  _id: ObjectId;
  name: string;                    // Tên menu (VD: "Menu Tết 2025")
  location?: string;                // Vị trí hiển thị (VD: "header", "footer", "mobile-sidebar")
  status: 'active' | 'inactive';    // Trạng thái
  createdAt: Date;
  updatedAt: Date;
}
```

**Indexes:**
- `{ location: 1 }` (unique, sparse) - Đảm bảo 1 location chỉ có 1 menu active
- `{ status: 1 }`

### 2. Collections: `menu_items`

```typescript
interface MenuItem {
  _id: ObjectId;
  menuId: ObjectId;                 // FK tới menus
  parentId?: ObjectId | null;       // FK tới chính menu_items (đệ quy)
  title?: string | null;            // Tên hiển thị (null -> lấy từ reference)
  type: 'custom' | 'category' | 'page' | 'product' | 'post';
  referenceId?: ObjectId | null;    // ID của đối tượng tham chiếu (nếu type != custom)
  url?: string | null;              // URL cứng (chỉ dùng khi type = custom)
  target: '_self' | '_blank';       // Default: '_self'
  iconClass?: string | null;         // Class icon (VD: "fa-home")
  cssClass?: string | null;         // CSS class riêng
  order: number;                    // Thứ tự sắp xếp
  createdAt: Date;
  updatedAt: Date;
}
```

**Indexes:**
- `{ menuId: 1, order: 1 }` - Tối ưu query theo menu và sắp xếp
- `{ menuId: 1, parentId: 1 }` - Tối ưu query cây
- `{ referenceId: 1, type: 1 }` - Tối ưu resolve reference

---

## 📐 API DESIGN

### 1. Public API (Frontend User)

#### GET /api/cms/menus/location/{location}
Lấy menu theo location để render trên frontend.

**Query Params:**
- `location`: Location slug (VD: "header", "footer")

**Response:**
```json
{
  "menu": {
    "id": "menu_id",
    "name": "Main Menu",
    "items": [
      {
        "id": "item_id",
        "title": "Trang chủ",
        "url": "/",
        "target": "_self",
        "iconClass": null,
        "cssClass": null,
        "children": [
          {
            "id": "child_id",
            "title": "Sản phẩm mới",
            "url": "/products?category=san-pham-moi",
            "target": "_self",
            "children": []
          }
        ]
      }
    ]
  }
}
```

**Logic:**
- Resolve `referenceId` → lấy title/slug mới nhất từ collections gốc
- Ẩn items có reference không tồn tại hoặc inactive
- Build tree structure từ flat list
- Cache kết quả (5 phút)

### 2. Admin API

#### GET /api/admin/menus
Lấy danh sách menus.

**Query Params:**
- `location`: Filter theo location
- `status`: Filter theo status

**Response:**
```json
{
  "menus": [
    {
      "id": "menu_id",
      "name": "Main Menu",
      "location": "header",
      "status": "active",
      "itemCount": 10,
      "createdAt": "2025-01-01T00:00:00Z",
      "updatedAt": "2025-01-01T00:00:00Z"
    }
  ],
  "pagination": { ... }
}
```

#### GET /api/admin/menus/{id}
Lấy chi tiết menu với items (flat hoặc tree).

**Query Params:**
- `format`: `flat` | `tree` (default: `tree`)

**Response (tree format):**
```json
{
  "menu": {
    "id": "menu_id",
    "name": "Main Menu",
    "location": "header",
    "status": "active",
    "items": [
      {
        "id": "item_id",
        "title": "Trang chủ",
        "type": "custom",
        "url": "/",
        "target": "_self",
        "order": 0,
        "children": [
          {
            "id": "child_id",
            "title": "Sản phẩm mới",
            "type": "category",
            "referenceId": "category_id",
            "reference": {
              "id": "category_id",
              "name": "Sản phẩm mới",
              "slug": "san-pham-moi"
            },
            "order": 0,
            "children": []
          }
        ]
      }
    ]
  }
}
```

#### POST /api/admin/menus
Tạo menu mới.

**Body:**
```json
{
  "name": "Main Menu",
  "location": "header",
  "status": "active"
}
```

#### PUT /api/admin/menus/{id}
Cập nhật menu.

**Body:**
```json
{
  "name": "Updated Menu Name",
  "location": "header",
  "status": "active"
}
```

#### DELETE /api/admin/menus/{id}
Xóa menu (soft delete hoặc hard delete kèm items).

#### POST /api/admin/menus/{id}/structure
Bulk update cấu trúc menu (quan trọng cho Drag & Drop).

**Body:**
```json
[
  {
    "id": "item_id_1",
    "children": [
      {
        "id": "item_id_5",
        "children": []
      },
      {
        "id": "item_id_6",
        "children": []
      }
    ]
  },
  {
    "id": "item_id_2",
    "children": []
  }
]
```

**Logic:**
- Validate max depth (3 cấp)
- Update `parentId` và `order` cho tất cả items
- Clear cache

#### GET /api/admin/menu-items/{id}
Lấy chi tiết menu item.

#### POST /api/admin/menu-items
Tạo menu item mới.

**Body:**
```json
{
  "menuId": "menu_id",
  "parentId": null,
  "title": "Trang chủ",
  "type": "custom",
  "url": "/",
  "target": "_self",
  "iconClass": null,
  "cssClass": null,
  "order": 0
}
```

**Hoặc với reference:**
```json
{
  "menuId": "menu_id",
  "parentId": null,
  "title": null,  // Sẽ lấy từ category
  "type": "category",
  "referenceId": "category_id",
  "target": "_self",
  "order": 0
}
```

#### PUT /api/admin/menu-items/{id}
Cập nhật menu item.

#### DELETE /api/admin/menu-items/{id}
Xóa menu item.

---

## 🎨 UI/UX DESIGN

### Admin Panel: `/admin/menus`

#### Layout:
```
┌─────────────────────────────────────────────────────────┐
│  Header: "Quản lý Menu" + Button "Tạo menu mới"        │
├──────────────────┬──────────────────────────────────────┤
│                  │                                      │
│  Panel Trái       │  Panel Phải                          │
│  (Nguồn dữ liệu) │  (Cấu trúc Menu)                     │
│                  │                                      │
│  ┌────────────┐  │  ┌────────────────────────────────┐ │
│  │ Pages      │  │  │ Menu: [Dropdown chọn menu]     │ │
│  │ ☑ Trang chủ│  │  │                                │ │
│  │ ☐ Giới thiệu│ │  │ ┌────────────────────────────┐ │ │
│  │ ☐ Liên hệ  │  │  │ │ Trang chủ (Page)      [⚙][🗑]│ │ │
│  │            │  │  │ │ └─ Sản phẩm mới (Category) │ │ │
│  │ [Add to Menu]│ │  │ └─ Dịch vụ (Custom)        │ │ │
│  └────────────┘  │  │ └────────────────────────────┘ │ │
│                  │  │                                │ │
│  ┌────────────┐  │  │ [Drag & Drop Area]            │ │
│  │ Categories │  │  │                                │ │
│  │ ☑ Gấu bông │  │  │                                │ │
│  │ ☑ Bigsize  │  │  │                                │ │
│  │            │  │  │                                │ │
│  │ [Add to Menu]│ │  │                                │ │
│  └────────────┘  │  │                                │ │
│                  │  │                                │ │
│  ┌────────────┐  │  │                                │ │
│  │ Custom Link│  │  │                                │ │
│  │ URL: [____]│  │  │                                │ │
│  │ Label: [__]│  │  │                                │ │
│  │            │  │  │                                │ │
│  │ [Add to Menu]│ │  │                                │ │
│  └────────────┘  │  │                                │ │
│                  │  └────────────────────────────────┘ │
└──────────────────┴──────────────────────────────────────┘
```

#### Components:
1. **MenuListPage** (`app/admin/menus/page.tsx`)
   - Danh sách menus với filter
   - Button "Tạo menu mới"

2. **MenuEditorPage** (`app/admin/menus/[id]/page.tsx`)
   - Split layout: Left panel (data sources) + Right panel (menu structure)
   - Drag & Drop với `@dnd-kit/core` hoặc `react-beautiful-dnd`

3. **MenuItemsSourcePanel** (`components/admin/menus/MenuItemsSourcePanel.tsx`)
   - Accordion tabs: Pages, Categories, Products, Posts, Custom Link
   - Checkbox selection
   - "Add to Menu" button

4. **MenuStructurePanel** (`components/admin/menus/MenuStructurePanel.tsx`)
   - Drag & Drop tree
   - Expandable items
   - Quick edit form (inline)
   - Delete button

5. **MenuItemEditor** (`components/admin/menus/MenuItemEditor.tsx`)
   - Form để edit title, target, iconClass, cssClass
   - Preview URL (nếu có reference)

---

## 🔄 BUSINESS LOGIC

### 1. Dynamic Link Resolution

**Khi render menu cho frontend:**
- Nếu `type = custom` → dùng `url` trực tiếp
- Nếu `type = category` → Query `categories` collection → lấy `slug` mới nhất → build URL `/products?category={slug}`
- Nếu `type = product` → Query `products` collection → lấy `slug` mới nhất → build URL `/products/{slug}`
- Nếu `type = page` → Query `posts` collection (với `type = 'page'`) → lấy `slug` mới nhất → build URL `/{slug}`
- Nếu `type = post` → Query `posts` collection → lấy `slug` mới nhất → build URL `/blog/{slug}`

**Title resolution:**
- Nếu `title` không null → dùng `title`
- Nếu `title` null → lấy từ reference object (category.name, product.name, page.title, post.title)

### 2. Max Depth Validation

- Giới hạn cứng: **3 cấp** (Level 0, 1, 2)
- API `/api/admin/menus/{id}/structure` validate depth trước khi update
- Frontend disable drag vào cấp 3

### 3. Deleted Reference Handling

- Khi render menu cho frontend:
  - Kiểm tra reference object có tồn tại không
  - Kiểm tra status (nếu có) = 'active'/'publish'
  - Nếu không thỏa → Ẩn item khỏi kết quả (không xóa trong DB)
- Trong Admin panel:
  - Hiển thị item với warning badge "Reference không tồn tại"
  - Cho phép admin sửa hoặc xóa

### 4. Location Uniqueness

- Mỗi location chỉ có 1 menu `status = 'active'`
- Khi set menu mới làm active cho location → Set menu cũ thành `inactive`
- Index unique trên `{ location: 1 }` (sparse) để enforce

### 5. Caching Strategy

- Cache key: `menu:location:{location}`
- TTL: 5 phút
- Invalidate khi:
  - Admin update menu structure
  - Admin update menu item
  - Admin create/delete menu item
- Implementation: Next.js cache hoặc Redis (nếu có)

---

## 📦 PHASES & TASKS

### Phase 1: Database Schema & API Foundation (Backend)
**Mục tiêu:** Setup database và API routes cơ bản

#### Tasks:
1. ✅ Tạo MongoDB collections: `menus`, `menu_items`
2. ✅ Tạo indexes cho performance
3. ✅ Tạo migration script (nếu cần seed data)
4. ✅ Implement `GET /api/admin/menus` (list menus)
5. ✅ Implement `GET /api/admin/menus/{id}` (get menu detail)
6. ✅ Implement `POST /api/admin/menus` (create menu)
7. ✅ Implement `PUT /api/admin/menus/{id}` (update menu)
8. ✅ Implement `DELETE /api/admin/menus/{id}` (delete menu)
9. ✅ Implement `GET /api/admin/menu-items/{id}` (get item detail)
10. ✅ Implement `POST /api/admin/menu-items` (create item)
11. ✅ Implement `PUT /api/admin/menu-items/{id}` (update item)
12. ✅ Implement `DELETE /api/admin/menu-items/{id}` (delete item)
13. ✅ Implement dynamic link resolution logic
14. ✅ Implement max depth validation (3 cấp)
15. ✅ Implement deleted reference handling

**Deliverables:**
- MongoDB collections với indexes
- API routes hoàn chỉnh
- Test script để verify API

---

### Phase 2: Bulk Structure Update & Public API
**Mục tiêu:** Drag & Drop API và Public API cho frontend

#### Tasks:
1. ✅ Implement `POST /api/admin/menus/{id}/structure` (bulk update)
2. ✅ Validate structure depth (max 3 levels)
3. ✅ Implement `GET /api/cms/menus/location/{location}` (public API)
4. ✅ Implement tree building logic (flat → nested)
5. ✅ Implement reference resolution cho public API
6. ✅ Implement caching cho public API (5 phút TTL)
7. ✅ Clear cache khi admin update menu
8. ✅ Test với nhiều menu items và nested structure

**Deliverables:**
- Bulk structure update API
- Public menu API với caching
- Test cases cho structure update

---

### Phase 3: Admin UI - Menu List & Editor
**Mục tiêu:** Giao diện quản lý menu cơ bản

#### Tasks:
1. ✅ Tạo `app/admin/menus/page.tsx` (menu list page)
2. ✅ Implement MenuListTable component
3. ✅ Implement MenuFilters (location, status)
4. ✅ Tạo `app/admin/menus/new/page.tsx` (create menu form)
5. ✅ Tạo `app/admin/menus/[id]/page.tsx` (menu editor page)
6. ✅ Implement MenuEditorHeader (menu name, location, status)
7. ✅ Implement basic menu items list (chưa drag & drop)
8. ✅ Implement MenuItemRow component
9. ✅ Implement delete menu item action
10. ✅ Test CRUD operations

**Deliverables:**
- Menu list page
- Menu editor page (basic)
- CRUD operations working

---

### Phase 4: Data Sources Panel & Add Items
**Mục tiêu:** Panel bên trái để thêm items vào menu

#### Tasks:
1. ✅ Implement MenuItemsSourcePanel component
2. ✅ Implement PagesTab (list pages, checkbox selection)
3. ✅ Implement CategoriesTab (tree view, checkbox selection)
4. ✅ Implement ProductsTab (list products, search, checkbox selection)
5. ✅ Implement PostsTab (list posts, checkbox selection)
6. ✅ Implement CustomLinkTab (URL + Label inputs)
7. ✅ Implement "Add to Menu" button với bulk add
8. ✅ Auto-set order khi add items
9. ✅ Test add items từ các nguồn khác nhau

**Deliverables:**
- Data sources panel hoàn chỉnh
- Add items functionality

---

### Phase 5: Drag & Drop & Structure Management
**Mục tiêu:** Kéo thả để sắp xếp và phân cấp menu

#### Tasks:
1. ✅ Install drag & drop library (`@dnd-kit/core` hoặc `react-beautiful-dnd`)
2. ✅ Implement MenuStructurePanel với drag & drop
3. ✅ Implement visual feedback khi drag (placeholder)
4. ✅ Implement nested drag & drop (parent-child)
5. ✅ Implement depth limit (disable drag vào cấp 3)
6. ✅ Auto-save structure khi drop (debounce 500ms)
7. ✅ Implement expand/collapse items
8. ✅ Test drag & drop với nhiều levels

**Deliverables:**
- Drag & drop interface
- Structure management working
- Visual feedback

---

### Phase 6: Inline Edit & Quick Actions
**Mục tiêu:** Sửa nhanh menu items

#### Tasks:
1. ✅ Implement MenuItemEditor component (inline form)
2. ✅ Implement edit title, target, iconClass, cssClass
3. ✅ Implement preview URL (nếu có reference)
4. ✅ Implement warning badge cho deleted references
5. ✅ Implement quick actions (duplicate, delete)
6. ✅ Test inline editing

**Deliverables:**
- Inline edit functionality
- Quick actions
- Reference validation

---

### Phase 7: Frontend Menu Renderer
**Mục tiêu:** Render menu trên frontend từ API

#### Tasks:
1. ✅ Tạo `lib/hooks/useMenu.ts` (fetch menu từ API)
2. ✅ Tạo `components/layout/DynamicNavigationMenu.tsx`
3. ✅ Replace hardcoded NavigationMenu với DynamicNavigationMenu
4. ✅ Tạo `components/layout/DynamicMobileMenu.tsx`
5. ✅ Replace hardcoded MobileMenu với DynamicMobileMenu
6. ✅ Implement menu caching trên frontend (React Query)
7. ✅ Test menu render với các locations khác nhau
8. ✅ Test responsive (desktop vs mobile)

**Deliverables:**
- Dynamic menu components
- Frontend integration
- Responsive menu

---

### Phase 8: Polish & Optimization
**Mục tiêu:** Tối ưu performance và UX

#### Tasks:
1. ✅ Optimize API queries (avoid N+1, use aggregation)
2. ✅ Implement menu cache invalidation strategy
3. ✅ Add loading states và skeletons
4. ✅ Add error handling và empty states
5. ✅ Add confirmation dialogs cho delete actions
6. ✅ Add toast notifications cho success/error
7. ✅ Mobile optimization cho admin panel
8. ✅ Add keyboard shortcuts (nếu cần)
9. ✅ Write documentation (API docs, user guide)
10. ✅ Final testing và bug fixes

**Deliverables:**
- Optimized performance
- Polished UX
- Documentation
- Production-ready

---

## 🧪 TESTING PLAN

### Unit Tests:
- Dynamic link resolution logic
- Tree building logic
- Max depth validation
- Reference resolution

### Integration Tests:
- API routes (CRUD operations)
- Bulk structure update
- Cache invalidation
- Public API với various references

### E2E Tests:
- Admin tạo menu và thêm items
- Admin drag & drop để sắp xếp
- Frontend render menu từ API
- Dynamic link update khi reference thay đổi
- Deleted reference handling

---

## 📚 DOCUMENTATION

### API Documentation:
- `docs/MENU_API_DOCUMENTATION.md`
- Swagger/OpenAPI spec (nếu có)

### User Guide:
- `docs/MENU_MANAGEMENT_USER_GUIDE.md`
- Screenshots và video tutorials

### Technical Docs:
- Database schema
- Caching strategy
- Reference resolution logic

---

## 🚀 DEPLOYMENT CHECKLIST

- [ ] Run migration script (nếu có)
- [ ] Setup indexes trên MongoDB
- [ ] Configure cache (Next.js cache hoặc Redis)
- [ ] Test API routes
- [ ] Test admin UI
- [ ] Test frontend menu render
- [ ] Performance testing
- [ ] Security review (authentication, authorization)
- [ ] Documentation review

---

## 📝 NOTES

- **Drag & Drop Library:** Recommend `@dnd-kit/core` (modern, accessible, TypeScript-friendly)
- **Caching:** Use Next.js built-in cache hoặc Redis nếu cần distributed cache
- **Performance:** Menu được render trên mọi trang → Cache là bắt buộc
- **Mobile:** Admin panel cần responsive, drag & drop có thể dùng touch events
- **Accessibility:** Menu items cần proper ARIA labels, keyboard navigation

---

**Tổng số tasks:** ~70 tasks  
**Ước tính thời gian:** 4-6 tuần (tùy team size)

