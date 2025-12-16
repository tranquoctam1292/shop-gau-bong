BÁO CÁO PHÂN TÍCH LỖI VÀ TỐI ƯU HÓA MODULE PRODUCT (CMS ADMIN)

Ngày báo cáo: 13/12/2025 (Cập nhật lần 3 - Deep Dive)
Đối tượng: Đội ngũ phát triển (Dev Team)
Trạng thái: Cần xử lý gấp

1. Lỗi Logic & Validation (Nghiêm trọng)

Các lỗi này ảnh hưởng trực tiếp đến tính toàn vẹn dữ liệu và quy trình nghiệp vụ.

STT

Vị trí (File)

Loại lỗi

Mô tả chi tiết

Đề xuất giải pháp (Solution)

Mức độ

1

lib/validations/product.ts

Logic Giá bán

Schema Zod hiện tại chỉ kiểm tra min(0) cho price và salePrice. Chưa có logic chặn việc salePrice (giá khuyến mãi) cao hơn price (giá gốc).

Sử dụng .refine() của Zod để so sánh: salePrice < price. Nếu salePrice >= price, báo lỗi tại field salePrice.

High

2

components/.../product-form.tsx

Slug Generation

Logic tạo Slug tự động từ Tên sản phẩm (Name) có thể gây trùng lặp (Duplicate Key Error) trong Database nếu 2 sản phẩm có tên giống nhau.

Cần thêm hàm checkSlugExist ở server action hoặc thêm hậu tố random (shortid) nếu slug đã tồn tại. Ví dụ: gau-bong-teddy-ax8z.

High

3

components/.../product-form.tsx

Dirty Check

Khi ở chế độ Edit, nếu admin không thay đổi gì mà bấm "Lưu", hệ thống vẫn gửi request update không cần thiết.

Kiểm tra form.formState.isDirty trước khi enable nút Submit hoặc trước khi gọi API update.

Medium

4

lib/actions/product.ts

Xử lý Ảnh rác

Khi Admin upload ảnh lên Cloudinary/Firebase nhưng sau đó hủy tạo sản phẩm (Cancel) hoặc xóa ảnh khỏi form, ảnh vẫn tồn tại trên Storage (Orphan files).

Cần implement Cron Job quét ảnh rác hoặc trigger xóa ảnh trên Storage ngay khi xóa khỏi UI (cần cân nhắc kỹ UX).

Medium

5

app/.../products/page.tsx

Pagination Logic

Nếu user đang ở trang 5, sau đó filter/search ra kết quả ít hơn 1 trang, UI có thể vẫn giữ query param page=5 dẫn đến trang trắng.

Reset page về 1 mỗi khi thay đổi bộ lọc (Search, Category Filter).

Medium

6

lib/actions/product.ts

Hard Delete (Mới)

Hành động deleteProduct hiện tại đang xóa cứng (xóa hẳn khỏi DB). Điều này sẽ gây lỗi Foreign Key Constraint nếu sản phẩm đã từng có trong Orders (Lịch sử đơn hàng).

Bắt buộc chuyển sang Soft Delete (thêm cột deletedAt hoặc status: 'ARCHIVED'). Không xóa record để bảo toàn lịch sử giao dịch.

Critical

7

lib/actions/product.ts

RBAC check (Mới)

Server Action chưa kiểm tra quyền hạn kỹ càng. User thường nếu biết API endpoint có thể gửi request tạo/sửa sản phẩm.

Thêm middleware check role === 'ADMIN' ngay đầu hàm Server Action.

High

8

components/.../product-form.tsx

Broken Link / SEO (Mới)

Khi sửa "Tên sản phẩm", code tự động regenerate lại slug. Điều này làm chết link cũ (404) đã được Google index hoặc khách hàng đã lưu bookmark.

Logic Slug: Chỉ tự động tạo slug khi tạo mới (create). Khi edit, không tự động đổi slug theo tên trừ khi Admin chủ đích bấm nút "Regenerate".

High

9

lib/actions/product.ts

Draft Leak (Mới)

API lấy chi tiết sản phẩm (Public API) có thể chưa lọc status: 'ACTIVE'. Khách có thể mò ra sản phẩm chưa ra mắt nếu đoán được Slug/ID.

Tại hàm getProductBySlug (public), bắt buộc thêm điều kiện where: { status: 'ACTIVE' }.

High

2. Lỗi UI/UX (Trải nghiệm người dùng)

Các vấn đề khiến Admin khó thao tác hoặc dễ nhầm lẫn.

STT

Thành phần

Mô tả vấn đề

Giải pháp UX

1

Image Uploader

Không có tính năng kéo thả (Drag & Drop) để sắp xếp thứ tự ảnh (ảnh bìa, ảnh chi tiết).

Tích hợp dnd-kit hoặc react-beautiful-dnd vào component upload ảnh để cho phép Admin chọn ảnh đại diện dễ dàng.

2

Price Input

