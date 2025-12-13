BÁO CÁO KIỂM TRA MÃ NGUỒN (CODE AUDIT)

Module: Menu Management (Drag & Drop Component)

File: components/admin/menus/MenuStructurePanel.tsx
Ngày Audit: 13/12/2025
Người thực hiện: AI Assistant
Mức độ nghiêm trọng: Cao (High)

1. LỖI LOGIC TÍNH TOÁN TỌA ĐỘ (CRITICAL BUG)

1.1. Mô tả lỗi

Hệ thống tính toán sai độ lệch (Offset) khi người dùng kéo chuột, dẫn đến việc tính toán độ thụt lề (depth) bị sai lệch theo cấp số cộng, khiến item bị "nhảy" cấp độ không kiểm soát.

1.2. Vị trí mã nguồn

Trong hàm handleDragOver, logic cập nhật state dragOffset.

Mã hiện tại (Lỗi):

// MenuStructurePanel.tsx (Khoảng dòng 577)
setDragOffset((prev) => {
  if (!prev) return { x: delta.x, y: delta.y };
  // SAI: Cộng dồn delta vào giá trị cũ
  return { x: prev.x + delta.x, y: prev.y + delta.y };
});


1.3. Nguyên nhân

Thư viện dnd-kit trả về giá trị delta trong sự kiện onDragOver là khoảng cách tích lũy (cumulative distance) từ điểm bắt đầu kéo đến điểm hiện tại, KHÔNG PHẢI là khoảng cách gia tăng (incremental) giữa các khung hình.
Việc cộng dồn prev.x + delta.x sẽ làm giá trị tăng vọt không chính xác (Ví dụ: Kéo 10px -> Code tính thành 10+10+10... = 1000px).

1.4. Giải pháp (Fix)

Loại bỏ việc cộng dồn, sử dụng trực tiếp giá trị delta từ event hoặc chỉ lưu delta mới nhất.

// SỬA LẠI:
setDragOffset({ x: delta.x, y: delta.y });


2. LỖI TOÀN VẸN DỮ LIỆU (DATA INTEGRITY)

2.1. Mô tả lỗi

Hệ thống thực hiện cập nhật giao diện trước (Optimistic Update) nhưng không có cơ chế hoàn tác (Rollback) nếu API lưu dữ liệu thất bại.

2.2. Vị trí mã nguồn

Hàm handleDragEnd.

Mã hiện tại (Lỗi):

// Cập nhật UI ngay lập tức
setTreeItems(orderedTree); 

// Gọi API lưu sau đó (Debounced)
const timeout = setTimeout(async () => {
  await saveStructure(orderedTree);
}, 500);


2.3. Rủi ro

Nếu API saveStructure trả về lỗi (500 Server Error hoặc mất mạng), UI vẫn hiển thị vị trí mới. Người dùng tưởng đã lưu thành công. Khi F5 lại trang, menu quay về vị trí cũ gây hoang mang và mất dữ liệu.

2.4. Giải pháp (Fix)

Cần lưu lại trạng thái cũ (snapshot) trước khi cập nhật.

// Trong handleDragEnd
const previousTree = [...treeItems]; // Snapshot
setTreeItems(orderedTree); // Optimistic Update

// Trong hàm saveStructure hoặc logic gọi API
try {
  await saveStructure(orderedTree);
} catch (error) {
  // Rollback nếu lỗi
  setTreeItems(previousTree);
  showToast('Lưu thất bại, đã hoàn tác thay đổi', 'error');
}


3. LỖI LOGIC TÌM VỊ TRÍ CHA (PARENT DETECTION)

3.1. Mô tả lỗi

Thuật toán xác định cha mới (targetParentId) dựa trên việc duyệt ngược mảng phẳng (look-back) không đáng tin cậy trong môi trường Drag & Drop động.

3.2. Vị trí mã nguồn

Hàm handleDragEnd, đoạn logic tìm targetParentId.

Mã hiện tại:

// MenuStructurePanel.tsx (Khoảng dòng 790)
for (let i = overIndex - 1; i >= 0; i--) {
  // Duyệt ngược để tìm item có depth = targetDepth - 1
}


3.3. Nguyên nhân

Khi đang kéo (dragging), thứ tự index trong mảng phẳng (allItemsFlat) có thể không đồng bộ hoàn toàn với vị trí hiển thị trực quan (visual position) do dnd-kit đang xử lý transform. Việc dựa vào overIndex để tìm cha có thể dẫn đến việc gán nhầm item con vào một nhánh khác phía trên.

3.4. Giải pháp (Fix)

Thay vì duyệt ngược mảng phẳng, hãy sử dụng cấu trúc cây (Tree Structure) để xác định cha.
Khi biết overId (item bị đè lên) và projectedDepth:

