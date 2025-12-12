Đặc tả Kỹ thuật: Module Tối ưu hóa Tìm kiếm (SEO Meta Box) - Dành cho Sản phẩm

Module này được tích hợp sâu vào trang "Thêm sản phẩm mới", nằm ngay dưới khung soạn thảo hoặc tab "Dữ liệu sản phẩm". Mục tiêu là tự động hóa tối đa việc SEO dựa trên dữ liệu sản phẩm đã nhập.

1. Giao diện Tổng quan & Xem trước (Product Snippet Preview)

Khác với bài viết thông thường, sản phẩm cần hiển thị cả Giá và Tình trạng kho trên kết quả tìm kiếm.

1.1. Khu vực Giả lập Google (Rich Snippet SERP)

Vị trí: Đầu tiên trong Meta Box.

Chức năng: Hiển thị thời gian thực (Real-time) mô phỏng kết quả tìm kiếm Google dạng Product Rich Result.

Cấu trúc hiển thị đặc thù cho Sản phẩm:

Favicon + Breadcrumb: Shop Gấu Bông > Gấu Teddy > Gấu Khổng Lồ (Lấy từ Danh mục sản phẩm).

Tiêu đề (Blue Link): Gấu Bông Teddy 1m2 Nhập Khẩu - Giá Rẻ | Shop Gấu Xịn.

Thông tin bổ sung (Rich Data - Quan trọng): Hiển thị dòng thông tin ngay dưới tiêu đề (màu xám nhạt):

Rating: ⭐⭐⭐⭐⭐ (5.0) - Mặc định hiển thị giả lập 5 sao hoặc lấy từ rating thực tế.

Price: 500.000₫ - Tự động lấy từ trường "Giá bán" hoặc "Giá khuyến mãi" bên tab Dữ liệu sản phẩm.

Stock: Còn hàng (In Stock) - Tự động lấy từ tab Kiểm kê kho hàng.

Mô tả (Meta Description): Đoạn text mô tả ngắn.

1.2. Thanh tiến trình độ dài (Length Progress Bar)

UX Logic: Thanh màu (Color-coded bar) đánh giá độ dài ngay khi gõ.

Quy tắc màu sắc:

Xám: Quá ngắn.

Cam: Khá.

Xanh lá: Độ dài hoàn hảo (Title: ~580px, Desc: ~155-160 chars).

Đỏ: Quá dài (Bị cắt bớt).

2. Các trường nhập liệu cốt lõi (Core Input Fields)

2.1. Từ khóa chính (Focus Keyword)

UI: Input text.

Chức năng: Nhập từ khóa SEO (Ví dụ: "Gấu bông to").

Logic Gợi ý: Tự động đề xuất từ khóa dựa trên Tên sản phẩm vừa nhập ở trên cùng trang.

2.2. Tiêu đề SEO (SEO Title) - Tự động hóa

Cơ chế Template: Cho phép cấu hình mẫu mặc định để Admin không cần viết tay từng sản phẩm.

Biến động chuyên cho Sản phẩm (Product Dynamic Variables):

Hỗ trợ các biến lấy dữ liệu trực tiếp từ DB sản phẩm:

%title%: Tên sản phẩm.

%price%: Giá bán hiện tại (Ưu tiên giá Sale nếu có).

%sku%: Mã sản phẩm (Quan trọng cho khách tìm theo mã).

%category%: Danh mục chính (Ví dụ: Gấu Teddy).

%brand%: Thương hiệu.

Ví dụ Template: Mua %title% Mã %sku% Giá chỉ %price% - %sitename%

Output: "Mua Gấu Teddy 1m6 Mã T01 Giá chỉ 850k - Shop Gấu Bông"

2.3. Đường dẫn tĩnh (Slug/URL)

Validation: Tự động convert từ Tên sản phẩm -> slug (tiếng Việt không dấu, gạch ngang). Check trùng lặp Real-time.

2.4. Mô tả Meta (Meta Description)

Cơ chế Fallback (Tự động điền):

Nếu trường này trống -> Lấy nội dung từ trường "Mô tả ngắn của sản phẩm" (Product Short Description).

Nếu Mô tả ngắn trống -> Lấy 160 ký tự đầu từ "Mô tả chi tiết".
Giúp Admin lười nhập vẫn có description chuẩn.

3. Hệ thống Phân tích SEO Sản phẩm (E-commerce Analysis)

Bộ quy tắc chấm điểm dành riêng cho trang bán hàng.

3.1. Checklist Kiểm tra (Real-time Audit)

Hiển thị trạng thái: 🟢 (Tốt), 🟠 (Cảnh báo), 🔴 (Tệ).

Checklist Đặc thù Sản phẩm:

SKU: Sản phẩm đã có mã SKU chưa? (Cần cho Schema).

Giá bán: Sản phẩm đã nhập giá chưa? (Không có giá = SEO kém).

Ảnh sản phẩm: Đã có ảnh đại diện (Featured Image) chưa?

Nội dung: Mô tả sản phẩm có chứa từ khóa không?

Internal Link: Có link trỏ về các sản phẩm liên quan không?

4. Tab Nâng cao (Technical SEO)

Canonical URL: Link gốc (dùng khi sản phẩm này là biến thể copy).

Meta Robots:

Noindex: Tự động gợi ý bật nếu Tồn kho = 0 (Hết hàng) để tránh trải nghiệm xấu cho khách (Tuỳ chọn cấu hình).

5. Tab Mạng xã hội (Social Sharing)

Tối ưu hiển thị khi share link sản phẩm lên Facebook/Zalo để bán hàng.

Cơ chế Đồng bộ Ảnh:

Mặc định: Tự động lấy Ảnh đại diện sản phẩm (Featured Image) làm ảnh share.

Tùy chọn: Nút "Upload ảnh riêng" (Ví dụ ảnh banner khuyến mãi có chữ to).

Hiển thị Giá trên Facebook:

Tự động chèn thông tin giá vào Description khi share: "Đang giảm giá chỉ còn 500k!".

6. Schema Markup (Dữ liệu có cấu trúc) - Tự động hoàn toàn

Đây là phần quan trọng nhất giúp Google hiểu đây là một "Sản phẩm" để hiển thị giá/kho.

Logic Backend: Hệ thống tự động sinh JSON-LD Product Schema, Admin không cần thao tác.

Mapping Dữ liệu (Tự động map từ các tab khác):

name <== Tên sản phẩm.

description <== Meta Description / Mô tả ngắn.

sku <== Tab Kiểm kê kho hàng > SKU.

image <== Ảnh đại diện sản phẩm.

brand <== Tên Shop hoặc Thương hiệu (Attribute).

offers:

price <== Tab Tổng quan > Giá bán/Giá Sale.

priceCurrency <== VNĐ.

availability <== Tab Kiểm kê kho hàng (InStock/OutOfStock).

7. Cấu trúc Database (Lưu ý cho Dev)

Dữ liệu SEO lưu trong bảng postmeta của sản phẩm:

Meta Key

Format

Ví dụ

_seo_focus_keyword

String

gấu teddy

_seo_title

String

Template title...

_seo_desc

String

...

_social_img_id

Int

2048

8. Đề xuất đặc thù cho Shop Gấu Bông

Schema "Size": Với sản phẩm Gấu Bông, tự động inject thêm thuộc tính size vào Schema nếu sản phẩm là biến thể có kích thước (1m, 1m2...).

Auto-Alt Text: Tự động thêm hậu tố "Shop [Tên Shop]" vào thẻ Alt của ảnh sản phẩm để tăng bản quyền hình ảnh trên Google Images.