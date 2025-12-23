TÀI LIỆU ĐẶC TẢ KỸ THUẬT (TECHNICAL SPECIFICATION)

Tính năng: Smart SKU Generation (Tạo SKU Thông Minh)

Phiên bản: 1.0
Ngày tạo: 13/12/2025
Module phụ thuộc: Product Management

1. TỔNG QUAN (OVERVIEW)

1.1. Mục đích

Hiện tại, việc nhập SKU thủ công dễ gây ra lỗi trùng lặp, thiếu nhất quán (lúc chữ hoa, lúc chữ thường) và tốn thời gian. Tính năng này cho phép Admin định nghĩa các Công thức (Pattern) để hệ thống tự động sinh mã SKU chuẩn xác ngay khi nhập liệu sản phẩm.

1.2. Phạm vi

Settings: Trang cấu hình quy tắc sinh SKU (Global hoặc theo Danh mục).

Product Form: Tích hợp nút "Auto Generate SKU" vào form thêm/sửa sản phẩm.

Dictionary: Quản lý từ điển viết tắt (Ví dụ: Màu Đỏ -> RED, Size Small -> S).

2. LOGIC CỐT LÕI (CORE LOGIC)

2.1. Cấu trúc Pattern (Công thức)

Hệ thống cho phép xây dựng SKU dựa trên các token (thẻ) ghép lại với nhau.

Các Token hỗ trợ:

{CATEGORY_CODE}: Mã viết tắt của danh mục (Ví dụ: Áo thun -> AT).

{BRAND_CODE}: Mã viết tắt thương hiệu (Ví dụ: Nike -> NK).

{PRODUCT_NAME}: Tên sản phẩm (Lấy ký tự đầu hoặc viết tắt).

{ATTRIBUTE_VALUE}: Giá trị thuộc tính biến thể (Màu, Size).

{YEAR}: Năm hiện tại (2025 -> 25).

{INCREMENT}: Số tự tăng (001, 002...).

Ví dụ công thức:
{CATEGORY_CODE}-{BRAND_CODE}-{ATTRIBUTE_VALUE}-{INCREMENT}
=> Kết quả: AT-NK-RED-S-001

2.2. Cơ chế Viết tắt (Abbreviation System)

Để SKU ngắn gọn, hệ thống không lấy nguyên văn giá trị mà phải qua bộ lọc viết tắt.

Logic:

Bước 1: Tìm trong bảng sku_abbreviations. Nếu có -> Lấy giá trị mapping.

Bước 2: Nếu không có -> Tự động lấy 3 ký tự đầu viết hoa & bỏ dấu (Slugify + Upper + Substr).

Ví dụ: "Xanh Dương" -> Tìm thấy XD -> Lấy XD. Nếu không tìm thấy -> Lấy XAN.

2.3. Cơ chế Xử lý Trùng lặp (Duplicate Handling)

Khi sinh ra một chuỗi SKU (ví dụ: AT-NK-RED-S), hệ thống kiểm tra trong DB:

Nếu chưa tồn tại: Sử dụng luôn.

Nếu đã tồn tại: Tự động thêm hoặc tăng số ở phần {INCREMENT}.

AT-NK-RED-S (Đã có) -> AT-NK-RED-S-01

AT-NK-RED-S-01 (Đã có) -> AT-NK-RED-S-02

3. THIẾT KẾ CƠ SỞ DỮ LIỆU (DATABASE SCHEMA)

3.1. Bảng sku_settings (Lưu cấu hình quy tắc)

Trường

Kiểu

Mô tả

id

INT

PK

category_id

BIGINT

Nullable. Nếu Null -> Quy tắc mặc định toàn shop.

pattern

VARCHAR

Chuỗi format. VD: {CAT}-{ATTR}-{INC}.

separator

CHAR(1)

Ký tự ngăn cách (Thường là -, _, .). Default: -.

case_type

ENUM

UPPER (Mặc định), LOWER.

3.2. Bảng sku_abbreviations (Từ điển viết tắt)

Trường

Kiểu

Mô tả

id

BIGINT

PK

type

ENUM

CATEGORY, BRAND, ATTRIBUTE.

original_value

VARCHAR

Giá trị gốc (VD: "Áo Polo", "Màu Đỏ").

short_code

VARCHAR

Mã viết tắt (VD: "AP", "DO").

category_id

BIGINT

Nullable. Mapping riêng cho từng danh mục (nếu cần).

4. GIAO DIỆN NGƯỜI DÙNG (UI/UX)

4.1. Màn hình Cấu hình SKU (Settings > Products > SKU)

Global Pattern: Input field cho phép admin nhập chuỗi pattern chung. Có các "Chips" (Token) bên dưới để click chọn (Insert variable).

Exceptions: Bảng cho phép Override pattern theo từng Category cụ thể.

Abbreviation Dictionary: Giao diện Table cho phép thêm/sửa các từ viết tắt.

Cột 1: Giá trị gốc (Input text).

Cột 2: Mã viết tắt (Input text - Uppercase only).

4.2. Tích hợp trong Form Sản phẩm (Product Create/Edit)

Trường SKU (Product Level):

Bên cạnh ô Input SKU có nút "⚡ Auto Gen".

Khi bấm: Gọi API sinh mã preview -> Fill vào ô input.

Bảng Biến thể (Variants Table):

Thêm checkbox trên header: "Auto-generate SKU for all variants".

Live Preview: Khi User chọn xong thuộc tính (VD: Màu Đỏ, Size M) -> Cột SKU tự động hiển thị mờ mã dự kiến (VD: AO-RED-M).

Nếu User sửa tay -> Ghi đè mã tự động.

Nút "Regenerate SKUs": Dành cho trường hợp đã tạo rồi nhưng muốn reset lại theo quy tắc mới.

5. API DESIGN (INTERNAL)

5.1. Generate Preview API

Endpoint: POST /api/v1/admin/sku/generate

Mục đích: Chỉ sinh chuỗi để hiển thị trên UI, chưa lưu vào DB.

Payload:

{
  "product_name": "Áo thun Coolmate",
  "category_id": 10,
  "brand_id": 5,
  "variants": [
    { "attributes": { "Color": "Red", "Size": "L" } },
    { "attributes": { "Color": "Blue", "Size": "M" } }
  ]
}


Response:

{
  "data": [
    { "variant_index": 0, "sku": "AT-CM-RED-L" },
    { "variant_index": 1, "sku": "AT-CM-BLU-M" }
  ]
}


5.2. Manage Dictionary API

GET /api/v1/admin/sku/abbreviations

POST /api/v1/admin/sku/abbreviations

6. LOGIC XỬ LÝ ĐẶC BIỆT (EDGE CASES)

Thay đổi danh mục:

Khi sản phẩm đang soạn thảo bị đổi Category -> Hệ thống phải trigger lại logic sinh SKU (vì pattern có thể thay đổi theo category mới).

Sản phẩm cũ:

Tính năng này không tự động đổi SKU của sản phẩm cũ để tránh sai lệch tồn kho/đơn hàng lịch sử.

Chỉ áp dụng khi tạo mới hoặc khi user chủ động bấm "Regenerate".

Ký tự đặc biệt:

Tự động loại bỏ ký tự đặc biệt trong tên sản phẩm khi sinh mã (VD: Áo thun 100% Cotton -> AT-100-COTTON).