Input giá tiền đang là dạng type="number", khó nhìn với các số lớn (vd: 10000000).

Sử dụng react-number-format hoặc component custom để hiển thị phân cách hàng nghìn (10.000.000 đ) ngay khi nhập.

3

Loading State

Khi bấm nút "Delete" sản phẩm ở trang danh sách, không có loading indicator trên nút hoặc row, admin dễ bấm nhiều lần.

Thêm state isDeleting cho từng row hoặc disable nút delete trong quá trình gọi API.

4

Error Toast

Thông báo lỗi từ Server Action thường chung chung (ví dụ: "Something went wrong").

Cần parse error message từ catch block và hiển thị cụ thể (vd: "Tên sản phẩm đã tồn tại").

5

Rich Text Editor

Editor load ảnh trực tiếp Base64 gây nặng payload.

Cấu hình Editor upload ảnh lên Server lấy URL thay vì lưu Base64.

6

Audit Log (Mới)

Không biết ai đã sửa giá/tồn kho vào lúc nào. Rất nguy hiểm nếu có nhiều nhân viên quản lý.

Thêm tab "Lịch sử hoạt động" trong trang chi tiết sản phẩm (hiển thị: Người sửa, Trường thay đổi, Thời gian).

7

SEO Image Alt (Mới)

Component upload ảnh hiện tại chỉ lưu URL, không cho nhập alt text.

Thêm input nhỏ bên dưới mỗi ảnh thumbnail để nhập Alt Text cho SEO hình ảnh.

8

Bulk Actions (Mới)

Thiếu chức năng chọn nhiều dòng để Xóa/Ẩn hàng loạt. Rất cực nếu muốn ẩn 50 sản phẩm cùng lúc.

Thêm Checkbox column vào Table và thanh Action Bar (Delete All, Publish All) khi có dòng được chọn.

3. Phân tích Hiệu năng & Bảo mật (Nâng cao)

Vấn đề

Hiện trạng

Rủi ro

Giải pháp

Rerender Form

Sử dụng useForm với mode: "onChange".

Lag khi nhập liệu form dài.

Chuyển mode sang "onBlur".

Data Fetching

Trang danh sách fetch cả description.

Chậm tải trang.

Chỉ select fields cần thiết.

XSS Attack

dangerouslySetInnerHTML không sanitize.

Script injection từ mô tả sản phẩm.

Sử dụng dompurify.

Race Condition

Không có locking khi edit đồng thời.

Mất dữ liệu sửa đổi (Last write wins).

Thêm cơ chế Optimistic Locking (dùng field version hoặc updatedAt).

Dirty Style (Paste) (Mới)

Paste text từ MS Word/Google Doc vào Editor mang theo hàng tá inline-style rác.

Gây vỡ layout trang chi tiết (Product Detail) trên Mobile.

Cấu hình pasteRules cho Editor để strip (loại bỏ) các style không cần thiết, chỉ giữ thẻ h1, h2, b, i, p.

4. Snippet Code Fix (Đề xuất Bổ sung)

4.1. Fix Zod Validation (Giá bán)

File: lib/validations/product.ts

export const productSchema = z.object({
  // ...
  price: z.coerce.number().min(0),
  salePrice: z.coerce.number().min(0).optional(),
}).refine((data) => {
  if (data.salePrice && data.salePrice >= data.price) {
    return false;
  }
  return true;
}, {
  message: "Giá khuyến mãi phải nhỏ hơn giá gốc",
  path: ["salePrice"],
});


4.2. Logic Slug (Không tự đổi khi Edit)

File: components/admin/products/product-form.tsx

// Trong useEffect theo dõi name
useEffect(() => {
  // Chỉ auto-generate slug khi đang ở chế độ TẠO MỚI
  if (!initialData && nameValue) {
    const slug = slugify(nameValue);
    form.setValue("slug", slug);
  }
  // Nếu đang Edit, KHÔNG làm gì cả để tránh đổi URL cũ
}, [nameValue, initialData]);


4.3. Implement Soft Delete

File: lib/actions/product.ts

export async function deleteProduct(id: string) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") throw new Error("Unauthorized");

  try {
    await db.product.update({
      where: { id },
      data: {
        status: "ARCHIVED",
        deletedAt: new Date()
      }
    });
    revalidatePath('/admin/products');
    return { success: true };
  } catch (error) {
    return { error: "Lỗi hệ thống khi xóa sản phẩm." };
  }
}


5. Kết luận (Cập nhật)

Trong lần review thứ 3 này, tôi nhấn mạnh vào vấn đề SEO (Slug không được tự đổi) và Bảo mật dữ liệu (Audit Log + Soft Delete).

Code hiện tại đang quá "ngây thơ" khi cho phép sửa Tên sản phẩm -> Tự đổi Slug. Đây là lỗi phổ biến nhất khiến website bị rớt hạng Google sau một thời gian vận hành. Đội Dev cần fix ngay logic này tại Frontend (product-form.tsx).