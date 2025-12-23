BÁO CÁO NGHIỆM THU & RÀ SOÁT SÂU MODULE PRODUCT (CMS ADMIN)

Ngày cập nhật: 14/12/2025 (Phiên bản v5 - Deep Code Review)
Trạng thái Code: Sẵn sàng cho Beta (Ready for Beta) - Core Logic ổn định.
Tiêu điểm: Rà soát từng dòng code (Line-by-line check) để tìm lỗi ẩn.

1. Kết quả Rà soát Từng bước (Step-by-Step Review)

Tôi đã giả lập luồng đi của dữ liệu để kiểm tra các điểm gãy (fail points):

Bước 1: Admin mở form & Nhập liệu (Frontend)

Check: Slug Generation.

Code: useEffect lắng nghe name và chỉ chạy khi !isEditMode.

Đánh giá: An toàn. Link SEO cũ không bị thay đổi khi sửa tên.

Check: Validate Client-side (Zod Resolver).

Code: form.handleSubmit chặn ngay nếu salePrice >= price.

Đánh giá: Tốt. UX phản hồi tức thì, không cần đợi server.

Bước 2: Gửi dữ liệu về Server (Server Actions)

Check: createProduct / updateProduct trong lib/actions/product.ts.

Vấn đề phát hiện: Thiếu Sanitize HTML.

Chi tiết: Dữ liệu từ RichTextEditor (mô tả sản phẩm) được lưu thẳng vào DB. Nếu Admin bị hack cookie hoặc copy-paste mã độc, mã này sẽ nằm trong DB (Stored XSS).

Action: Cần dùng thư viện isomorphic-dompurify để làm sạch field description và content ngay tại server action trước khi db.product.create.

Bước 3: Tương tác Database (Prisma/DB)

Check: Transaction Safety.

Vấn đề phát hiện: Không dùng Transaction cho thao tác phức tạp.

Chi tiết: Khi tạo sản phẩm (createProduct), code đang lưu thông tin cơ bản -> sau đó lưu Images -> sau đó lưu Tags. Nếu bước lưu Images lỗi, ta sẽ có một sản phẩm rác không có ảnh trong DB (Data Inconsistency).

Action: Bọc toàn bộ logic tạo/sửa trong db.$transaction(...).

Bước 4: Phản hồi & Cache (Revalidation)

Check: revalidatePath.

Code: revalidatePath('/admin/products').

Vấn đề phát hiện: Thiếu Revalidate trang chi tiết.

Chi tiết: Khi sửa giá sản phẩm, trang Admin cập nhật giá mới, nhưng trang khách hàng (/product/[slug]) vẫn hiện giá cũ do Next.js cache cứng (Full Route Cache).

Action: Cần thêm revalidatePath(\/products/${slug}`)` (đường dẫn public) vào cuối hàm update.

2. Bảng Tổng hợp Lỗi Tồn Đọng & Mới (Cập nhật v5)

STT

Phân loại

Vấn đề

Mức độ

Trạng thái Code

Giải pháp Kỹ thuật

1

Security

Thiếu HTML Sanitization (Mới)

High

❌ Missing

Import isomorphic-dompurify. Gọi JSDOMPurify.sanitize(data.content) trong Server Action.

2

Stability

Thiếu DB Transaction (Mới)

Medium

❌ Missing

Dùng await db.$transaction(async (tx) => { ... }) để đảm bảo All-or-Nothing.

3

Logic

Bulk Actions (Xóa nhiều)

Medium

⚠️ Incomplete

UI có checkbox nhưng thiếu Server Action deleteProducts (số nhiều). Tránh gọi loop deleteProduct ở Client.

4

Cache

Stale Data (Public View)

Medium

❌ Missing

Thêm revalidatePath('/products/[slug]') sau khi update.

5

Cleanup

Ảnh rác (Orphan Images)

Low

❌ Missing

(Giữ nguyên từ v4) Cần Cron Job dọn dẹp Cloudinary.

6

Logic

Soft Delete

Critical

✅ Fixed

Đã dùng status: 'ARCHIVED'.

3. Snippet Code Fix (Bổ sung cho v5)

3.1. Fix Security & Transaction (Tại lib/actions/product.ts)

import DOMPurify from "isomorphic-dompurify";

export async function createProduct(data: ProductInput) {
  // 1. RBAC Check
  const session = await auth();
  if (session?.user?.role !== "ADMIN") throw new Error("Unauthorized");

  // 2. Sanitize HTML để chống XSS
  const cleanContent = DOMPurify.sanitize(data.content);
  const cleanDescription = DOMPurify.sanitize(data.description);

  try {
    // 3. Sử dụng Transaction để đảm bảo toàn vẹn dữ liệu
    await db.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          ...data,
          content: cleanContent,       // Dữ liệu sạch
          description: cleanDescription, // Dữ liệu sạch
          // Xử lý relation an toàn trong transaction
          images: {
            create: data.images.map((img) => ({ url: img.url, ... }))
          }
        }
      });
      
      // Nếu có logic phụ khác, viết tiếp tại đây
    });

    revalidatePath('/admin/products');
    return { success: true };
  } catch (error) {
    console.error("Transaction failed:", error);
    return { error: "Lỗi tạo sản phẩm" };
  }
}


3.2. Fix Cache Revalidation

export async function updateProduct(id: string, data: ProductInput) {
  // ... logic update
  
  // Clear cache admin (để thấy list mới)
  revalidatePath('/admin/products');
  
  // Clear cache trang public (để khách hàng thấy giá mới ngay)
  // Lưu ý: Cần lấy slug mới nhất của sản phẩm để clear đúng path
  revalidatePath(`/products/${updatedProduct.slug}`); 
  
  return { success: true };
}


4. Kết luận Review v5

So với lần review trước, lần này tôi đi sâu vào độ ổn định khi vận hành thực tế.

Việc thiếu Transaction có thể không gây lỗi ngay, nhưng khi hệ thống tải cao, nó sẽ tạo ra dữ liệu rác (sản phẩm mất ảnh, mất tag).

Việc thiếu Sanitize là rủi ro bảo mật tiềm ẩn.

Khuyến nghị: Đội Dev cần apply ngay fix 3.1 và 3.2 trước khi release.