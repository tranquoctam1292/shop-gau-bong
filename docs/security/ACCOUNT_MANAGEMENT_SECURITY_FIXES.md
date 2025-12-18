# 🔒 Account Management & Authentication Security Fixes

## 📋 Tổng quan vấn đề

Sau khi rà soát hệ thống kiến trúc của module quản lý tài khoản và luồng đăng nhập (Authentication & RBAC), đã phát hiện một số vấn đề về an ninh và logic cần được xử lý ngay để đảm bảo tính toàn vẹn của hệ thống.

---

## 🚨 VẤN ĐỀ 1: Rủi ro bảo mật - Bypass Rate Limiting tại luồng Đăng nhập

### Mô tả
Trong `app/api/admin/auth/login/route.ts`, đã triển khai `checkRateLimit` dựa trên MongoDB để chặn Brute Force. Tuy nhiên, luồng đăng nhập hiện tại đang bị dư thừa và hổng.

**Vấn đề:** File `app/admin/login/page.tsx` gọi `/api/admin/auth/login` trước để kiểm tra giới hạn, sau đó mới gọi `signIn('credentials', ...)` của NextAuth. Kẻ tấn công có thể gọi trực tiếp endpoint mặc định của NextAuth là `/api/auth/callback/credentials` để bỏ qua hoàn toàn lớp bảo vệ rate limit này.

**Đánh giá tác động:** 🔴 **CAO** - Kẻ tấn công có thể thực hiện tấn công dò mật khẩu mà không bị chặn bởi `rateLimits` collection.

### Giải pháp
Chuyển logic `checkRateLimit` vào trong hàm `authorize` của `lib/authOptions.ts` để đảm bảo rate limiting được áp dụng ở mọi luồng đăng nhập.

### Files cần sửa
- [x] `lib/authOptions.ts` - ✅ Đã di chuyển logic `checkRateLimit` vào hàm `authorize` (username-based rate limiting)
- [x] `app/api/auth/[...nextauth]/route.ts` - ✅ Đã đơn giản hóa, rate limiting được handle trong authorize function
- [x] `app/api/admin/auth/login/route.ts` - ✅ Đã cập nhật comment để giải thích 2 lớp rate limiting

**Trạng thái:** ✅ **ĐÃ SỬA**

### Giải pháp đã triển khai:
1. **Username-based rate limiting trong `authorize` function:**
   - Rate limit key: `login:global:{username}` (5 attempts / 15 minutes)
   - Được áp dụng cho mọi luồng đăng nhập, kể cả khi bypass `/api/admin/auth/login`
   - Reset rate limit khi login thành công
   - Trả về `null` khi rate limit exceeded (NextAuth sẽ trả về "Invalid credentials" - không reveal rate limit)

2. **IP-based rate limiting trong `/api/admin/auth/login`:**
   - Vẫn giữ nguyên để có lớp bảo vệ bổ sung
   - Rate limit key: `login:{ip}:{username}` (5 attempts / 15 minutes)

3. **Kết quả:**
   - Kẻ tấn công không thể bypass rate limiting bằng cách gọi trực tiếp `/api/auth/callback/credentials`
   - Rate limiting được enforce ở cả 2 lớp: IP-based và username-based

---

## ⚠️ VẤN ĐỀ 2: Token Revocation và Cache - Độ trễ 2 phút

### Mô tả
Hệ thống sử dụng `token_version` để đăng xuất từ xa (V1.2).

**Vấn đề:** Trong `lib/authOptions.ts`, hàm `getUserStatus` sử dụng `userStatusCache` (Map) với TTL 2 phút. Nếu một Admin bị khóa tài khoản (`is_active: false`) hoặc bị đổi `token_version` do đổi mật khẩu, họ vẫn có thể truy cập hệ thống trong tối đa 120 giây tiếp theo nếu cache chưa hết hạn.

**Đánh giá tác động:** 🟡 **TRUNG BÌNH** - Trong các trường hợp khẩn cấp (xóa tài khoản nhân viên nghỉ việc), độ trễ 2 phút có thể là rủi ro.

### Giải pháp
Cần gọi `invalidateUserStatusCache` tại tất cả các route có thay đổi trạng thái user.

### Files cần sửa
- [x] `app/api/admin/users/[id]/route.ts` - ✅ Đã thêm `invalidateUserStatusCache` khi DELETE và PUT thay đổi `is_active`
- [x] `app/api/admin/auth/change-password/route.ts` - ✅ Cache đã được invalidate tự động qua `incrementTokenVersion` (đã có trong `lib/utils/tokenRevocation.ts`)
- [x] `app/api/admin/users/[id]/reset-password/route.ts` - ✅ Cache đã được invalidate tự động qua `incrementTokenVersion` (đã có trong `lib/utils/tokenRevocation.ts`)

**Trạng thái:** ✅ **ĐÃ SỬA**

