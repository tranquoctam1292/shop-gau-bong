DEEP REVIEW: SMART SKU IMPLEMENTATION PLAN (UPDATED)

Ngày review: 2025-12-15
Đối tượng: SMART_SKU_IMPLEMENTATION_PLAN.md
Trạng thái: ✅ Đã sẵn sàng (với một số lưu ý nhỏ về logic chi tiết)

1. PHÂN TÍCH LOGIC CỐT LÕI (CORE LOGIC DEEP DIVE)

⚠️ A. Xung đột Logic giữa "Duplicate Check" và "Atomic Increment"

Vấn đề:
Trong mục Core Logic #3 (Duplicate Handling) và #4 (Increment Handling) đang có sự chồng chéo logic:

Mục 3 mô tả quy trình: Tạo SKU -> Check DB -> Nếu trùng thì Increment & Retry.

Mục 4 mô tả quy trình: Dùng skuCounters để lấy số Atomic ngay từ đầu.

Rủi ro:
Nếu Pattern có chứa {INCREMENT}, việc thực hiện "Check DB" trước khi lấy Counter là thừa thãi và có thể gây lỗi logic. Ví dụ: Nếu Counter đang là 100, mà logic lại đi scan DB xem có ai dùng 100 chưa thì sẽ chậm. Counter sinh ra là để đảm bảo duy nhất (về mặt lý thuyết).

Đề xuất tinh chỉnh (Quan trọng):
Cần chia tách logic sinh SKU thành 2 luồng rõ ràng dựa trên Pattern:

Luồng 1: Pattern CÓ chứa {INCREMENT}

B1: Parse các token tĩnh (Category, Name...).

B2: Tạo counterKey (ví dụ: CAT-AO-THUN).

B3: Gọi skuCounters.findOneAndUpdate({key: counterKey}, {$inc: {sequence: 1}}) để lấy số tiếp theo.

B4: Ghép số vào SKU -> Ra SKU cuối cùng (VD: CAT-AO-THUN-001).

B5: (Optional) Check sku_normalized index lần cuối để bắt trường hợp hãn hữu (manual insert). Không cần vòng lặp Retry phức tạp.

Luồng 2: Pattern KHÔNG chứa {INCREMENT}

B1: Parse token -> Ra SKU gốc (VD: CAT-AO-THUN).

B2: Check sku_normalized trong DB.

B3: Nếu trùng -> Lúc này mới kích hoạt logic Fallback: Lấy Counter cho key CAT-AO-THUN và nối thêm suffix (VD: CAT-AO-THUN-01).

⚠️ B. Vấn đề "Live Preview" với số Increment

Vấn đề:
Mục UI Components đề cập đến "Live Preview" và "Auto-generate checkbox" cho Variants.
Nếu Pattern có chứa {INCREMENT}, giá trị preview hiển thị trên UI sẽ không bao giờ chính xác 100% cho đến khi bấm Save.

Lý do: Nếu User A và User B cùng mở form tạo sản phẩm, cả hai đều thấy preview là ...-005. Nhưng khi User A bấm Save, User A lấy số 005. User B bấm Save sau sẽ phải lấy số 006 (hoặc bị lỗi nếu không handle tốt).

Đề xuất:
Trong UI Preview, đối với token {INCREMENT}, KHÔNG hiển thị con số thực tế đang chờ.

Thay vào đó, hiển thị placeholder: AT-001-### hoặc AT-001-<SEQ>.

Thêm ghi chú nhỏ: "Số thứ tự thực tế sẽ được gán khi lưu sản phẩm để đảm bảo không trùng lặp."

2. RÀ SOÁT CẤU TRÚC DỮ LIỆU (SCHEMA AUDIT)

skuCounters Collection

Current: { key: string, sequence: number }

Deep Dive: key được định nghĩa là "base SKU without increment".

Kịch bản biên: Nếu Admin đổi Pattern từ {CAT}-{NAME}-{INCREMENT} sang {CAT}-{YEAR}-{INCREMENT}, thì key sẽ thay đổi. Counter sẽ bị reset về 1 cho pattern mới.

Đánh giá: Điều này là Hợp lý. Nếu đổi pattern, chuỗi số nên reset. Logic này ổn, không cần sửa.

skuHistory Collection

Thiếu: Field patternSnapshot.

Lý do: Khi truy vết lịch sử, đôi khi cần biết SKU cũ đó được sinh ra từ Pattern nào để debug.

Đề xuất: Thêm patternUsed: string vào history (nếu cần thiết, low priority).

3. KẾ HOẠCH MIGRATION (MIGRATION STRATEGY)

Kế hoạch hiện tại đã thêm field code bắt buộc cho Category, nhưng chưa đề cập chi tiết cách xử lý dữ liệu cũ (Legacy Data).

Cần bổ sung Script Migration:

Bước 1: Quét tất cả Categories đang có code: null/undefined.

Bước 2: Generate code tự động từ name (Slugify + Uppercase).

Bước 3: Kiểm tra trùng lặp Code. Nếu trùng -> Thêm số đếm.

Bước 4: Update vào DB.

Lưu ý: Phải chạy script này trước khi deploy code mới yêu cầu code là bắt buộc.

4. CÁC TRƯỜNG HỢP BIÊN (EDGE CASES) BỊ BỎ SÓT

Xóa sản phẩm:

Khi xóa sản phẩm SKU-005, số 005 trong skuCounters không bị lùi lại (để tránh reuse ID gây nhầm lẫn lịch sử). Đây là behaviour đúng, nhưng cần note rõ trong document để Admin không thắc mắc "Tại sao nhảy số?".

Variants trùng thuộc tính:

User lỡ tay tạo 2 variants giống hệt nhau (VD: 2 cái đều Size L).

Logic ensureUniqueSku sẽ xử lý (cái sau thành -002), nhưng về mặt Business Logic của sản phẩm thì không nên cho phép 2 variants trùng nhau.

Check: Nên validate uniqueness của Variant Attributes trước khi gọi hàm sinh SKU.

5. TỔNG KẾT HÀNH ĐỘNG (ACTION ITEMS)

Dựa trên phân tích trên, bạn chỉ cần tinh chỉnh nhỏ trước khi code:

Refine Logic: Tách hàm generateSku thành 2 nhánh: HasIncrementToken (Dùng Counter luôn) và NoIncrementToken (Check DB -> Fallback).

Update UI Spec: Sửa lại mô tả Preview cho token Increment (hiển thị placeholder thay vì số thật).

Add Migration Task: Viết script migrate data cho Category Code.

Validation: Thêm validate duplicate variants ở Frontend/Backend trước khi sinh SKU.

Kết luận: Bản kế hoạch đạt 9.5/10. Các vấn đề trên là tiểu tiết kỹ thuật (implementation details) chứ không phải lỗi thiết kế hệ thống.