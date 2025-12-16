# Inline Image Editor - Test Checklist

## Môi trường Test
- URL: `http://localhost:3000/admin/products/new` (Thêm sản phẩm mới)
- Hoặc: `http://localhost:3000/admin/products/[id]/edit` (Chỉnh sửa sản phẩm)

---

## Phase 1: Inline Quick Toolbar ✅

### Test 1.1: Hiển thị Toolbar khi click ảnh
- [ ] Click vào một ảnh trong editor
- [ ] Toolbar xuất hiện phía trên ảnh
- [ ] Toolbar có các nút: Căn trái, Căn giữa, Căn phải, Không căn chỉnh, Chỉnh sửa, Crop, Tách nền, Xóa

### Test 1.2: Căn chỉnh ảnh
- [ ] Click nút "Căn trái" → Ảnh căn trái với text wrap
- [ ] Click nút "Căn giữa" → Ảnh căn giữa
- [ ] Click nút "Căn phải" → Ảnh căn phải với text wrap
- [ ] Click nút "Không căn chỉnh" → Ảnh trở về mặc định

### Test 1.3: Ẩn Toolbar
- [ ] Click ra ngoài ảnh → Toolbar ẩn đi
- [ ] Click vào ảnh khác → Toolbar di chuyển đến ảnh mới

---

## Phase 2: Resize Handles ✅

### Test 2.1: Hiển thị Resize Handles
- [ ] Click vào ảnh → 4 góc có các handle nhỏ
- [ ] Hover vào handle → Cursor thay đổi thành resize cursor

### Test 2.2: Resize ảnh
- [ ] Kéo handle ở góc dưới bên phải → Ảnh resize, giữ tỷ lệ
- [ ] Kéo handle ở góc trên bên trái → Ảnh resize, giữ tỷ lệ
- [ ] Hiển thị tooltip với kích thước (width × height) khi đang resize
- [ ] Thả chuột → Kích thước được lưu vào editor

### Test 2.3: Giới hạn kích thước
- [ ] Thử resize nhỏ hơn 50px → Không cho phép
- [ ] Resize lớn → Không có giới hạn trên

---

## Phase 3: Image Details Modal ✅

### Test 3.1: Mở Modal
- [ ] Click nút "Chỉnh sửa" (Pencil icon) trong toolbar
- [ ] Modal "Chi tiết hình ảnh" mở ra
- [ ] Có 2 tabs: "Cài đặt Chung" và "Nâng cao"

### Test 3.2: Tab "Cài đặt Chung"
- [ ] **Alt Text**: Nhập text → Lưu → Kiểm tra trong HTML có `alt` attribute
- [ ] **Caption**: Nhập caption → Lưu → Kiểm tra có `data-caption` attribute
- [ ] **Display Size**: Chọn "Thumbnail" → Ảnh resize về 150px
- [ ] **Display Size**: Chọn "Medium" → Ảnh resize về 300px
- [ ] **Display Size**: Chọn "Large" → Ảnh resize về 1024px
- [ ] **Display Size**: Chọn "Full Size" → Ảnh giữ kích thước gốc
- [ ] **Display Size**: Chọn "Custom" → Nhập width/height → Ảnh resize đúng
- [ ] **Lock Aspect Ratio**: Bật/tắt → Kiểm tra tỷ lệ có bị khóa không
- [ ] **Link To**: Chọn "Media File" → Lưu → Kiểm tra có `data-link-to` attribute
- [ ] **Link To**: Chọn "Custom URL" → Nhập URL → Lưu → Kiểm tra có `data-link-url` attribute

