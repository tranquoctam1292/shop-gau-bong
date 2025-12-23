# 📚 Media Library API Documentation

**Last Updated:** 2025-01-XX  
**Base URL:** `/api/admin/media`  
**Authentication:** Required (Admin only)

---

## 📋 MỤC LỤC

1. [Tổng quan](#1-tổng-quan)
2. [Authentication](#2-authentication)
3. [Endpoints](#3-endpoints)
4. [Error Handling](#4-error-handling)
5. [Examples](#5-examples)

---

## 1. TỔNG QUAN

Media Library API cung cấp các endpoints để quản lý media files (hình ảnh, video, tài liệu) trong hệ thống CMS.

**Base URL:** `/api/admin/media`

**Authentication:** Tất cả endpoints yêu cầu admin authentication (NextAuth session với role `admin`)

---

## 2. AUTHENTICATION

Tất cả endpoints yêu cầu authentication:

```http
Headers:
  Cookie: next-auth.session-token=<session_token>
```

**Error Response (401 Unauthorized):**
```json
{
  "success": false,
  "error": "Unauthorized"
}
```

---

## 3. ENDPOINTS

### 3.1. Upload Media

**POST** `/api/admin/media`

Upload một file media mới.

**Request:**
- **Content-Type:** `multipart/form-data`
- **Body:**
  - `file` (File, required) - File cần upload
  - `name` (string, optional) - Tên hiển thị
  - `altText` (string, optional) - Alt text cho SEO
  - `folder` (string, optional) - Folder path

**Constraints:**
- Max file size: 5MB
- Allowed types:
  - Images: `image/jpeg`, `image/jpg`, `image/png`, `image/gif`, `image/webp`
  - Videos: `video/mp4`, `video/webm`, `video/ogg`
  - Documents: `application/pdf`, `application/msword`, etc.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "My Image",
    "filename": "1234567890-image.jpg",
    "url": "https://blob.vercel-storage.com/...",
    "path": "media/1234567890-image.jpg",
    "type": "image",
    "mimeType": "image/jpeg",
    "extension": "jpg",
    "size": 245678,
    "width": 1920,
    "height": 1080,
    "altText": "My image alt text",
    "createdAt": "2025-01-XXT00:00:00.000Z",
    "updatedAt": "2025-01-XXT00:00:00.000Z"
  }
}
```

**Error Responses:**
- `400 Bad Request` - Invalid file or validation error
- `401 Unauthorized` - Not authenticated
- `500 Internal Server Error` - Upload failed

---

### 3.2. Get Media List

**GET** `/api/admin/media`

Lấy danh sách media với filters và pagination.

**Query Parameters:**
- `page` (number, default: 1) - Page number
- `limit` (number, default: 20, max: 100) - Items per page
- `type` (string, optional) - Filter by type: `image`, `video`, `document`, `other`
- `search` (string, optional) - Text search (name, altText)
- `sort` (string, default: `newest`) - Sort option: `newest`, `oldest`, `name`, `size`
- `folder` (string, optional) - Filter by folder
- `uploadedBy` (string, optional) - Filter by user ID (ObjectId)
- `dateFrom` (date, optional) - Filter by date from
- `dateTo` (date, optional) - Filter by date to
- `minSize` (number, optional) - Filter by minimum size (bytes)
- `maxSize` (number, optional) - Filter by maximum size (bytes)

**Example Request:**
```
GET /api/admin/media?page=1&limit=20&type=image&search=product&sort=newest
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Product Image 1",
      "url": "https://blob.vercel-storage.com/...",
      "type": "image",
      "size": 245678,
      "createdAt": "2025-01-XXT00:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 100,
    "pages": 5,
    "page": 1,
    "limit": 20,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

### 3.3. Get Media Detail

**GET** `/api/admin/media/[id]`

Lấy thông tin chi tiết của một media.

**Path Parameters:**
- `id` (string, required) - Media ID (ObjectId)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "My Image",
    "filename": "1234567890-image.jpg",
    "url": "https://blob.vercel-storage.com/...",
    "path": "media/1234567890-image.jpg",
    "type": "image",
    "mimeType": "image/jpeg",
    "extension": "jpg",
    "size": 245678,
    "width": 1920,
    "height": 1080,
    "altText": "My image alt text",
    "caption": "Image caption",
    "description": "Image description",
    "createdAt": "2025-01-XXT00:00:00.000Z",
    "updatedAt": "2025-01-XXT00:00:00.000Z"
  }
}
```

**Error Responses:**
- `400 Bad Request` - Invalid ID format
- `404 Not Found` - Media not found

---

### 3.4. Update Media

**PUT** `/api/admin/media/[id]`

Cập nhật metadata của media (không thay đổi file vật lý).

**Path Parameters:**
- `id` (string, required) - Media ID (ObjectId)

**Request Body (JSON):**
```json
{
  "name": "Updated Name",
  "altText": "Updated alt text",
  "caption": "Updated caption",
  "description": "Updated description",
  "folder": "products"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Updated Name",
    "altText": "Updated alt text",
    // ... other fields
    "updatedAt": "2025-01-XXT00:00:00.000Z"
  }
}
```

**Error Responses:**
- `400 Bad Request` - Invalid data or validation error
- `404 Not Found` - Media not found

---

### 3.5. Delete Media

**DELETE** `/api/admin/media/[id]`

Xóa media file và document.

**Path Parameters:**
- `id` (string, required) - Media ID (ObjectId)

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Media deleted successfully"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid ID format
- `404 Not Found` - Media not found
- `500 Internal Server Error` - Delete failed

**Note:** Xóa cả file từ storage và document từ database.

---

### 3.6. Search Media (Advanced)

**GET** `/api/admin/media/search`

Advanced search với multiple filters.

**Query Parameters:** (Same as Get Media List)

**Response:** (Same format as Get Media List, with additional `query` field)

```json
{
  "success": true,
  "data": [...],
  "pagination": {...},
  "query": {
    "search": "product",
    "filters": {
      "type": "image",
      "folder": null,
      "dateFrom": null,
      "dateTo": null
    },
    "sort": "newest"
  }
}
```

---

## 4. ERROR HANDLING

Tất cả errors trả về format chuẩn:

```json
{
  "success": false,
  "error": "Error message",
  "details": {
    // Optional: validation errors
  }
}
```

**HTTP Status Codes:**
- `200 OK` - Success
- `400 Bad Request` - Invalid input/validation error
- `401 Unauthorized` - Not authenticated
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

---

## 5. EXAMPLES

### 5.1. Upload Image

```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('name', 'Product Image');
formData.append('altText', 'Product image description');

