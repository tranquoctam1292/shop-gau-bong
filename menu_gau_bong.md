ĐẶC TẢ KỸ THUẬT: MENU WEBSHOP GẤU BÔNG (TEDDY BEAR STORE)

1. Phong Cách Thiết Kế (Design Style)

Chủ đề (Theme): Soft, Cute, Warm & Trustworthy.

Cảm xúc: Tạo cảm giác êm ái, ngọt ngào và an toàn.

Hình khối: Sử dụng nhiều đường bo tròn (rounded corners) cho nút bấm, ô tìm kiếm và khung menu để mô phỏng sự mềm mại của gấu bông.

Font chữ: Sử dụng font không chân, bo tròn (Rounded Sans-serif) như Quicksand, Nunito hoặc Varela Round.

2. Bảng Màu (Color Palette)

Sử dụng tông màu Pastel (phấn) kết hợp với màu nâu ấm.

Vai trò

Mã màu (Hex)

Tên gọi

Sử dụng cho

Chủ đạo

#FF9EAA

Pastel Pink

Nút bấm chính, Icon active, Highlight

Nền chính

#FFF9F9

Creamy White

Background toàn trang

Nền Menu

#FFFFFF

Pure White

Nền thanh Menu (Header)

Văn bản

#5D4037

Warm Brown

Màu chữ chính (thay vì màu đen tuyền)

Điểm nhấn

#FFD700

Soft Gold

Icon ngôi sao, Badge khuyến mãi

Phụ trợ

#F3F4F6

Light Grey

Nền thanh tìm kiếm, đường viền

3. Cấu trúc Menu (Information Architecture)

Thanh điều hướng (Navigation) được chia làm 3 tầng:

Tầng 1: Top Bar (Thanh thông tin trên cùng)

Mục đích: Tăng độ uy tín và hỗ trợ nhanh.

Chiều cao: 30px - 40px.

Nội dung trái: "Chào mừng đến với thế giới gấu bông!"

Nội dung phải: Hotline (Clickable), Theo dõi đơn hàng.

Tầng 2: Main Header (Thanh chức năng chính)

Mục đích: Nhận diện thương hiệu và thao tác mua hàng.

Chiều cao: 60px - 80px.

Thành phần:

Logo: Nằm bên trái (hoặc giữa). Hình ảnh gấu bông + Tên shop.

Search Bar (Tìm kiếm): Nằm giữa. Placeholder: "Bạn đang tìm gấu Teddy, gấu hoạt hình...". Kèm nút tìm kiếm nổi bật.

User Actions (Phải):

Tài khoản: Icon người dùng.

Yêu thích: Icon trái tim.

Giỏ hàng: Icon giỏ hàng + Badge số lượng (màu đỏ hoặc hồng đậm).

Tầng 3: Main Navigation (Thanh điều hướng danh mục)

Mục đích: Phân loại sản phẩm.

Kiểu hiển thị: Sticky (dính) khi cuộn trang hoặc nằm liền dưới Main Header.

Các mục Menu (Sitemap):

Tên Menu

Loại

Nội dung Dropdown (Menu con)

Trang chủ

Link

-

Sản phẩm

Mega Menu

Theo loại: Gấu Teddy, Thú bông hoạt hình, Gối ôm.



Theo size: Khổng lồ (>1m), Vừa (50-80cm), Nhỏ (Móc khóa).

Bộ sưu tập

Dropdown

Gấu tốt nghiệp, Quà tặng Valentine, Quà sinh nhật.

Phụ kiện

Link

Áo cho gấu, Hộp quà, Thiệp.

Góc Chia Sẻ

Link

Cách giặt gấu, Cách gói quà, Blog.

Liên hệ

Link

Hệ thống cửa hàng, Form liên hệ.

Sale %

Link (Màu đỏ)

Các sản phẩm giảm giá.

4. Hành vi Kỹ thuật (Technical Behavior)

Desktop

Hover: Khi di chuột vào menu cấp 1, menu con (Dropdown/Mega menu) trượt xuống nhẹ nhàng (Transition: 0.3s ease-in-out).

Active State: Mục menu đang chọn sẽ đổi màu chữ sang màu chủ đạo (Hồng) và in đậm.

Sticky Header: Khi cuộn xuống quá 100px, thanh Menu chính sẽ dính chặt lên trên cùng màn hình, đổ bóng nhẹ (box-shadow) để tách biệt nội dung.

Mobile (Responsive)

Breakpoint: < 768px (Tablet & Mobile).

Hamburger Menu: Ẩn toàn bộ menu ngang, thay bằng biểu tượng 3 gạch (Hamburger icon).

Drawer: Khi bấm vào Hamburger, menu trượt ra từ bên trái hoặc phải.

Search: Thu gọn thành 1 icon kính lúp, khi bấm mới hiện ra thanh nhập liệu.

Hotline: Nút gọi nhanh (Call-to-action) cố định dưới cùng màn hình (Sticky Bottom) trên mobile.

5. Yêu cầu UI Elements chi tiết

Logo: Định dạng SVG để sắc nét.

Search Bar: Bo tròn góc (Border-radius: 999px). Nút tìm kiếm nằm bên trong input.

Badge Giỏ hàng: Hình tròn nhỏ, nằm góc trên bên phải icon giỏ hàng, hiển thị số lượng item. Animation lắc nhẹ khi thêm hàng vào giỏ.