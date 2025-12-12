TÀI LIỆU ĐẶC TẢ KỸ THUẬT (TECHNICAL SPECIFICATION)

Module: Quản lý Đơn hàng (Order Management System - OMS)

Phiên bản: 1.0
Ngày tạo: 12/12/2025
Trạng thái: Draft

1. TỔNG QUAN (OVERVIEW)

1.1. Mục đích

Xây dựng hệ thống quản lý vòng đời đơn hàng từ lúc khách đặt (Checkout) đến khi hoàn tất giao hàng (Completed) hoặc hủy/hoàn trả. Module này đóng vai trò trung tâm, kết nối Inventory (Kho), Payment (Thanh toán) và Shipping (Vận chuyển).

1.2. Phạm vi (Scope)

Backend: Xử lý luồng trạng thái đơn hàng (Order State Machine), tính toán giá trị (Tax, Shipping, Discount), quản lý kho (Hold/Release stock).

Frontend (CMS): Dashboard theo dõi đơn hàng, xử lý đơn hàng (Duyệt, Đóng gói, Giao vận), in phiếu giao hàng/hóa đơn.

Integrations: Cổng thanh toán (Payment Gateway), Đơn vị vận chuyển (3PL).

2. QUY TRÌNH & TRẠNG THÁI (ORDER STATE MACHINE) - QUAN TRỌNG

Hệ thống phải tuân thủ nghiêm ngặt luồng trạng thái để đảm bảo tính toàn vẹn dữ liệu.

2.1. Danh sách trạng thái (Status List)

Pending (Chờ xử lý): Đơn mới tạo, chưa thanh toán (hoặc COD). Kho hàng được giữ (Reserved).

Awaiting Payment (Chờ thanh toán): Dành cho thanh toán Online. Đang chờ callback từ cổng thanh toán.

Confirmed (Đã xác nhận): Đã thanh toán hoặc Admin xác nhận COD hợp lệ. Kho hàng chính thức bị trừ.

Processing (Đang xử lý/Đóng gói): Kho đang nhặt hàng, đóng gói. Đã in phiếu gửi.

Shipping (Đang giao hàng): Đã bàn giao cho đơn vị vận chuyển. Có mã vận đơn (Tracking ID).

Completed (Hoàn tất): Khách đã nhận hàng và đối soát thành công.

Cancelled (Đã hủy): Hủy bởi khách hoặc Admin. Stock được trả lại (Released).

Refunded (Đã hoàn tiền): Đã trả lại tiền cho khách (một phần hoặc toàn bộ).

Failed (Thất bại): Giao hàng thất bại hoặc thanh toán lỗi.

2.2. Quy tắc chuyển đổi (Transition Rules)

Pending -> Confirmed (Admin duyệt hoặc Auto-confirm).

Pending -> Cancelled (Khách hủy/Timeout).

Confirmed -> Processing -> Shipping -> Completed.

Không được phép: Nhảy cóc từ Pending sang Completed.

Chặn: Không thể Cancel đơn hàng khi đã ở trạng thái Shipping (phải qua quy trình Trả hàng/Hoàn tiền riêng).

3. CƠ SỞ DỮ LIỆU (DATABASE SCHEMA)

3.1. Bảng orders (Thông tin chính)

Trường

Kiểu

Nullable

Mô tả

id

BIGINT

No

PK.

code

VARCHAR(20)

No

Mã đơn hàng (VD: ORD-2025-001). Unique.

user_id

BIGINT

Yes

ID khách hàng (Null nếu là Guest).

guest_info

JSON

Yes

Thông tin Guest (Email, Phone, Name) nếu user_id null.

status

ENUM

No

Theo danh sách trạng thái ở mục 2.1.

subtotal

DECIMAL

No

Tổng tiền hàng chưa thuế/phí.

tax_total

DECIMAL

No

Tổng thuế.

shipping_fee

DECIMAL

No

Phí vận chuyển.

discount_total

DECIMAL

No

Tổng giảm giá (Coupon/Promotion).

grand_total

DECIMAL

No

Tổng thanh toán cuối cùng (= Sub + Tax + Ship - Discount).

payment_method

VARCHAR(50)

No

cod, banking, vnpay, momo, stripe.

payment_status

ENUM

No

pending, paid, failed, refunded.

shipping_method

VARCHAR(50)

No

ID của phương thức vận chuyển.

notes

TEXT

Yes

Ghi chú của khách hàng.

admin_notes

TEXT

Yes

Ghi chú nội bộ của Admin (Không hiện cho khách).

3.2. Bảng order_items (Chi tiết sản phẩm - SNAPSHOT DATA)

Lưu ý: Phải lưu giá và tên sản phẩm tại thời điểm mua (Snapshot), không được tham chiếu trực tiếp sang bảng Products để lấy giá hiện tại.

Trường

Kiểu

Mô tả

id

BIGINT

PK.

order_id

BIGINT

FK -> orders.

product_id

BIGINT

FK -> products.

product_variant_id

BIGINT

