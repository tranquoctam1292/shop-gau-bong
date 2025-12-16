# Vercel Blob Storage Setup Guide

**Ngày tạo:** 2025-01-XX  
**Mục tiêu:** Hướng dẫn cài đặt và cấu hình Vercel Blob Storage cho media files

---

## 📋 TỔNG QUAN

Vercel Blob Storage là giải pháp lưu trữ file được Vercel cung cấp, cho phép:
- Upload và lưu trữ media files (images, videos)
- CDN tự động cho performance tốt
- Không cần quản lý server storage
- Tích hợp dễ dàng với Next.js

---

## 🔧 CÀI ĐẶT

### 1. Cài đặt Package

```bash
npm install @vercel/blob
```

### 2. Cấu hình Environment Variables

Thêm vào file `.env.local`:

```env
# Vercel Blob Storage Token
# Lấy từ: https://vercel.com/dashboard/stores
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Cách lấy token:**
1. Đăng nhập vào [Vercel Dashboard](https://vercel.com/dashboard)
2. Vào **Storage** → **Create Database/Store**
3. Chọn **Blob**
4. Tạo store mới
5. Copy **Read/Write Token** từ store settings

### 3. Cấu hình cho Production (Vercel)

Thêm environment variable trong Vercel Dashboard:
1. Vào project settings
2. **Settings** → **Environment Variables**
3. Thêm `BLOB_READ_WRITE_TOKEN` với value từ store

---

## 📁 CẤU TRÚC FILES

### Utility Functions
- `lib/utils/vercelBlob.ts` - Utility functions cho upload, delete, list

### API Routes
- `app/api/admin/media/route.ts` - Upload media files (POST endpoint - current)
- ⚠️ `app/api/admin/media/upload/route.ts` - DEPRECATED (legacy endpoint, not used anymore)
- `app/api/admin/images/upload/route.ts` - Upload edited images (đã cập nhật)

### Components
- `components/admin/products/MediaLibraryModal.tsx` - Đã cập nhật để upload lên Vercel Blob

---

## 🚀 SỬ DỤNG

### Upload File

```typescript
import { uploadToBlob } from '@/lib/utils/vercelBlob';

const file = // File object
const blobFile = await uploadToBlob(file, 'my-image.jpg', {
  access: 'public',
  contentType: 'image/jpeg',
  cacheControlMaxAge: 31536000, // 1 year
});

console.log(blobFile.url); // Public URL
```

### Delete File

```typescript
import { deleteFromBlob } from '@/lib/utils/vercelBlob';

await deleteFromBlob(blobUrl);
```

### List Files

```typescript
import { listBlobFiles } from '@/lib/utils/vercelBlob';

const files = await listBlobFiles('media/', 100);
```

---

## 🔄 MIGRATION TỪ LOCAL STORAGE

### Files hiện tại trong `public/uploads/`

Các files đã upload trước đây vẫn còn trong local storage. Có 2 options:

1. **Giữ nguyên** - Files cũ vẫn hoạt động, chỉ files mới upload lên Vercel Blob
2. **Migrate** - Upload lại tất cả files cũ lên Vercel Blob (cần script migration)

---

## ⚙️ CẤU HÌNH

### File Size Limits
- Maximum: 10MB (có thể điều chỉnh trong API routes)
- Allowed types: JPEG, PNG, GIF, WebP (images), MP4, WebM, OGG (videos)

### Cache Control
- Default: 1 year (31536000 seconds)
- Có thể điều chỉnh trong `uploadToBlob()` options

### Access Control
- Default: `public` (có thể đổi thành `private` nếu cần)

---

## 🧪 TESTING

### Test Upload

1. Vào admin panel
2. Mở Media Library Modal
3. Upload một file
4. Kiểm tra URL trả về có chứa `blob.vercel-storage.com`

### Test trong Development

```bash
# Đảm bảo có BLOB_READ_WRITE_TOKEN trong .env.local
npm run dev
```

---

## 📝 NOTES

- Vercel Blob Storage có free tier: 1GB storage, 10GB bandwidth/month
- Files được lưu với pathname: `media/{timestamp}-{filename}`
- URLs có format: `https://{store-id}.public.blob.vercel-storage.com/{pathname}`

---

## 🔗 LINKS

- [Vercel Blob Documentation](https://vercel.com/docs/storage/vercel-blob)
- [Vercel Blob SDK](https://www.npmjs.com/package/@vercel/blob)

---

**Status:** ✅ Setup Complete
