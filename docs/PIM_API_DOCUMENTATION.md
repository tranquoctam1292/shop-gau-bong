# 📚 PIM MODULE API DOCUMENTATION

**Module:** Product Information Management (PIM)  
**Base URL:** `/api/admin/products`  
**Authentication:** Required (Admin only)

---

## 📋 MỤC LỤC

1. [GET /api/admin/products](#get-apadminproducts)
2. [POST /api/admin/products](#post-apadminproducts)
3. [GET /api/admin/products/[id]](#get-apadminproductsid)
4. [PUT /api/admin/products/[id]](#put-apadminproductsid)
5. [DELETE /api/admin/products/[id]](#delete-apadminproductsid)
6. [PATCH /api/admin/products/[id]/quick-update](#patch-apadminproductsidquick-update)
7. [PATCH /api/admin/products/[id]/restore](#patch-apadminproductsidrestore)
8. [DELETE /api/admin/products/[id]/force](#delete-apadminproductsidforce)
9. [POST /api/admin/products/bulk-action](#post-apadminproductsbulk-action)
10. [POST /api/admin/products/auto-cleanup-trash](#post-apadminproductsauto-cleanup-trash)

---

## GET /api/admin/products

Lấy danh sách sản phẩm với filters và pagination.

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `page` | number | No | Số trang (default: 1) |
| `per_page` | number | No | Số items mỗi trang (default: 10) |
| `search` | string | No | Tìm kiếm (tên, SKU, barcode) |
| `status` | string | No | Filter theo status: `publish`, `draft`, `trash` |
| `trashed` | boolean | No | Chỉ lấy sản phẩm trong thùng rác (`true`) |
| `category` | string | No | Filter theo category ID |
| `brand` | string | No | Filter theo brand ID |
| `price_min` | number | No | Giá tối thiểu (VND) |
| `price_max` | number | No | Giá tối đa (VND) |
| `stock_status` | string | No | Filter theo stock status: `instock`, `outofstock`, `onbackorder` |

### Response

```json
{
  "products": [
    {
      "id": "string",
      "databaseId": "string",
      "name": "string",
      "slug": "string",
      "price": "string",
      "regularPrice": "string",
      "salePrice": "string",
      "onSale": boolean,
      "minPrice": number,
      "maxPrice": number,
      "image": {
        "sourceUrl": "string",
        "altText": "string"
      },
      "sku": "string",
      "stockStatus": "string",
      "stockQuantity": number,
      "status": "draft" | "publish" | "trash",
      "categories": [...],
      "tags": [...],
      "type": "simple" | "variable"
    }
  ],
  "pagination": {
    "total": number,
    "totalPages": number,
    "currentPage": number,
    "perPage": number,
    "hasNextPage": boolean,
    "hasPrevPage": boolean
  },
  "filters": {
    "trashCount": number
  }
}
```

### Example

```bash
GET /api/admin/products?page=1&per_page=20&status=publish&category=123&price_min=100000&price_max=500000
```

---

## POST /api/admin/products

Tạo sản phẩm mới.

### Request Body

```json
{
  "name": "string",
  "slug": "string",
  "description": "string",
  "shortDescription": "string",
  "sku": "string",
  "minPrice": number,
  "maxPrice": number,
  "status": "draft" | "publish",
  "category": "string",
  "tags": ["string"],
  "variants": [...]
}
```

### Response

```json
{
  "product": { ... },
  "message": "Product created successfully"
}
```

---

## GET /api/admin/products/[id]

Lấy thông tin chi tiết một sản phẩm.

### Response

```json
{
  "product": { ... }
}
```

---

## PUT /api/admin/products/[id]

Cập nhật toàn bộ thông tin sản phẩm.

### Request Body

Tương tự như POST, nhưng tất cả fields đều optional.

### Response

```json
{
  "product": { ... },
  "message": "Product updated successfully"
}
```

---

## DELETE /api/admin/products/[id]

Xóa tạm sản phẩm (soft delete).

### Response

```json
{
  "message": "Product moved to trash successfully"
}
```

**Lưu ý:** Sản phẩm không bị xóa vĩnh viễn, chỉ được chuyển vào thùng rác.

---

## PATCH /api/admin/products/[id]/quick-update

Cập nhật nhanh một số fields của sản phẩm.

### Request Body

```json
{
  "price": number,           // Optional
  "stockQuantity": number,   // Optional
  "status": "draft" | "publish" | "trash"  // Optional
}
```

### Response

```json
{
  "product": { ... },
  "message": "Product quick updated successfully"
}
```

### Example

```bash
PATCH /api/admin/products/123/quick-update
Content-Type: application/json

{
  "price": 150000,
  "stockQuantity": 50
}
```

---

## PATCH /api/admin/products/[id]/restore

Khôi phục sản phẩm từ thùng rác.

### Response

```json
{
  "product": { ... },
  "message": "Product restored successfully"
}
```

**Lưu ý:** Sản phẩm được khôi phục về trạng thái "draft".

---

## DELETE /api/admin/products/[id]/force

Xóa vĩnh viễn sản phẩm.

### Response

```json
{
  "message": "Product permanently deleted successfully"
}
```

**⚠️ Cảnh báo:** Hành động này không thể hoàn tác!

---

## POST /api/admin/products/bulk-action

Thực hiện thao tác hàng loạt trên nhiều sản phẩm.

### Request Body

```json
{
  "ids": ["string"],  // Array of product IDs
  "action": "soft_delete" | "force_delete" | "restore" | "update_status" | "update_price" | "update_stock",
  "value": string | number  // Required for update_status, update_price, update_stock
}
```

### Actions

- **soft_delete** - Xóa tạm (chuyển vào thùng rác)
- **force_delete** - Xóa vĩnh viễn
- **restore** - Khôi phục từ thùng rác
- **update_status** - Cập nhật status (value: "draft" | "publish")
- **update_price** - Cập nhật giá (value: number)
- **update_stock** - Cập nhật kho (value: number)

### Response

```json
{
  "success": true,
  "updated": number,
  "failed": number,
  "message": "Bulk action completed. X products updated, Y failed.",
  "results": [
    {
      "id": "string",
      "status": "success" | "failed",
      "message": "string"  // Optional, only if failed
    }
  ]
}
```

### Example

```bash
POST /api/admin/products/bulk-action
Content-Type: application/json

{
  "ids": ["123", "456", "789"],
  "action": "update_status",
  "value": "publish"
}
```

---

## POST /api/admin/products/auto-cleanup-trash

Tự động xóa vĩnh viễn sản phẩm trong thùng rác cũ hơn 30 ngày.

**Lưu ý:** API này thường được gọi bởi cron job, không phải user.

### Response

```json
{
  "success": true,
  "deleted": number,
  "errors": number,
  "deletedProductIds": ["string"],
  "errorsList": [
    {
      "productId": "string",
      "error": "string"
    }
  ],
  "cutoffDate": "ISO date string",
  "message": "Đã xóa vĩnh viễn X sản phẩm trong thùng rác (cũ hơn 30 ngày)"
}
```

### Cron Schedule

- **Vercel Cron:** Chạy mỗi ngày lúc 2:00 AM (UTC)
- **Schedule:** `0 2 * * *` (cron expression)

---

## 🔐 AUTHENTICATION

Tất cả API routes yêu cầu authentication:

1. User phải đăng nhập
2. User phải có quyền admin
3. Nếu không authenticated, API sẽ trả về `401 Unauthorized`

---

## ❌ ERROR CODES

| Status Code | Description |
|-------------|-------------|
| `400` | Bad Request - Invalid input |
| `401` | Unauthorized - Authentication required |
| `404` | Not Found - Product not found |
| `500` | Internal Server Error |

### Error Response Format

```json
{
  "error": "Error message",
  "details": {
    // Additional error details (only in development)
  }
}
```

---

## 📝 NOTES

- Tất cả prices được lưu và trả về dưới dạng **VND** (Vietnamese Dong)
- Dates được trả về dưới dạng **ISO 8601** strings
- Product IDs là **MongoDB ObjectId** strings
- Soft delete sử dụng field `deletedAt` (Date | null)
- Auto-cleanup xóa sản phẩm có `deletedAt < (now - 30 days)`

---

## 🔗 RELATED DOCUMENTATION

- [PIM Module Implementation Plan](./PIM_MODULE_IMPLEMENTATION_PLAN.md)
- [PIM Module Progress](./PIM_MODULE_PROGRESS.md)
- [PIM Module User Guide](./PIM_MODULE_USER_GUIDE.md)