Nếu projectedDepth > overDepth: Item đang được kéo sẽ trở thành con của overItem.

Nếu projectedDepth == overDepth: Item đang được kéo sẽ là anh em (sibling) của overItem, cùng cha với overItem.

4. VẤN ĐỀ HIỆU NĂNG (PERFORMANCE)

4.1. Mô tả

Component bị Re-render quá nhiều lần không cần thiết.

4.2. Chi tiết

Component NestedMenuItems được gọi đệ quy. Mỗi khi sự kiện dragOver xảy ra (tần suất rất cao: ~60 lần/giây), state projectedPosition thay đổi làm toàn bộ cây menu bị render lại từ gốc đến ngọn.

4.3. Giải pháp (Optimization)

Sử dụng React.memo cho component SortableMenuItem để chỉ render lại item đang bị tác động.

Tách logic tính toán projectedPosition ra khỏi render loop chính nếu có thể, hoặc throttle sự kiện cập nhật state.

5. LỖI UX: FLICKERING (NHẤP NHÁY)

5.1. Mô tả

Item bị nhấp nháy hoặc nhảy loạn xạ khi kéo qua ranh giới giữa các item có độ cao khác nhau (do menu con đang mở/đóng).

5.2. Nguyên nhân

Sử dụng SortableContext với verticalListSortingStrategy cho một cấu trúc lồng nhau (Nested). Strategy này giả định các item nằm trên một danh sách phẳng tuyến tính.

5.3. Giải pháp

Với cấu trúc cây phức tạp, nên chuyển sang sử dụng logic tùy chỉnh hoặc thư viện bổ trợ chuyên dụng cho Tree (dnd-kit-sortable-tree hoặc tự implement logic collisionDetection tùy chỉnh) thay vì dùng verticalListSortingStrategy mặc định.

TỔNG KẾT & KHUYẾN NGHỊ

Đội Dev cần ưu tiên sửa theo thứ tự sau:

Fix ngay Lỗi 1 (Tính toán tọa độ): Đây là lỗi chặn (Blocker), làm tính năng không hoạt động được.

Fix Lỗi 2 (Rollback): Đảm bảo an toàn dữ liệu.

Refactor Lỗi 3 & 4: Để cải thiện độ ổn định và mượt mà sau khi tính năng đã chạy được.


BÁO CÁO KIỂM TRA MÃ NGUỒN (PHASE 2)

Module: Menu Management (Drag & Drop Component)

File: components/admin/menus/MenuStructurePanel.tsx
Trạng thái Review: Các lỗi Phase 1 đã được sửa. Phát hiện các vấn đề Logic & Performance mới.

1. LỖI LOGIC SẮP XẾP: "LUÔN CHÈN LÊN TRÊN" (INSERT BEFORE BUG)

1.1. Mô tả

Người dùng không thể kéo một item xuống vị trí cuối cùng của danh sách hoặc cuối cùng của một nhóm con.
Khi kéo item A đè lên item B, logic hiện tại luôn chèn A vào trước B.

Ví dụ: Có danh sách [A, B, C].

Muốn đổi thành [B, A, C]: Kéo A xuống đè lên B -> Code chèn A trước B -> Kết quả vẫn là [A, B, C].

Muốn đổi thành [B, C, A]: Kéo A xuống đè lên C -> Code chèn A trước C -> Kết quả [B, A, C].

1.2. Vị trí mã nguồn

Hàm handleDragEnd, đoạn logic reorderInParent.

Mã hiện tại:

// MenuStructurePanel.tsx (Khoảng dòng 914)
// Insert active item at over item's position (before over item)
const newRootItems = [...rootItems];
newRootItems.splice(overIndex, 0, { ...itemToInsert, ... });


1.3. Giải pháp (Fix)

Cần xác định hướng kéo (kéo từ trên xuống hay dưới lên) để quyết định chèn trước hay sau.

Logic sửa đổi:

Trước khi xóa item cũ (removeItem), hãy lưu lại index gốc của active và over.

So sánh: Nếu originalActiveIndex < originalOverIndex (Kéo xuống) -> Chèn vào overIndex + 1.

Ngược lại -> Chèn vào overIndex.

(Lưu ý: Logic này phức tạp trong cấu trúc cây, giải pháp đơn giản hơn cho Frontend Dev là kiểm tra active.rect.current.translated.top > over.rect.top).

2. VẤN ĐỀ HIỆU NĂNG: N+1 API REQUESTS (PERFORMANCE BOTTLENECK)

2.1. Mô tả

