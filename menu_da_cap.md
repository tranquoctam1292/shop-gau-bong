TÀI LIỆU ĐẶC TẢ KỸ THUẬT (TECHNICAL SPECIFICATION)

Tính năng: Cơ chế Kéo thả Menu Đa cấp (WordPress Style)

Phiên bản: 1.0
Ngày tạo: 13/12/2025
Phạm vi: Frontend Component (CMS)

1. MỤC TIÊU TRẢI NGHIỆM (UX GOALS)

Hệ thống cần đạt được cảm giác "mượt" và "thông minh" giống WordPress với các đặc điểm sau:

Vertical Sorting: Kéo lên/xuống để đổi thứ tự.

Horizontal Nesting: Kéo sang phải để biến thành con của mục bên trên (Sub-menu). Kéo sang trái để thoát khỏi cha (Un-nest).

Snap Assistant: Có "bóng mờ" (Placeholder) hiển thị chính xác vị trí sẽ thả.

Auto-Scroll: Tự động cuộn màn hình khi kéo item xuống đáy hoặc lên đỉnh trang.

2. GIẢI PHÁP KỸ THUẬT (TECHNICAL APPROACH)

2.1. Thư viện đề xuất (Library Recommendation)

Không nên code thuần (Vanilla JS) từ đầu vì rất dễ lỗi trên Mobile và các trình duyệt khác nhau.

Phương án 1 (React - Khuyên dùng): dnd-kit kết hợp với @dnd-kit/sortable và strategy SortableTree. Đây là thư viện hiện đại, headless (dễ style), hỗ trợ tốt accessibility và touch devices.

Phương án 2 (Legacy/jQuery): Nestable.js (Thư viện kinh điển mà WordPress từng dùng ý tưởng tương tự).

Phương án 3 (Vue/React): SortableJS (Hỗ trợ tốt nested lists nhưng cần config kỹ phần group).

Trong tài liệu này, ta sẽ đặc tả logic dựa trên dnd-kit (hoặc logic tọa độ tổng quát).

2.2. Logic "Thụt lề" (Indentation Logic) - QUAN TRỌNG

Đây là phần khó nhất. Làm sao máy biết user muốn "thụt dòng"?

Grid System: Chia chiều ngang thành các bước nhảy (Steps). Ví dụ: mỗi cấp (level) cách nhau 30px.

Công thức tính Level:
Khi user đang kéo item (dragging), ta lắng nghe sự thay đổi toạ độ X (deltaX).

// Giả sử indentationWidth = 30px
const projectedLevel = Math.round(currentOffset.x / indentationWidth);

// Giới hạn (Clamp) level mới:
// 1. Không được nhỏ hơn 0 (Root).
// 2. Không được lớn hơn (Level của item liền trên + 1).
//    (Nghĩa là: Muốn làm Level 2 thì thằng liền trên phải ít nhất là Level 1).


Visual Guide: Hiển thị đường kẻ dọc hoặc khung placeholder thụt vào tương ứng với projectedLevel để user biết mình đang ở cấp mấy.

3. CẤU TRÚC DỮ LIỆU (DATA STRUCTURE)

3.1. Dữ liệu đầu vào (Frontend State)

Mặc dù hiển thị là Cây (Tree), nhưng để dễ tính toán Drag & Drop, ta nên giữ State ở dạng Mảng phẳng (Flat Array) có chứa parentId và depth.

[
  { "id": "1", "parentId": null, "depth": 0, "name": "Trang chủ", "order": 0 },
  { "id": "2", "parentId": null, "depth": 0, "name": "Sản phẩm", "order": 1 },
  { "id": "3", "parentId": "2",   "depth": 1, "name": "Áo thun",   "order": 2 }, // Con của 2
  { "id": "4", "parentId": "2",   "depth": 1, "name": "Quần jean", "order": 3 }  // Con của 2
]


3.2. Logic Chuyển đổi (Transformations)

Flattening (Tree -> Flat): Khi lấy từ API về (nếu API trả tree), cần duỗi ra để render list.

Building Tree (Flat -> Tree): Khi user bấm "Lưu", cần gom nhóm lại để gửi về Server (hoặc gửi Flat tùy thiết kế Backend).

4. CÁC QUY TẮC RÀNG BUỘC (CONSTRAINTS)

Hệ thống phải chặn các hành động sau ngay trong lúc kéo:

Max Depth (Độ sâu tối đa):

Cấu hình MAX_DEPTH = 3.

Nếu user cố kéo item sang phải để tạo cấp 4 -> Placeholder không di chuyển theo, giữ nguyên ở cấp 3. Hiển thị viền đỏ cảnh báo.

No Parent (Mồ côi):

Không thể tạo cấp con nếu không có cấp cha liền kề bên trên.

Ví dụ: Item đầu tiên của danh sách bắt buộc phải là Level 0 (Sát lề trái).

Collapsed Parent (Cha đang đóng):

Nếu một Menu Item đang ở trạng thái đóng (Collapsed - ẩn con), không cho phép kéo một item khác chui vào làm con của nó (hoặc phải tự động mở bung ra khi hover giữ chuột 500ms).

5. CÁC TRẠNG THÁI HIỂN THỊ (VISUAL STATES)

5.1. Item đang được kéo (Draggable)

Opacity: 0.5 (Mờ đi).

Shadow: Lớn (Nổi lên).

Cursor: grabbing.

Nội dung: Nên thu gọn nội dung, chỉ hiện Tiêu đề (ẩn các nút edit/delete) để gọn gàng.

5.2. Vùng thả dự kiến (Placeholder/Ghost)

Đây là component quan trọng nhất để giả lập WordPress.

Là một box rỗng, có viền nét đứt (dashed border).

Chiều cao: Bằng chiều cao item đang kéo.

Vị trí: Di chuyển realtime theo con trỏ chuột và logic Indentation.

5.3. Trạng thái lỗi (Error Feedback)

Nếu kéo vào vùng không hợp lệ (Quá sâu): Placeholder chuyển màu nền đỏ nhạt.

6. API SYNC (ĐỒNG BỘ DỮ LIỆU)

Khi sự kiện onDragEnd kết thúc và hợp lệ:

Update Local State: Cập nhật lại mảng dữ liệu trên RAM ngay lập tức để UI không bị giật.

Serialize Data: Chuyển đổi mảng state thành format rút gọn để gửi lên server.

Payload mẫu:

[
  { "id": 1, "parent_id": null, "order": 0 },
  { "id": 2, "parent_id": null, "order": 1 },
  { "id": 3, "parent_id": 2, "order": 0 }, // Order reset theo scope cha
  { "id": 4, "parent_id": 2, "order": 1 }
]


(Lưu ý: Chỉ gửi ID, ParentID và Order để tiết kiệm băng thông).

7. EDGE CASES CẦN TEST

Kéo một nhánh (Sub-tree):

Khi kéo Item cha (đang có con), toàn bộ con cháu phải đi theo.

Visually: Hiển thị một "chồng" hồ sơ hoặc Badge số lượng (VD: "Sản phẩm (+3 items)").

Kéo trên Mobile:

Trên điện thoại, việc vừa cuộn màn hình vừa kéo rất khó. Cần có "Drag Handle" (nút 6 chấm) đủ lớn để chạm vào.

Menu quá dài:

Khi kéo item xuống cạnh dưới màn hình, trình duyệt phải tự cuộn (Auto-scrolling) mượt mà.