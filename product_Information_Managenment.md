TÀI LIỆU ĐẶC TẢ KỸ THUẬT (TECHNICAL SPECIFICATION)

Module: Quản lý Sản phẩm (Product Information Management - PIM)

Phiên bản: 2.2 (Trash Bin Added)
Ngày tạo: 12/12/2025
Trạng thái: Draft

1. TỔNG QUAN (OVERVIEW)

1.1. Mục đích

Xây dựng màn hình danh sách sản phẩm (Product Listing) mới, thay thế giao diện cũ. Tập trung vào khả năng tìm kiếm, lọc dữ liệu đa chiều, quản lý nhanh trạng thái/tồn kho và cơ chế an toàn dữ liệu (Xóa mềm/Khôi phục).

1.2. Phạm vi (Scope)

Backend: API liệt kê (Listing), lọc (Filtering), cập nhật nhanh (Quick Update), quản lý thùng rác (Trash Management).

Frontend (CMS): Giao diện Data Grid, Inline Edit, Bulk Actions, Tab Thùng rác.

Database: Sử dụng cấu trúc dữ liệu sản phẩm hiện có, bổ sung trường quản lý xóa mềm.

2. CƠ SỞ DỮ LIỆU (DATABASE SCHEMA)

Tham chiếu cấu trúc dữ liệu đã có (để phục vụ hiển thị):

2.1. Bảng products (Sản phẩm cha)

Chứa thông tin chung: id, name, sku (nếu quản lý theo cha), category_id, brand_id, status, image_url, created_at.

Bổ sung: deleted_at (TIMESTAMP, Nullable) - Thời điểm xóa mềm. Nếu NULL là chưa xóa.

2.2. Bảng product_variants (SKU)

Chứa thông tin biến thể: sku, price, stock_quantity, status.

Bổ sung: deleted_at (TIMESTAMP, Nullable) - Để đồng bộ xóa mềm với cha hoặc xóa lẻ.

3. LOGIC HIỂN THỊ & TÌM KIẾM

3.1. Logic hiển thị giá & kho

Sản phẩm đơn: Hiển thị trực tiếp price và stock_quantity.

Sản phẩm có biến thể:

Giá: Hiển thị khoảng giá Min - Max (VD: 100.000đ - 150.000đ).

Kho: Hiển thị tổng tồn kho của tất cả biến thể (SUM(variants.stock)).

3.2. Logic tìm kiếm

Tìm kiếm Full-text search trên name.

Tìm kiếm chính xác trên sku (bao gồm cả SKU cha và SKU con).

Mặc định: Chỉ tìm kiếm các sản phẩm có deleted_at IS NULL (trừ khi đang ở trong Thùng rác).

4. YÊU CẦU CHỨC NĂNG (FUNCTIONAL REQUIREMENTS)

4.1. Màn hình Quản lý danh sách (Product List Dashboard)

Màn hình trung tâm để quản lý toàn bộ sản phẩm.

A. Khu vực Bộ lọc & Tìm kiếm (Filter & Search Bar)

Tab điều hướng:

Tất cả (All)

Đang bán (Active)

Hết hàng (Out of stock)

Thùng rác (Trash) [Mới]: Hiển thị số lượng sản phẩm đã xóa bên cạnh (VD: Thùng rác (5)).

Thanh tìm kiếm (Global Search): Input text cho phép tìm theo Tên sản phẩm, Mã SKU, Barcode.

Bộ lọc nâng cao (Advanced Filters):

Danh mục (Category): Dropdown cây danh mục (Tree select).

Thương hiệu (Brand): Dropdown chọn thương hiệu.

Khoảng giá: Input Min - Max.

B. Bảng dữ liệu (Data Grid)

Cấu trúc cột hiển thị:

Cột

Nội dung hiển thị

Thao tác nhanh (Inline Action)

Checkbox

Chọn dòng để thực hiện Bulk Actions

Chọn tất cả / Chọn trang hiện tại

Sản phẩm

- Ảnh đại diện (Thumbnail)