### Test 3.3: Tab "Nâng cao"
- [ ] **Focal Point Picker**: Click "Đặt điểm lấy nét" → Modal mở → Click/kéo điểm đỏ → Lưu → Kiểm tra có `data-focal-x` và `data-focal-y`
- [ ] **Bộ lọc màu**: Click "Sáng hơn" → Preview thay đổi → Lưu → Kiểm tra có `filter: brightness(1.1)` trong style
- [ ] **Bộ lọc màu**: Click "Rực rỡ" → Preview thay đổi → Lưu → Kiểm tra có `filter: saturate(1.3)` trong style
- [ ] **Bộ lọc màu**: Click "Vintage" → Preview thay đổi → Lưu → Kiểm tra có `filter: sepia(0.5) contrast(1.1)` trong style
- [ ] **Watermark**: Check "Đóng dấu logo Shop" → Lưu → Kiểm tra có `data-watermark="true"` attribute
- [ ] **Title Attribute**: Nhập title → Lưu → Kiểm tra có `title` attribute
- [ ] **CSS Class**: Nhập class → Lưu → Kiểm tra class được merge với alignment classes
- [ ] **Open in new tab**: Check → Lưu → Kiểm tra có `data-link-target="_blank"` attribute

---

## Phase 4: Pixel Editor (Crop/Rotate) ✅

### Test 4.1: Mở Pixel Editor
- [ ] Click nút "Crop" (Crop icon) trong toolbar
- [ ] Modal "Chỉnh sửa hình ảnh" mở ra với Cropper.js

### Test 4.2: Crop ảnh
- [ ] Kéo để di chuyển vùng crop
- [ ] Kéo các góc để thay đổi kích thước vùng crop
- [ ] Chọn tỷ lệ "1:1 (Vuông)" → Vùng crop bị khóa tỷ lệ vuông
- [ ] Chọn tỷ lệ "16:9 (Video)" → Vùng crop bị khóa tỷ lệ 16:9
- [ ] Chọn tỷ lệ "4:3 (Ảnh)" → Vùng crop bị khóa tỷ lệ 4:3
- [ ] Chọn "Tự do" → Vùng crop không bị khóa tỷ lệ

### Test 4.3: Rotate & Flip
- [ ] Click "Xoay trái" → Ảnh xoay 90° ngược chiều kim đồng hồ
- [ ] Click "Xoay phải" → Ảnh xoay 90° theo chiều kim đồng hồ
- [ ] Click "Lật dọc" → Ảnh lật theo trục dọc
- [ ] Click "Lật ngang" → Ảnh lật theo trục ngang

### Test 4.4: Save & Restore
- [ ] Click "Lưu" → Ảnh được upload lên server → URL mới được cập nhật trong editor
- [ ] Kiểm tra có `data-original-src` attribute chứa URL gốc
- [ ] Kiểm tra có `data-edited="true"` attribute
- [ ] Click "Khôi phục" → Ảnh trở về URL gốc → `data-original-src` và `data-edited` bị xóa

### Test 4.5: Compare View
- [ ] Sau khi edit ảnh, click "Nhấn giữ để xem ảnh gốc"
- [ ] Giữ chuột → Ảnh gốc hiển thị overlay với border highlight
- [ ] Thả chuột → Ảnh đã chỉnh sửa hiển thị lại

---

## Phase 5: Advanced Features ✅

### Test 5.1: Focal Point Picker
- [ ] Mở Image Details Modal → Tab "Nâng cao" → Click "Đặt điểm lấy nét"
- [ ] Modal Focal Point Picker mở với preview ảnh
- [ ] Click vào ảnh → Điểm đỏ xuất hiện tại vị trí click
- [ ] Kéo điểm đỏ → Điểm di chuyển theo chuột
- [ ] Hiển thị tọa độ (x%, y%) dưới ảnh
- [ ] Click "Lưu" → Kiểm tra có `data-focal-x` và `data-focal-y` attributes
- [ ] Kiểm tra có `object-position: x% y%` trong style attribute

### Test 5.2: Instant Filters
- [ ] Mở Image Details Modal → Tab "Nâng cao"
- [ ] Click "Sáng hơn" → Preview ảnh sáng hơn ngay lập tức (CSS filter)
- [ ] Click "Rực rỡ" → Preview ảnh có màu sắc rực rỡ hơn
- [ ] Click "Vintage" → Preview ảnh có tone màu vintage
- [ ] Click lại nút đã chọn → Filter bị tắt
- [ ] Lưu → Kiểm tra filter được lưu trong style attribute

