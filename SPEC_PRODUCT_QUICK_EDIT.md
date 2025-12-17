🛠️ TECHNICAL SPECIFICATION: PRODUCT QUICK EDIT FEATURE

Ngày tạo: 17/12/2025
Cập nhật lần cuối: 17/12/2025 (Deep Review Phase 7 - Automation & Audit Log)
Module: Product Management
Trạng thái: 🚀 Ready for Dev
Tài liệu tham chiếu: PRODUCT_MODULE_REFERENCE.md

1. TỔNG QUAN (OVERVIEW)

1.1. Mục đích

Tính năng Quick Edit (Sửa nhanh) cho phép quản trị viên cập nhật tức thì các thông tin vận hành quan trọng ngay tại danh sách sản phẩm.

1.2. Phạm vi & Giới hạn

Vị trí: Action Menu tại ProductList.

Đối tượng: Admin (product:update).

Các trường cho phép sửa:

General: Name, SKU, Status, Manage Stock.

Price: Regular Price, Sale Price.

Inventory: Stock Quantity, Stock Status.

Logic Lịch khuyến mãi: Sửa Sale Price -> Xóa lịch khuyến mãi cũ.

1.3. Logic Tự động hóa (Automation Logic)

Auto-Sync Stock Status (Đồng bộ trạng thái kho):

Khi sửa Stock Quantity:

Nếu Qty > 0: Tự động set Status = instock (Trừ khi đang set là onbackorder).

Nếu Qty <= 0: Tự động set Status = outofstock (Trừ khi đang set là onbackorder).

UX: Frontend tự động đổi giá trị Dropdown Status khi user nhập số lượng, nhưng vẫn cho phép user chỉnh lại thủ công sau đó.

2. YÊU CẦU UI/UX (USER INTERFACE)

2.1. Dialog Layout (ProductQuickEditDialog)

Header: "Sửa nhanh: [Tên sản phẩm]" [Badge: Simple/Variable]

Form Body:

General Info:

Name (Required).

Status (Draft/Publish).

SKU (Parent).

Inventory Control:

Checkbox: [x] Quản lý tồn kho (Manage Stock)

Behavior:

Uncheck -> Disable Input Stock Qty.

Check -> Enable Input Stock Qty.

Pricing & Variants Area:

Mode 1: Bulk Update (Checked Áp dụng chung)

Inputs: Bulk Regular, Bulk Sale, Bulk Stock.

Mode 2: Individual Update (Unchecked)

Mini-Table Variants (Enhanced):

Info: Thumb + Attributes (Size/Color/Material).

SKU: Input.

Price: Regular | Sale.

Stock: Qty | Status (Select nhỏ gọn).

Interaction Safety (Mới):

Prevent Accidental Close: Nếu form đang có thay đổi (isDirty = true), khi user bấm nút Hủy hoặc click ra ngoài (backdrop click), hiển thị Alert Dialog: "Bạn có thay đổi chưa lưu. Bạn có chắc muốn thoát?".

Mobile Responsiveness:

Trên Mobile (< 768px): Thay Dialog bằng Sheet (Drawer) trượt từ dưới lên để có không gian hiển thị bảng biến thể tốt hơn.

Footer:

Lưu thay đổi (Loading state).

3. THIẾT KẾ KỸ THUẬT (TECHNICAL DESIGN)

3.1. Frontend (ProductQuickEditDialog.tsx)

Helper Function: handleStockChange

// Logic Auto-sync Status tại Frontend
const handleStockChange = (newQty: number, currentStatus: string, setValue: any) => {
    // Chỉ auto-switch nếu status hiện tại KHÔNG phải là onbackorder
    if (currentStatus !== 'onbackorder') {
        if (newQty > 0) setValue('stockStatus', 'instock');
        else setValue('stockStatus', 'outofstock');
    }
};


Zod Schema (Giữ nguyên từ Phase 6):

Vẫn đảm bảo validate Sale < Regular và các ràng buộc kiểu dữ liệu.

3.2. Backend API (PATCH /api/admin/products/[id]/quick-update)

Flow xử lý:

Validation & Lock: Validate Body, Check version.

Process Logic:

Handle $unset Sale Dates.

Handle manageStock logic.

Audit Log (Mới - Critical):

Sau khi update thành công, ghi record vào collection audit_logs:

await AuditLog.create({
    action: 'PRODUCT_QUICK_UPDATE',
    actorId: session.user.id,
    targetId: productId,
    details: {
        oldValues: { ... }, // Optional: Snapshot giá cũ (nếu cần)
        changes: body // Các trường thay đổi
    },
    timestamp: new Date()
});


Recalculate Bounds: Tính lại minPrice, maxPrice, totalStock.

Return: Updated Product.

4. EDGE CASES & BUSINESS RULES

Case

Hành vi hệ thống

User nhập Kho = 0 nhưng cố tình chọn Status = In Stock

Hệ thống tôn trọng lựa chọn thủ công cuối cùng của User (Manual override).

Sửa nhanh thất bại (Mất mạng/Lỗi Server)

Giữ nguyên Dialog, không đóng, hiện thông báo lỗi đỏ (Toast Error) để user thử lại (Retry).

Click backdrop khi đang sửa dở

Hiện Confirm Dialog chặn thoát.

Sửa giá trị Stock của biến thể nhưng quên bật Manage Stock

Backend sẽ lưu giá trị Stock đó nhưng field manageStock (nếu có ở level variant) hoặc logic hiển thị sẽ khiến số này không có tác dụng. -> Frontend nên auto-check "Manage Stock" nếu user cố nhập số lượng.

5. DEV CHECKLIST

[ ] Frontend: Implement logic Auto-sync Stock -> Status.

[ ] Frontend: Implement Dirty Check chặn đóng Dialog.

[ ] Frontend: Responsive: Dùng Sheet cho Mobile view.

[ ] Backend: Thêm logic ghi Audit Log.

[ ] Backend: Kiểm tra lại logic onbackorder để tránh bị logic auto-sync ghi đè sai.