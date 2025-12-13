TÀI LIỆU ĐẶC TẢ KỸ THUẬT (TECHNICAL SPECIFICATION)

Module: Quản lý Menu & Điều hướng (Menu Management)

Phiên bản: 1.0
Ngày tạo: 12/12/2025
Trạng thái: Draft

1. TỔNG QUAN (OVERVIEW)

1.1. Mục đích

Xây dựng module cho phép quản trị viên (Admin) cấu hình các thanh điều hướng (Navigation Bars) trên website (ví dụ: Menu chính, Footer menu, Sidebar). Hệ thống cần linh hoạt để người dùng không cần can thiệp code khi muốn thay đổi liên kết.

1.2. Phạm vi (Scope)

Backend: API CRUD Menu (nhóm) và Menu Items (phần tử), xử lý logic liên kết động (Dynamic Linking).

Frontend (CMS): Giao diện kéo thả (Drag & Drop) trực quan để sắp xếp thứ tự và cấp bậc cha-con.

Frontend (User): Render menu dựa trên cấu trúc JSON trả về.

2. YÊU CẦU CHỨC NĂNG (FUNCTIONAL REQUIREMENTS)

2.1. Quản lý Nhóm Menu (Menu Locations)

Tạo vị trí menu: Admin có thể tạo các "vùng" menu (Ví dụ: Main Header, Footer Column 1, Mobile Sidebar).

Gán menu: Một website có thể có nhiều menu, Admin cần chọn menu nào hiển thị ở vị trí nào.

2.2. Quản lý Phần tử Menu (Menu Items)

Cho phép thêm các loại liên kết sau vào menu:

Liên kết tự do (Custom Link): Nhập URL và Tên hiển thị thủ công.

Liên kết nội bộ (Internal References):

Trang tĩnh (Pages): Chọn từ danh sách "Giới thiệu", "Liên hệ"...

Danh mục sản phẩm: Chọn từ cây danh mục đã có.

Sản phẩm: Chọn một sản phẩm cụ thể.

Bài viết/Tin tức: Chọn bài viết cụ thể.

Lưu ý: Khi đối tượng gốc (ví dụ: Tên danh mục) thay đổi, Menu Item nên tự động cập nhật theo (nếu thiết kế theo cơ chế tham chiếu ID).

2.3. Cấu trúc & Sắp xếp

Phân cấp: Hỗ trợ menu đa cấp (Level 1 > Level 2 > Level 3).

Kéo thả (Drag & Drop): Cho phép kéo thả để thay đổi vị trí và cấp bậc (kéo thụt vào để làm con).

3. THIẾT KẾ CƠ SỞ DỮ LIỆU (DATABASE SCHEMA)

Module này cần 2 bảng chính: menus (chứa thông tin nhóm) và menu_items (chứa các nút).

3.1. Bảng menus

Tên trường

Kiểu dữ liệu

Nullable

Mô tả

id

BIGINT

No

Primary Key

name

VARCHAR(255)

No

Tên menu (VD: Menu Tết 2025).

location

VARCHAR(50)

Yes

Vị trí hiển thị (VD: header, footer). Unique (1 vị trí chỉ 1 menu active).

status

ENUM

No

active, inactive.

created_at

TIMESTAMP

No



3.2. Bảng menu_items

Tên trường

Kiểu dữ liệu

Nullable

Mô tả

id

BIGINT

No

Primary Key

menu_id

BIGINT

No

FK tới bảng menus.

parent_id

BIGINT

Yes

FK tới chính bảng menu_items (đệ quy).

title

VARCHAR(255)

Yes

Tên hiển thị (Nếu null -> lấy tên của đối tượng tham chiếu).

type

VARCHAR(50)

No

Loại item: custom, category, page, product.

reference_id

BIGINT

Yes

ID của đối tượng tham chiếu (Nếu type != custom).

url

VARCHAR(500)

Yes

URL cứng (Chỉ dùng khi type = custom).

target

VARCHAR(20)

No

_self (cùng tab), _blank (tab mới). Default: _self.

icon_class

VARCHAR(50)

Yes

Class icon (VD: fa-home).

css_class

VARCHAR(50)

Yes

CSS class riêng cho item (để style đặc biệt).

order

INT

No

Thứ tự sắp xếp.

4. THIẾT KẾ API (RESTful API DESIGN)

4.1. Public API (Cho Frontend User)

Get Menu by Location:

GET /api/v1/menus/location/{location_slug}

Response: Trả về cấu trúc cây (Nested JSON) đã resolve đầy đủ URL và Title từ các reference_id.

