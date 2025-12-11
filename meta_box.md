Đặc tả Kỹ thuật: Meta Box "Dữ liệu sản phẩm" (Product Data)

Tài liệu này mô tả chi tiết logic, giao diện (UI/UX) và luồng xử lý dữ liệu cho khung quản lý thông tin sản phẩm. Đây là trái tim của hệ thống E-commerce.

1. Thanh Điều khiển Trên cùng (Top Control Bar)

Khu vực này quyết định cấu trúc dữ liệu của toàn bộ sản phẩm.

Loại sản phẩm (Product Type Dropdown):

UI: Select Box.

Các tùy chọn:

Sản phẩm đơn giản (Simple Product): Mặc định. Bán một mặt hàng cụ thể.

Sản phẩm có biến thể (Variable Product): Sản phẩm có nhiều size, màu sắc (Logic phức tạp nhất).

Sản phẩm nhóm (Grouped Product): Tập hợp các sản phẩm đơn giản.

Sản phẩm bên ngoài/Liên kết (External/Affiliate Product): Chuyển hướng sang web khác để mua.

Logic hiển thị: Khi thay đổi giá trị này, các Tab bên trái và nội dung bên phải sẽ thay đổi tương ứng (Javascript Event change).

Các Checkbox Tùy chọn:

Sản phẩm ảo (Virtual):

Logic: Nếu check -> Ẩn tab "Giao hàng" (Shipping). Sản phẩm không cần vận chuyển (dịch vụ, bảo hiểm...).

Có thể tải xuống (Downloadable):

Logic: Nếu check -> Thêm các trường upload file, giới hạn lượt tải, hạn sử dụng tải xuống trong tab "Chung".

2. Các Tab Chức năng (Vertical Tabs)

A. Tab Tổng quan (General)

Giá vốn (Cost Price) - Tính năng nâng cao:

DataType: Float/Decimal.

UI: Ô nhập liệu số.

Mục đích: Dùng để tính toán lợi nhuận. Trường này thường ẩn với khách hàng, chỉ hiển thị cho Admin.

Giá bán thường (Regular Price):

DataType: Float/Decimal.

Validation: Chỉ nhập số, không âm.

Logic Tính Lợi Nhuận (Real-time Calculation):

Ngay khi nhập giá, hệ thống tự động tính: Lợi nhuận = Giá bán - Giá vốn.

Hiển thị: Một label nhỏ bên cạnh ô nhập: "Lãi: 50.000đ (20%)". Giúp Admin cân đối giá bán ngay lập tức.

Required: Có (để hiển thị nút Add to cart).

Giá khuyến mãi (Sale Price):

DataType: Float/Decimal.

Validation: Phải nhỏ hơn Giá bán thường.

Tính năng Lên lịch (Schedule):

Khi click "Lên lịch", hiện 2 trường chọn ngày: Ngày bắt đầu và Ngày kết thúc.

Frontend Logic: Chỉ hiển thị giá sale nếu Ngày hiện tại nằm trong khoảng này.

UX Improvement: Tự động tính % giảm giá và hiển thị nhãn (Ví dụ: "Đang giảm 20%") ngay cạnh ô nhập liệu.

Tệp tin tải xuống (Downloadable Files) - Chỉ hiện khi check "Có thể tải xuống"

UI: Bảng danh sách file. Có nút "Thêm file".

Fields: Tên file, Đường dẫn file (Upload button), Giới hạn tải (Download Limit), Hết hạn tải (Download Expiry).

B. Tab Kiểm kê kho hàng (Inventory)

Mã sản phẩm (SKU - Stock Keeping Unit):

DataType: String.

Logic: Phải là Duy nhất (Unique) trong toàn bộ hệ thống database. Cần validate trùng lặp ngay khi nhập (Real-time Ajax check).

Quản lý kho hàng (Manage Stock?):

UI: Checkbox.

Logic:

Nếu Uncheck: Chỉ hiện trạng thái kho (Còn hàng/Hết hàng).

Nếu Check: Hiện thêm trường "Số lượng trong kho" (Stock Quantity) và "Ngưỡng sắp hết hàng" (Low stock threshold).

Số lượng trong kho (Stock quantity):

Input: Number (Integer).

Logic: Khi đơn hàng được tạo -> Trừ số lượng này. Nếu về 0 -> Tự động chuyển trạng thái sang "Hết hàng".

Cho phép đặt hàng trước (Allow backorders?):

Options: Không cho phép / Cho phép nhưng thông báo khách / Cho phép.

Logic: Cho phép mua hàng ngay cả khi Stock quantity <= 0.

Bán riêng lẻ (Sold individually):

UI: Checkbox.

Logic: Nếu check, khách chỉ được mua tối đa 1 sản phẩm này trong 1 đơn hàng.

C. Tab Giao hàng (Shipping)

(Sẽ ẩn nếu là "Sản phẩm ảo")

Trọng lượng (Weight): Input Number (kg/g tùy setting).

