Báo Cáo Rà Soát Mã Nguồn & Chuyển Đổi Hệ Thống

Dự án: Chuyển đổi WordPress/WooCommerce sang Next.js + MongoDB
Ngày: 13/12/2025

1. Tổng Quan Tình Trạng

Hệ thống hiện tại đang sử dụng Next.js App Router kết hợp với Shadcn/ui và Tailwind CSS. Mã nguồn vẫn còn chứa các "tàn dư" của cấu trúc WordPress (metadata, xử lý HTML) và một số cấu hình CSS chưa được tối ưu.

2. Rà Soát API & Data Fetching (Kết nối dữ liệu)

Các điểm kết nối dữ liệu cần được thay đổi hoàn toàn từ REST API của WordPress sang truy vấn trực tiếp MongoDB (hoặc Internal API của Next.js).

Khu vực / File

Vấn đề phát hiện

Mức độ

Hành động khuyến nghị

Data Fetching (Server Components)

Có khả năng vẫn sử dụng fetch() tới endpoint /wp-json/wc/v3/... hoặc /wp-json/wp/v2/....

Cao

Thay thế bằng hàm truy vấn Mongoose trực tiếp (ví dụ: Product.find({...})) để tăng tốc độ và bảo mật.

Image Domains (next.config.js)

Cấu hình images.domains có thể đang whitelist domain cũ của WordPress (ví dụ: wp-content hoặc domain cũ).

Trung bình

Chuyển sang sử dụng dịch vụ lưu trữ mới (S3, Cloudinary) và cập nhật lại domain trong config.

API Routes (app/api/...)

Các route API trung gian (proxy) gọi về WordPress Backend không còn cần thiết.

Cao

Xóa bỏ các file route proxy. Viết lại logic xử lý dữ liệu trực tiếp tại API route kết nối MongoDB.

Authentication

Nếu đang dùng JWT từ plugin WordPress (JWT Auth), token này sẽ vô hiệu.

Cao

Triển khai NextAuth.js (Auth.js) đấu nối với User Collection trong MongoDB.

3. Rà Soát Code & Logic (Frontend/Backend)

3.1. Cấu trúc Metadata & SEO (app/(blog)/posts/metadata.ts)

Đoạn mã hiện tại:

export const metadata: Metadata = {
  title: 'Blog | Shop Gấu Bông',
  description: 'Đọc các bài viết...',
  // ...
}


Vấn đề: Hardcode (gán cứng) các chuỗi văn bản như 'Shop Gấu Bông'.

Giải pháp: Tạo file constants/config.ts hoặc lấy từ Database (Settings Collection) để dễ dàng thay đổi tên thương hiệu sau này mà không cần sửa code.

3.2. Xử lý nội dung HTML (Migration từ WP)

Trong WordPress, nội dung bài viết/sản phẩm lưu dưới dạng HTML thô.

Vấn đề: Sử dụng dangerouslySetInnerHTML hoặc thư viện html-react-parser để render nội dung cũ. Điều này gây rủi ro XSS và khó style.

Giải pháp:

Nếu giữ nguyên HTML cũ: Cần sanitize kỹ lưỡng (dùng dompurify).

Nếu chuyển đổi: Convert HTML cũ sang dạng JSON (như Editor.js hoặc Slate.js) để lưu vào MongoDB.

3.3. Tailwind CSS & UI (tailwind.config.ts)

File config chứa định nghĩa màu sắc rất chi tiết cho Shadcn/ui:

chart: {
    '1': 'hsl(var(--chart-1))',
    '2': 'hsl(var(--chart-2))',
    // ...
}


Vấn đề: Các biến màu chart, sidebar, popover thường dư thừa nếu giao diện Storefront đơn giản và không có Dashboard phức tạp.

Giải pháp:

Xóa các biến màu không sử dụng trong globals.css và tailwind.config.ts để giảm dung lượng file CSS build ra.

Kiểm tra lại fontFamily. Đang load 3 font: Inter, Nunito, Fredoka. Cần xác định xem có thực sự dùng hết không để tối ưu tốc độ tải trang.

4. Kiểm kê File & Thư mục (Cần dọn dẹp)

Loại File

Dấu hiệu nhận biết

Hành động

Types/Interfaces

Các interface có field như yoast_head, _links, rendered (đặc trưng WP REST API).

Xóa bỏ. Định nghĩa lại Schema Interface theo Mongoose Model.

Utils

Các hàm parseWPDate, cleanWPContent.

Xóa bỏ hoặc viết lại thành format chuẩn ISO cho MongoDB.

Components

Các component phục vụ plugin WP cũ (ví dụ: ContactForm7, YoastBreadcrumbs).

Thay thế bằng React Hook Form và component Breadcrumb tùy chỉnh của Next.js.

5. Đề xuất Lộ trình Chuyển đổi

Giai đoạn 1 (Database): Định nghĩa lại Schema Mongoose cho Products, Orders, Posts sao cho sạch sẽ, bỏ các field rác của WP (post_mime_type, comment_count nếu không dùng...).

Giai đoạn 2 (Logic): Viết lại các hàm lib/data.ts để fetch dữ liệu từ MongoDB thay vì fetch API.

Giai đoạn 3 (Cleanup): Chạy lệnh unused-exports (hoặc tool tương tự) để tìm các component/function không còn được gọi (dead code).

Giai đoạn 4 (Assets): Di chuyển hình ảnh từ wp-content/uploads sang Cloud Storage mới và chạy script update URL trong Database MongoDB.

Kết luận: Hệ thống cần tập trung vào việc gỡ bỏ lớp trung gian (fetching API WP) và chuẩn hóa lại Schema dữ liệu. Việc giữ lại code cũ sẽ làm tăng độ phức tạp không cần thiết cho Next.js.