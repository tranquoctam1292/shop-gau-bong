Đặc tả Kỹ thuật: Module Ảnh Sản phẩm & Thư viện Ảnh (Media Management)

Tài liệu này mô tả chi tiết logic, giao diện (UI/UX) và luồng dữ liệu cho 2 widget nằm ở cột bên phải (Sidebar) của trang thêm sản phẩm.

1. Widget: Ảnh Sản phẩm (Product Image / Featured Image)

Đây là ảnh đại diện chính của sản phẩm, xuất hiện ở trang danh mục và là ảnh lớn nhất trong trang chi tiết.

1.1. Trạng thái Giao diện (UI States)

Widget này có 2 trạng thái hiển thị rõ rệt:

A. Trạng thái Rỗng (Chưa chọn ảnh)

Hiển thị: Một đường link hoặc nút bấm: "Thiết lập ảnh sản phẩm" (Set product image).

Placeholder: (Tùy chọn) Một hình ảnh mờ icon "No Image" để giữ bố cục.

B. Trạng thái Đã chọn ảnh

Hiển thị:

Thumbnail của ảnh đã chọn (Kích thước hiển thị trong admin thường là 260px width).

Bên dưới ảnh là đường link: "Xóa ảnh sản phẩm" (Remove product image).

Click vào ảnh -> Mở lại Modal để thay đổi ảnh khác.

1.2. Luồng xử lý (Workflow Logic)

Kích hoạt: User click vào "Thiết lập ảnh sản phẩm".

Gọi Media Modal: Hệ thống mở cửa sổ Media Library (đã mô tả ở tài liệu Editor).

Filter: Chỉ hiển thị tab "Upload Files" và "Media Library".

Constraint: Chỉ cho phép chọn 1 ảnh duy nhất.

Button Text: Nút xác nhận đổi thành "Thiết lập ảnh sản phẩm" (thay vì "Chèn vào bài viết").

Xử lý Dữ liệu trả về (Callback):

Lấy attachment_id (ID ảnh) và thumbnail_url từ item được chọn.

Gán attachment_id vào một thẻ <input type="hidden" name="_thumbnail_id">.

Cập nhật DOM: Ẩn link "Thiết lập...", hiện thẻ <img> với src vừa lấy được.

Xóa ảnh:

Click "Xóa ảnh sản phẩm".

Set value của hidden input về null hoặc -1.

Xóa thẻ <img> khỏi DOM, hiện lại link "Thiết lập...".

2. Widget: Album hình ảnh sản phẩm (Product Gallery)

Khu vực này cho phép upload nhiều ảnh chụp các góc độ khác nhau của sản phẩm.

2.1. Giao diện (UI Structure)

Container: Một vùng chứa (Div container) hiển thị danh sách các ảnh dạng lưới (Grid).

Nút tác vụ: Link "Thêm ảnh thư viện sản phẩm" (Add product gallery images).

Các item ảnh (Thumbnails):

Mỗi ảnh hiển thị trong một ô vuông nhỏ (ví dụ 80x80px).

Nút Xóa nhanh (Quick Remove): Một icon (x) nhỏ xuất hiện ở góc trên phải của mỗi ảnh khi hover chuột.

Tooltip: Hover vào ảnh hiện tên file hoặc title.

2.2. Tính năng Kéo thả (Drag & Drop Reordering)

Yêu cầu: User phải có thể thay đổi thứ tự ảnh bằng cách kéo thả trực quan.

Kỹ thuật: Sử dụng thư viện như jQuery UI Sortable hoặc SortableJS.

Logic: Khi nhả chuột (Drop), hệ thống phải cập nhật lại thứ tự các ID trong input hidden (Ví dụ: từ 12,15,88 thành 15,12,88).

2.3. Luồng xử lý (Workflow Logic)

Kích hoạt: Click "Thêm ảnh thư viện...".

Gọi Media Modal:

Mode: Kích hoạt chế độ Multi-select (Chọn nhiều). User có thể giữ Ctrl/Cmd để chọn nhiều ảnh cùng lúc.

State: Nếu đã có ảnh trong gallery, khi mở modal, các ảnh đó nên được đánh dấu "Đang chọn" (Checked) - (Tùy chọn, WP mặc định không làm điều này để tránh rối, mà chỉ append thêm).

Xử lý Dữ liệu:

Nhận về một mảng object [img1, img2, img3].

Append (Thêm vào): Không ghi đè ảnh cũ, mà nối thêm ảnh mới vào danh sách hiện có.

Cập nhật value cho <input type="hidden" name="_product_image_gallery"> (Lưu chuỗi ID ngăn cách bằng dấu phẩy).

3. Cấu trúc Dữ liệu & Database (Backend Specs)

Để lập trình viên Backend nắm rõ cách lưu trữ:

Tên trường (Meta Key)

Kiểu dữ liệu

Mô tả

_thumbnail_id

Integer

ID của ảnh đại diện (Ví dụ: 1052).

_product_image_gallery

String

Chuỗi ID các ảnh album, ngăn cách bởi dấu phẩy (Ví dụ: 1053,1054,1055).

Lưu ý khi API response: Khi xuất API ra Frontend (App/Web), cần expand các ID này thành object chứa full URL (thumbnail, medium, large) để Frontend không phải gọi thêm API lấy ảnh.

4. Lưu ý cho Frontend Developer (Xử lý AJAX)

Lazy Loading trong Admin: Nếu gallery có > 20 ảnh, không được render thẻ <img> full size mà chỉ load thumbnail nhỏ (150x150) để tránh lag CMS.

Optimistic UI: Khi xóa ảnh khỏi Gallery, hãy xóa element trên giao diện ngay lập tức (remove DOM) rồi mới gửi request update ngầm, không bắt user chờ loading.