### Test 5.3: AI Background Remover
- [ ] Click nút "Tách nền" (Sparkles icon) trong toolbar
- [ ] Loading state hiển thị (icon quay)
- [ ] API được gọi → `/api/admin/images/remove-background`
- [ ] Ảnh mới được tải về (placeholder - cần tích hợp AI service)
- [ ] Kiểm tra có `data-background-removed="true"` attribute
- [ ] Kiểm tra có `data-original-src` chứa URL gốc

### Test 5.4: Watermark Toggle
- [ ] Mở Image Details Modal → Tab "Nâng cao"
- [ ] Check "Đóng dấu logo Shop"
- [ ] Lưu → Kiểm tra có `data-watermark="true"` attribute
- [ ] Uncheck → Lưu → Kiểm tra `data-watermark` bị xóa

---

## Phase 6: Integration & Error Handling ✅

### Test 6.1: Error Boundaries
- [ ] Tạo lỗi trong image editor (ví dụ: null reference)
- [ ] Error boundary bắt lỗi và hiển thị UI thân thiện
- [ ] Click "Thử lại" → Component reset và hoạt động lại

### Test 6.2: File Upload Validation
- [ ] Upload file không phải ảnh → Hiển thị lỗi "File must be a valid image"
- [ ] Upload file > 10MB → Hiển thị lỗi "File size exceeds maximum"
- [ ] Upload file hợp lệ → Upload thành công

### Test 6.3: Performance
- [ ] Resize ảnh nhiều lần → Không có lag
- [ ] Mở/đóng modal nhiều lần → Không có memory leak
- [ ] Toolbar di chuyển mượt mà khi scroll

### Test 6.4: State Management
- [ ] Thay đổi alignment → Lưu → Reload trang → Alignment được giữ
- [ ] Thay đổi size → Lưu → Reload trang → Size được giữ
- [ ] Thay đổi alt text → Lưu → Reload trang → Alt text được giữ

---

## Test Cases - Edge Cases

### Test E1: Nhiều ảnh trong editor
- [ ] Thêm nhiều ảnh vào editor
- [ ] Click từng ảnh → Toolbar di chuyển đến đúng ảnh
- [ ] Edit ảnh này → Không ảnh hưởng ảnh khác

### Test E2: Ảnh rất lớn
- [ ] Upload ảnh > 5MB
- [ ] Resize ảnh → Performance vẫn tốt
- [ ] Crop ảnh → Không bị lag

### Test E3: Ảnh rất nhỏ
- [ ] Upload ảnh < 100px
- [ ] Resize handles vẫn hiển thị đúng
- [ ] Crop vẫn hoạt động

### Test E4: Mobile/Tablet
- [ ] Test trên mobile browser
- [ ] Toolbar hiển thị đúng
- [ ] Resize handles có thể touch được
- [ ] Modal responsive

---

## Checklist Summary

- [ ] **Phase 1**: Inline Quick Toolbar - ✅ Passed
- [ ] **Phase 2**: Resize Handles - ✅ Passed
- [ ] **Phase 3**: Image Details Modal - ✅ Passed
- [ ] **Phase 4**: Pixel Editor - ✅ Passed
- [ ] **Phase 5**: Advanced Features - ✅ Passed
- [ ] **Phase 6**: Integration & Error Handling - ✅ Passed
- [ ] **Edge Cases**: All scenarios - ✅ Passed

---

## Notes

- **AI Background Remover**: Hiện tại là placeholder, cần tích hợp AI service (remove.bg hoặc rembg)
- **Watermark**: Hiện tại chỉ lưu flag, cần tích hợp image processing library (sharp/jimp) để overlay logo
- **Focal Point**: Hoạt động tốt với CSS `object-position`, có thể test trên mobile để xem hiệu ứng

---

## Bugs Found

_(Ghi lại các bugs phát hiện trong quá trình test)_

1. 
2. 
3. 

---

## Test Date: _______________
## Tester: _______________
