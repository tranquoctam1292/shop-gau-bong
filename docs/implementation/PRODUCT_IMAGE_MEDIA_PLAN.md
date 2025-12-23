# Plan: Thay thế tính năng tải hình ảnh sản phẩm bằng Media Library

**Ngày tạo:** 2025-01-XX  
**Mục tiêu:** Thay thế tính năng upload hình ảnh hiện tại (URL input + file upload) bằng Media Library Modal theo đặc tả `anh_san_pham.md`

---

## 📋 TỔNG QUAN

### Yêu cầu từ `anh_san_pham.md`:

1. **Widget Ảnh Sản phẩm (Featured Image)**:
   - 2 trạng thái: Rỗng / Đã chọn ảnh
   - Click mở Media Modal (chỉ chọn 1 ảnh)
   - Lưu `attachment_id` vào hidden input `_thumbnail_id`
   - Có nút "Xóa ảnh sản phẩm"

2. **Widget Album hình ảnh (Product Gallery)**:
   - Grid layout với thumbnails
   - Multi-select trong Media Modal
   - Drag & Drop để sắp xếp
   - Nút xóa nhanh trên mỗi ảnh (hover)
   - Lưu chuỗi ID ngăn cách bằng dấu phẩy vào `_product_image_gallery`

### Hiện trạng:

- `FeaturedImageBox`: Dùng URL input + file upload (data URL)
- `ProductGalleryBox`: Dùng URL input + file upload (data URL)
- `MediaLibraryModal`: Đã có nhưng chưa được tích hợp vào image widgets

---

## 🎯 CÁC TASK CẦN THỰC HIỆN

### Phase 1: Cập nhật MediaLibraryModal

| # | Task | Mô tả | File | Status |
|---|------|-------|------|--------|
| 1.1 | Thêm mode Single-select | Thêm prop `mode: 'single' \| 'multiple'` để control chế độ chọn | `MediaLibraryModal.tsx` | ✅ Completed |
| 1.2 | Thêm filter tabs | Chỉ hiển thị "Upload Files" và "Media Library" (ẩn tab khác nếu có) | `MediaLibraryModal.tsx` | ✅ Completed |
| 1.3 | Custom button text | Thay đổi text button từ "Chèn vào bài viết" thành "Thiết lập ảnh sản phẩm" khi mode=single | `MediaLibraryModal.tsx` | ✅ Completed |
| 1.4 | Return attachment data | Callback trả về `{id, thumbnail_url, ...}` thay vì chỉ URL | `MediaLibraryModal.tsx` | ✅ Completed |
| 1.5 | Pre-select existing images | Khi mở modal cho gallery, đánh dấu các ảnh đã chọn (optional) | `MediaLibraryModal.tsx` | ✅ Completed |

### Phase 2: Refactor FeaturedImageBox

| # | Task | Mô tả | File | Status |
|---|------|-------|------|--------|
| 2.1 | Xóa URL input | Loại bỏ input URL và file upload trực tiếp | `FeaturedImageBox.tsx` | ✅ Completed |
| 2.2 | Thêm Media Modal trigger | Thay bằng button "Thiết lập ảnh sản phẩm" mở Media Modal | `FeaturedImageBox.tsx` | ✅ Completed |
| 2.3 | Hiển thị thumbnail | Hiển thị thumbnail 260px width khi đã chọn ảnh | `FeaturedImageBox.tsx` | ✅ Completed |
| 2.4 | Click ảnh để thay đổi | Click vào thumbnail mở lại Modal | `FeaturedImageBox.tsx` | ✅ Completed |
| 2.5 | Hidden input | Thêm `<input type="hidden" name="_thumbnail_id">` lưu attachment_id | `FeaturedImageBox.tsx` | ✅ Completed |
| 2.6 | Nút xóa ảnh | Thêm link "Xóa ảnh sản phẩm" bên dưới thumbnail | `FeaturedImageBox.tsx` | ✅ Completed |
| 2.7 | State management | Quản lý state: `attachment_id` và `thumbnail_url` | `FeaturedImageBox.tsx` | ✅ Completed |

### Phase 3: Refactor ProductGalleryBox

| # | Task | Mô tả | File | Status |
|---|------|-------|------|--------|
| 3.1 | Xóa URL input | Loại bỏ input URL và file upload trực tiếp | `ProductGalleryBox.tsx` | ✅ Completed |
| 3.2 | Thêm Media Modal trigger | Thay bằng button "Thêm ảnh thư viện sản phẩm" mở Modal (multi-select) | `ProductGalleryBox.tsx` | ✅ Completed |
| 3.3 | Grid layout | Hiển thị thumbnails 80x80px trong grid | `ProductGalleryBox.tsx` | ✅ Completed |
| 3.4 | Drag & Drop | Tích hợp SortableJS hoặc @dnd-kit để sắp xếp lại | `ProductGalleryBox.tsx` | ✅ Completed |
| 3.5 | Quick remove button | Icon (x) hiện khi hover, xóa ảnh ngay lập tức (optimistic UI) | `ProductGalleryBox.tsx` | ✅ Completed |
| 3.6 | Tooltip | Hover vào ảnh hiện tên file hoặc title | `ProductGalleryBox.tsx` | ✅ Completed |
| 3.7 | Hidden input | Thêm `<input type="hidden" name="_product_image_gallery">` lưu chuỗi ID (comma-separated) | `ProductGalleryBox.tsx` | ✅ Completed |
| 3.8 | Append mode | Khi chọn thêm ảnh, append vào danh sách hiện có (không ghi đè) | `ProductGalleryBox.tsx` | ✅ Completed |
| 3.9 | Lazy loading | Nếu > 20 ảnh, chỉ load thumbnail 150x150px | `ProductGalleryBox.tsx` | ✅ Completed |