### Giải pháp đã triển khai:
1. **PUT method trong `app/api/admin/users/[id]/route.ts`:**
   - Thêm `invalidateUserStatusCache` khi `is_active` thay đổi
   - Cache được invalidate ngay lập tức khi account bị lock/unlock

2. **DELETE method trong `app/api/admin/users/[id]/route.ts`:**
   - Đã có `invalidateUserStatusCache` khi soft delete (set `is_active = false`)

3. **Change Password và Reset Password:**
   - Cache đã được invalidate tự động qua `incrementTokenVersion` function
   - Function này đã có `invalidateUserStatusCache` call (trong `lib/utils/tokenRevocation.ts`)

4. **Kết quả:**
   - Token revocation có hiệu lực ngay lập tức (không còn độ trễ 2 phút)
   - Cache được invalidate tại tất cả các điểm thay đổi user status

---

## 🐛 VẤN ĐỀ 3: Lỗi tiềm ẩn tại trang Reset Password (Client Component)

### Mô tả
Tại file `app/admin/users/[id]/reset-password/page.tsx`:

**Vấn đề 1:** Code hiện tại sử dụng `useParams` để lấy `userId` nhưng trong logic xử lý lỗi hoặc khi không có dữ liệu, nó chưa kiểm tra kỹ tính hợp lệ của `userId` trước khi thực hiện fetch.

**Vấn đề 2:** Endpoint `/api/admin/users/[id]/reset-password` yêu cầu quyền `SUPER_ADMIN`. Tuy nhiên, nếu một user có quyền `admin:manage` nhưng không phải `SUPER_ADMIN` truy cập vào UI, họ sẽ thấy form nhưng khi submit mới nhận lỗi 403.

### Giải pháp
- Thêm validation cho `userId` trước khi fetch
- Thêm kiểm tra vai trò ngay tại tầng UI của trang để ẩn/hiện nội dung phù hợp với `PermissionGuard`

### Files cần sửa
- [ ] `app/admin/users/[id]/reset-password/page.tsx` - Thêm validation và permission check ở UI

**Trạng thái:** 🔴 Chưa sửa

---

## 🏗️ VẤN ĐỀ 4: Kiểm tra các quy tắc thiết kế (Architectural Safety)

### 4.1 XSS Protection
**Vấn đề:** Module account đã tuân thủ tốt việc không render dữ liệu người dùng trực tiếp. Tuy nhiên, `full_name` cần được sanitize nếu hiển thị ở các bảng tổng hợp.

**Files cần kiểm tra:**
- [x] `app/admin/users/page.tsx` - ✅ Đã sanitize `full_name` khi hiển thị (remove HTML tags)
- [x] `app/api/admin/users/[id]/route.ts` - ✅ Đã sanitize `full_name` khi lưu vào database

**Trạng thái:** ✅ **ĐÃ SỬA**

### 4.2 Optimistic Locking
**Vấn đề:** Trường `version` trong `app/api/admin/users/[id]/route.ts` chưa được áp dụng triệt để như module Product. Nếu hai `SUPER_ADMIN` cùng sửa quyền cho một user cùng lúc, sẽ xảy ra tình trạng "Last write wins".

**Giải pháp:** Áp dụng optimistic locking pattern giống như Product module:
- Check `version` trước khi update
- Trả về 409 Conflict nếu version không khớp
- Increment version sau khi update thành công

**Files cần sửa:**
- [x] `types/admin.ts` - ✅ Đã thêm `version?: number` vào AdminUser và AdminUserPublic interfaces
- [x] `app/api/admin/users/[id]/route.ts` - ✅ Đã thêm optimistic locking cho PUT method
- [x] `app/api/admin/users/route.ts` - ✅ Đã thêm `version: 1` khi tạo user mới

**Trạng thái:** ✅ **ĐÃ SỬA**

### Giải pháp đã triển khai:
1. **XSS Protection:**
   - Sanitize `full_name` khi hiển thị trong table (remove HTML tags)
   - Sanitize `full_name` khi lưu vào database (remove HTML tags và trim)

2. **Optimistic Locking:**
   - Thêm `version` field vào AdminUser schema (optional, default 0)
   - Check version trước khi update (trả về 409 nếu không khớp)
   - Increment version sau khi update thành công
   - Include version trong GET response để client có thể gửi lại khi update

3. **Kết quả:**
   - `full_name` được sanitize ở cả client và server
   - Concurrent edits được prevent bằng optimistic locking
   - "Last write wins" problem đã được giải quyết

---

## 📋 KẾ HOẠCH HÀNH ĐỘNG

### Bước 1: Fix Rate Limiting Bypass (CRITICAL)
1. Di chuyển `checkRateLimit` vào `authorize` function trong `lib/authOptions.ts`
2. Cần lấy IP từ request - có thể cần pass request object hoặc headers
3. Đơn giản hóa hoặc xóa `/api/admin/auth/login` endpoint
4. Test để đảm bảo rate limiting hoạt động đúng

