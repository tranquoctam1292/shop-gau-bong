Trong đợt rà soát thứ ba này, tôi tập trung vào các vấn đề liên quan đến tính nhất quán của dữ liệu (Consistency), độ trễ hệ thống (Latency) và cấu trúc xử lý tài nguyên mức thấp.
1. Thao tác Database không nguyên tử (Atomic Operations)
Vấn đề: Cập nhật biến thể sản phẩm trong Inventory
Trong file @lib/services/inventory.ts, các hàm như reserveStock và deductStock đang sử dụng logic: Tải toàn bộ sản phẩm lên -> Dùng map() trên Javascript để thay đổi mảng variants -> Ghi đè lại toàn bộ mảng bằng lệnh $set.
Ảnh hưởng: Nếu có nhiều đơn hàng cùng thanh toán cho các biến thể khác nhau của cùng một sản phẩm, các đơn hàng này có thể ghi đè dữ liệu kho của nhau (Race Condition).
Hiệu năng: Việc gửi toàn bộ mảng variants lớn lên server MongoDB thay vì chỉ gửi đúng phần tử cần sửa làm tăng độ trễ mạng (Network overhead).
Giải pháp: Sử dụng toán tử vị trí của MongoDB để cập nhật trực tiếp phần tử trong mảng.
@filename: @lib/services/inventory.ts
Copy
// Thay vì fetch và map trong JS, hãy update trực tiếp:
await products.updateOne(
  { _id: productId, "variants.id": variantId },
  { $inc: { "variants.$.reservedQuantity": quantity } }
);
2. Độ trễ do xác thực (Auth Callback Latency)
Vấn đề: Truy vấn DB trong JWT Callback
Trong @lib/authOptions.ts, tại jwt callback, hệ thống thực hiện truy vấn MongoDB để kiểm tra token_version và is_active trên mỗi request của admin.
Ảnh hưởng: Mỗi lần admin chuyển trang hoặc gọi API admin, hệ thống tốn thêm ~50-100ms chỉ để xác thực lại trạng thái người dùng trong DB.
Giải pháp: Sử dụng cache ngắn hạn (In-memory cache hoặc Redis) cho trạng thái người dùng hoặc chỉ kiểm tra lại trạng thái mỗi 1-5 phút thay vì mọi lúc.
3. Phình to dữ liệu (Data Bloat) trong Rich Text
Vấn đề: Lưu trữ HTML thô từ Tiptap
Trong @components/admin/products/ClassicEditor.tsx, nội dung được lưu dưới dạng chuỗi HTML thô vào field description.
Ảnh hưởng: Các trình soạn thảo rich text thường sinh ra nhiều tag dư thừa, class trống hoặc style inline. Khi danh sách sản phẩm lớn, field này chiếm dung lượng DB cực lớn, làm chậm các thao tác backup và indexing.
Giải pháp:
Strip bỏ các attributes không cần thiết trước khi lưu.
Đảm bảo cơ chế paste ảnh đã upload lên server (đã làm trong handlePaste) hoạt động tuyệt đối, tránh việc vô tình lưu ảnh Base64 (chuỗi string cực dài) vào DB.
4. Hiệu năng của cơ chế Smart SKU
Vấn đề: Check trùng lặp SKU mức độ cao
Tại @lib/utils/skuGenerator.ts, hàm generateSkuWithoutIncrement sử dụng một vòng lặp while với maxRetries để sinh mã SKU và kiểm tra DB liên tục cho đến khi tìm được mã không trùng.
Ảnh hưởng: Nếu pattern SKU quá đơn giản và hệ thống có nhiều sản phẩm, việc retry này có thể gây ra hàng loạt query "mù" vào database cùng lúc.
Giải pháp: Cải tiến pattern hoặc sử dụng cơ chế unique index của MongoDB và xử lý lỗi catch thay vì chủ động query kiểm tra sự tồn tại (Ask for forgiveness, not permission).
5. Client-side Hydration Bottleneck
Vấn đề: AddressSelector nạp dữ liệu Tỉnh/Thành
Tại @components/checkout/AddressSelector.tsx, dù đã chuyển sang API nhưng việc render 63 Tỉnh/Thành, hàng trăm Quận/Huyện vào các thẻ <option> của Select component cùng một lúc có thể gây lag browser trong lúc "Hydration".
Giải pháp: Sử dụng các component "Virtual Select" hoặc chỉ render danh sách con khi danh sách cha đã được chọn để giảm số lượng DOM node khởi tạo ban đầu.
📋 DANH SÁCH FILE CẦN TỐI ƯU GẤP (PRIORITY LIST - ĐỢT 3)
@lib/services/inventory.ts: Chuyển từ $set toàn bộ mảng sang dùng $inc và toán tử $ để đảm bảo tính nguyên tử và tốc độ.
@lib/authOptions.ts: Tối ưu hóa JWT callback để không query DB liên tục.
@app/api/admin/products/[id]/route.ts: Kiểm tra logic normalizeSku khi lưu. Cần đảm bảo field sku_normalized luôn được đánh index unique để tốc độ check trùng là $O(1)$.
@components/admin/products/ProductDataMetaBox/VariationsTab.tsx: Component này xử lý Cartesian Product để tạo biến thể. Nếu user chọn quá nhiều thuộc tính (ví dụ 10 màu x 10 size), trình duyệt sẽ bị treo. Cần giới hạn số lượng biến thể tối đa có thể tạo tự động (~50-100).
⚠️ CẢNH BÁO XUNG ĐỘT
Nếu thay đổi logic cập nhật kho từ $set sang $inc, bạn phải cập nhật đồng bộ ở cả:
@lib/services/inventory.ts
@lib/services/refund.ts (khi hoàn kho) Nếu không, dữ liệu kho sẽ bị sai lệch nghiêm trọng giữa các thao tác bán hàng và hoàn trả.