### Phase 4: Cập nhật ProductForm

| # | Task | Mô tả | File | Status |
|---|------|-------|------|--------|
| 4.1 | Update state structure | Thay đổi từ `images: string[]` sang `{thumbnail_id, gallery_ids: string[]}` | `ProductForm.tsx` | ✅ Completed |
| 4.2 | Update API payload | Gửi `_thumbnail_id` và `_product_image_gallery` thay vì `images` array | `ProductForm.tsx` | ✅ Completed |
| 4.3 | Load product data | Khi load product, map `_thumbnail_id` và `_product_image_gallery` về state | `ProductForm.tsx` | ✅ Completed |
| 4.4 | Remove old image logic | Xóa các hàm quản lý image cũ (nếu có) | `ProductForm.tsx` | ✅ Completed |

### Phase 5: Cập nhật API & Backend

| # | Task | Mô tả | File | Status |
|---|------|-------|------|--------|
| 5.1 | Update product schema | Thêm `_thumbnail_id` (string) và `_product_image_gallery` (string) | `app/api/admin/products/route.ts` | ✅ Completed |
| 5.2 | Update product update schema | Tương tự cho PUT endpoint | `app/api/admin/products/[id]/route.ts` | ✅ Completed |
| 5.3 | Save to database | Lưu `_thumbnail_id` và `_product_image_gallery` vào product document | API routes | ✅ Completed |
| 5.4 | Expand IDs in response | Khi trả về product, expand IDs thành object với full URLs (thumbnail, medium, large) | API routes | ✅ Completed (Partial - TODO: Full expansion when media API available) |

### Phase 6: Testing & Polish

| # | Task | Mô tả | File | Status |
|---|------|-------|------|--------|
| 6.1 | Test Featured Image | Test tất cả flows: chọn, thay đổi, xóa | Manual testing | ⬜ Pending |
| 6.2 | Test Gallery | Test: thêm nhiều ảnh, drag & drop, xóa, append mode | Manual testing | ⬜ Pending |
| 6.3 | Test API integration | Test save/load product với image IDs | Manual testing | ⬜ Pending |
| 6.4 | Performance check | Kiểm tra lazy loading với > 20 ảnh | Manual testing | ⬜ Pending |
| 6.5 | UI/UX polish | Đảm bảo UI match với spec (260px thumbnail, 80x80 grid, etc.) | All files | ⬜ Pending |

---

## 📦 DEPENDENCIES

### Thư viện cần cài đặt:

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
# hoặc
npm install sortablejs
```

**Lựa chọn:** Recommend `@dnd-kit` vì modern, React-friendly, và accessible.

---

## 🔄 WORKFLOW TỔNG QUAN

### Featured Image Flow:
1. User click "Thiết lập ảnh sản phẩm"
2. Mở Media Modal (mode: single)
3. User chọn 1 ảnh
4. Click "Thiết lập ảnh sản phẩm"
5. Modal trả về `{id, thumbnail_url}`
6. Update state và hidden input
7. Hiển thị thumbnail 260px

### Gallery Flow:
1. User click "Thêm ảnh thư viện sản phẩm"
2. Mở Media Modal (mode: multiple)
3. User chọn nhiều ảnh (Ctrl/Cmd + click)
4. Click "Thêm vào thư viện"
5. Modal trả về array `[{id, thumbnail_url}, ...]`
6. Append vào gallery hiện có
7. Update hidden input với comma-separated IDs
8. User có thể drag & drop để sắp xếp
9. User có thể xóa từng ảnh (optimistic UI)

---

## 📝 NOTES

- **Backward compatibility**: Cần xử lý migration từ `images: string[]` sang `_thumbnail_id` + `_product_image_gallery`
- **Optimistic UI**: Xóa ảnh trong gallery nên xóa DOM ngay, sau đó mới gửi API request
- **Lazy loading**: Chỉ áp dụng cho gallery, không cần cho featured image (chỉ 1 ảnh)
- **Error handling**: Cần xử lý trường hợp ảnh không tồn tại hoặc bị xóa

---

## ✅ COMPLETION CRITERIA

- [ ] Featured Image widget hoạt động đúng theo spec
- [ ] Gallery widget hoạt động đúng theo spec (multi-select, drag & drop, quick remove)
- [ ] Data được lưu đúng format (`_thumbnail_id` và `_product_image_gallery`)
- [ ] API trả về expanded image objects với full URLs
- [ ] UI/UX match với spec (sizes, layouts, interactions)
- [ ] Performance tốt với gallery > 20 ảnh
- [ ] Backward compatibility được xử lý

---

**Estimated Time:** 8-12 hours  
**Priority:** High