Logic: Backend tự động JOIN với bảng Categories/Pages để lấy title/slug mới nhất nếu title trong menu_items là null.

4.2. Admin API (Cho CMS)

Get Menu Detail (With Items):

GET /api/v1/admin/menus/{id}

Trả về danh sách items phẳng (flat list) hoặc cây (tree) tùy config frontend.

Create/Update Menu Item:

POST /api/v1/admin/menu-items

PUT /api/v1/admin/menu-items/{id}

Bulk Update Structure (Quan trọng cho Drag & Drop):

Method: POST

Endpoint: /api/v1/admin/menus/{id}/structure

Body: Gửi lên mảng JSON chứa cấu trúc phân cấp mới. Backend sẽ duyệt mảng này để update lại parent_id và order cho toàn bộ items trong menu đó.

Example Body:

[
  {"id": 1, "children": [
    {"id": 5, "children": []},
    {"id": 6, "children": []}
  ]},
  {"id": 2, "children": []}
]


5. LOGIC NGHIỆP VỤ (BUSINESS RULES)

5.1. Cơ chế Reference (Tham chiếu)

Vấn đề: Khi Admin đổi slug của một danh mục sản phẩm (VD: từ /ao-mua thành /ao-mua-he), menu trỏ tới danh mục đó có bị chết link không?

Giải pháp:

Khi type là category, page, product: Frontend KHÔNG lưu cứng URL vào DB. Chỉ lưu reference_id.

Khi gọi API lấy menu ra ngoài frontend, Backend sẽ query bảng gốc để lấy slug mới nhất -> Link luôn sống (Alive).

5.2. Giới hạn độ sâu (Depth Limit)

Menu quá nhiều cấp (4-5 cấp) thường vỡ giao diện trên Mobile và Desktop.

Rule: Cấu hình giới hạn cứng độ sâu tối đa (Max Depth) là 3 cấp. API sẽ chặn nếu user cố tình gửi structure sâu hơn.

5.3. Xóa đối tượng gốc

Nếu một Page bị xóa (Soft Delete), Menu Item trỏ tới nó xử lý sao?

Rule: Khi render menu, Backend kiểm tra nếu đối tượng tham chiếu không tồn tại (hoặc status != active) -> Ẩn menu item đó khỏi kết quả trả về (không xóa trong DB menu, chỉ ẩn để Admin biết vào sửa).

6. GIAO DIỆN NGƯỜI DÙNG (UI/UX GUIDELINES)

6.1. Panel bên trái: Nguồn dữ liệu

Dạng Accordion (Tab xếp chồng):

Tab Pages: List các trang tĩnh, có checkbox chọn nhiều -> Nút "Add to Menu".

Tab Categories: Cây danh mục, checkbox -> Nút "Add to Menu".

Tab Custom Link: 2 ô input URL và Label -> Nút "Add to Menu".

6.2. Panel bên phải: Cấu trúc Menu

Sử dụng thư viện Nestable hoặc React-Beautiful-DnD.

Mỗi item là một thẻ chữ nhật:

Hiển thị Tên + Loại (VD: "Trang chủ (Page)", "Sản phẩm mới (Category)").

Nút "Mở rộng" (Tam giác nhỏ): Bấm vào xổ xuống form chỉnh sửa nhanh (Sửa label, target, class).

Nút "Xóa" (Icon thùng rác).

Thao tác kéo thả mượt mà, có placeholder hiển thị vị trí sẽ thả.

7. YÊU CẦU PHI CHỨC NĂNG

Caching: Menu là thành phần xuất hiện ở mọi trang. Bắt buộc phải Cache (Redis/Memcached) output của API Get Menu. Cache key dựa trên location và language (nếu đa ngôn ngữ). Xóa cache ngay khi Admin cập nhật menu.

Performance: Query lấy menu item phải tối ưu, tránh N+1 Query khi resolve reference name/slug (Sử dụng Eager Loading hoặc JOIN).

8. KẾ HOẠCH KIỂM THỬ (TESTING PLAN)

Test Case CRUD: Thêm/Sửa/Xóa item thành công.

Test Case Drag & Drop:

Kéo item cha thành con của item khác.

Kéo item con ra làm cha.

Đổi thứ tự trên dưới.

Test Case Dynamic Link:

Tạo menu trỏ tới Category A.

Đổi slug Category A -> F5 trang chủ -> Link trên menu phải tự đổi theo.

Test Case Deleted Reference:

Xóa Category A.

Menu item trỏ tới A phải tự động biến mất ở Frontend User (nhưng vẫn còn trong CMS để admin thấy và xử lý).