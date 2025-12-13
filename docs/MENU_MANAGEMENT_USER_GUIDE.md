# Menu Management User Guide

Hướng dẫn sử dụng module quản lý Menu trong Admin Panel.

---

## Tổng quan

Module Menu Management cho phép bạn:
- ✅ Tạo và quản lý nhiều menu
- ✅ Thêm menu items từ nhiều nguồn (Custom links, Pages, Categories, Products, Posts)
- ✅ Sắp xếp menu items bằng drag & drop
- ✅ Tạo menu đa cấp (tối đa 3 cấp)
- ✅ Gán menu vào các vị trí khác nhau (Primary, Footer, Mobile, etc.)
- ✅ Chỉnh sửa menu items inline

---

## 1. Tạo Menu mới

### Bước 1: Truy cập Menu Management
1. Đăng nhập vào Admin Panel
2. Click vào **"Menu"** trong sidebar
3. Click nút **"Tạo menu mới"**

### Bước 2: Điền thông tin menu
- **Tên menu**: Tên để phân biệt menu (VD: "Menu chính", "Menu footer")
- **Vị trí** (tùy chọn): Chọn vị trí để hiển thị menu
  - `primary`: Menu chính (desktop)
  - `footer`: Menu footer
  - `mobile`: Menu mobile
  - `mobile-sidebar`: Menu sidebar mobile
- **Trạng thái**: 
  - `active`: Menu đang hoạt động
  - `inactive`: Menu tạm dừng

### Bước 3: Lưu menu
Click nút **"Tạo menu"** để lưu.

**Lưu ý:**
- Nếu bạn set menu mới làm `active` cho một location đã có menu active, menu cũ sẽ tự động chuyển sang `inactive`.

---

## 2. Thêm Menu Items

### Cách 1: Thêm từ nguồn có sẵn

1. Mở menu editor (click vào tên menu trong danh sách)
2. Trong panel bên trái **"Thêm menu items"**, chọn tab:
   - **Trang**: Chọn từ danh sách pages
   - **Danh mục**: Chọn từ tree view categories
   - **Sản phẩm**: Tìm kiếm và chọn products
   - **Bài viết**: Chọn từ danh sách posts
3. Chọn các items bằng checkbox
4. Click nút **"Thêm vào menu"**

### Cách 2: Thêm Custom Link

1. Chọn tab **"Liên kết tùy chỉnh"**
2. Nhập:
   - **URL**: Địa chỉ liên kết (VD: `/about`, `https://example.com`)
   - **Nhãn**: Tên hiển thị trên menu
3. Click **"Thêm vào menu"**

---

## 3. Sắp xếp Menu Items (Drag & Drop)

### Reorder trong cùng cấp
1. Kéo menu item bằng icon **⋮⋮** (grip handle)
2. Thả vào vị trí mong muốn
3. Cấu trúc sẽ tự động lưu sau 500ms

### Tạo menu đa cấp
1. Kéo menu item vào một menu item khác
2. Item được kéo sẽ trở thành con của item đó
3. Tối đa 3 cấp (Level 1, Level 2, Level 3)

**Lưu ý:**
- Items ở cấp 3 (độ sâu tối đa) không thể kéo vào cấp khác
- Không thể kéo item vào chính nó hoặc item con của nó

---

## 4. Chỉnh sửa Menu Item (Inline Edit)

1. Click vào icon **⋮** (More) bên cạnh menu item
2. Chọn **"Chỉnh sửa"**
3. Form inline sẽ hiển thị với các fields:
   - **Tiêu đề**: Tên hiển thị trên menu
   - **Mở liên kết**: Trong cùng tab hoặc tab mới
   - **Icon Class**: CSS class cho icon (VD: `fa fa-home`)
   - **CSS Class**: CSS class tùy chỉnh cho menu item
4. Click **"Lưu"** để cập nhật

**Preview:**
- URL preview sẽ hiển thị resolved URL (nếu có reference)
- Warning badge sẽ hiển thị nếu reference không tồn tại hoặc không active