const response = await fetch('/api/admin/media', {
  method: 'POST',
  body: formData,
});

const data = await response.json();
console.log(data.data.url); // Media URL
```

### 5.2. Get Media List with Filters

```javascript
const params = new URLSearchParams({
  page: '1',
  limit: '20',
  type: 'image',
  search: 'product',
  sort: 'newest',
});

const response = await fetch(`/api/admin/media?${params}`);
const data = await response.json();
console.log(data.data); // Media array
console.log(data.pagination); // Pagination info
```

### 5.3. Update Media Metadata

```javascript
const response = await fetch(`/api/admin/media/${mediaId}`, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'Updated Name',
    altText: 'Updated alt text',
  }),
});

const data = await response.json();
```

### 5.4. Delete Media

```javascript
const response = await fetch(`/api/admin/media/${mediaId}`, {
  method: 'DELETE',
});

const data = await response.json();
```

---

## 6. IMAGE PROCESSING

Khi upload ảnh, hệ thống tự động:
- Resize nếu > 2500px (giữ aspect ratio)
- Optimize với quality 85%
- Extract metadata (width, height)
- Generate thumbnail (nếu cần)

**Supported Formats:**
- JPEG, PNG, GIF, WebP

---

## 7. STORAGE

**Current Storage:** Vercel Blob Storage

**File Path Structure:**
```
media/YYYY/MM/timestamp-filename.ext
```

**Public URLs:** Tất cả files được lưu với `access: 'public'`

---

## 8. RATE LIMITING

Hiện tại chưa có rate limiting. Có thể thêm sau nếu cần.

---

## 9. BEST PRACTICES

1. **File Size:** Luôn optimize ảnh trước khi upload (< 5MB)
2. **Alt Text:** Luôn cung cấp alt text cho SEO
3. **Naming:** Sử dụng tên file mô tả rõ ràng
4. **Folder Organization:** Sử dụng folder để tổ chức media
5. **Error Handling:** Luôn handle errors khi gọi API

---

**Last Updated:** 2025-01-XX
