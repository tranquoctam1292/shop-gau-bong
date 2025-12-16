BÁO CÁO KIỂM THỬ MÃ NGUỒN: MODULE QUẢN LÝ TÀI KHOẢN ADMIN (RBAC)

Ngày tạo: 13/12/2025
Cập nhật lần cuối: 13/12/2025 (Review chuyên sâu - Lần 3)
Đối tượng: Đội ngũ phát triển dự án Website
Phạm vi: Module Authentication, Authorization, User Management (RBAC)

1. 🔴 Lỗi Nghiêm Trọng (Critical) - Cần Xử Lý Ngay

Những vấn đề này ảnh hưởng trực tiếp đến bảo mật và khả năng vận hành của hệ thống.

Vị trí (File)

Vấn đề

Giải thích & Rủi ro

Giải pháp đề xuất

lib/middleware/authMiddleware.ts

Deadlock Đổi mật khẩu

Middleware chặn tất cả request nếu must_change_password=true, bao gồm cả API /change-password. User mới bị kẹt vĩnh viễn không thể đổi pass.

Sửa Middleware: Thêm ngoại lệ (bypass) cho route /api/admin/auth/change-password và /auth/logout.

app/admin/layout.tsx

Logic Chặn Quyền Sai

Code check role !== 'admin'. Hệ thống mới dùng SUPER_ADMIN... 👉 Toàn bộ Admin bị chặn truy cập Dashboard.

Sửa logic: Check !Object.values(AdminRole).includes(user.role).

scripts/migrate-users-to-admin-users.ts

Migration Lockout

User cũ (VD: đăng nhập Google) khi migrate sẽ không có password hash. Hệ thống bắt buộc Login -> Đổi pass. 👉 User cũ không thể login để đổi pass.

Cập nhật Script: Gán password mặc định ngẫu nhiên cho user migrate và xuất ra file log để Super Admin gửi cho họ.

lib/authOptions.ts

Hardcoded Secret Risk

Fallback dev-secret... hoạt động cả trên production nếu thiếu env var. 👉 Hacker có thể giả mạo Token Admin.

Bắt buộc: Xóa fallback string. throw Error ngay lập tức nếu thiếu NEXTAUTH_SECRET.

2. 🟡 Lỗi Logic & Hiệu Năng (Logic & Performance Bugs)

Audit Log "LOGOUT" bị mất (app/admin/layout.tsx):

Vấn đề: Nút "Đăng xuất" chỉ gọi signOut (NextAuth) client-side mà không gọi API /api/admin/auth/logout.

Hậu quả: Hành động đăng xuất không bao giờ được ghi vào Database Log.

Giải pháp: Trong hàm handleLogout, gọi fetch('/api/admin/auth/logout') trước khi gọi signOut.

Frontend Search Spam (app/admin/users/page.tsx):

Vấn đề: Gõ 1 ký tự = 1 request API. Chưa có debounce.

Giải pháp: Dùng hook useDebounce cho biến search.

Lỗi UX Filter Sync (app/admin/users/page.tsx):

Vấn đề: Bấm nút Back/Forward trình duyệt, URL thay đổi nhưng Filter trên UI không cập nhật theo.

Giải pháp: Thêm useEffect lắng nghe searchParams để cập nhật lại State (setSearch, setRoleFilter...).

3. 🔵 Lỗi UX/UI (User Experience)

Giao diện Phân quyền gây nhầm lẫn (UserForm.tsx):

Vấn đề: Không hiển thị quyền mặc định của Role. Admin dễ tích chọn dư thừa.

Giải pháp: Hiển thị quyền mặc định dạng disabled & checked.

Middleware chặn Logout:

Vấn đề: Nếu must_change_password=true, middleware trả về 403 cho mọi route, có thể chặn cả API Logout (nếu được gọi). User muốn thoát ra để đăng nhập tài khoản khác cũng khó.

4. 📥 Kế hoạch Hành động (Action Plan) - Cập Nhật

Bước 1: Fix Blocker (Quan trọng nhất)

Sửa Deadlock: Mở khóa route đổi mật khẩu trong Middleware.

Sửa Layout: Fix check role để vào được Dashboard.

Fix Security: Xóa fallback secret và cập nhật script migration.

Bước 2: Logic & Audit

Fix Logout Log: Gọi API logout trước khi sign out.

Hợp nhất Login Flow: Fix lỗi login kép và rate limit RAM.

Bước 3: UX & Clean up

Debounce Search & Sync Filter: Tối ưu trang danh sách user.

UI Polish: Cải thiện form phân quyền.

Báo cáo được tổng hợp dựa trên mã nguồn phiên bản 1.2