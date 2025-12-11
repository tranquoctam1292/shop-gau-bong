Chi tiết Trình soạn thảo Cổ điển WordPress 

1. Nút Thêm Media (Add Media) - Yêu cầu Kỹ thuật Cao

Nằm ngay phía trên thanh công cụ soạn thảo, bên trái. Đây là tính năng phức tạp nhất cần xử lý upload file và quản lý thư viện.

Cơ chế UI (User Interface): Khi click, cần mở ra một Modal Overlay (cửa sổ nổi) che phủ màn hình soạn thảo chính, không chuyển trang.

Các tab chức năng và Logic xử lý:

Tải tập tin lên (Upload Files):

Input: Hỗ trợ Drag & Drop (kéo thả) file từ máy tính vào vùng quy định.

Process: Sử dụng AJAX để upload file bất đồng bộ (multipart/form-data). Cần có thanh tiến trình (Progress bar) cho từng file.

Validation: Kiểm tra định dạng file (MIME types: jpg, png, mp4, pdf...) và kích thước tối đa cho phép (max_upload_size).

Thư viện (Media Library):

Display: Hiển thị dạng lưới (Grid) các thumbnail ảnh/video đã upload, có phân trang hoặc cuộn vô tận (Infinite scroll).

Selection: Cho phép chọn một hoặc nhiều item. Khi chọn item, bên phải sẽ hiện cột "Attachment Details".

Chi tiết đính kèm (Attachment Details - Sidebar):

Fields: Cần các trường input để lưu metadata vào database: Văn bản thay thế (Alt Text - quan trọng cho SEO), Tiêu đề (Title), Chú thích (Caption), Mô tả (Description).

Display Settings: Tùy chọn cách chèn vào bài viết:

Căn chỉnh: Trái, Phải, Giữa, Không.

Liên kết tới: Tập tin đa phương tiện, Trang đính kèm, Tùy chỉnh URL, Không.

Kích cỡ: Thumbnail, Medium, Large, Full Size (CMS cần tự động crop ảnh ra các size này khi upload).

Logic Chèn (Insert Logic):

Khi bấm "Insert into post", hệ thống sẽ sinh mã HTML và chèn vào vị trí con trỏ chuột trong editor.

Ví dụ Output: <img class="aligncenter size-medium wp-image-123" src="image-300x200.jpg" alt="Mo ta anh" />.

Nếu có Caption, thường sẽ bao bằng shortcode hoặc thẻ div: [caption]<img ... /> Chú thích[/caption].

2. Thanh Công cụ Soạn thảo (Toolbar) - Chế độ Trực quan (Visual)

Đây là khu vực WYSIWYG (What You See Is What You Get), thường sử dụng lõi như TinyMCE hoặc CKEditor. Dưới đây là logic xử lý cho từng nút.

Hàng 1 (Core Formatting)

In đậm (Bold - B):

Command: execCommand('bold').

Output: Bọc văn bản chọn trong thẻ <strong> (ưu tiên hơn <b> vì chuẩn semantic).

In nghiêng (Italic - I):

Command: execCommand('italic').

Output: Bọc văn bản chọn trong thẻ <em> (ưu tiên hơn <i>).

Gạch ngang (Strikethrough):

Output: Thẻ <del> hoặc <s>. Dùng để biểu thị nội dung đã bị loại bỏ.

Danh sách không thứ tự (Bulleted List):

Logic: Chuyển đổi dòng hiện tại hoặc các dòng đang chọn thành thẻ <li>, bao quanh bởi <ul>. Xử lý phím Enter để tạo dòng <li> mới.

Danh sách có thứ tự (Numbered List):

Logic: Tương tự Bulleted List nhưng bao quanh bởi thẻ <ol>.

Trích dẫn (Blockquote):

Action: Bọc đoạn văn (<p>) hiện tại vào trong thẻ <blockquote>.

CSS Editor: Cần style riêng trong editor để người viết dễ nhận biết (thường là thụt lề và có đường kẻ dọc bên trái).

Đường kẻ ngang (Horizontal Line):

Output: Chèn thẻ <hr /> độc lập.

Căn lề (Left, Center, Right):

Action: Thêm style inline text-align: center hoặc class CSS tương ứng (ví dụ: align-center) vào thẻ block chứa văn bản (thường là <p>).

