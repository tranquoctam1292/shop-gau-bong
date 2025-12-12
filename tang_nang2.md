Đặc tả Kỹ thuật: Modal Bảng Chọn Giá Trị Thuộc Tính (Attribute Value Selection Modal)

Mục tiêu: Thay thế cơ chế chọn giá trị dạng Dropdown (Select box) truyền thống bằng giao diện Modal Bảng Chọn (Popup Table).
Đối tượng sử dụng: Đội ngũ Lập trình Frontend/Backend.
Ngữ cảnh: Sử dụng trong tab "Các thuộc tính" (Attributes) tại trang Thêm/Sửa sản phẩm.

1. Vấn đề & Giải pháp

Vấn đề hiện tại (As-Is):

Dropdown chỉ hiển thị danh sách text dọc.

Không nhìn thấy màu sắc thực tế hoặc ảnh minh họa kích thước.

Khó thao tác khi danh sách quá dài (ví dụ: 50 màu gấu bông).

Không thể chọn/bỏ chọn hàng loạt nhanh chóng.

Giải pháp (To-Be):

Sử dụng Modal Overlay hiển thị danh sách giá trị dưới dạng Lưới (Grid) hoặc Bảng (Table).

Tích hợp hiển thị trực quan (Color Swatch, Image Thumbnail).

Hỗ trợ tìm kiếm, lọc và chọn nhiều (Multi-select) tốc độ cao.

2. Luồng Tương tác (User Flow)

Kích hoạt (Trigger):

Người dùng click vào ô input "Chọn giá trị..." của một dòng thuộc tính (Ví dụ: Dòng "Màu sắc").

Hành vi: Ngăn chặn Dropdown mặc định xổ xuống. Thay vào đó, mở Modal modal-attribute-values.

Thao tác trong Modal:

Người dùng nhìn thấy toàn bộ các giá trị (Ví dụ: Tất cả các màu).

Sử dụng ô tìm kiếm để lọc (nếu cần).

Click chọn các item mong muốn (Có thể chọn nhiều). Item được chọn sẽ có viền xanh/highlight.

Bấm nút "Áp dụng".

Kết quả:

Modal đóng lại.

Các giá trị đã chọn được điền vào ô input bên ngoài (hiển thị dạng Chips/Tags).

3. Chi tiết Giao diện Modal (UI Specifications)

Modal cần được thiết kế rộng (min-width: 600px) để tận dụng không gian hiển thị.

3.1. Header (Tiêu đề)

Tiêu đề: "Chọn [Tên Thuộc Tính]" (Ví dụ: Chọn Màu sắc, Chọn Kích thước).

Nút Đóng (X): Góc trên phải.

3.2. Toolbar (Thanh công cụ bên trong)

Nằm ngay dưới Header.

Ô Tìm kiếm (Search Input): "Tìm kiếm màu sắc..." (Real-time filter).

Nút "Chọn tất cả" (Select All): Checkbox chọn toàn bộ danh sách hiện có.

Nút "Thêm nhanh" (+ Add New): Mở form tạo giá trị mới ngay tại chỗ (dành cho trường hợp thiếu màu).

3.3. Body (Khu vực hiển thị danh sách) - Quan trọng nhất

Khu vực này thay đổi cách hiển thị tùy theo Loại thuộc tính (đã định nghĩa ở Global Attributes).

A. Đối với Thuộc tính "Màu sắc" (Color Mode)

Layout: Lưới (Grid), mỗi dòng 4-5 item.

Cấu trúc Card Item:

Hình ảnh/Màu: Ô tròn lớn hoặc vuông hiển thị mã màu (Hex) hoặc Gradient.

Tên: Tên màu nằm dưới (Ví dụ: Nâu Đất).

Trạng thái chọn: Khi click, hiện dấu tích (✔) màu xanh trùm lên ô màu.

B. Đối với Thuộc tính "Kích thước/Hình ảnh" (Visual Mode)

Layout: Danh sách (List View) hoặc Bảng (Table View).

Cấu trúc Row:

Cột 1 (Checkbox): Để chọn.

Cột 2 (Visual): Ảnh minh họa kích thước (Ví dụ: Ảnh gấu 1m so với người).

Cột 3 (Tên): "Size 1m".

Cột 4 (Mô tả): "Khổ vải 1m, nhồi bông còn 80cm".

C. Đối với Thuộc tính "Văn bản" (Text Mode - Cơ bản)

Layout: Danh sách Checkbox đơn giản, chia nhiều cột cho gọn.

3.4. Footer (Chân trang)

Thông tin tổng hợp: "Đã chọn: 5 giá trị".

Nút Hủy (Cancel): Đóng modal, không lưu thay đổi.

Nút Áp dụng (Apply): Style nổi bật (Primary Color).

4. Logic Kỹ thuật (Technical Notes)

4.1. Data Loading (Tải dữ liệu)

Lazy Loading: Không load sẵn HTML của Modal khi vào trang để tránh nặng DOM.

AJAX Fetch: Chỉ khi user click vào ô input, hệ thống mới bắn AJAX request:

GET /api/attributes/terms?taxonomy=pa_mau-sac

Response trả về JSON chứa: ID, Name, Slug, Meta Data (Mã màu, URL ảnh).

Caching: Lưu cache danh sách này lại phía Client (JS Variable). Lần mở sau không cần gọi API lại trừ khi refresh trang.

4.2. State Management (Quản lý trạng thái)

Khi mở Modal, cần kiểm tra ô input bên ngoài đang có giá trị nào (ví dụ đang có "Màu Đỏ").

Modal phải tự động đánh dấu chọn (Pre-select) các giá trị "Màu Đỏ" đó để user biết trạng thái hiện tại.

4.3. Xử lý "Áp dụng" (Apply Logic)

Khi bấm Áp dụng:

Lấy mảng ID các item đang được chọn trong Modal.

Render lại giao diện Chips/Tags vào ô input bên ngoài.

Trigger sự kiện change cho ô input để các script khác (như Tạo biến thể) nhận biết thay đổi.

5. Ví dụ Mockup (HTML Structure Suggestion)

Gợi ý cấu trúc HTML cho Body của Modal (Loại Màu sắc):

<div class="modal-body attribute-grid-view">
    <!-- Item: Màu Nâu -->
    <div class="attr-item selected" data-id="101" data-slug="nau">
        <div class="swatch" style="background-color: #5D4037;">
            <span class="check-icon">✔</span>
        </div>
        <div class="label">Nâu Chocolate</div>
    </div>

    <!-- Item: Màu Trắng -->
    <div class="attr-item" data-id="102" data-slug="trang">
        <div class="swatch" style="background-color: #FFFFFF; border: 1px solid #ddd;">
            <span class="check-icon">✔</span>
        </div>
        <div class="label">Trắng Tinh</div>
    </div>
    
    <!-- ... more items ... -->
</div>


6. Lợi ích UX cho Shop Gấu Bông

Tránh nhầm lẫn: Nhân viên kho nhìn thấy ô màu nâu sẽ không chọn nhầm màu đen.

Tốc độ: Chọn "Full size" (1m, 2m, 3m) chỉ với 1 cú click "Chọn tất cả" thay vì tìm và click 3 lần trong dropdown.

Đào tạo: Nhân viên mới dễ dàng hình dung "Size 1m" trông như thế nào nhờ ảnh minh họa trong cột visual.