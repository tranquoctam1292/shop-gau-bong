Đặc Tả Kỹ Thuật: Module Thư viện Media (Media Library)
1. Tổng quan (Overview)
Module Media Library đóng vai trò là kho lưu trữ trung tâm cho tất cả các tài sản số (hình ảnh, video, tài liệu) của hệ thống CMS. Module này thay thế cách quản lý file rời rạc cũ, cung cấp giao diện trực quan để tải lên, quản lý, tìm kiếm và chèn media vào Sản phẩm (Products), Danh mục (Categories) hoặc Bài viết (Posts).

Mục tiêu kỹ thuật:

Xây dựng collection mới media trong MongoDB.

API upload hỗ trợ Multipart/form-data.

Tích hợp xử lý ảnh (resize/optimize) trước khi lưu.

UI dạng Modal (để chọn nhanh) và Page (để quản lý toàn bộ).

Đồng bộ với cấu trúc SCHEMA_CONTEXT.md hiện tại.

2. Thiết kế Cơ sở dữ liệu (Database Schema)
2.1. Media Collection
Tạo một collection mới tên là media.

TypeScript

// types/media.ts

import { ObjectId } from 'mongodb';

export type MediaType = 'image' | 'video' | 'document' | 'other';

export interface MongoMedia {
  _id: ObjectId;
  
  // Thông tin file cơ bản
  name: string;             // Tên hiển thị (editable)
  filename: string;         // Tên file gốc trên đĩa/cloud (ví dụ: img_123.jpg)
  url: string;              // Đường dẫn truy cập công khai (Public URL)
  path: string;             // Đường dẫn vật lý hoặc S3 Key (để xóa file)
  
  // Phân loại
  type: MediaType;          // Loại media
  mimeType: string;         // e.g., 'image/jpeg', 'video/mp4'
  extension: string;        // e.g., 'jpg', 'png'
  folder?: string;          // (Optional) Để phân cấp thư mục sau này
  
  // Metadata kỹ thuật
  size: number;             // Kích thước file (bytes)
  width?: number;           // Chỉ dành cho ảnh/video
  height?: number;          // Chỉ dành cho ảnh/video
  
  // Metadata SEO & Quản lý
  altText?: string;         // Thẻ alt cho SEO
  caption?: string;         // Chú thích ảnh
  description?: string;     // Mô tả chi tiết
  
  // System
  uploadedBy?: ObjectId;    // User ID người upload
  createdAt: Date;
  updatedAt: Date;
}
2.2. Indexing Strategy
Cần tạo index trong file scripts/setup-database-indexes.ts:

TypeScript

// Media Indexes
media.createIndex({ name: 'text', altText: 'text' }); // Để tìm kiếm text
media.createIndex({ type: 1 });                       // Filter theo loại (Ảnh/Video)
media.createIndex({ createdAt: -1 });                 // Sắp xếp mới nhất
media.createIndex({ folder: 1 });                     // Filter theo folder
3. Kiến trúc Backend & API Routes
Hệ thống sử dụng Next.js API Routes tại app/api/admin/media.

3.1. Storage Strategy (Chiến lược lưu trữ)
Cần xây dựng một StorageService (Design Pattern: Adapter) để dễ dàng chuyển đổi giữa Local Storage và Cloud Storage.

Option 1 (Local - Giai đoạn 1): Lưu tại public/uploads/YYYY/MM/.

Option 2 (Cloud - Recommended): Sử dụng AWS S3 hoặc Cloudflare R2.

Xử lý ảnh: Sử dụng thư viện sharp để:

Tự động convert sang .webp (nếu cần).

Tạo thumbnail (cho view admin đỡ nặng).

Giới hạn kích thước tối đa (ví dụ: max-width 2000px).

3.2. API Endpoints
A. Upload Media
Route: POST /api/admin/media

Content-Type: multipart/form-data

Logic:

Validate file (kích thước < 5MB, đúng định dạng).

Dùng sharp để lấy metadata (width, height) và optimize.

Upload file lên Storage -> Nhận về URL.

Insert document vào collection media.

Return object MongoMedia.

B. Get Media List
Route: GET /api/admin/media

Query Params:

page: number (default 1)

limit: number (default 20)

type: 'image' | 'video'

search: string (tìm theo name/altText)

sort: 'newest' | 'oldest' | 'name'

Response: { data: MongoMedia[], pagination: { total, pages, ... } }

C. Update Media Details
Route: PUT /api/admin/media/[id]

Body: { name, altText, caption }