FK -> product_variants (Nếu có size/màu).

product_name

VARCHAR

Tên sản phẩm tại thời điểm mua.

sku

VARCHAR

SKU tại thời điểm mua.

quantity

INT

Số lượng mua.

unit_price

DECIMAL

Giá gốc 1 sản phẩm tại thời điểm mua.

total_price

DECIMAL

quantity * unit_price.

3.3. Bảng order_histories (Audit Log - Quan trọng cho CMS chuyên nghiệp)

Ghi lại mọi thay đổi trạng thái để truy vết (Traceability).

Trường

Kiểu

Mô tả

id

BIGINT

PK.

order_id

BIGINT

FK.

action

VARCHAR

create, update_status, payment_received.

description

TEXT

Chi tiết (VD: "Admin A đổi trạng thái từ Pending sang Processing").

actor_id

BIGINT

ID người thực hiện (Admin hoặc Customer hoặc System).

created_at

TIMESTAMP

Thời điểm thực hiện.

4. YÊU CẦU CHỨC NĂNG (FUNCTIONAL REQUIREMENTS)

4.1. Danh sách đơn hàng (Order List)

Bộ lọc nâng cao (Advanced Filters):

Theo ngày tạo (From date - To date).

Theo trạng thái (Status).

Theo kênh bán hàng (Website, App, POS).

Search theo: Mã đơn, SĐT, Email khách.

Quick Actions: Duyệt nhanh, In vận đơn hàng loạt.

4.2. Chi tiết đơn hàng (Order Detail)

Đây là màn hình làm việc chính của nhân viên vận hành.

Thông tin khách hàng: Hiển thị tên, SĐT, lịch sử mua hàng (Total LTV - Lifetime Value) để nhận biết khách VIP.

Thông tin sản phẩm: List items, hình ảnh, link tới sản phẩm gốc.

Xử lý đơn hàng (Action Bar):

Nút chuyển trạng thái (chỉ hiện nút hợp lệ theo State Machine).

Nút "Hủy đơn" (Yêu cầu nhập lý do).

Nút "Hoàn tiền" (Partial Refund hoặc Full Refund).

Timeline: Hiển thị dữ liệu từ bảng order_histories dưới dạng dòng thời gian.

4.3. Chỉnh sửa đơn hàng (Order Editing)

Quy tắc: Chỉ cho phép sửa khi đơn ở trạng thái Pending hoặc Confirmed. Khi đã sang Processing (đã đóng gói), khóa tính năng sửa.

Khả năng sửa:

Thêm/bớt sản phẩm (Hệ thống phải tự tính lại Total).

Sửa địa chỉ giao hàng.

Áp dụng mã giảm giá thủ công.

5. LOGIC NGHIỆP VỤ (BUSINESS RULES)

5.1. Quản lý tồn kho (Inventory Reservation)

Hold Stock: Khi đơn hàng được tạo (Pending), hệ thống phải giữ tồn kho tạm thời.

Deduction: Khi đơn hàng Confirmed hoặc Paid, trừ kho chính thức.

Release Stock:

Nếu đơn bị Cancelled.

Nếu đơn Pending quá hạn thanh toán (ví dụ: 30 phút cho QR code, 24h cho COD) -> Cronjob chạy quét và hủy đơn -> Trả lại tồn kho.

5.2. Tính toán tiền tệ

Phải xử lý vấn đề làm tròn số (Rounding issue).

Công thức chuẩn: GrandTotal = Max(0, Subtotal + Tax + Ship - Discount). Không bao giờ được ra số âm.

6. API DESIGN (RESTful)

6.1. Admin APIs

GET /admin/orders: List orders (pagination, sort, filter).

GET /admin/orders/{id}: Detail.

PATCH /admin/orders/{id}/status:

{ "status": "processing", "note": "Đã kiểm tra kho" }


POST /admin/orders/{id}/shipment: Tạo vận đơn (kết nối API GHTK/GHN).

{ "carrier": "ghtk", "weight": 200 }


7. UI/UX GUIDELINES

Màu sắc trạng thái: Phải dùng color-code chuẩn để nhân viên dễ nhận diện:

Pending: Vàng (Warning).

Processing: Xanh dương (Info).

Completed: Xanh lá (Success).

Cancelled: Xám hoặc Đỏ nhạt.

Layout: Chia màn hình chi tiết làm 3 cột:

Cột trái (Lớn): Danh sách sản phẩm, thanh toán.

Cột phải (Nhỏ): Thông tin khách hàng, Trạng thái, Note.

Cột dưới: Timeline lịch sử.

8. NON-FUNCTIONAL REQUIREMENTS

Concurrency (Đồng thời): Xử lý khóa (Database Locking/Optimistic Locking) khi 2 admin cùng sửa 1 đơn hàng hoặc khi tồn kho còn 1 nhưng 2 khách cùng mua.

Security: Masking (che bớt) số thẻ tín dụng trong database transaction logs.

Performance: API List Orders phải load dưới 500ms. Index kỹ các trường created_at, status, user_id.