Mỗi khi render danh sách menu, từng item lại tự gọi API riêng lẻ để kiểm tra link (/api/admin/menu-items/resolve-link).
Nếu menu có 50 items -> Trình duyệt gửi 50 request cùng lúc ngay khi tải trang. Điều này sẽ làm treo server hoặc bị Rate Limit.

2.2. Vị trí mã nguồn

Component SortableMenuItem, trong useEffect.

Mã hiện tại:

// SortableMenuItem (Khoảng dòng 275)
useEffect(() => {
  const loadReferenceStatus = async () => {
    // ... fetch('/api/admin/menu-items/resolve-link' ...)
  };
  loadReferenceStatus();
}, [item]);


2.3. Giải pháp (Fix)

Di chuyển logic kiểm tra này về phía Backend hoặc gọi Batch API một lần duy nhất.

Cách 1 (Backend - Tốt nhất): Khi gọi API GET /api/admin/menus/[id], Backend tự join dữ liệu và trả về cờ isValid, isActive cho từng item luôn. Frontend không cần check lại.

Cách 2 (Frontend Batch): MenuStructurePanel gom tất cả ID lại, gọi 1 API check-status-batch, sau đó truyền status xuống từng item qua props.

3. LỖI UX: ITEM KHÔNG CÓ TIÊU ĐỀ (INVISIBLE ITEM)

3.1. Mô tả

Nếu người dùng xóa tiêu đề (Title) trong lúc chỉnh sửa, hoặc item custom link chưa nhập label, item đó sẽ hiển thị một dòng trống trơn trên giao diện. Người dùng sẽ khó bấm vào nút Edit/Delete của item đó.

3.2. Vị trí mã nguồn

Component SortableMenuItem.

Mã hiện tại:

<span className="font-medium text-gray-900">{item.title}</span>


3.3. Giải pháp (Fix)

Thêm fallback hiển thị nếu title rỗng.

<span className={`font-medium ${!item.title ? 'text-gray-400 italic' : 'text-gray-900'}`}>
  {item.title || '(Chưa có tiêu đề)'}
</span>


4. CODE SNIPPET SỬA LỖI SẮP XẾP (BUG 1)

Thay thế logic reorderInParent bằng logic thông minh hơn dựa trên vị trí tương đối:

// Trong handleDragEnd
const reorderInParent = (items: MenuItem[], parentId: string | null, itemToInsert: MenuItem): MenuItem[] => {
  // Helper lọc items cùng cấp
  const siblings = items.filter(i => i.parentId === parentId);
  const overSiblingIndex = siblings.findIndex(i => i.id === over.id);
  
  // Tìm vị trí gốc (trước khi xóa) để biết đang kéo lên hay xuống
  // Lưu ý: Cần tìm trong allItemsFlat gốc (trước khi gọi removeItem)
  const originalActiveIndex = allFlatItems.findIndex(i => i.id === active.id);
  const originalOverIndex = allFlatItems.findIndex(i => i.id === over.id);
  
  const isMovingDown = originalActiveIndex < originalOverIndex;
  
  // Tính toán index chèn: Nếu đang kéo xuống, chèn SAU overItem (index + 1)
  // Nếu kéo lên, chèn TRƯỚC overItem (index)
  // Tuy nhiên, vì ta đã xóa item active ra khỏi mảng rồi, nên index của overItem đã bị dịch chuyển
  // Logic đơn giản hóa: 
  // Nếu activeIndex < overIndex (Kéo xuống): insertIndex = overIndex
  // Nếu activeIndex > overIndex (Kéo lên): insertIndex = overIndex
  
  // CHỜ CHÚT: Logic splice của JS: splice(i, 0, item) chèn vào TRƯỚC phần tử tại i.
  // Nếu ta muốn chèn SAU, ta cần splice(i + 1, 0, item).
  
  let insertIndex = overSiblingIndex;
  if (isMovingDown) {
     insertIndex = overSiblingIndex + 1;
  }

  // ... (Phần còn lại giữ nguyên logic duyệt đệ quy map/splice)
}


Lưu ý: Để sửa triệt để, bạn nên dùng hàm arrayMove của dnd-kit cho các items cùng cấp (siblings) thay vì tự implement splice.

Trích xuất danh sách con (siblings).

Dùng arrayMove(siblings, oldIndex, newIndex).

Gán lại danh sách con vào cây cha.

BÁO CÁO KIỂM TRA MÃ NGUỒN (PHASE 3) - CƠ CHẾ KÉO THẢ

Module: Menu Management

File: components/admin/menus/MenuStructurePanel.tsx
Vấn đề: Trải nghiệm kéo thả bị sượng, logic phân cấp bị kẹt.

1. LỖI NGHIÊM TRỌNG: KHÓA CHẶT MENU CẤP 3 (STUCK AT LEVEL 3)