Kích thước (Dimensions): 3 ô input: Dài, Rộng, Cao.

Logic: Dữ liệu này dùng để tính phí vận chuyển qua API (Giao Hàng Nhanh, Viettel Post...).

Lớp giao hàng (Shipping class): Dropdown chọn nhóm vận chuyển (ví dụ: Hàng cồng kềnh, Hàng dễ vỡ).

D. Tab Các sản phẩm được liên kết (Linked Products)

Bán thêm (Upsells):

UI: Ô input tìm kiếm Ajax (Search product box).

Logic: Gợi ý sản phẩm cao cấp hơn để khách thay thế sản phẩm hiện tại (Hiện ở trang chi tiết sản phẩm).

Data: Lưu dạng mảng ID sản phẩm [12, 15, 88].

Bán chéo (Cross-sells):

UI: Ô input tìm kiếm Ajax.

Logic: Gợi ý sản phẩm mua kèm (Hiện ở trang Giỏ hàng/Checkout).

E. Tab Các thuộc tính (Attributes) - Giao diện thông minh

Đây là tiền đề để tạo ra sản phẩm biến thể. Giao diện được cải tiến để tránh lỗi nhập liệu.

Thêm thuộc tính:

Select Box: Chọn thuộc tính Global (đã định nghĩa trước ở menu Attributes) hoặc "Custom Attribute" (chỉ dùng cho SP này).

Nút Thêm (Add).

Bên trong một thuộc tính:

Tên (Name): Ví dụ "Màu sắc".

Giá trị (Values) - Smart UI:

Input: Dạng Tags Input (Chips) kết hợp Auto-suggest.

Logic: Khi gõ, hệ thống gợi ý các giá trị đã có trong DB. Nếu gõ mới và Enter, tạo tag mới.

Color Picker: Nếu thuộc tính là "Màu sắc", hiển thị bảng chọn màu trực quan thay vì chỉ nhập tên màu (VD: Chọn mã Hex #FF0000 sẽ hiện ô vuông màu đỏ).

Checkbox: "Dùng cho nhiều biến thể" (Used for variations). Checkbox này cực kỳ quan trọng, là trigger để kích hoạt tab Biến thể.

F. Tab Các biến thể (Variations) - Giao diện Bảng tính (Spreadsheet View)

(Chỉ hiện khi Loại sản phẩm = Sản phẩm có biến thể)

Logic Sinh Biến Thể (Variation Generation):

Cần nút "Tạo biến thể từ tất cả thuộc tính" (Create variations from all attributes).

Thuật toán: Cartesian Product (Tích Đề các). Ví dụ: 

$$Đỏ, Xanh$$

 x 

$$S, M$$

 = 4 biến thể.

Giao diện Quản lý Biến thể (Table View):

Thay đổi lớn: Thay vì dùng Accordion (xổ xuống) truyền thống chậm chạp, sử dụng Grid/Table View giống Excel.

Các cột hiển thị:

Hình ảnh: Click để upload ảnh nhanh cho biến thể.

Tên biến thể: (Read-only) Ví dụ: Đỏ - Size S.

SKU: Mã kho riêng.

Giá vốn (Cost): Để tính lãi từng biến thể.

Giá bán (Price): Giá khách mua.

Giá KM (Sale): Giá giảm.

Tồn kho (Stock): Số lượng thực tế.

Tính năng Inline Edit: Admin có thể click trực tiếp vào ô giá/kho để sửa, bấm phím Tab để nhảy sang ô tiếp theo. Giúp cập nhật hàng loạt cực nhanh.

G. Tab Nâng cao (Advanced)

Ghi chú mua hàng (Purchase note): Gửi cho khách sau khi mua xong (trong email).

Thứ tự menu (Menu order): Số nguyên. Dùng để sắp xếp vị trí hiển thị sản phẩm tùy ý.

Cho phép đánh giá (Enable reviews): Checkbox bật tắt comment/rating.

Thanh trạng thái cố định (Sticky Action Bar):

Thanh công cụ chứa nút Lưu, Xem thử luôn dính (Sticky) ở mép màn hình, giúp admin lưu bất cứ lúc nào mà không cần cuộn trang lên xuống.

3. Lưu ý Kỹ thuật cho Lập trình viên

Cấu trúc dữ liệu (Database Schema):

Sử dụng bảng posts (lưu tên, mô tả) và postmeta (lưu giá, sku, attributes).

Với biến thể: Mỗi biến thể là một record trong bảng posts với post_type = 'product_variation', post_parent = ID_Sản_phẩm_cha.

Validation:

Frontend: Validate ngay khi blur khỏi ô input.

Backend: Sanitize dữ liệu trước khi save vào DB.

Performance:

Sử dụng Lazy Load cho các tab nội dung.

Với giao diện Bảng tính (Variations Table), sử dụng Virtual Scrolling nếu số lượng biến thể > 100 để đảm bảo mượt mà.