Logic: Cập nhật thông tin metadata trong DB. Không đụng vào file vật lý.

D. Delete Media
Route: DELETE /api/admin/media/[id]

Logic:

Tìm document trong DB.

Xóa file vật lý dựa trên path.

Xóa document khỏi DB.

(Nâng cao) Kiểm tra xem ảnh có đang được dùng ở Product nào không (Optional warning).

4. Frontend Implementation (Admin UI)
4.1. UI Components
Cần xây dựng các component tái sử dụng trong components/admin/media/:

MediaUploader:

Khu vực Drag & Drop (sử dụng react-dropzone).

Hiển thị Progress bar khi upload.

Hỗ trợ upload nhiều file cùng lúc.

MediaGrid / MediaList:

Hiển thị danh sách media dạng lưới (thumbnail) hoặc list (chi tiết).

Lazy load ảnh (quan trọng cho performance).

Infinite scroll hoặc Pagination.

MediaFilterBar:

Input search.

Dropdown filter type (Image, Video).

Sort options.

MediaDetailSidebar:

Khi click vào 1 ảnh, hiện sidebar bên phải.

Hiển thị preview lớn.

Form edit: Tên, Alt Text, URL (nút copy), File info.

Nút "Delete" (cần confirm).

MediaLibraryModal (Core Feature):

Một Modal bao bọc toàn bộ giao diện trên.

Props: onSelect: (media: MongoMedia[]) => void, multiple: boolean.

Được gọi từ trang Edit Product, Edit Category.

4.2. Integration Points (Tích hợp vào hệ thống cũ)
Tại trang ProductForm (Edit/Create Product):
Thay thế các input nhập URL text hiện tại bằng component MediaPicker.

Field images (Gallery):

Hiển thị list ảnh đã chọn (có thể re-order).

Nút "Thêm ảnh" -> Mở MediaLibraryModal (multiple=true).

Field variants[].image:

Nút "Chọn ảnh" -> Mở MediaLibraryModal (multiple=false).

Tại trang CategoryForm:
Field image:

Input chọn ảnh đơn.

Tại trình soạn thảo văn bản (Editor):
Nếu dùng TinyMCE/CKEditor/Quill, cần custom button "Insert Image" để gọi MediaLibraryModal thay vì trình upload mặc định của editor.

5. Quy trình kỹ thuật chi tiết (Flows)
5.1. Luồng Upload File
User: Kéo thả 5 file ảnh vào MediaUploader.

Frontend:

Duyệt qua từng file.

Gọi POST /api/admin/media cho từng file (hoặc batch nếu API hỗ trợ).

Hiển thị trạng thái "Uploading...".

Backend:

Nhận file -> sharp resize (nếu > 2500px) -> nén nhẹ (quality 80-90).

Lưu vào đĩa/S3 -> Tạo unique filename (timestamp-slug-name.jpg).

Lưu metadata vào MongoDB.

Frontend:

Nhận phản hồi success -> Tự động refresh list media hoặc prepend ảnh mới vào grid.

5.2. Luồng chọn ảnh cho Sản phẩm
User: Đang ở trang "Sửa sản phẩm Gấu Bông Teddy". Click "Thêm ảnh".

System: Mở MediaLibraryModal.

User: Có thể upload ảnh mới ngay tại đây hoặc chọn ảnh có sẵn từ thư viện.

User: Chọn 3 ảnh -> Bấm "Chèn 3 ảnh".

Frontend:

Modal đóng lại.

Callback onSelect trả về mảng object Media.

Form cha lấy media.url để lưu vào mảng product.images.

6. Yêu cầu Phi chức năng (Non-functional Requirements)
Performance:

API list media phải phản hồi < 200ms.

Thumbnail hiển thị trong Grid phải được resize nhỏ (không load ảnh gốc 5MB ra grid).

Security:

Chỉ user có role admin mới được truy cập API upload/delete.

Validate MIME type kỹ càng (tránh upload file .exe, .php).

Scalability:

Cấu trúc code phải tách biệt logic lưu trữ (Interface Storage) để sau này dễ chuyển từ Local sang AWS S3 mà không sửa logic controller.

7. Các gói thư viện gợi ý (Dependencies)
multer hoặc formidable: Để xử lý multipart/form-data trong Next.js API.

sharp: Để xử lý ảnh (resize, convert, get metadata).

react-dropzone: UI kéo thả file.

clsx / tailwind-merge: Xử lý class CSS động.

aws-sdk (optional): Nếu dùng S3 ngay từ đầu. :::