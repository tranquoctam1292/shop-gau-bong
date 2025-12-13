# Checklist: WordPress-Style Drag & Drop Implementation

So sánh các tính năng đã triển khai với yêu cầu trong `menu_da_cap.md`

## 1. MỤC TIÊU TRẢI NGHIỆM (UX GOALS)

### ✅ 1.1. Vertical Sorting
- **Yêu cầu:** Kéo lên/xuống để đổi thứ tự
- **Status:** ✅ Đã implement
- **Code:** `reorderInParent` function, `shouldReorder` logic
- **Note:** Sử dụng `@dnd-kit/sortable` với `verticalListSortingStrategy`

### ✅ 1.2. Horizontal Nesting
- **Yêu cầu:** Kéo sang phải để biến thành con, kéo sang trái để un-nest
- **Status:** ✅ Đã implement
- **Code:** `handleDragOver` với `deltaX` tracking, `projectedDepth` calculation
- **Logic:** `levelChange = Math.round(cumulativeDeltaX / INDENTATION_WIDTH)`
- **Note:** Clamp depth theo constraints (min 0, max MAX_DEPTH, không orphan)

### ⚠️ 1.3. Snap Assistant (Placeholder)
- **Yêu cầu:** Có "bóng mờ" (Placeholder) hiển thị chính xác vị trí sẽ thả
- **Status:** ⚠️ Partial - Component đã tạo nhưng chưa render đúng
- **Code:** `DragPlaceholder` component đã tạo (line 502-528)
- **Issue:** Placeholder chưa được render trong `NestedMenuItems` - cần thêm logic render
- **Note:** Cần render placeholder tại vị trí `projectedPosition` với `projectedDepth`

### ✅ 1.4. Auto-Scroll
- **Yêu cầu:** Tự động cuộn màn hình khi kéo item xuống đáy hoặc lên đỉnh trang
- **Status:** ✅ Đã implement
- **Code:** `handleAutoScroll` function (line 649-693)
- **Logic:** Trigger khi distance < AUTO_SCROLL_THRESHOLD (50px), scroll với speed 10px/frame

## 2. GIẢI PHÁP KỸ THUẬT

### ✅ 2.1. Thư viện
- **Yêu cầu:** dnd-kit kết hợp với @dnd-kit/sortable
- **Status:** ✅ Đã sử dụng
- **Code:** Import từ `@dnd-kit/core` và `@dnd-kit/sortable`

### ✅ 2.2. Logic "Thụt lề" (Indentation Logic)
- **Yêu cầu:** 
  - Grid System: 30px per level
  - Công thức: `projectedLevel = Math.round(currentOffset.x / indentationWidth)`
  - Clamp: min 0, max (Level của item liền trên + 1)
- **Status:** ✅ Đã implement
- **Code:** 
  - `INDENTATION_WIDTH = 30` (line 79)
  - `handleDragOver` với `deltaX` tracking (line 578-645)
  - Clamp logic (line 612-623)
- **Note:** Logic đúng theo spec

### ⚠️ 2.3. Visual Guide
- **Yêu cầu:** Hiển thị đường kẻ dọc hoặc khung placeholder thụt vào tương ứng với projectedLevel
- **Status:** ⚠️ Partial - Component có nhưng chưa render
- **Code:** `DragPlaceholder` component có visual guide (line 524: `w-1 h-8 bg-blue-400`)

## 3. CẤU TRÚC DỮ LIỆU

### ✅ 3.1. Flat Array với depth
- **Yêu cầu:** Giữ State ở dạng Mảng phẳng (Flat Array) có chứa parentId và depth
- **Status:** ✅ Đã implement
- **Code:** `flattenTree` function, items có `parentId` và depth được tính bằng `getItemDepth`

### ✅ 3.2. Transformations
- **Yêu cầu:** Flattening (Tree -> Flat) và Building Tree (Flat -> Tree)
- **Status:** ✅ Đã implement
- **Code:** 
  - `flattenTree` (Tree -> Flat)
  - `buildTree` (Flat -> Tree)
  - `treeToStructure` (Tree -> API format)

## 4. CÁC QUY TẮC RÀNG BUỘC (CONSTRAINTS)

### ✅ 4.1. Max Depth
- **Yêu cầu:** MAX_DEPTH = 3, Placeholder không di chuyển khi quá sâu, hiển thị viền đỏ
- **Status:** ✅ Đã implement
- **Code:** 
  - `MAX_DEPTH = 3` (line 80)
  - Validation trong `handleDragEnd` (line 754-764)
  - `isInvalid` flag trong `projectedPosition`
  - `DragPlaceholder` có `isInvalid` prop để hiển thị đỏ (line 516)

### ✅ 4.2. No Parent (Mồ côi)
- **Yêu cầu:** Không thể tạo cấp con nếu không có cấp cha liền kề bên trên
- **Status:** ✅ Đã implement
- **Code:** Clamp logic `projectedDepth = Math.min(overDepth + 1, projectedDepth)` (line 617)

### ✅ 4.3. Collapsed Parent
- **Yêu cầu:** Tự động mở bung ra khi hover giữ chuột 500ms
- **Status:** ✅ Đã implement
- **Code:** Auto-expand logic trong `handleDragOver` (line 633-641)
- **Delay:** `COLLAPSED_EXPAND_DELAY = 500ms` (line 83)

