BÁO CÁO KIỂM TRA & ĐÁNH GIÁ MÃ NGUỒN FRONTEND (DEEP CODE REVIEW)

Ngày thực hiện: 14/12/2025
Phạm vi: Các component hiển thị sản phẩm (ProductCard, ProductInfo, ProductFilters, ProductList) và logic xử lý (Hooks, Utils).
Mức độ nghiêm trọng: Cao (Có lỗi logic ảnh hưởng đến đơn hàng).

1. TỔNG QUAN (EXECUTIVE SUMMARY)

Mã nguồn được viết khá sạch sẽ, sử dụng các công nghệ hiện đại (Next.js App Router, Tailwind CSS, React Query, Zustand). Tuy nhiên, tồn tại một số lỗi logic nghiêm trọng (Critical Logic Bugs) liên quan đến quy trình thêm vào giỏ hàng và xử lý State bất đồng bộ của React.

Nếu không khắc phục, hệ thống sẽ gặp tình trạng:

Khách hàng thêm sản phẩm vào giỏ nhưng thiếu thuộc tính Size/Màu.

Sản phẩm biến thể (Variable Product) bị tính sai giá (lấy giá gốc thay vì giá biến thể).

Trải nghiệm người dùng (UX) bị gián đoạn do "nhảy giá" hoặc phản hồi chậm.

2. CÁC LỖI LOGIC NGHIÊM TRỌNG (CRITICAL BUGS) 🚨

2.1. Lỗi Async State Update trong ProductInfo.tsx (Nghiêm trọng nhất)

Mô tả:
Trong hàm handleAddToCartClick, logic tự động chọn Size đầu tiên nếu người dùng quên chọn đang bị sai nguyên lý hoạt động của React State. setState là bất đồng bộ, giá trị state mới không được cập nhật ngay lập tức trong cùng một scope hàm.

Đoạn mã lỗi:

// ProductInfo.tsx
if (product.type === 'variable' && availableSizes.length > 0 && !selectedSize) {
  if (availableSizes.length > 0) {
    setSelectedSize(availableSizes[0]); // (1) Trigger update state (Async)
    // Code tiếp tục chạy xuống dưới ngay lập tức mà KHÔNG chờ state cập nhật
  }
}

// (2) Tại đây, selectedSize vẫn là NULL (giá trị cũ)
const priceToUse = selectedVariation ? ... : ...; // Dẫn đến selectedVariation = undefined

await addToCart({
    // (3) Gửi lên server với tên sản phẩm thiếu size, hoặc variationId bị undefined
    productName: `${product.name} ${selectedSize ? `(${selectedSize})` : ''}`, 
    // ...
});


Hậu quả: Đơn hàng được tạo nhưng thiếu Size, kho không trừ đúng tồn kho của biến thể.

Giải pháp: Sử dụng biến cục bộ (local variable) để lưu giá trị size sẽ chọn, sau đó vừa set state vừa dùng biến đó để gọi hàm addToCart.

2.2. Lỗi Race Condition & Logic giá trong ProductCard.tsx

Mô tả:
Tính năng "Lazy Loading" variations (chỉ fetch khi hover) để tối ưu hiệu năng đang gây ra lỗi logic khi người dùng thao tác nhanh ("Quick Add").

Kịch bản lỗi:

Người dùng bấm nút "Thêm nhanh" (icon giỏ hàng) trên Mobile hoặc Desktop mà chưa kịp hover đủ lâu.

shouldFetchVariations chưa kịp kích hoạt hoặc API chưa trả về kịp.

variations rỗng -> selectedVariation là null.

Hàm handleQuickAdd chạy logic fallback: lấy giá của Product cha.

Hậu quả:
Sản phẩm biến thể được thêm vào giỏ với giá của sản phẩm cha (thường là giá min hoặc 0đ nếu chưa setup kỹ), thay vì giá cụ thể của variation.

Giải pháp:
Trong handleQuickAdd, nếu là variable product mà chưa có data variations, cần hiển thị loading hoặc chặn hành động cho đến khi fetch xong (hoặc mở Modal chọn nhanh).

3. LỖI UX/UI & VẤN ĐỀ HIỆU NĂNG ⚠️

