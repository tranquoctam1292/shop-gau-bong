# Menu Management API Documentation

## Tổng quan

Menu Management API cung cấp các endpoints để quản lý menu và menu items trong hệ thống. API được chia thành 2 nhóm:
- **Admin API** (`/api/admin/menus/*`): Dành cho admin, yêu cầu authentication
- **Public API** (`/api/cms/menus/*`): Dành cho frontend, không yêu cầu authentication

---

## Admin API Endpoints

### 1. GET /api/admin/menus

Lấy danh sách menus với pagination và filters.

**Query Parameters:**
- `page` (number, default: 1): Số trang
- `per_page` (number, default: 20): Số items mỗi trang
- `location` (string, optional): Lọc theo location
- `status` (string, optional): Lọc theo status ('active' | 'inactive')
- `search` (string, optional): Tìm kiếm theo tên menu

**Response:**
```json
{
  "menus": [
    {
      "id": "string",
      "name": "string",
      "location": "string | null",
      "status": "active | inactive",
      "itemCount": 0,
      "createdAt": "ISO date",
      "updatedAt": "ISO date"
    }
  ],
  "pagination": {
    "total": 0,
    "totalPages": 0,
    "currentPage": 1,
    "perPage": 20,
    "hasNextPage": false,
    "hasPrevPage": false
  }
}
```

**Performance:** ✅ Optimized với aggregation pipeline để tránh N+1 queries

---

### 2. GET /api/admin/menus/{id}

Lấy chi tiết menu và menu items (tree format).

**Query Parameters:**
- `format` (string, optional): 'tree' để lấy dạng tree structure

**Response:**
```json
{
  "menu": {
    "_id": "string",
    "name": "string",
    "location": "string | null",
    "status": "active | inactive",
    "createdAt": "ISO date",
    "updatedAt": "ISO date",
    "items": [
      {
        "id": "string",
        "title": "string",
        "type": "custom | category | product | page | post",
        "url": "string | null",
        "referenceId": "string | null",
        "target": "_self | _blank",
        "iconClass": "string | null",
        "cssClass": "string | null",
        "order": 0,
        "parentId": "string | null",
        "children": []
      }
    ]
  }
}
```

---

### 3. POST /api/admin/menus

Tạo menu mới.

**Request Body:**
```json
{
  "name": "string (required)",
  "location": "string | null (optional)",
  "status": "active | inactive (default: active)"
}
```

**Response:**
```json
{
  "message": "Menu created successfully",
  "menu": {
    "id": "string",
    "name": "string",
    "location": "string | null",
    "status": "active | inactive",
    "createdAt": "ISO date",
    "updatedAt": "ISO date"
  }
}
```

**Cache Invalidation:** ✅ Tự động clear cache nếu location được set và status = 'active'

---

### 4. PUT /api/admin/menus/{id}

Cập nhật menu.

**Request Body:**
```json
{
  "name": "string (optional)",
  "location": "string | null (optional)",
  "status": "active | inactive (optional)"
}
```

**Response:**
```json
{
  "message": "Menu updated successfully",
  "menu": {
    "id": "string",
    "name": "string",
    "location": "string | null",
    "status": "active | inactive",
    "createdAt": "ISO date",
    "updatedAt": "ISO date"
  }
}
```

**Cache Invalidation:** ✅ Tự động clear cache nếu location hoặc status thay đổi

---

### 5. DELETE /api/admin/menus/{id}

Xóa menu và tất cả menu items.

**Response:**
```json
{
  "message": "Menu deleted successfully"
}
```

**Cache Invalidation:** ✅ Tự động clear cache nếu menu có location

---

### 6. POST /api/admin/menus/{id}/structure

Cập nhật cấu trúc menu (bulk update parentId và order).

**Request Body:**
```json
[
  {
    "id": "string",
    "parentId": "string | null",
    "order": 0
  }
]
```

**Response:**
```json
{
  "message": "Menu structure updated successfully",
  "structure": [
    {
      "id": "string",
      "title": "string",
      "type": "custom | category | product | page | post",
      "url": "string | null",
      "target": "_self | _blank",
      "iconClass": "string | null",
      "cssClass": "string | null",
      "order": 0,
      "parentId": "string | null",
      "children": []
    }
  ]
}
```

**Validation:**
- ✅ Max depth: 3 levels (0, 1, 2)
- ✅ Prevents circular references
- ✅ Validates all item IDs exist

**Cache Invalidation:** ✅ Tự động clear cache nếu menu có location

---

### 7. POST /api/admin/menu-items

Tạo menu item mới.

**Request Body:**
```json
{
  "menuId": "string (required)",
  "parentId": "string | null (optional)",
  "title": "string | null (optional)",
  "type": "custom | category | page | product | post (required)",
  "referenceId": "string | null (required for non-custom/page)",
  "url": "string | null (required for custom/page)",
  "target": "_self | _blank (default: _self)",
  "iconClass": "string | null (optional)",
  "cssClass": "string | null (optional)",
  "order": 0 (optional, auto-set if not provided)
}
```

**Response:**
```json
{
  "message": "Menu item created successfully",
  "item": {
    "id": "string",
    "menuId": "string",
    "parentId": "string | null",
    "title": "string | null",
    "type": "custom | category | product | page | post",
    "referenceId": "string | null",
    "url": "string | null",
    "target": "_self | _blank",
    "iconClass": "string | null",
    "cssClass": "string | null",
    "order": 0,
    "createdAt": "ISO date",
    "updatedAt": "ISO date"
  }
}
```

