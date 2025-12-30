Sau khi rà soát hệ thống kiến trúc của module quản lý tài khoản và luồng đăng nhập (Authentication & RBAC), tôi đã phát hiện một số vấn đề về an ninh và logic cần được xử lý ngay để đảm bảo tính toàn vẹn của hệ thống.
1. Rủi ro bảo mật: Bypass Rate Limiting tại luồng Đăng nhập
Trong @app/api/admin/auth/login/route.ts, chúng ta đã triển khai checkRateLimit dựa trên MongoDB để chặn Brute Force. Tuy nhiên, luồng đăng nhập hiện tại đang bị dư thừa và hổng:
Vấn đề: File @app/admin/login/page.tsx gọi /api/admin/auth/login trước để kiểm tra giới hạn, sau đó mới gọi signIn('credentials', ...) của NextAuth. Kẻ tấn công có thể gọi trực tiếp endpoint mặc định của NextAuth là /api/auth/callback/credentials để bỏ qua hoàn toàn lớp bảo vệ rate limit này.
Đánh giá tác động: Cao. Kẻ tấn công có thể thực hiện tấn công dò mật khẩu mà không bị chặn bởi rateLimits collection.
Giải pháp: Chuyển logic checkRateLimit vào trong hàm authorize của @lib/authOptions.ts.
2. Vấn đề Logic: Thu hồi Token (Token Revocation) và Cache
Hệ thống sử dụng token_version để đăng xuất từ xa (V1.2).
Vấn đề: Trong @lib/authOptions.ts, hàm getUserStatus sử dụng userStatusCache (Map) với TTL 2 phút. Nếu một Admin bị khóa tài khoản (is_active: false) hoặc bị đổi token_version do đổi mật khẩu, họ vẫn có thể truy cập hệ thống trong tối đa 120 giây tiếp theo nếu cache chưa hết hạn.
Tác động: Trung bình. Trong các trường hợp khẩn cấp (xóa tài khoản nhân viên nghỉ việc), độ trễ 2 phút có thể là rủi ro.
Files bị ảnh hưởng: @lib/authOptions.ts, @lib/utils/tokenRevocation.ts.
Hướng xử lý: Cần gọi invalidateUserStatusCache tại tất cả các route có thay đổi trạng thái user:
@app/api/admin/users/[id]/route.ts (Khi DELETE hoặc PUT thay đổi is_active).
@app/api/admin/auth/change-password/route.ts.
3. Lỗi tiềm ẩn tại trang Reset Password (Client Component)
Tại file @app/admin/users/[id]/reset-password/page.tsx:
Vấn đề: Code hiện tại sử dụng useParams để lấy userId nhưng trong logic xử lý lỗi hoặc khi không có dữ liệu, nó chưa kiểm tra kỹ tính hợp lệ của userId trước khi thực hiện fetch.
Lỗi đồng bộ: Endpoint /api/admin/users/[id]/reset-password yêu cầu quyền SUPER_ADMIN. Tuy nhiên, nếu một user có quyền admin:manage nhưng không phải SUPER_ADMIN truy cập vào UI, họ sẽ thấy form nhưng khi submit mới nhận lỗi 403.
Hướng xử lý: Thêm kiểm tra vai trò ngay tại tầng UI của trang để ẩn/hiện nội dung phù hợp với PermissionGuard.
4. Kiểm tra các quy tắc thiết kế (Architectural Safety)
XSS Protection: Module account đã tuân thủ tốt việc không render dữ liệu người dùng trực tiếp. Tuy nhiên, full_name cần được sanitize nếu hiển thị ở các bảng tổng hợp.
Optimistic Locking: Trường version trong @app/api/admin/users/[id]/route.ts chưa được áp dụng triệt để như module Product. Nếu hai SUPER_ADMIN cùng sửa quyền cho một user cùng lúc, sẽ xảy ra tình trạng "Last write wins".
📋 Danh sách file cần sửa đổi đồng bộ:
@lib/authOptions.ts: Di chuyển logic checkRateLimit từ API login vào hàm authorize.
@app/api/admin/users/[id]/route.ts: Thêm gọi invalidateUserStatusCache khi thay đổi trạng thái is_active.
@app/api/admin/auth/login/route.ts: Xóa bỏ hoặc đơn giản hóa endpoint này chỉ còn nhiệm vụ log activity, vì xác thực chính nằm ở NextAuth.
@app/api/admin/auth/change-password/route.ts: Đảm bảo token_version được tăng lên trước khi trả về response thành công.
✅ Kết luận:
Module quản lý tài khoản có cấu trúc RBAC rất chặt chẽ và luồng thu hồi token (V1.2) là một điểm sáng về bảo mật. Tuy nhiên, việc tách rời giữa API login tùy chỉnh và NextAuth tạo ra kẽ hở cho tấn công Brute Force. Cần hợp nhất logic kiểm soát tần suất truy cập vào lõi của NextAuth.