---

## 5. Nhân bản Menu Item

1. Click vào icon **⋮** (More) bên cạnh menu item
2. Chọn **"Nhân bản"**
3. Menu item mới sẽ được tạo với title "(Copy)"

---

## 6. Xóa Menu Item

1. Click vào icon **⋮** (More) bên cạnh menu item
2. Chọn **"Xóa"**
3. Xác nhận xóa trong dialog
4. **Lưu ý**: Nếu menu item có items con, tất cả sẽ bị xóa

---

## 7. Xóa Menu

1. Trong danh sách menu, click icon **⋮** (More)
2. Chọn **"Xóa"**
3. Xác nhận xóa trong dialog
4. **Lưu ý**: Tất cả menu items sẽ bị xóa cùng với menu

---

## 8. Expand/Collapse Menu Items

- Click vào icon **▶** hoặc **▼** để expand/collapse menu items có children
- Mặc định tất cả items được expand

---

## 9. Gán Menu vào Vị trí

### Cách 1: Khi tạo menu mới
- Chọn **"Vị trí"** trong form tạo menu

### Cách 2: Chỉnh sửa menu hiện có
1. Mở menu editor
2. Trong phần **"Thông tin menu"**, chọn **"Vị trí"**
3. Click **"Lưu thay đổi"**

**Lưu ý:**
- Mỗi location chỉ có 1 menu `active` tại một thời điểm
- Nếu bạn set menu mới làm active cho location đã có menu active, menu cũ sẽ tự động chuyển sang inactive

---

## 10. Filter và Tìm kiếm Menu

### Filter theo Location
- Chọn location từ dropdown **"Vị trí"**

### Filter theo Status
- Chọn status từ dropdown **"Trạng thái"**

### Tìm kiếm
- Nhập tên menu vào ô tìm kiếm
- Kết quả sẽ tự động cập nhật sau 300ms

---

## Tips & Best Practices

1. **Đặt tên menu rõ ràng**: Sử dụng tên mô tả để dễ quản lý (VD: "Menu chính", "Menu footer")

2. **Sử dụng Custom Links cho external links**: Thay vì tạo page mới, sử dụng Custom Link cho links ngoài

3. **Kiểm tra Reference Status**: Nếu thấy warning badge "Reference không tồn tại", hãy kiểm tra và sửa lại reference

4. **Tối ưu cấu trúc menu**: 
   - Không nên tạo quá nhiều cấp (tối đa 3 cấp)
   - Sắp xếp items quan trọng lên trên

5. **Test trên Frontend**: Sau khi tạo/cập nhật menu, kiểm tra hiển thị trên frontend

---

## Troubleshooting

### Menu không hiển thị trên frontend
- ✅ Kiểm tra menu có `status = 'active'` không
- ✅ Kiểm tra menu có được gán `location` không
- ✅ Kiểm tra location có đúng với code frontend không (VD: 'primary', 'mobile')

### Menu items không hiển thị
- ✅ Kiểm tra reference có tồn tại và active không (xem warning badge)
- ✅ Kiểm tra menu item có `parentId` đúng không

### Không thể kéo thả menu items
- ✅ Kiểm tra item có ở cấp 3 (độ sâu tối đa) không
- ✅ Refresh trang và thử lại
- ✅ Kiểm tra console có lỗi không

### Cấu trúc menu không lưu
- ✅ Kiểm tra network tab xem API call có thành công không
- ✅ Kiểm tra console có lỗi không
- ✅ Thử kéo thả lại và đợi 500ms để auto-save

---

## Keyboard Shortcuts

Hiện tại chưa có keyboard shortcuts. Có thể thêm trong tương lai.

---

## Support

Nếu gặp vấn đề, vui lòng:
1. Kiểm tra console và network tab
2. Xem error messages trong toast notifications
3. Liên hệ developer với thông tin lỗi

---

**Last Updated:** 12/12/2025