1.1. Mô tả

Bạn gặp lỗi: "Khi menu đã là cấp 3 thì không kéo được trở lại".
Nguyên nhân là do mã nguồn đang vô hiệu hóa hoàn toàn khả năng kéo của các item ở cấp độ sâu nhất.

1.2. Vị trí mã nguồn (Gây lỗi)

Trong component SortableMenuItem (khoảng dòng 177):

const {
  // ...
} = useSortable({
  id: item.id,
  disabled: depth >= 2, // <--- LỖI TẠI ĐÂY: Vô hiệu hóa kéo nếu đang ở cấp 3 (depth 2)
});


1.3. Giải thích

Dòng code disabled: depth >= 2 có nghĩa là: "Nếu item đang ở cấp 3, cấm không cho người dùng chạm vào để kéo đi đâu nữa". Điều này làm item bị "chết cứng" tại chỗ.
Mục đích ban đầu có lẽ là chặn tạo cấp 4, nhưng cách làm này lại chặn luôn việc di chuyển item cấp 3.

1.4. Giải pháp (Fix)

Xóa bỏ thuộc tính disabled hoặc set logic chặn ở nơi khác (trong handleDragOver ta đã có logic chặn MAX_DEPTH rồi).

Sửa thành:

const {
  // ...
} = useSortable({
  id: item.id,
  disabled: false, // Luôn cho phép kéo, việc chặn độ sâu sẽ do logic DragOver xử lý
});


2. LỖI TRẢI NGHIỆM: TÍNH TOÁN ĐỘ SÂU BỊ "GIẬT" (JUMPY DEPTH)

2.1. Mô tả

Bạn gặp lỗi: "Chuyển từ menu cấp 2 sang cấp 3 khó khăn, kéo thả không mượt".
Nguyên nhân là do công thức tính độ sâu mới (projectedDepth) đang dựa vào độ sâu của item bị đè lên (overDepth) thay vì item đang được kéo (activeDepth).

2.2. Vị trí mã nguồn (Logic chưa tối ưu)

Trong hàm handleDragOver (khoảng dòng 757):

// Code hiện tại: Dựa vào overDepth (độ sâu của item bên dưới con trỏ chuột)
const overDepth = getItemDepth(overItem, allFlatItems);
const levelChange = Math.round(cumulativeDeltaX / INDENTATION_WIDTH);
let projectedDepth = overDepth + levelChange; // <--- GÂY GIẬT


2.3. Giải thích

Khi bạn kéo chuột, item over (item nằm dưới con trỏ) thay đổi liên tục.

Ví dụ: Bạn đang kéo một item. Con trỏ chuột lướt qua item cha (Cấp 1) -> overDepth = 0.

Nhích chuột xuống 1px, lướt qua item con (Cấp 2) -> overDepth = 1.

Công thức overDepth + levelChange sẽ làm projectedDepth nhảy loạn xạ (0 -> 1 -> 0) dù tay bạn giữ nguyên độ lệch ngang. Điều này tạo cảm giác "giật cục" và khó kiểm soát.

2.4. Giải pháp (Fix)

Tính toán dựa trên độ sâu gốc của item đang kéo (activeItem). Như vậy độ sâu mới chỉ phụ thuộc vào việc bạn kéo sang trái/phải bao nhiêu (delta X), không phụ thuộc vào việc bạn đang đè lên ai.

Sửa thành:

// 1. Lấy độ sâu gốc của item đang kéo
const activeDepth = getItemDepth(activeItem, allFlatItems);

// 2. Tính độ sâu mới dựa trên độ sâu gốc + khoảng cách di chuyển
const levelChange = Math.round(delta.x / INDENTATION_WIDTH);
let projectedDepth = activeDepth + levelChange;

// 3. Sau đó mới clamp (kẹp) giá trị này dựa trên overDepth để đảm bảo logic cha-con
const maxDepth = overDepth + 1; // Không thể sâu hơn con của item đang đè lên
projectedDepth = Math.min(projectedDepth, maxDepth);


3. LỖI LOGIC: KHÔNG THỂ LÀM CON CỦA ITEM ĐANG ĐÓNG (COLLAPSED)

3.1. Mô tả

Khi kéo một item vào một item cha đang đóng (collapsed), logic hiện tại có thể tính sai vị trí chèn hoặc không cho phép chèn vào làm con.

3.2. Giải pháp (Fix)

Trong handleDragOver, logic tự động mở rộng (Auto-expand) đã có nhưng delay 500ms có thể hơi lâu gây cảm giác sượng. Có thể giảm xuống 300ms.

const COLLAPSED_EXPAND_DELAY = 300; // Giảm từ 500 xuống 300 cho nhạy hơn
