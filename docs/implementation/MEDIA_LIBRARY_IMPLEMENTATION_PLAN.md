# 📸 Kế Hoạch Xây Dựng Module Thư viện Media (Media Library)

**Ngày tạo:** 2025-01-XX  
**Status:** Planning  
**Mục tiêu:** Xây dựng hệ thống quản lý media tập trung cho CMS admin

---

## 📋 MỤC LỤC

1. [Tổng quan](#1-tổng-quan)
2. [Kiến trúc & Thiết kế](#2-kiến-trúc--thiết-kế)
3. [Phân chia Phase](#3-phân-chia-phase)
4. [Chi tiết từng Phase](#4-chi-tiết-từng-phase)
5. [Dependencies & Tools](#5-dependencies--tools)
6. [Testing Strategy](#6-testing-strategy)
7. [Deployment Checklist](#7-deployment-checklist)

---

## 1. TỔNG QUAN

### 1.1. Mục tiêu

Xây dựng Module Media Library để:
- ✅ Quản lý tập trung tất cả media (hình ảnh, video, tài liệu)
- ✅ Thay thế cách quản lý file rời rạc hiện tại
- ✅ Cung cấp giao diện trực quan để upload, quản lý, tìm kiếm
- ✅ Tích hợp vào ProductForm, CategoryForm, Editor
- ✅ Hỗ trợ xử lý ảnh tự động (resize, optimize, thumbnail)

### 1.2. Tech Stack

- **Backend:** Next.js API Routes (`/api/admin/media`)
- **Database:** MongoDB (collection `media`)
- **Storage:** Vercel Blob Storage (hiện tại) / AWS S3 (tương lai)
- **Image Processing:** Sharp
- **Frontend:** React + Tailwind CSS + Shadcn UI
- **File Upload:** Multipart/form-data với `formidable` hoặc `multer`

### 1.3. Yêu cầu Phi chức năng

- **Performance:** API list media < 200ms
- **Security:** Chỉ admin mới được upload/delete
- **Scalability:** Adapter pattern cho storage (dễ chuyển Local → Cloud)
- **Mobile:** UI responsive, touch-friendly

---

## 2. KIẾN TRÚC & THIẾT KẾ

### 2.1. Database Schema

**Collection:** `media`

```typescript
// types/media.ts
export type MediaType = 'image' | 'video' | 'document' | 'other';

export interface MongoMedia {
  _id: ObjectId;
  
  // Thông tin file cơ bản
  name: string;             // Tên hiển thị (editable)
  filename: string;         // Tên file gốc trên đĩa/cloud
  url: string;              // Public URL
  path: string;             // Đường dẫn vật lý hoặc S3 Key
  
  // Phân loại
  type: MediaType;
  mimeType: string;         // e.g., 'image/jpeg'
  extension: string;        // e.g., 'jpg'
  folder?: string;         // Optional: phân cấp thư mục
  
  // Metadata kỹ thuật
  size: number;            // Kích thước file (bytes)
  width?: number;          // Chỉ dành cho ảnh/video
  height?: number;         // Chỉ dành cho ảnh/video
  
  // Metadata SEO & Quản lý
  altText?: string;        // Thẻ alt cho SEO
  caption?: string;        // Chú thích ảnh
  description?: string;    // Mô tả chi tiết
  
  // System
  uploadedBy?: ObjectId;   // User ID người upload
  createdAt: Date;
  updatedAt: Date;
}
```

### 2.2. Storage Service Architecture

**Design Pattern:** Adapter Pattern

```typescript
// lib/storage/StorageService.ts
interface IStorageService {
  upload(file: Buffer, filename: string, options?: UploadOptions): Promise<StorageResult>;
  delete(path: string): Promise<void>;
  getUrl(path: string): string;
}

// Implementations:
// - VercelBlobStorageService (hiện tại)
// - LocalStorageService (development)
// - S3StorageService (tương lai)
```

### 2.3. API Routes Structure

```
app/api/admin/media/
├── route.ts              # GET (list), POST (upload)
├── [id]/
│   └── route.ts          # GET (detail), PUT (update), DELETE (delete)
└── search/
    └── route.ts          # GET (advanced search)
```

### 2.4. Frontend Components Structure

```
components/admin/media/
├── MediaLibraryModal.tsx      # Modal chọn media (đã có, cần cải thiện)
├── MediaUploader.tsx          # Component upload (drag & drop)
├── MediaGrid.tsx              # Grid view với lazy load
├── MediaList.tsx              # List view chi tiết
├── MediaFilterBar.tsx         # Search, filter, sort
├── MediaDetailSidebar.tsx     # Sidebar chi tiết khi click ảnh
└── MediaPicker.tsx            # Wrapper component tích hợp
```

---

## 3. PHÂN CHIA PHASE

### Phase 1: Database & Backend Foundation ⏳
**Thời gian ước tính:** 2-3 ngày  
**Mục tiêu:** Thiết lập database schema, indexes, types

### Phase 2: Storage Service & Image Processing ⏳
**Thời gian ước tính:** 2-3 ngày  
**Mục tiêu:** Xây dựng Storage Service với Adapter pattern, tích hợp Sharp

### Phase 3: API Endpoints ⏳
**Thời gian ước tính:** 3-4 ngày  
**Mục tiêu:** Implement đầy đủ CRUD API với authentication

### Phase 4: Frontend Core Components ⏳
**Thời gian ước tính:** 4-5 ngày  
**Mục tiêu:** Xây dựng UI components (Uploader, Grid, List, Filter)

### Phase 5: Integration & Enhancement ⏳
**Thời gian ước tính:** 2-3 ngày  
**Mục tiêu:** Tích hợp vào ProductForm, CategoryForm, Editor

### Phase 6: Testing & Optimization ⏳
**Thời gian ước tính:** 2 ngày  
**Mục tiêu:** Testing, performance optimization, documentation

**Tổng thời gian ước tính:** 15-20 ngày

---

## 4. CHI TIẾT TỪNG PHASE

### 📦 Phase 1: Database & Backend Foundation

**Status:** ⏳ Pending  
**Files cần tạo:**

#### Task 1.1: Tạo Types & Interfaces
- [ ] `types/media.ts` - Định nghĩa `MongoMedia`, `MediaType`
- [ ] `types/api/media.ts` - API request/response types

#### Task 1.2: Database Setup
- [ ] Cập nhật `lib/db.ts` - Thêm `media` collection vào `getCollections()`
- [ ] `scripts/setup-database-indexes.ts` - Tạo indexes:
  ```typescript
  media.createIndex({ name: 'text', altText: 'text' }); // Text search
  media.createIndex({ type: 1 });                       // Filter by type
  media.createIndex({ createdAt: -1 });                 // Sort newest
  media.createIndex({ folder: 1 });                     // Filter by folder
  media.createIndex({ uploadedBy: 1 });                 // Filter by user
  ```

#### Task 1.3: Repository Pattern
- [ ] `lib/repositories/mediaRepository.ts` - CRUD operations cho media
  - `createMedia(mediaData)`
  - `getMediaById(id)`
  - `getMediaList(filters, pagination)`
  - `updateMedia(id, updates)`
  - `deleteMedia(id)`
  - `searchMedia(query, filters)`

#### Task 1.4: Validation Schema
- [ ] `lib/validations/mediaSchema.ts` - Zod schemas cho validation
  - Upload validation
  - Update validation
  - Search/filter validation

**Deliverables:**
- ✅ Database schema hoàn chỉnh
- ✅ Types & interfaces
- ✅ Repository layer
- ✅ Indexes được tạo

---

### 🗄️ Phase 2: Storage Service & Image Processing

**Status:** ⏳ Pending  
**Files cần tạo:**

#### Task 2.1: Storage Service Interface
- [ ] `lib/storage/StorageService.ts` - Interface `IStorageService`
- [ ] `lib/storage/types.ts` - Types cho storage (UploadOptions, StorageResult)

#### Task 2.2: Vercel Blob Implementation
- [ ] `lib/storage/VercelBlobStorageService.ts` - Implement cho Vercel Blob
  - Kiểm tra `lib/utils/vercelBlob.ts` hiện có
  - Wrap lại theo interface `IStorageService`

#### Task 2.3: Local Storage Implementation (Optional - Dev)
- [ ] `lib/storage/LocalStorageService.ts` - Implement cho local storage
  - Lưu tại `public/uploads/YYYY/MM/`
  - Generate public URL

#### Task 2.4: Storage Factory
- [ ] `lib/storage/storageFactory.ts` - Factory function để chọn storage service
  ```typescript
  export function getStorageService(): IStorageService {
    if (process.env.STORAGE_TYPE === 'local') {
      return new LocalStorageService();
    }
    return new VercelBlobStorageService(); // Default
  }
  ```

#### Task 2.5: Image Processing Service
- [ ] `lib/services/imageProcessingService.ts` - Xử lý ảnh với Sharp
  - `resizeImage(buffer, maxWidth, maxHeight)` - Resize nếu > 2500px
  - `optimizeImage(buffer, quality)` - Nén ảnh (quality 80-90)
  - `generateThumbnail(buffer, size)` - Tạo thumbnail (200x200)
  - `getImageMetadata(buffer)` - Lấy width, height, format
  - `convertToWebP(buffer)` - Convert sang WebP (optional)

**Deliverables:**
- ✅ Storage Service với Adapter pattern
- ✅ Image processing với Sharp
- ✅ Support Vercel Blob (và Local nếu cần)

---

### 🔌 Phase 3: API Endpoints

**Status:** ⏳ Pending  
**Files cần tạo:**

#### Task 3.1: Upload API
- [ ] `app/api/admin/media/route.ts` - POST handler
  - Validate file (size < 5MB, đúng MIME type)
  - Xử lý multipart/form-data (dùng `formidable` hoặc `multer`)
  - Process image với Sharp (resize, optimize)
  - Upload lên Storage Service
  - Lưu metadata vào MongoDB
  - Return `MongoMedia` object
  - Authentication: `requireAdmin()`

#### Task 3.2: List API
- [ ] `app/api/admin/media/route.ts` - GET handler
  - Query params: `page`, `limit`, `type`, `search`, `sort`
  - Pagination support
  - Text search (name, altText)
  - Filter by type, folder
  - Sort: newest, oldest, name
  - Return: `{ data: MongoMedia[], pagination: {...} }`

#### Task 3.3: Detail API
- [ ] `app/api/admin/media/[id]/route.ts` - GET handler
  - Get single media by ID
  - Return full `MongoMedia` object

#### Task 3.4: Update API
- [ ] `app/api/admin/media/[id]/route.ts` - PUT handler
  - Update metadata: `name`, `altText`, `caption`, `description`
  - Không đụng vào file vật lý
  - Validation với Zod schema

#### Task 3.5: Delete API
- [ ] `app/api/admin/media/[id]/route.ts` - DELETE handler
  - Tìm document trong DB
  - Xóa file vật lý từ Storage Service
  - Xóa document khỏi MongoDB
  - (Optional) Kiểm tra xem media có đang được dùng không (warning)

#### Task 3.6: Search API (Advanced)
- [ ] `app/api/admin/media/search/route.ts` - GET handler
  - Advanced search với multiple filters
  - Date range filter
  - Size range filter
  - User filter

**Deliverables:**
- ✅ Đầy đủ CRUD API endpoints
- ✅ Authentication & authorization
- ✅ Validation & error handling
- ✅ Pagination & filtering

---

### 🎨 Phase 4: Frontend Core Components

**Status:** ⏳ Pending  
**Files cần tạo/cập nhật:**

#### Task 4.1: MediaUploader Component
- [ ] `components/admin/media/MediaUploader.tsx`
  - Drag & Drop với `react-dropzone`
  - Upload progress bar
  - Hỗ trợ upload nhiều file cùng lúc
  - Preview ảnh trước khi upload
  - Error handling & validation feedback

#### Task 4.2: MediaGrid Component
- [ ] `components/admin/media/MediaGrid.tsx`
  - Grid layout với lazy load images
  - Thumbnail display (200x200)
  - Click để xem chi tiết
  - Selection mode (multiple select)
  - Infinite scroll hoặc pagination

#### Task 4.3: MediaList Component
- [ ] `components/admin/media/MediaList.tsx`
  - List view với thông tin chi tiết
  - Columns: Thumbnail, Name, Type, Size, Date
  - Sortable columns
  - Selection checkbox

#### Task 4.4: MediaFilterBar Component
- [ ] `components/admin/media/MediaFilterBar.tsx`
  - Search input (tìm theo name/altText)
  - Type filter dropdown (Image, Video, Document)
  - Sort dropdown (Newest, Oldest, Name)
  - Date range filter (optional)
  - Clear filters button

#### Task 4.5: MediaDetailSidebar Component
- [ ] `components/admin/media/MediaDetailSidebar.tsx`
  - Preview ảnh lớn
  - Form edit: Name, Alt Text, Caption, Description
  - Display: URL (copy button), File info (size, dimensions)
  - Actions: Update, Delete (với confirm)
  - Close button

#### Task 4.6: MediaLibraryModal Component (Cải thiện)
- [ ] `components/admin/media/MediaLibraryModal.tsx` (đã có, cần cải thiện)
  - Props: `onSelect: (media: MongoMedia[]) => void`, `multiple: boolean`
  - Tabs: Library, Upload
  - Tích hợp MediaGrid, MediaFilterBar, MediaUploader
  - Selection mode với counter
  - "Insert X media" button

#### Task 4.7: MediaPicker Component (Wrapper)
- [ ] `components/admin/media/MediaPicker.tsx`
  - Wrapper component dễ sử dụng
  - Props: `value`, `onChange`, `multiple`, `type`
  - Hiển thị preview ảnh đã chọn
  - Button mở MediaLibraryModal

#### Task 4.8: Media Library Page
- [ ] `app/admin/media/page.tsx`
  - Full page quản lý media
  - Tích hợp tất cả components trên
  - Bulk actions (delete multiple)
  - Export/Import (optional)

**Deliverables:**
- ✅ Đầy đủ UI components
- ✅ Responsive design (mobile-first)
- ✅ Performance optimization (lazy load, virtualization)
- ✅ User experience tốt

---

### 🔗 Phase 5: Integration & Enhancement

**Status:** ⏳ Pending  
**Files cần cập nhật:**

#### Task 5.1: ProductForm Integration
- [ ] `components/admin/ProductForm.tsx`
  - Thay thế `FeaturedImageBox` hiện tại bằng `MediaPicker`
  - Thay thế `ProductGalleryBox` bằng `MediaPicker` (multiple)
  - Variant image picker sử dụng `MediaPicker`

#### Task 5.2: CategoryForm Integration
- [ ] `components/admin/CategoryForm.tsx` (nếu có)
  - Category image sử dụng `MediaPicker`

#### Task 5.3: Editor Integration
- [ ] `components/admin/products/ClassicEditor.tsx` hoặc Editor component
  - Custom button "Insert Image" trong toolbar
  - Mở `MediaLibraryModal` thay vì upload mặc định
  - Insert image URL vào editor

#### Task 5.4: Banner/Homepage Integration (Optional)
- [ ] Cập nhật banner upload sử dụng Media Library
- [ ] Homepage sections sử dụng Media Library

#### Task 5.5: Migration Script (Optional)
- [ ] `scripts/migrate-existing-images.ts`
  - Migrate ảnh hiện có vào Media Library
  - Scan `public/uploads/` hoặc Vercel Blob
  - Tạo documents trong `media` collection
  - Update references trong products/categories

**Deliverables:**
- ✅ Tích hợp vào ProductForm
- ✅ Tích hợp vào CategoryForm
- ✅ Tích hợp vào Editor
- ✅ Migration script (nếu cần)

---

### ✅ Phase 6: Testing & Optimization

**Status:** ⏳ Pending

#### Task 6.1: Unit Tests
- [ ] `__tests__/lib/repositories/mediaRepository.test.ts`
- [ ] `__tests__/lib/storage/storageService.test.ts`
- [ ] `__tests__/lib/services/imageProcessingService.test.ts`

#### Task 6.2: API Tests
- [ ] `__tests__/api/admin/media/route.test.ts`
- [ ] Test upload, list, update, delete
- [ ] Test authentication & authorization
- [ ] Test validation & error handling

#### Task 6.3: Component Tests
- [ ] `__tests__/components/admin/media/MediaUploader.test.tsx`
- [ ] `__tests__/components/admin/media/MediaGrid.test.tsx`

#### Task 6.4: Integration Tests
- [ ] Test flow: Upload → List → Select → Insert vào Product
- [ ] Test flow: Edit Product → Change image → Save

#### Task 6.5: Performance Optimization
- [ ] Lazy load images trong MediaGrid
- [ ] Virtual scrolling cho list dài
- [ ] Image optimization (WebP, responsive sizes)
- [ ] API response caching (nếu cần)

#### Task 6.6: Documentation
- [ ] `docs/MEDIA_LIBRARY_API_DOCUMENTATION.md` - API documentation
- [ ] `docs/MEDIA_LIBRARY_USAGE_GUIDE.md` - User guide
- [ ] Update `SCHEMA_CONTEXT.md` với media schema
- [ ] Code comments & JSDoc

#### Task 6.7: Security Audit
- [ ] Review authentication & authorization
- [ ] Review file upload validation
- [ ] Review MIME type checking
- [ ] Review file size limits

**Deliverables:**
- ✅ Test coverage đầy đủ
- ✅ Performance optimized
- ✅ Documentation hoàn chỉnh
- ✅ Security reviewed

---

## 5. DEPENDENCIES & TOOLS

### 5.1. Backend Dependencies

```json
{
  "dependencies": {
    "sharp": "^0.33.0",              // Image processing
    "formidable": "^3.5.0",          // Multipart form parsing
    "@vercel/blob": "^0.20.0",       // Vercel Blob Storage (đã có)
    "zod": "^3.22.0"                 // Validation (đã có)
  }
}
```

### 5.2. Frontend Dependencies

```json
{
  "dependencies": {
    "react-dropzone": "^14.2.0",     // Drag & drop upload
    "@tanstack/react-query": "^5.0.0", // Data fetching (đã có)
    "react-virtual": "^2.10.0"       // Virtual scrolling (optional)
  }
}
```

### 5.3. Development Tools

- **Sharp:** Image processing (resize, optimize, thumbnail)
- **Formidable/Multer:** Multipart form parsing
- **React Dropzone:** Drag & drop UI
- **React Query:** API state management

---

## 6. TESTING STRATEGY

### 6.1. Unit Tests
- Repository methods
- Storage service methods
- Image processing functions

### 6.2. Integration Tests
- API endpoints (upload, list, update, delete)
- Component interactions
- End-to-end flows

### 6.3. Performance Tests
- API response time (< 200ms)
- Large file upload handling
- Grid rendering với nhiều items

### 6.4. Security Tests
- Authentication & authorization
- File upload validation
- MIME type checking
- File size limits

---

## 7. DEPLOYMENT CHECKLIST

### Pre-Deployment
- [ ] Run `npm run pre-deploy` (TypeScript, build, lint)
- [ ] All tests passing
- [ ] Database indexes created
- [ ] Environment variables configured
- [ ] Storage service configured (Vercel Blob)

### Deployment
- [ ] Deploy to staging
- [ ] Test upload functionality
- [ ] Test integration với ProductForm
- [ ] Performance check
- [ ] Security review

### Post-Deployment
- [ ] Monitor error logs
- [ ] Monitor storage usage
- [ ] User feedback collection
- [ ] Documentation update

---

## 8. TRACKING PROGRESS

### Progress Tracking Format

Mỗi khi hoàn thành một phase, cập nhật status:

```markdown
### 📦 Phase 1: Database & Backend Foundation

**Status:** ✅ Complete (2025-01-XX)  
**Completed Tasks:**
- ✅ Task 1.1: Types & Interfaces
- ✅ Task 1.2: Database Setup
- ✅ Task 1.3: Repository Pattern
- ✅ Task 1.4: Validation Schema

**Notes:**
- Database indexes created successfully
- Repository pattern implemented
```

### Phase Status Indicators

- ⏳ **Pending** - Chưa bắt đầu
- 🚧 **In Progress** - Đang làm
- ✅ **Complete** - Hoàn thành
- ⚠️ **Blocked** - Bị chặn (cần giải quyết dependency)

---

## 9. RISKS & MITIGATION

### Risk 1: Storage Costs
**Risk:** Vercel Blob có thể tốn kém với nhiều ảnh  
**Mitigation:** 
- Implement image optimization (WebP, compression)
- Consider S3 migration nếu cần
- Set file size limits

### Risk 2: Performance với nhiều media
**Risk:** Grid rendering chậm với 1000+ items  
**Mitigation:**
- Implement pagination/infinite scroll
- Virtual scrolling
- Lazy load images
- API caching

### Risk 3: Migration từ hệ thống cũ
**Risk:** Ảnh hiện có không có trong Media Library  
**Mitigation:**
- Migration script để import ảnh cũ
- Backward compatibility trong ProductForm
- Gradual migration strategy

---

## 10. FUTURE ENHANCEMENTS

### Phase 7+ (Optional)
- [ ] Folder organization (nested folders)
- [ ] Bulk operations (bulk delete, bulk edit)
- [ ] Media analytics (usage tracking)
- [ ] CDN integration
- [ ] Video processing & thumbnails
- [ ] Document preview
- [ ] Media versioning
- [ ] Media sharing & permissions

---

**Last Updated:** 2025-01-XX  
**Next Review:** Sau khi hoàn thành Phase 1