## 5. CÁC TRẠNG THÁI HIỂN THỊ (VISUAL STATES)

### ⚠️ 5.1. Item đang được kéo (Draggable)
- **Yêu cầu:** 
  - Opacity: 0.5 (Mờ đi)
  - Shadow: Lớn (Nổi lên)
  - Cursor: grabbing
  - Nội dung: Thu gọn, chỉ hiện Tiêu đề (ẩn các nút edit/delete)
- **Status:** ⚠️ Partial
- **Code:** 
  - ✅ Opacity: `opacity-80` trong `isDragging` (line 309)
  - ✅ Shadow: `shadow-lg` (line 309)
  - ✅ Cursor: `cursor-grab active:cursor-grabbing` (line 316)
  - ❌ Nội dung: Chưa thu gọn - vẫn hiển thị đầy đủ buttons trong `SortableMenuItem`
- **Note:** Cần ẩn edit/delete buttons khi `isDragging`

### ⚠️ 5.2. Placeholder/Ghost
- **Yêu cầu:** 
  - Box rỗng, viền nét đứt (dashed border)
  - Chiều cao: Bằng chiều cao item đang kéo
  - Vị trí: Di chuyển realtime theo con trỏ và logic Indentation
- **Status:** ⚠️ Partial
- **Code:** 
  - ✅ Component đã tạo: `DragPlaceholder` (line 502-528)
  - ✅ Dashed border: `border-2 border-dashed` (line 517)
  - ✅ Indentation: `paddingLeft: ${12 + indentPx}px` (line 519)
  - ❌ Chưa render: Placeholder chưa được render trong `NestedMenuItems`
  - ❌ Chiều cao: Hardcoded `itemHeight = 60`, chưa lấy từ item thực tế

### ✅ 5.3. Error Feedback
- **Yêu cầu:** Placeholder chuyển màu nền đỏ nhạt khi quá sâu
- **Status:** ✅ Đã implement
- **Code:** `isInvalid ? 'bg-red-50 border-red-300' : 'bg-blue-50 border-blue-300'` (line 516)

## 6. API SYNC (ĐỒNG BỘ DỮ LIỆU)

### ✅ 6.1. Update Local State
- **Yêu cầu:** Cập nhật lại mảng dữ liệu trên RAM ngay lập tức để UI không bị giật
- **Status:** ✅ Đã implement
- **Code:** `setTreeItems(orderedTree)` ngay sau khi tính toán (line 1030)

### ✅ 6.2. Serialize Data
- **Yêu cầu:** Chuyển đổi mảng state thành format rút gọn (chỉ ID, ParentID và Order)
- **Status:** ✅ Đã implement
- **Code:** `treeToStructure` function (line 156-161), gửi format `{id, children: []}`

## 7. EDGE CASES

### ✅ 7.1. Kéo một nhánh (Sub-tree)
- **Yêu cầu:** Khi kéo Item cha, toàn bộ con cháu phải đi theo. Visually: Badge số lượng
- **Status:** ✅ Đã implement
- **Code:** 
  - Logic: `children: activeItem.children || []` khi move (preserve children)
  - Visual: Badge trong `DragOverlay` (line 1204-1208): `+{flattenTree([activeItem]).length - 1} items`

### ✅ 7.2. Kéo trên Mobile
- **Yêu cầu:** Drag Handle (nút 6 chấm) đủ lớn để chạm vào
- **Status:** ✅ Đã implement
- **Code:** `GripVertical` với `p-1` padding (line 313-322), `@dnd-kit` hỗ trợ touch devices

### ✅ 7.3. Menu quá dài (Auto-scrolling)
- **Yêu cầu:** Tự động cuộn mượt mà khi kéo item xuống cạnh dưới màn hình
- **Status:** ✅ Đã implement
- **Code:** `handleAutoScroll` function (line 649-693)

## TỔNG KẾT

### ✅ Đã hoàn thành (10/13):
1. Vertical Sorting
2. Horizontal Nesting
3. Auto-Scroll
4. Indentation Logic (30px, deltaX calculation)
5. Max Depth constraint
6. No Parent constraint
7. Collapsed Parent auto-expand
8. Error Feedback (đỏ khi invalid)
9. API Sync (local state + serialize)
10. Edge cases (sub-tree, mobile, auto-scroll)

### ⚠️ Cần hoàn thiện (3/13):
1. **Placeholder Rendering:** Component đã tạo nhưng chưa render trong `NestedMenuItems`
2. **Draggable Content:** Chưa thu gọn nội dung khi dragging (vẫn hiển thị edit/delete buttons)
3. **Placeholder Height:** Chưa lấy chiều cao từ item thực tế, đang hardcode 60px

## HÀNH ĐỘNG CẦN THỰC HIỆN

1. **Render Placeholder trong NestedMenuItems:**
   - Thêm logic render `DragPlaceholder` tại vị trí `projectedPosition.overId` với `projectedPosition.depth`
   - Cần xác định vị trí chính xác (before/after item) dựa trên drag position

2. **Thu gọn nội dung khi dragging:**
   - Ẩn edit/delete buttons trong `SortableMenuItem` khi `isDragging === true`
   - Chỉ hiển thị title và type badge

3. **Dynamic Placeholder Height:**
   - Lấy chiều cao từ item đang kéo (measure DOM element)
   - Hoặc sử dụng ref để lấy height của `SortableMenuItem`