3.1. Vấn đề "Flash of Wrong Price" (Nhảy giá)

Vị trí: ProductCard.tsx

Hiện tượng: Khi trang vừa load, variations chưa có -> Hiển thị giá Product gốc (VD: 0đ hoặc giá thấp nhất). Khi hover vào, variations load xong -> Giá cập nhật lại.

Đánh giá: Tạo cảm giác website bị lỗi hoặc thiếu chuyên nghiệp ("Glitchy").

3.2. Logic Filter Mobile/Desktop phức tạp & Dư thừa

Vị trí: ProductFilters.tsx

Vấn đề: Đang duy trì 2 bộ state riêng biệt cho Desktop (pricePopoverOpen) và Mobile (mobilePriceOpen). Logic xử lý đóng/mở và sync dữ liệu đang bị lặp lại (Duplication).

Rủi ro: Khó bảo trì (Maintainability). Nếu sửa logic ở Desktop dễ quên sửa ở Mobile.

3.3. Hardcoded Strings ("Magic Strings")

Vị trí: ProductCard.tsx, ProductInfo.tsx

Vấn đề: Các chuỗi so sánh attribute đang được hardcode trực tiếp:

attr.name.toLowerCase().includes('size') || 
attr.name.toLowerCase().includes('kích thước') ...


Rủi ro: Nếu Backend thay đổi slug attribute (VD: đổi từ "kích thước" sang "size_vn"), Frontend sẽ gãy logic hiển thị selector. Nên đưa vào file Constant config.

4. PHÂN TÍCH CHI TIẾT TỪNG FILE

components/product/ProductInfo.tsx

Logic tìm Variation: Logic matchedVariation đang lặp lại code từ ProductCard. Nên tách ra hook chung (VD: useVariationMatcher).

Quy tắc Hooks: Có đoạn check if (!product) return null nằm giữa các hooks (mặc dù hiện tại logic useProductVariations ở trên đã handle an toàn, nhưng về convention thì hơi rủi ro).

components/product/ProductCard.tsx

Nút Quick Add: Thiếu feedback loading UI khi bấm nút Quick Add (người dùng không biết hệ thống đang xử lý hay bị treo nếu mạng chậm).

Logic Variation: Logic so sánh variation.size === selectedSize có thể gặp lỗi nếu dữ liệu size từ Mongo chưa được trim() hoặc chuẩn hóa chữ hoa/thường.

lib/utils/productMapper.ts

Phức tạp: File này đang gánh quá nhiều trách nhiệm: map từ WooCommerce REST API, map từ MongoDB, và xử lý fallback logic.

Maintainability: Rất khó debug xem dữ liệu giá (Price) đang đến từ nguồn nào (Meta box, Variants array, hay fields gốc).

5. ĐỀ XUẤT CẢI THIỆN (ACTION PLAN)

Bước 1: Fix lỗi Critical (Ưu tiên P0)

Refactor handleAddToCartClick (ProductInfo): Tách logic auto-select size ra khỏi setState để đảm bảo dữ liệu gửi đi luôn đúng.

Fix handleQuickAdd (ProductCard): Thêm check: Nếu là Variable Product -> Bắt buộc mở Modal hoặc redirect vào trang chi tiết, KHÔNG cho add thẳng nếu chưa chọn variation cụ thể (tránh sai giá).

Bước 2: Tối ưu Code (P1)

Tạo Hook useProductPrice: Gom logic tính toán giá (displayPrice, isOnSale) và logic tìm variation (matchedVariation) vào một Custom Hook duy nhất để dùng chung cho cả Card và Info.

Centralize Constants: Đưa các từ khóa 'size', 'color', 'kích thước' vào lib/constants/attributes.ts.

Bước 3: Cải thiện UX (P2)

Product Card Skeleton: Thêm trạng thái loading nhẹ cho vùng giá khi đang fetch variation.

Unified Filters: Refactor ProductFilters để dùng chung logic state đóng mở popover (dùng Component tái sử dụng thay vì copy-paste code cho Mobile/Desktop).

Kết luận: Mã nguồn có nền tảng tốt nhưng cần patch ngay 2 lỗi logic tại ProductInfo và ProductCard để tránh thất thoát doanh thu hoặc sai lệch tồn kho.