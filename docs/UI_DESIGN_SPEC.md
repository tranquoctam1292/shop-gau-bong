🎨 UI/UX DESIGN SPECIFICATION: PRODUCT QUICK EDIT

Phiên bản: 1.0
Dựa trên: Shadcn UI & Tailwind CSS
Mục tiêu: Tạo giao diện sửa nhanh hiện đại, sạch sẽ, tập trung vào tốc độ xử lý dữ liệu (Data-density) nhưng không gây rối mắt.

1. CẤU TRÚC LAYOUT (LAYOUT STRUCTURE)

1.1. Container

Hệ thống sử dụng cơ chế Responsive Container:

Desktop (≥ 768px): Sử dụng Modal Dialog (Popup) nằm giữa màn hình.

Width: max-w-4xl (khoảng 896px) để đủ rộng hiển thị bảng biến thể.

Height: max-h-[90vh].

Scroll: Body cuộn dọc, Header và Footer cố định (Sticky).

Backdrop: Màu đen mờ bg-black/50.

Mobile (< 768px): Sử dụng Bottom Sheet (Ngăn kéo trượt từ dưới lên).

Height: h-[90vh] (chiếm 90% chiều cao màn hình).

Border-radius: Bo tròn 2 góc trên.

1.2. Màu sắc chủ đạo (Color Palette)

Sử dụng hệ màu Slate (Xám xanh) để tạo cảm giác chuyên nghiệp, trung tính:

Primary (Nút chính, Active): Slate-900 (#0f172a).

Background (Nền bảng, input): White (#ffffff) và Slate-50 (#f8fafc).

Border (Đường viền): Slate-200 (#e2e8f0).

Text Main (Chữ chính): Slate-900.

Text Muted (Chữ phụ, Label): Slate-500.

Error (Lỗi): Red-500 (#ef4444).

2. CHI TIẾT THÀNH PHẦN (COMPONENT DETAILS)

2.1. Header (Tiêu đề)

Title: Font Semibold, size lg. Căn trái.

Subtitle (ID): Font sm, màu Slate-500. Nằm ngay dưới Title.

Close Button: Icon X, variant ghost (không nền, hover xám nhẹ), nằm góc trên cùng bên phải.

2.2. Form Body (Khu vực nhập liệu)

Sử dụng bố cục Grid System để tối ưu không gian:

A. Thông tin cơ bản (Row 1):

Chia 2 cột (Grid cols-2):

Tên sản phẩm: Input text, full width cột 1.

SKU: Input text, full width cột 2.

B. Giá & Trạng thái (Row 2):

Chia 3 cột (Grid cols-3):

Trạng thái: Select Dropdown (Bản nháp / Xuất bản / Thùng rác).

Giá gốc: Input number.

Giá khuyến mãi: Input number.

Validation UI: Nếu có lỗi (VD: Giá KM > Giá gốc), viền Input chuyển đỏ, hiện text lỗi nhỏ màu đỏ bên dưới.

C. Quản lý kho (Inventory Card) - Điểm nhấn:

Container: Background màu Slate-50 (xám rất nhạt), có border Slate-200, bo góc rounded-md, padding p-4. Mục đích để tách biệt logic kho hàng với thông tin chung.

Toggle: Checkbox "Quản lý tồn kho" nằm trên cùng.

Animation: Khi check, nội dung bên dưới (Số lượng, Trạng thái) hiện ra với hiệu ứng fade-in slide-in-from-top nhẹ.

Nội dung con: Grid 2 cột (Số lượng tồn | Trạng thái kho).

2.3. Bảng biến thể (Variant Table) - Khu vực phức tạp nhất

A. Header Bảng:

Label "Biến thể (n)" in đậm.

Badge nhỏ màu xám: "Sửa trực tiếp trên bảng" để hướng dẫn người dùng.

B. Công cụ sửa hàng loạt (Bulk Edit Tool):

Checkbox "Áp dụng chung..." ở trên cùng.

Panel nhập liệu: Khi check, hiện ra một panel màu trắng, có shadow nhẹ shadow-sm, border.

Bao gồm 3 input ngang hàng: SKU chung | Giá chung | Số lượng chung.

Nút "Áp dụng" nằm cuối hoặc full-width.

C. Data Table (Bảng dữ liệu):

Style: Table chuẩn, border bao quanh, header nền Slate-100.

Cột 1: Ảnh (Thumbnail):

Kích thước: 40x40px (w-10 h-10).

Bo góc rounded.

Nếu không có ảnh: Hiện placeholder nền xám chữ "N/A".

Cột 2: Thuộc tính (Attributes):

Dòng 1: Tên Size (VD: "L") - Font medium, màu đậm.

Dòng 2: Màu sắc (Stack ngang).

Color Swatch: Hình tròn w-3 h-3, bo viền nhẹ.

Tên màu: Text nhỏ xs, màu xám.

Cột 3, 4, 5 (SKU, Giá, Kho) - Editable Cells:

Trạng thái thường: Hiển thị text. Khi rê chuột (Hover) -> nền chuyển xám nhẹ hover:bg-slate-50, trỏ chuột thành dạng text.

Trạng thái Edit (Click vào):

Text biến mất, thay thế bằng Input Field.

Input này nhỏ gọn (h-8), font chữ nhỏ xs.

Tự động Focus và bôi đen toàn bộ text cũ.

Trạng thái Bulk Active: Các ô này bị mờ đi (opacity-50), không click được (để tránh xung đột dữ liệu).

2.4. Footer (Chân trang)

Nằm cố định ở dưới cùng (nếu nội dung dài).

Có border-top ngăn cách.

Nút Hủy: Variant outline (nền trắng, viền xám).

Nút Lưu: Variant default (nền đen Slate-900).

Disabled state: Mờ đi (opacity-50) nếu form chưa sửa gì (!isDirty) hoặc đang loading.

Loading state: Hiện icon quay tròn (Loader2) bên trái text.

3. TƯƠNG TÁC & TRẠNG THÁI (INTERACTIONS & STATES)

3.1. Input Behaviors

Focus: Khi click vào bất kỳ Input nào, hiện vòng ring màu đen ring-2 ring-slate-950 để nhận diện rõ ràng.

Hover: Viền Input đậm hơn một chút khi rê chuột.

3.2. Click-to-Edit (Trong bảng biến thể)

Click: Ô chuyển thành Input.

Enter: Lưu giá trị tạm thời vào state, thoát chế độ Edit, chuyển lại thành Text.

Click ra ngoài (Blur) / Esc: Thoát chế độ Edit.

3.3. Safety UX (An toàn)

Unsaved Changes: Nếu người dùng đã sửa dữ liệu mà bấm nút [X] hoặc bấm ra ngoài vùng đen (Backdrop):

Hiện ra một Dialog nhỏ chồng lên trên (Nested Dialog).

Thông báo: "Bạn có thay đổi chưa lưu...".

Nút: Hủy (Ở lại) / Thoát (Mất dữ liệu).

4. TÀI NGUYÊN ICON (ICONS)

Sử dụng bộ Lucide React:

X: Nút đóng.

Loader2: Loading spinner (animate-spin).

Save: Icon đĩa mềm trên nút Lưu.

Check: Icon trong checkbox.

AlertCircle: Icon cảnh báo lỗi.

Ghi chú cho Dev: Thiết kế này ưu tiên sử dụng các class utility có sẵn của Tailwind CSS và các component nguyên tử (Atomic components) của Shadcn UI để đảm bảo tính nhất quán và tốc độ phát triển.