- Tên sản phẩm (Click để sang trang Edit)



- 3 dòng đầu mô tả ngắn (truncate)



Phân loại

- Tên Danh mục



- Tên Thương hiệu



SKU

Mã SKU đại diện (hoặc list SKU con nếu expand)

Click to copy

Giá bán

Giá hoặc Khoảng giá

Sửa nhanh: Click icon bút chì để sửa giá trực tiếp.

Tồn kho

- Số lượng tổng.



- Label màu: Xanh (>10), Vàng (<10), Đỏ (0).

Sửa nhanh: Click icon bút chì để điều chỉnh (+/-) kho nhanh.

Trạng thái

Badge trạng thái (Active/Inactive)

Toggle Switch: Bật/Tắt bán nhanh.

Hành động

Nút ...

Xem chi tiết, Nhân bản (Duplicate), Xóa tạm.

C. Thao tác hàng loạt (Bulk Actions)

Khi người dùng tick chọn nhiều sản phẩm, thanh công cụ Bulk Action sẽ hiện ra:

Xóa tạm (Move to Trash): Chuyển các mục đã chọn vào thùng rác (Set deleted_at = NOW).

Cập nhật trạng thái: Chuyển tất cả sang Published hoặc Draft.

Cập nhật giá/kho hàng loạt.

4.2. Quản lý Thùng rác (Trash Management) [Mới]

Khi người dùng chuyển sang Tab "Thùng rác", giao diện Grid sẽ thay đổi một chút:

Bộ lọc mặc định: Chỉ hiển thị sản phẩm có deleted_at IS NOT NULL.

Cột "Hành động" thay đổi thành:

Khôi phục (Restore): Đưa sản phẩm trở lại danh sách chính (Set deleted_at = NULL).

Xóa vĩnh viễn (Force Delete): Xóa hoàn toàn khỏi Database (Cần Popup xác nhận lần 2: "Hành động này không thể hoàn tác").

Bulk Actions cho Thùng rác:

Khôi phục các mục đã chọn.

Xóa vĩnh viễn các mục đã chọn.

Cơ chế tự động: Hệ thống tự động xóa vĩnh viễn sản phẩm trong thùng rác sau 30 ngày (cần Cronjob). Hiển thị cảnh báo: "Sản phẩm trong thùng rác sẽ tự động bị xóa sau 30 ngày".

4.3. Quản lý kho nhanh (Quick Inventory Management)

Giữ nguyên như phiên bản trước.

5. API DESIGN (RESTful) - LISTING FOCUS

5.1. Admin API

GET /api/v1/admin/products: Lấy danh sách sản phẩm.

Query Params: status (active/draft), trashed (boolean: true để lấy list thùng rác).

Response: Trả về mảng sản phẩm.

DELETE /api/v1/admin/products/{id}: Xóa tạm (Soft Delete).

Logic: Update deleted_at = NOW().

DELETE /api/v1/admin/products/{id}/force: Xóa vĩnh viễn (Force Delete).

Logic: DELETE FROM products WHERE id = {id}.

PATCH /api/v1/admin/products/{id}/restore: Khôi phục sản phẩm.

Logic: Update deleted_at = NULL.

POST /api/v1/admin/products/bulk-action: Xử lý hàng loạt.

Body:

{
  "ids": [1, 2, 3],
  "action": "restore", // hoặc "force_delete", "soft_delete"
  "value": null
}


6. UI/UX GUIDELINES (CHO LIST VIEW)

6.1. Empty States

Khi thùng rác trống: Hiển thị icon vui vẻ "Thùng rác sạch sẽ".

6.2. Feedback

Khi xóa tạm: Toast message "Đã chuyển vào thùng rác. [Hoàn tác]". Nút Hoàn tác cho phép restore ngay lập tức nếu lỡ tay.

Khi xóa vĩnh viễn: Modal xác nhận màu đỏ cảnh báo nguy hiểm.

7. MIGRATION PLAN (KẾ HOẠCH CHUYỂN ĐỔI)

Chạy migration add column deleted_at vào bảng products và product_variants.