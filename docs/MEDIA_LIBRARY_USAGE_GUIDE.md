# 📖 Media Library Usage Guide

**Last Updated:** 2025-01-XX  
**For:** CMS Admin Users

---

## 📋 MỤC LỤC

1. [Tổng quan](#1-tổng-quan)
2. [Truy cập Media Library](#2-truy-cập-media-library)
3. [Upload Media](#3-upload-media)
4. [Quản lý Media](#4-quản-lý-media)
5. [Sử dụng trong Sản phẩm](#5-sử-dụng-trong-sản-phẩm)
6. [Sử dụng trong Danh mục](#6-sử-dụng-trong-danh-mục)
7. [Sử dụng trong Editor](#7-sử-dụng-trong-editor)
8. [Tips & Best Practices](#8-tips--best-practices)

---

## 1. TỔNG QUAN

Media Library là hệ thống quản lý tập trung cho tất cả media files (hình ảnh, video, tài liệu) trong CMS.

**Tính năng chính:**
- ✅ Upload và quản lý media files
- ✅ Tìm kiếm và lọc media
- ✅ Chỉnh sửa metadata (tên, alt text, caption)
- ✅ Tích hợp vào Sản phẩm, Danh mục, Editor
- ✅ Xử lý ảnh tự động (resize, optimize)

---

## 2. TRUY CẬP MEDIA LIBRARY

### 2.1. Truy cập từ Menu

1. Đăng nhập vào Admin Panel
2. Click vào **"Media"** trong sidebar menu
3. Hoặc truy cập trực tiếp: `/admin/media`

### 2.2. Giao diện

Media Library có 2 tabs:
- **Thư viện:** Xem và quản lý media đã upload
- **Upload:** Upload media mới

---

## 3. UPLOAD MEDIA

### 3.1. Upload từ Tab Upload

1. Chuyển sang tab **"Upload"**
2. Kéo thả file vào vùng upload hoặc click để chọn file
3. Hỗ trợ upload nhiều file cùng lúc (tối đa 10 files)
4. Xem progress bar khi upload
5. File sẽ tự động xuất hiện trong Thư viện sau khi upload xong

### 3.2. Upload từ Modal (khi chọn ảnh)

1. Khi chọn ảnh cho Sản phẩm/Danh mục
2. Mở Media Library Modal
3. Chuyển sang tab **"Upload"**
4. Upload file mới ngay tại đây
5. File sẽ tự động được chọn sau khi upload

### 3.3. Yêu cầu File

**Kích thước tối đa:** 5MB

**Định dạng hỗ trợ:**
- **Ảnh:** JPEG, PNG, GIF, WebP
- **Video:** MP4, WebM, OGG
- **Tài liệu:** PDF, Word, Excel

**Khuyến nghị cho ảnh:**
- Kích thước: 1920x1080px (hoặc tương đương)
- Format: JPEG hoặc WebP
- File size: < 500KB sau khi optimize

---

## 4. QUẢN LÝ MEDIA

### 4.1. Xem Media

**Grid View (Mặc định):**
- Hiển thị dạng lưới với thumbnails
- Click vào ảnh để xem chi tiết
- Hover để xem thông tin nhanh

**List View:**
- Hiển thị dạng bảng với thông tin chi tiết
- Columns: Thumbnail, Tên, Loại, Kích thước, Ngày tạo
- Sortable columns

### 4.2. Tìm kiếm & Lọc

**Search Bar:**
- Tìm kiếm theo tên hoặc alt text
- Real-time search

**Filters:**
- **Loại:** Tất cả, Ảnh, Video, Tài liệu, Khác
- **Sắp xếp:** Mới nhất, Cũ nhất, Tên A-Z, Kích thước

**Clear Filters:**
- Click "Xóa bộ lọc" để reset tất cả filters

### 4.3. Chỉnh sửa Media

1. Click vào media để mở sidebar chi tiết
2. Chỉnh sửa các trường:
   - **Tên:** Tên hiển thị
   - **Alt Text:** Mô tả ảnh cho SEO
   - **Chú thích:** Caption
   - **Mô tả:** Description chi tiết
3. Click **"Lưu thay đổi"**

**Lưu ý:** Chỉnh sửa metadata không thay đổi file vật lý.

### 4.4. Xóa Media

1. Click vào media để mở sidebar
2. Click **"Xóa media"**
3. Confirm xóa

**Lưu ý:** 
- Xóa media sẽ xóa cả file và document
- Hành động không thể hoàn tác
- Kiểm tra xem media có đang được sử dụng không trước khi xóa

### 4.5. Bulk Actions

- Chọn nhiều media (checkbox)
- Click **"Xóa (n)"** để xóa nhiều media cùng lúc

---

## 5. SỬ DỤNG TRONG SẢN PHẨM

### 5.1. Featured Image (Ảnh đại diện)

1. Vào trang **Sửa sản phẩm**
2. Tìm box **"Hình ảnh đại diện"** ở sidebar
3. Click **"Chọn media"**
4. Chọn ảnh từ Media Library
5. Ảnh sẽ tự động được gán làm featured image

### 5.2. Product Gallery (Thư viện ảnh)

1. Tìm box **"Thư viện hình ảnh"** ở sidebar
2. Click **"Thêm ảnh thư viện sản phẩm"**
3. Chọn nhiều ảnh (multiple selection)
4. Kéo thả để sắp xếp thứ tự
5. Hover và click X để xóa ảnh

### 5.3. Variant Images

1. Trong **Product Data Meta Box**
2. Tab **Variations**
3. Click **"Chọn ảnh"** cho từng variant
4. Chọn ảnh từ Media Library

---

## 6. SỬ DỤNG TRONG DANH MỤC

### 6.1. Category Image

1. Vào trang **Sửa danh mục**
2. Tìm field **"Hình ảnh đại diện"**
3. Click **"Chọn media"**
4. Chọn ảnh từ Media Library
5. Hoặc nhập URL trực tiếp (fallback)

---

## 7. SỬ DỤNG TRONG EDITOR

### 7.1. Insert Image vào Bài viết

1. Trong Classic Editor
2. Click button **"Add Media"** trên toolbar
3. Chọn ảnh từ Media Library hoặc upload mới
4. Cấu hình:
   - **Alignment:** Left, Center, Right, None
   - **Link To:** File, Attachment, Custom, None
   - **Size:** Thumbnail, Medium, Large, Full
5. Click **"Chèn vào bài viết"**

### 7.2. Edit Image trong Editor

1. Click vào ảnh trong editor
2. Toolbar xuất hiện
3. Có thể:
   - Resize image
   - Edit image (crop, rotate)
   - Change alignment
   - Remove image

---

## 8. TIPS & BEST PRACTICES

### 8.1. File Naming

✅ **Tốt:**
- `product-teddy-bear-1.jpg`
- `category-gau-bong.jpg`
- `banner-hero-2025.jpg`

❌ **Không tốt:**
- `IMG_1234.jpg`
- `DSC_0001.jpg`
- `image.jpg`

### 8.2. Alt Text

✅ **Luôn cung cấp alt text:**
- Mô tả rõ ràng nội dung ảnh
- Bao gồm từ khóa SEO nếu có
- Ví dụ: "Gấu bông Teddy màu nâu size lớn"

### 8.3. Image Optimization

✅ **Trước khi upload:**
- Resize ảnh về kích thước phù hợp
- Compress ảnh để giảm file size
- Sử dụng WebP format nếu có thể

### 8.4. Organization

✅ **Sử dụng folders:**
- Tổ chức media theo folder
- Ví dụ: `products/`, `categories/`, `banners/`

### 8.5. Performance

✅ **Best practices:**
- Không upload ảnh quá lớn (> 5MB)
- Sử dụng lazy loading cho gallery
- Xóa media không sử dụng

---

## 9. TROUBLESHOOTING

### 9.1. Upload Failed

**Nguyên nhân:**
- File quá lớn (> 5MB)
- Định dạng không hỗ trợ
- Network error

**Giải pháp:**
- Kiểm tra file size
- Kiểm tra định dạng file
- Thử lại sau vài giây

### 9.2. Image Not Displaying

**Nguyên nhân:**
- URL không hợp lệ
- File đã bị xóa
- CORS issue

**Giải pháp:**
- Kiểm tra URL trong Media Library
- Re-upload file nếu cần
- Liên hệ admin nếu vấn đề vẫn còn

### 9.3. Slow Loading

**Nguyên nhân:**
- Quá nhiều media trong một trang
- Ảnh chưa được optimize

**Giải pháp:**
- Sử dụng pagination
- Optimize ảnh trước khi upload
- Sử dụng filters để giảm số lượng hiển thị

---

## 10. KEYBOARD SHORTCUTS

- `Ctrl/Cmd + K` - Mở search (trong Media Library page)
- `Esc` - Đóng modal/sidebar
- `Enter` - Confirm selection

---

**Last Updated:** 2025-01-XX
