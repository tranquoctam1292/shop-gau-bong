# 📖 HƯỚNG DẪN SỬ DỤNG MODULE PIM

**Module:** Product Information Management (PIM)  
**Phiên bản:** 1.0.0  
**Ngày cập nhật:** 12/12/2025

---

## 📋 MỤC LỤC

1. [Tổng quan](#tổng-quan)
2. [Danh sách sản phẩm](#danh-sách-sản-phẩm)
3. [Tìm kiếm và Lọc](#tìm-kiếm-và-lọc)
4. [Quản lý sản phẩm](#quản-lý-sản-phẩm)
5. [Thùng rác](#thùng-rác)
6. [Thao tác hàng loạt](#thao-tác-hàng-loạt)
7. [FAQ](#faq)

---

## 🎯 TỔNG QUAN

Module PIM (Product Information Management) là hệ thống quản lý sản phẩm toàn diện cho CMS admin, bao gồm:

- ✅ **Data Grid** với đầy đủ thông tin sản phẩm
- ✅ **Tab Navigation** (Tất cả, Đang bán, Hết hàng, Thùng rác)
- ✅ **Tìm kiếm nâng cao** (tên, SKU, barcode)
- ✅ **Bộ lọc đa chiều** (danh mục, giá, kho)
- ✅ **Inline Editing** (sửa giá, kho trực tiếp)
- ✅ **Soft Delete & Restore** (xóa tạm, khôi phục)
- ✅ **Thao tác hàng loạt** (xóa, cập nhật trạng thái, giá, kho)
- ✅ **Auto-cleanup** (tự động xóa sau 30 ngày)

---

## 📦 DANH SÁCH SẢN PHẨM

### Truy cập

Điều hướng đến: **Admin → Sản phẩm → Tất cả sản phẩm**

### Các Tab

1. **Tất cả** - Hiển thị tất cả sản phẩm (mặc định: chỉ sản phẩm đang bán)
2. **Đang bán** - Chỉ sản phẩm có status = "publish"
3. **Hết hàng** - Sản phẩm có stockStatus = "outofstock"
4. **Thùng rác** - Sản phẩm đã bị xóa tạm (hiển thị số lượng)

### Cột hiển thị

- **Checkbox** - Chọn sản phẩm để thao tác hàng loạt
- **Sản phẩm** - Thumbnail, tên (click để edit), mô tả ngắn
- **Phân loại** - Danh mục và thương hiệu
- **SKU** - Mã SKU (click để copy)
- **Giá bán** - Giá hoặc khoảng giá (click icon bút chì để sửa)
- **Tồn kho** - Số lượng với màu (Xanh >10, Vàng <10, Đỏ =0) (click icon bút chì để sửa)
- **Trạng thái** - Badge + Toggle switch
- **Hành động** - Menu (⋮) với các options

---

## 🔍 TÌM KIẾM VÀ LỌC

### Tìm kiếm

- **Full-text search** trên tên sản phẩm
- **Exact search** trên SKU
- **Search** trên barcode (nếu có)
- **Debounce** 300ms để tối ưu performance

### Bộ lọc nâng cao

Click nút **"Bộ lọc"** để mở popover:

1. **Danh mục** - Tree select với hierarchy
2. **Khoảng giá** - Min - Max (VND)
3. **Trạng thái kho** - Còn hàng / Hết hàng / Đặt hàng trước

**Lưu ý:** Filters được sync với URL, có thể share link với filters.

---

## ✏️ QUẢN LÝ SẢN PHẨM

### Inline Editing

#### Sửa giá nhanh

1. Click icon **bút chì** (✏️) bên cạnh giá
2. Nhập giá mới (VND)
3. Click **✓** để lưu hoặc **✗** để hủy
4. Hoặc nhấn **Enter** để lưu, **Escape** để hủy

#### Sửa kho nhanh

1. Click icon **bút chì** (✏️) bên cạnh số lượng kho
2. Sử dụng nút **+/-** để điều chỉnh nhanh
3. Hoặc nhập số lượng trực tiếp
4. Click **✓** để lưu hoặc **✗** để hủy

### Action Menu (⋮)

#### Normal Tab

- **Xem chi tiết** - Xem thông tin đầy đủ
- **Chỉnh sửa** - Mở trang edit
- **Nhân bản** - Tạo bản sao sản phẩm
- **Xóa tạm** - Chuyển vào thùng rác

#### Trash Tab

- **Khôi phục** - Khôi phục về trạng thái "Bản nháp"
- **Xóa vĩnh viễn** - Xóa vĩnh viễn (không thể hoàn tác)

---

## 🗑️ THÙNG RÁC

### Tính năng

- Sản phẩm bị xóa sẽ được chuyển vào **Thùng rác**
- Hiển thị số lượng sản phẩm trong thùng rác trên tab
- **Auto-cleanup:** Tự động xóa vĩnh viễn sau **30 ngày**
- Warning message: "Sản phẩm trong thùng rác sẽ tự động bị xóa sau 30 ngày"

### Khôi phục

1. Chuyển sang tab **"Thùng rác"**
2. Chọn sản phẩm cần khôi phục
3. Click **"Khôi phục"** (single) hoặc **"Khôi phục"** trong Bulk Actions Bar
4. Sản phẩm sẽ được khôi phục về trạng thái **"Bản nháp"**

### Xóa vĩnh viễn

1. Chuyển sang tab **"Thùng rác"**
2. Chọn sản phẩm cần xóa
3. Click **"Xóa vĩnh viễn"** (single) hoặc **"Xóa vĩnh viễn"** trong Bulk Actions Bar
4. Xác nhận trong modal cảnh báo
5. **⚠️ Lưu ý:** Hành động này không thể hoàn tác!

---

## 📊 THAO TÁC HÀNG LOẠT

### Chọn sản phẩm

- Click checkbox bên cạnh từng sản phẩm
- Click checkbox ở header để chọn tất cả trong trang hiện tại

### Bulk Actions Bar

Khi có sản phẩm được chọn, Bulk Actions Bar sẽ hiển thị:

#### Normal Tab

- **Xuất bản** - Chuyển status sang "publish"
- **Chuyển thành bản nháp** - Chuyển status sang "draft"
- **Cập nhật giá** - Mở modal để cập nhật giá cho tất cả sản phẩm đã chọn
- **Cập nhật kho** - Mở modal để cập nhật kho (Set/Add/Subtract)
- **Xóa tạm** - Chuyển vào thùng rác

#### Trash Tab

- **Khôi phục** - Khôi phục tất cả sản phẩm đã chọn
- **Xóa vĩnh viễn** - Xóa vĩnh viễn tất cả sản phẩm đã chọn

### Cập nhật giá hàng loạt

1. Chọn sản phẩm cần cập nhật
2. Click **"Cập nhật giá"**
3. Nhập giá mới (VND)
4. Click **"Cập nhật"**
5. Tất cả sản phẩm đã chọn sẽ được cập nhật với giá mới

### Cập nhật kho hàng loạt

1. Chọn sản phẩm cần cập nhật
2. Click **"Cập nhật kho"**
3. Chọn thao tác:
   - **Đặt thành** - Set số lượng về giá trị cụ thể
   - **Thêm vào** - Cộng thêm số lượng
   - **Trừ đi** - Trừ bớt số lượng
4. Nhập số lượng
5. Click **"Cập nhật"**

---

## ❓ FAQ

### Q: Làm thế nào để tìm sản phẩm nhanh?

**A:** Sử dụng thanh tìm kiếm ở đầu trang. Bạn có thể tìm theo:
- Tên sản phẩm
- SKU (exact match)
- Barcode (nếu có)

### Q: Sản phẩm trong thùng rác có thể khôi phục không?

**A:** Có, bạn có thể khôi phục sản phẩm từ thùng rác bất kỳ lúc nào trong vòng 30 ngày. Sau 30 ngày, sản phẩm sẽ tự động bị xóa vĩnh viễn.

### Q: Làm thế nào để xóa nhiều sản phẩm cùng lúc?

**A:** 
1. Chọn các sản phẩm bằng checkbox
2. Click **"Xóa tạm"** trong Bulk Actions Bar
3. Xác nhận

### Q: Có thể sửa giá/kho trực tiếp trong danh sách không?

**A:** Có! Click icon **bút chì** (✏️) bên cạnh giá hoặc số lượng kho để sửa trực tiếp.

### Q: Filters có được lưu trong URL không?

**A:** Có, tất cả filters và search được sync với URL. Bạn có thể bookmark hoặc share link với filters.

### Q: Làm thế nào để xem sản phẩm đã bị xóa?

**A:** Chuyển sang tab **"Thùng rác"** để xem tất cả sản phẩm đã bị xóa tạm.

### Q: Auto-cleanup chạy khi nào?

**A:** Auto-cleanup chạy tự động mỗi ngày lúc **2:00 AM** (theo timezone của server). Sản phẩm trong thùng rác cũ hơn 30 ngày sẽ bị xóa vĩnh viễn.

---

## 🔧 TROUBLESHOOTING

### Lỗi: "Không thể tải danh sách sản phẩm"

**Giải pháp:**
1. Kiểm tra kết nối internet
2. Click **"Thử lại"** trong error state
3. Refresh trang (F5)
4. Kiểm tra console để xem lỗi chi tiết

### Lỗi: "Không thể cập nhật sản phẩm"

**Giải pháp:**
1. Kiểm tra giá/kho có hợp lệ không (>= 0)
2. Đảm bảo bạn có quyền admin
3. Thử lại sau vài giây

### Sản phẩm không hiển thị sau khi thêm

**Giải pháp:**
1. Kiểm tra tab hiện tại (có thể đang ở tab "Đang bán" trong khi sản phẩm mới là "Bản nháp")
2. Chuyển sang tab **"Tất cả"** hoặc **"Bản nháp"**
3. Refresh trang

---

## 📞 HỖ TRỢ

Nếu bạn gặp vấn đề hoặc có câu hỏi, vui lòng liên hệ:
- **Email:** support@shop-gaubong.com
- **Documentation:** Xem `docs/PIM_MODULE_IMPLEMENTATION_PLAN.md` cho chi tiết kỹ thuật

---

**Lưu ý:** Module PIM đang trong giai đoạn phát triển. Một số tính năng có thể được cải thiện trong các phiên bản tương lai.