### Bước 2: Fix Token Revocation Cache Delay
1. Thêm `invalidateUserStatusCache` vào `app/api/admin/users/[id]/route.ts` (DELETE và PUT)
2. Thêm `invalidateUserStatusCache` vào `app/api/admin/auth/change-password/route.ts`
3. Thêm `invalidateUserStatusCache` vào `app/api/admin/users/[id]/reset-password/route.ts`
4. Test để đảm bảo cache được invalidate ngay lập tức

### Bước 3: Fix Reset Password UI
1. Thêm validation cho `userId` trong `app/admin/users/[id]/reset-password/page.tsx`
2. Thêm `PermissionGuard` hoặc role check ở UI level
3. Test với user không có SUPER_ADMIN role

### Bước 4: Architectural Safety
1. Sanitize `full_name` trong các bảng tổng hợp
2. Implement optimistic locking cho user update API
3. Test concurrent updates

---

## ⚠️ CẢNH BÁO XUNG ĐỘT

### Rate Limiting Migration
Nếu di chuyển `checkRateLimit` vào `authorize`, cần đảm bảo:
- IP address có thể được lấy từ request context
- Rate limit key generation phải nhất quán
- Reset rate limit sau khi login thành công

### Cache Invalidation
Khi thêm `invalidateUserStatusCache`, cần đảm bảo:
- Gọi invalidate TRƯỚC khi update database (hoặc ngay sau)
- Không làm ảnh hưởng đến performance (invalidate là O(1) operation)

---

## 📊 METRICS & KẾT QUẢ

### Trước khi sửa:
- ❌ Rate limiting có thể bị bypass qua NextAuth endpoint
- ❌ Token revocation có độ trễ tối đa 2 phút
- ❌ Reset password UI thiếu validation và permission check
- ❌ User update không có optimistic locking

### Sau khi sửa (dự kiến):
- ✅ Rate limiting được enforce ở mọi luồng đăng nhập
- ✅ Token revocation có hiệu lực ngay lập tức
- ✅ Reset password UI có validation và permission check đầy đủ
- ✅ User update có optimistic locking để tránh race condition

---

## 🔄 CẬP NHẬT TIẾN ĐỘ

### 2025-01-XX - Khởi tạo
- ✅ Đã xác nhận tất cả các vấn đề
- ✅ Đã tạo file tracking progress
- ✅ Đã tạo kế hoạch hành động

### 2025-01-XX - Hoàn thành Vấn đề 1: Rate Limiting Bypass
- ✅ Đã thêm username-based rate limiting vào `authorize` function trong `lib/authOptions.ts`
- ✅ Rate limiting được enforce cho mọi luồng đăng nhập (không thể bypass)
- ✅ Đã cập nhật comment trong `app/api/admin/auth/login/route.ts` để giải thích 2 lớp rate limiting
- ✅ Đã đơn giản hóa `app/api/auth/[...nextauth]/route.ts` vì rate limiting đã được handle trong authorize

### 2025-01-XX - Hoàn thành Vấn đề 2: Token Revocation Cache
- ✅ Đã thêm `invalidateUserStatusCache` vào PUT method trong `app/api/admin/users/[id]/route.ts` khi `is_active` thay đổi
- ✅ Xác nhận DELETE method đã có `invalidateUserStatusCache`
- ✅ Xác nhận Change Password và Reset Password đã invalidate cache tự động qua `incrementTokenVersion`
- ✅ Token revocation giờ có hiệu lực ngay lập tức (không còn độ trễ 2 phút)

### 2025-01-XX - Hoàn thành Vấn đề 3: Reset Password UI
- ✅ Đã thêm validation `ObjectId.isValid()` cho userId trước khi fetch
- ✅ Đã cải thiện error handling với xử lý các HTTP status codes cụ thể (403, 404)
- ✅ Đã thêm error state UI với button "Quay lại danh sách người dùng"
- ✅ Đã đảm bảo PermissionGuard hoạt động đúng cách
- ✅ User không thể truy cập trang với userId không hợp lệ

### 2025-01-XX - Hoàn thành Vấn đề 4: Architectural Safety
- ✅ Đã sanitize `full_name` khi hiển thị trong table (remove HTML tags)
- ✅ Đã sanitize `full_name` khi lưu vào database (remove HTML tags và trim)
- ✅ Đã thêm `version` field vào AdminUser schema (optimistic locking)
- ✅ Đã implement optimistic locking trong PUT method (check version, return 409 nếu không khớp)
- ✅ Đã increment version sau khi update thành công
- ✅ Đã include version trong GET response và mapToPublicUser
- ✅ Đã thêm `version: 1` khi tạo user mới

---

## 📚 TÀI LIỆU THAM KHẢO

- [NextAuth.js Authorization](https://next-auth.js.org/configuration/providers/credentials)
- [Rate Limiting Best Practices](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [Token Revocation Patterns](https://auth0.com/blog/refresh-tokens-what-are-they-and-when-to-use-them/)
- [Optimistic Locking](https://www.mongodb.com/docs/manual/core/write-operations-atomicity/)