**Cache Invalidation:** ✅ Tự động clear cache nếu menu có location

---

### 8. GET /api/admin/menu-items/{id}

Lấy chi tiết menu item.

**Response:**
```json
{
  "item": {
    "id": "string",
    "menuId": "string",
    "parentId": "string | null",
    "title": "string | null",
    "type": "custom | category | product | page | post",
    "referenceId": "string | null",
    "url": "string | null",
    "target": "_self | _blank",
    "iconClass": "string | null",
    "cssClass": "string | null",
    "order": 0,
    "createdAt": "ISO date",
    "updatedAt": "ISO date"
  }
}
```

---

### 9. PUT /api/admin/menu-items/{id}

Cập nhật menu item.

**Request Body:**
```json
{
  "title": "string | null (optional)",
  "target": "_self | _blank (optional)",
  "iconClass": "string | null (optional)",
  "cssClass": "string | null (optional)",
  "parentId": "string | null (optional)",
  "order": 0 (optional)
}
```

**Response:**
```json
{
  "message": "Menu item updated successfully",
  "item": {
    "id": "string",
    "menuId": "string",
    "parentId": "string | null",
    "title": "string | null",
    "type": "custom | category | product | page | post",
    "referenceId": "string | null",
    "url": "string | null",
    "target": "_self | _blank",
    "iconClass": "string | null",
    "cssClass": "string | null",
    "order": 0,
    "createdAt": "ISO date",
    "updatedAt": "ISO date"
  }
}
```

**Cache Invalidation:** ✅ Tự động clear cache nếu menu có location

---

### 10. DELETE /api/admin/menu-items/{id}

Xóa menu item.

**Validation:**
- ❌ Không thể xóa nếu có menu items con

**Response:**
```json
{
  "message": "Menu item deleted successfully"
}
```

**Cache Invalidation:** ✅ Tự động clear cache nếu menu có location

---

### 11. POST /api/admin/menu-items/{id}/duplicate

Nhân bản menu item.

**Response:**
```json
{
  "message": "Menu item duplicated successfully",
  "item": {
    "id": "string",
    "menuId": "string",
    "parentId": "string | null",
    "title": "string (Copy)",
    "type": "custom | category | product | page | post",
    "referenceId": "string | null",
    "url": "string | null",
    "target": "_self | _blank",
    "iconClass": "string | null",
    "cssClass": "string | null",
    "order": 0,
    "createdAt": "ISO date",
    "updatedAt": "ISO date"
  }
}
```

**Cache Invalidation:** ✅ Tự động clear cache nếu menu có location

---

### 12. POST /api/admin/menu-items/resolve-link

Resolve menu item link và check reference status (dành cho client components).

**Request Body:**
```json
{
  "type": "custom | category | product | page | post",
  "url": "string | null",
  "referenceId": "string | null",
  "title": "string | null"
}
```

**Response:**
```json
{
  "url": "string",
  "title": "string",
  "exists": true,
  "active": true
}
```

---

## Public API Endpoints

### 1. GET /api/cms/menus/location/{location}

Lấy menu theo location (dành cho frontend rendering).

**Response:**
```json
{
  "menu": {
    "id": "string",
    "name": "string",
    "location": "string",
    "items": [
      {
        "id": "string",
        "title": "string",
        "url": "string",
        "target": "_self | _blank",
        "iconClass": "string | null",
        "cssClass": "string | null",
        "children": []
      }
    ]
  }
}
```

**Caching:**
- ✅ Cache-Control: `public, s-maxage=300, stale-while-revalidate=600`
- ✅ Cache 5 phút, stale-while-revalidate 10 phút
- ✅ Tự động filter items với deleted/inactive references

**Performance:** ✅ Resolve references và filter trong một pass

---

## Error Responses

Tất cả endpoints trả về error với format:

```json
{
  "error": "Error message",
  "details": {
    "stack": "Error stack (chỉ trong development)"
  }
}
```

**Status Codes:**
- `400`: Bad Request (validation error)
- `401`: Unauthorized (chưa đăng nhập)
- `404`: Not Found
- `500`: Internal Server Error

---

## Cache Invalidation Strategy

Cache được tự động invalidate khi:
1. ✅ Admin tạo menu mới với location và status = 'active'
2. ✅ Admin cập nhật menu (location hoặc status thay đổi)
3. ✅ Admin xóa menu có location
4. ✅ Admin cập nhật menu structure (drag & drop)
5. ✅ Admin tạo/cập nhật/xóa menu item
6. ✅ Admin duplicate menu item

**Implementation:**
- Sử dụng `Cache-Control: no-cache` header khi gọi public API từ admin API
- Next.js sẽ tự động revalidate cache trên request tiếp theo

---

## Performance Optimizations

1. ✅ **Aggregation Pipeline**: Sử dụng aggregation để tránh N+1 queries khi lấy item counts
2. ✅ **Bulk Operations**: Sử dụng `bulkWrite` cho structure updates
3. ✅ **Caching**: Public API được cache 5 phút với stale-while-revalidate
4. ✅ **Reference Resolution**: Resolve references trong một pass, filter invalid items

---

## Security

- ✅ Tất cả admin endpoints yêu cầu authentication (`requireAdmin()`)
- ✅ Public endpoints không yêu cầu authentication
- ✅ Input validation với Zod schemas
- ✅ ObjectId validation để prevent injection

---

## Rate Limiting

Hiện tại chưa có rate limiting. Có thể thêm trong tương lai nếu cần.

---

**Last Updated:** 12/12/2025