Chèn/Sửa liên kết (Insert/Edit Link):

UI: Hiển thị popup nhỏ (inline toolbar) hoặc modal.

Input: URL, Text to display.

Option: Checkbox "Open link in a new tab" (thêm target="_blank" rel="noopener").

Search: (Nâng cao) Cho phép tìm kiếm bài viết cũ trong CMS để link nội bộ.

Thẻ Đọc tiếp (Read More tag):

Output: Chèn comment HTML đặc biệt: <!--more-->.

Logic CMS: Khi hiển thị ra trang chủ, CMS sẽ cắt nội dung tại vị trí comment này.

Mở rộng thanh công cụ (Toolbar Toggle):

Javascript: Sự kiện onclick để toggle class hidden cho thanh toolbar hàng thứ 2.

Hàng 2 (Advanced Formatting)

Định dạng (Format Select):

Type: Dropdown menu.

Function: Chuyển đổi thẻ bao quanh khối văn bản (Block-level element).

Options: Paragraph (<p>), Heading 1-6 (<h1> - <h6>), Preformatted (<pre>).

Gạch chân (Underline):

Output: Thẻ <u> hoặc style text-decoration: underline. (Lưu ý: Ít dùng trên web vì dễ nhầm với link).

Căn đều 2 bên (Justify):

Style: text-align: justify.

Màu chữ (Text color):

UI: Color Picker (bảng chọn màu).

Output: Thêm span với style color: #hexcode.

Dán như văn bản thuần (Paste as text):

Logic: Đây là một trạng thái (State). Khi bật, sự kiện onPaste sẽ chặn hành vi dán mặc định, lấy nội dung từ Clipboard, dùng Regex loại bỏ toàn bộ thẻ HTML, chỉ giữ lại text và ký tự ngắt dòng, sau đó chèn vào editor.

Tẩy định dạng (Clear formatting):

Command: execCommand('removeFormat').

Action: Loại bỏ các thẻ strong, em, span, u, strike trong vùng chọn, đưa về văn bản thuần.

Ký tự đặc biệt (Special character):

UI: Modal hiển thị lưới các ký tự Unicode. Khi click, chèn mã entity (ví dụ: &copy;) vào vị trí con trỏ.

Thụt lề (Indent/Outdent):

Action: Thêm/bớt padding-left hoặc margin-left cho đoạn văn.

Hoàn tác/Làm lại (Undo/Redo):

Management: Editor cần quản lý một Stack (ngăn xếp) lịch sử thay đổi nội dung (History Manager) để thực hiện tính năng này.

3. Chế độ Soạn thảo Văn bản (Text Mode / HTML)

Đây là chế độ dành cho Developer hoặc người dùng biết code. Không có trình hiển thị trực quan.

Thành phần UI: Là một thẻ <textarea> thông thường, sử dụng font monospaced (như Courier New, Consolas).

Logic Đồng bộ (Sync Logic):

Khi chuyển từ Visual -> Text: Nội dung HTML từ Visual được đổ vào Textarea.

Khi chuyển từ Text -> Visual: Nội dung từ Textarea được parse và render lại trong Visual editor. Cần cẩn thận logic wpautop (tự động chuyển đổi xuống dòng thành thẻ <p> và <br>) để tránh vỡ giao diện.

Thanh công cụ rút gọn (QuickTags):

Khác với Visual, các nút ở đây hoạt động theo cơ chế chèn chuỗi ký tự (String Insertion).

Cơ chế đóng/mở thông minh:

Trường hợp 1 (Bôi đen text): Nếu user bôi đen chữ "CMS", bấm nút b, script sẽ chèn <strong> vào trước và </strong> vào sau -> <strong>CMS</strong>.

Trường hợp 2 (Không bôi đen): Bấm nút b lần 1 -> chèn <strong>. Nút chuyển trạng thái thành /b. Bấm lần 2 -> chèn </strong>.

Các nút đặc thù:

code: Chèn thẻ <code> (dùng cho inline code).

link: Mở popup nhập URL đơn giản, sau đó sinh thẻ <a href="...">text</a>.

img: Mở Media Library giống bên Visual nhưng trả về mã HTML thô thay vì hiển thị ảnh.