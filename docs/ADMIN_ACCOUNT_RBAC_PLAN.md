# KẾ HOẠCH TRIỂN KHAI: MODULE QUẢN LÝ TÀI KHOẢN ADMIN (RBAC)

**Phiên bản:** 1.2  
**Ngày tạo:** 2025-01-11  
**Ngày cập nhật:** 2025-01-11  
**Mục tiêu:** Xây dựng hệ thống quản lý tài khoản admin với Role-Based Access Control (RBAC) và bảo mật nâng cao  
**Tài liệu tham khảo:** `SPEC_MODULE_ADMIN_ACCOUNT.md`

## 🔒 CẬP NHẬT V1.2 - BẢO MẬT NÂNG CAO

Phiên bản 1.2 bổ sung các tính năng bảo mật quan trọng:

1. **Token Revocation**: Hỗ trợ thu hồi token ngay lập tức với `token_version`
2. **Cookie Security**: Bắt buộc Secure và SameSite=Strict cho cookies
3. **Security Headers**: Yêu cầu cấu hình HTTP Security Headers (Helmet hoặc next.config.js)

Xem chi tiết trong các phases bên dưới.

---

## 📋 TỔNG QUAN

Module này sẽ thay thế hệ thống authentication đơn giản hiện tại (chỉ có role `admin`) bằng hệ thống RBAC đầy đủ với:
- **5 roles**: SUPER_ADMIN, PRODUCT_MANAGER, ORDER_MANAGER, CONTENT_EDITOR, VIEWER
- **Permissions system**: Quản lý quyền chi tiết cho từng role
- **Rate limiting**: Bảo vệ khỏi brute-force attacks
- **Audit logging**: Ghi log mọi hành động của admin
- **User management**: CRUD admin users với phân quyền

---

## 🎯 CÁC PHASE TRIỂN KHAI

### **PHASE 1: Database Schema & Types** ✅
**Mục tiêu:** Tạo schema MongoDB và TypeScript types cho `admin_users` collection

#### Tasks:
- [ ] **Task 1.1:** Tạo TypeScript types cho AdminUser schema
  - File: `types/admin.ts`
  - Bao gồm: AdminUser, AdminRole, Permission, AdminActivityLog types
  - **V1.2:** Thêm field `token_version: number` vào AdminUser interface
    - Default: 0
    - Tăng lên mỗi khi force logout hoặc reset password
  - Exports: AdminRole enum, Permission type, các interfaces

- [ ] **Task 1.2:** Update `lib/db.ts` để thêm `admin_users` và `admin_activity_logs` collections
  - Thêm `adminUsers: Collection` vào interface Collections
  - Thêm `adminActivityLogs: Collection` vào interface Collections
  - Update `getCollections()` để return 2 collections mới

- [ ] **Task 1.3:** Tạo constants cho Roles và Permissions
  - File: `lib/constants/adminRoles.ts`
  - Define: ADMIN_ROLES enum (SUPER_ADMIN, PRODUCT_MANAGER, ORDER_MANAGER, CONTENT_EDITOR, VIEWER)
  - Define: PERMISSIONS object với mapping role -> permissions array
  - Function: `getRolePermissions(role: AdminRole): Permission[]`

- [ ] **Task 1.5:** **(V1.2)** Tạo Token Revocation utilities
  - File: `lib/utils/tokenRevocation.ts`
  - Functions:
    - `incrementTokenVersion(userId: string): Promise<void>` - Tăng token_version để revoke tất cả tokens
    - `getTokenVersion(userId: string): Promise<number>` - Lấy token_version hiện tại

- [ ] **Task 1.4:** Tạo database indexes
  - File: `scripts/setup-admin-indexes.ts`
  - Indexes cho `admin_users`: username (unique), email (unique), role, is_active, token_version
  - Indexes cho `admin_activity_logs`: admin_id, action, createdAt
  - Chạy script: `npm run setup:admin-indexes`

**Deliverables:**
- ✅ Types được định nghĩa đầy đủ (bao gồm token_version)
- ✅ Collections được thêm vào getCollections()
- ✅ Constants và permissions mapping sẵn sàng
- ✅ Token revocation utilities sẵn sàng
- ✅ Database indexes được tạo

**Kiểm thử:**
- [ ] Run TypeScript type-check: `npm run type-check`
- [ ] Run setup indexes script: `npm run setup:admin-indexes`
- [ ] Verify indexes trong MongoDB

---

### **PHASE 2: Authentication & Security Utils** ✅
**Mục tiêu:** Tạo các utilities cho password hashing, JWT, và rate limiting

#### Tasks:
- [ ] **Task 2.1:** Tạo PasswordUtils class
  - File: `lib/utils/passwordUtils.ts`
  - Functions:
    - `hashPassword(password: string): Promise<string>` - Hash với bcrypt (salt rounds: 12)
    - `comparePassword(password: string, hash: string): Promise<boolean>`
    - `validatePasswordStrength(password: string): { valid: boolean; errors: string[] }` - Min 8 chars, có chữ hoa, chữ thường, số

- [ ] **Task 2.2:** Tạo Rate Limiter utility
  - File: `lib/utils/rateLimiter.ts`
  - Sử dụng in-memory Map hoặc Redis (optional)
  - Function: `checkRateLimit(key: string, maxAttempts: number, windowMs: number): Promise<boolean>`
  - Key format: `login:${ip}:${username}`
  - Default: 5 attempts / 15 minutes

- [ ] **Task 2.3:** Tạo Audit Logger utility
  - File: `lib/utils/auditLogger.ts`
  - Function: `logActivity(action: string, adminId: string, metadata?: object, request?: NextRequest): Promise<void>`
  - Log vào collection `admin_activity_logs`
  - Capture: IP address, User-Agent, timestamp

**Deliverables:**
- ✅ PasswordUtils có thể hash/compare passwords
- ✅ Rate limiter hoạt động đúng
- ✅ Audit logger có thể ghi log

**Kiểm thử:**
- [ ] Test password hashing/verification
- [ ] Test rate limiter với multiple requests
- [ ] Test audit logger ghi log vào DB

---

### **PHASE 3: Permission System & Middleware** ✅
**Mục tiêu:** Tạo hệ thống kiểm tra permissions và middleware cho API routes

#### Tasks:
- [ ] **Task 3.1:** Tạo Permission Check utilities
  - File: `lib/utils/permissions.ts`
  - Functions:
    - `hasPermission(userRole: AdminRole, userPermissions: Permission[], requiredPermission: Permission): boolean`
    - `hasAnyPermission(userRole: AdminRole, userPermissions: Permission[], requiredPermissions: Permission[]): boolean`
    - `hasAllPermissions(userRole: AdminRole, userPermissions: Permission[], requiredPermissions: Permission[]): boolean`
    - `canAccessResource(userRole: AdminRole, userPermissions: Permission[], resource: string, action: string): boolean`

- [ ] **Task 3.2:** Update `lib/auth.ts` với RBAC support
  - Thêm function: `getAdminUser(userId: string): Promise<AdminUser | null>`
  - Thêm function: `requireAdminWithPermission(permission: Permission): Promise<AdminUser>`
  - Update `requireAdmin()` để check is_active
  - Check `must_change_password` và throw error nếu true

- [ ] **Task 3.3:** Tạo API middleware wrapper
  - File: `lib/middleware/authMiddleware.ts`
  - Function: `withAuthAdmin(requiredPermission?: Permission)`
  - Logic:
    1. Get session từ NextAuth
    2. Verify user exists và is_active = true
    3. **V1.2:** Check token_version - Verify token.version === user.token_version (nếu không khớp -> return 401 "Token revoked")
    4. Check must_change_password (nếu true, return 403 với message)
    5. Check permission (nếu requiredPermission được cung cấp)
    6. Attach `req.adminUser` để dùng trong route handler

- [ ] **Task 3.4:** **(V1.2)** Update NextAuth JWT callback để check token_version
  - File: `lib/authOptions.ts`
  - Update `jwt()` callback:
    - Store `tokenVersion` từ DB vào JWT token
    - Compare với DB mỗi lần verify (optional - có thể chỉ check trong middleware)

**Deliverables:**
- ✅ Permission system hoạt động đúng
- ✅ Middleware wrapper sẵn sàng sử dụng
- ✅ Auth functions hỗ trợ RBAC

**Kiểm thử:**
- [ ] Test permission checks với các roles khác nhau
- [ ] Test middleware với/không có permission requirement
- [ ] Test must_change_password redirect

---

### **PHASE 4: Auth APIs (Login/Logout/Me)** ✅
**Mục tiêu:** Tạo các API endpoints cho authentication

#### Tasks:
- [ ] **Task 4.1:** Update NextAuth để dùng `admin_users` collection
  - File: `lib/authOptions.ts`
  - Update `authorize()` function:
    - Query từ `admin_users` thay vì `users`
    - Check `is_active` (nếu false -> return null)
    - Update `last_login` sau khi login thành công
    - Return user info với role, permissions, và **token_version**
  - **V1.2:** Update NextAuth cookie configuration:
    - `cookies.useSecureCookies = true` (production)
    - `cookies.sessionToken.sameSite = 'strict'`
    - `cookies.sessionToken.secure = true` (production only)
    - `cookies.csrfToken.sameSite = 'strict'`
    - `cookies.csrfToken.secure = true` (production only)

- [ ] **Task 4.2:** Tạo API `/api/admin/auth/login` (POST)
  - File: `app/api/admin/auth/login/route.ts`
  - Body: `{ username: string, password: string }`
  - Logic:
    1. Check rate limit (5 attempts / 15 min)
    2. Validate input
    3. Find user by username trong `admin_users`
    4. Check is_active
    5. Verify password
    6. Update last_login
    7. Create session với NextAuth
    8. Log activity: LOGIN
    9. Return: `{ success: true, user: {...}, requireChangePassword: boolean }`
  - Error cases: Rate limit exceeded, invalid credentials, account locked

- [ ] **Task 4.3:** Tạo API `/api/admin/auth/logout` (POST)
  - File: `app/api/admin/auth/logout/route.ts`
  - Logic:
    1. Get current user
    2. Log activity: LOGOUT
    3. Clear session với NextAuth
    4. Return: `{ success: true }`

- [ ] **Task 4.4:** Tạo API `/api/admin/auth/me` (GET)
  - File: `app/api/admin/auth/me/route.ts`
  - Logic:
    1. Get current user từ session
    2. Query full user info từ DB (trừ password_hash)
    3. Return: `{ success: true, data: AdminUser }`

- [ ] **Task 4.5:** Tạo API `/api/admin/auth/change-password` (POST)
  - File: `app/api/admin/auth/change-password/route.ts`
  - Body: `{ currentPassword: string, newPassword: string }`
  - Logic:
    1. Get current user
    2. Verify current password
    3. Validate new password strength
    4. Hash new password
    5. Update password_hash và set must_change_password = false
    6. **V1.2:** Increment token_version (force logout tất cả devices)
    7. Log activity: CHANGE_PASSWORD
    8. Return: `{ success: true }`

- [ ] **Task 4.6:** **(V1.2)** Tạo API `/api/admin/auth/logout-all` (POST) - Force logout all devices
  - File: `app/api/admin/auth/logout-all/route.ts`
  - Logic:
    1. Get current user
    2. Increment token_version trong DB
    3. Log activity: LOGOUT_ALL_DEVICES
    4. Return: `{ success: true, message: "Đã đăng xuất khỏi tất cả thiết bị" }`
  - Use case: Khi user nghi ngờ account bị compromised

**Deliverables:**
- ✅ Login API với rate limiting
- ✅ Logout API
- ✅ Me API để lấy user info
- ✅ Change password API
- ✅ NextAuth được update để dùng admin_users

**Kiểm thử:**
- [ ] Test login với đúng/sai credentials
- [ ] Test rate limiting (5 failed attempts)
- [ ] Test login với must_change_password = true
- [ ] Test logout
- [ ] Test change password

---

### **PHASE 5: User Management APIs** ✅
**Mục tiêu:** Tạo CRUD APIs cho quản lý admin users (chỉ SUPER_ADMIN)

#### Tasks:
- [ ] **Task 5.1:** Tạo API `/api/admin/users` (GET) - List users
  - File: `app/api/admin/users/route.ts`
  - Permission: SUPER_ADMIN only
  - Query params: `page`, `limit`, `search`, `role`, `is_active`
  - Response: `{ success: true, data: { users: AdminUser[], total: number, page: number, limit: number } }`
  - Logic:
    1. Check permission: SUPER_ADMIN
    2. Build query từ query params
    3. Paginate results
    4. Return users (exclude password_hash)

- [ ] **Task 5.2:** Tạo API `/api/admin/users` (POST) - Create user
  - File: `app/api/admin/users/route.ts`
  - Permission: SUPER_ADMIN only
  - Body: `{ username, email, password, full_name, role, permissions?: Permission[] }`
  - Validation:
    - Username/email unique
    - Password min 8 chars
    - Role valid
  - Logic:
    1. Check permission: SUPER_ADMIN
    2. Validate input
    3. Check username/email không trùng
    4. Hash password
    5. Set must_change_password = true
    6. Set created_by = current user id
    7. Insert vào DB
    8. Log activity: CREATE_USER
    9. Return: `{ success: true, data: AdminUser }`

- [ ] **Task 5.3:** Tạo API `/api/admin/users/[id]` (GET) - Get user detail
  - File: `app/api/admin/users/[id]/route.ts`
  - Permission: SUPER_ADMIN only
  - Return: `{ success: true, data: AdminUser }`

- [ ] **Task 5.4:** Tạo API `/api/admin/users/[id]` (PUT) - Update user
  - File: `app/api/admin/users/[id]/route.ts`
  - Permission: SUPER_ADMIN only
  - Body: `{ role?, is_active?, full_name?, permissions? }`
  - Logic:
    1. Check permission: SUPER_ADMIN
    2. Validate input
    3. Prevent self-modification của role/is_active (nếu update chính mình)
    4. Update fields
    5. Log activity: UPDATE_USER
    6. Return: `{ success: true, data: AdminUser }`

- [ ] **Task 5.5:** Tạo API `/api/admin/users/[id]/reset-password` (PUT)
  - File: `app/api/admin/users/[id]/reset-password/route.ts`
  - Permission: SUPER_ADMIN only
  - Body: `{ new_password: string }`
  - Logic:
    1. Check permission: SUPER_ADMIN
    2. Validate password strength
    3. Hash new password
    4. Set must_change_password = true
    5. **V1.2:** Increment token_version (force logout user)
    6. Log activity: RESET_PASSWORD
    7. Return: `{ success: true }`

- [ ] **Task 5.7:** **(V1.2)** Tạo API `/api/admin/users/[id]/force-logout` (POST)
  - File: `app/api/admin/users/[id]/force-logout/route.ts`
  - Permission: SUPER_ADMIN only
  - Logic:
    1. Check permission: SUPER_ADMIN
    2. Increment token_version cho user đó
    3. Log activity: FORCE_LOGOUT_USER
    4. Return: `{ success: true }`

- [ ] **Task 5.6:** Tạo API `/api/admin/users/[id]` (DELETE) - Soft delete
  - File: `app/api/admin/users/[id]/route.ts`
  - Permission: SUPER_ADMIN only
  - Logic:
    1. Check permission: SUPER_ADMIN
    2. Prevent self-deletion
    3. Set is_active = false (soft delete)
    4. Log activity: DELETE_USER
    5. Return: `{ success: true }`

**Deliverables:**
- ✅ Full CRUD APIs cho user management
- ✅ Permission checks đầy đủ
- ✅ Audit logging cho mọi actions

**Kiểm thử:**
- [ ] Test tất cả CRUD operations
- [ ] Test permission checks (non-SUPER_ADMIN không thể access)
- [ ] Test self-modification prevention
- [ ] Test validation (unique username/email, password strength)

---

### **PHASE 6: Frontend Components** ✅
**Mục tiêu:** Tạo UI components cho admin user management

#### Tasks:
- [ ] **Task 6.1:** Tạo Admin Users List Page
  - File: `app/admin/users/page.tsx`
  - Features:
    - Table hiển thị users với pagination
    - Search by name/email/username
    - Filter by role, is_active
    - Actions: View, Edit, Delete, Reset Password
    - "Create User" button

- [ ] **Task 6.2:** Tạo User Form Component
  - File: `components/admin/UserForm.tsx`
  - Props: `userId?: string, initialData?: AdminUser, onSuccess?: () => void`
  - Features:
    - Form fields: username, email, password (if create), full_name, role select, permissions (multi-select)
    - Validation với Zod
    - Submit create/update user

- [ ] **Task 6.3:** Tạo User Detail/Edit Page
  - File: `app/admin/users/[id]/edit/page.tsx`
  - Features:
    - Load user data
    - Display user info
    - Edit form (chỉ SUPER_ADMIN)
    - Change password section

- [ ] **Task 6.4:** Update Admin Layout để thêm Users menu
  - File: `app/admin/layout.tsx`
  - Thêm menu item "Quản lý tài khoản" (chỉ hiện với SUPER_ADMIN)
  - Icon: Users

- [ ] **Task 6.5:** Tạo Change Password Page
  - File: `app/admin/change-password/page.tsx`
  - Features:
    - Form: current password, new password, confirm password
    - Validate password strength
    - Call API `/api/admin/auth/change-password`
    - **V1.2:** Show warning: "Thay đổi mật khẩu sẽ đăng xuất khỏi tất cả thiết bị"
    - Redirect sau khi change thành công

- [ ] **Task 6.8:** **(V1.2)** Thêm "Force Logout All Devices" button
  - File: `app/admin/settings/security/page.tsx` (hoặc trong profile page)
  - Features:
    - Button "Đăng xuất khỏi tất cả thiết bị"
    - Confirmation dialog: "Bạn có chắc muốn đăng xuất khỏi tất cả thiết bị?"
    - Call API `/api/admin/auth/logout-all`
    - Show success message và redirect về login

- [ ] **Task 6.6:** Update Login Page để handle `must_change_password`
  - File: `app/admin/login/page.tsx`
  - Logic:
    - Sau khi login thành công, check `requireChangePassword`
    - Nếu true, redirect đến `/admin/change-password` với message

- [ ] **Task 6.7:** Tạo Permission-based UI guards
  - File: `components/admin/PermissionGuard.tsx`
  - Props: `permission: Permission, children: ReactNode, fallback?: ReactNode`
  - Logic: Check user permission, render children hoặc fallback

**Deliverables:**
- ✅ Admin Users management UI hoàn chỉnh
- ✅ Change password page
- ✅ Permission-based UI guards
- ✅ Updated admin layout

**Kiểm thử:**
- [ ] Test tất cả UI flows
- [ ] Test permission guards (chỉ SUPER_ADMIN thấy Users menu)
- [ ] Test change password flow
- [ ] Test must_change_password redirect

---

### **PHASE 7: Update Existing APIs với RBAC** ✅
**Mục tiêu:** Update các API routes hiện tại để sử dụng permission system

#### Tasks:
- [ ] **Task 7.1:** Update Product APIs với permissions
  - Files: `app/api/admin/products/**/*.ts`
  - Required permissions:
    - GET: `product:read` hoặc role có quyền
    - POST: `product:create`
    - PUT: `product:update`
    - DELETE: `product:delete`
  - Wrap handlers với `withAuthAdmin(permission)`

- [ ] **Task 7.2:** Update Order APIs với permissions
  - Files: `app/api/admin/orders/**/*.ts`
  - Required permissions:
    - GET: `order:read`
    - PUT: `order:update`
    - POST (approve, etc): `order:update`

- [ ] **Task 7.3:** Update Category APIs với permissions
  - Files: `app/api/admin/categories/**/*.ts`
  - Required permissions:
    - GET: `category:read` hoặc `product:read`
    - POST/PUT/DELETE: `category:manage` hoặc `product:update`

- [ ] **Task 7.4:** Update Content APIs với permissions
  - Files: `app/api/admin/posts/**/*.ts`, `app/api/admin/authors/**/*.ts`
  - Required permissions:
    - GET: `blog:read`
    - POST/PUT/DELETE: `blog:manage`

- [ ] **Task 7.5:** Update Media APIs với permissions
  - Files: `app/api/admin/media/**/*.ts`
  - Required permissions:
    - GET: `media:read`
    - POST/DELETE: `media:upload`

**Deliverables:**
- ✅ Tất cả admin APIs được bảo vệ bởi permission checks
- ✅ Error responses chuẩn khi không có quyền

**Kiểm thử:**
- [ ] Test mỗi API với các roles khác nhau
- [ ] Verify VIEWER chỉ có thể read
- [ ] Verify PRODUCT_MANAGER chỉ có thể manage products

---

### **PHASE 8: Migration & Data Seeding** ✅
**Mục tiêu:** Migrate dữ liệu từ `users` sang `admin_users` và tạo seed data

#### Tasks:
- [ ] **Task 8.1:** Tạo migration script
  - File: `scripts/migrate-users-to-admin-users.ts`
  - Logic:
    1. Query tất cả users có role = 'admin' từ collection `users`
    2. Transform data theo AdminUser schema:
       - username = email (hoặc generate từ email)
       - email = email
       - password_hash = password
       - full_name = name
       - role = SUPER_ADMIN (default cho users cũ)
       - is_active = true
       - must_change_password = true (force đổi pass)
    3. Insert vào `admin_users`
    4. Log migration results

- [ ] **Task 8.2:** Tạo seed script cho admin users
  - File: `scripts/seed-admin-users.ts`
  - Tạo các users mẫu với các roles khác nhau:
    - SUPER_ADMIN: admin / ChangeMe@123
    - PRODUCT_MANAGER: product@example.com / ChangeMe@123
    - ORDER_MANAGER: order@example.com / ChangeMe@123
    - CONTENT_EDITOR: editor@example.com / ChangeMe@123
    - VIEWER: viewer@example.com / ChangeMe@123
  - Command: `npm run seed:admin-users`

- [ ] **Task 8.3:** Update create-admin-user script
  - File: `scripts/create-admin-user.ts`
  - Update để tạo user trong `admin_users` collection
  - Default role: SUPER_ADMIN
  - Default must_change_password: true

**Deliverables:**
- ✅ Migration script sẵn sàng
- ✅ Seed script với users mẫu
- ✅ Updated create-admin-user script

**Kiểm thử:**
- [ ] Run migration script
- [ ] Verify data được migrate đúng
- [ ] Run seed script
- [ ] Test login với users mới

---

### **PHASE 9: Documentation & Testing** ✅
**Mục tiêu:** Viết documentation và test toàn bộ module

#### Tasks:
- [ ] **Task 9.1:** Viết API Documentation
  - File: `docs/ADMIN_ACCOUNT_RBAC_API.md`
  - Document tất cả API endpoints
  - Request/Response examples
  - Error codes
  - **V1.2:** Document token revocation mechanism

- [ ] **Task 9.2:** Viết User Guide
  - File: `docs/ADMIN_ACCOUNT_RBAC_USER_GUIDE.md`
  - Hướng dẫn sử dụng cho admin
  - Giải thích roles và permissions
  - Hướng dẫn change password
  - **V1.2:** Hướng dẫn force logout all devices

- [ ] **Task 9.3:** Tạo integration tests
  - File: `scripts/test-admin-rbac.ts`
  - Test:
    - Login với các roles
    - Permission checks
    - User CRUD operations
    - Rate limiting
    - **V1.2:** Test token revocation (force logout)
    - **V1.2:** Test cookie security (Secure, SameSite)

- [ ] **Task 9.4:** Update main documentation
  - Update `README.md` với RBAC info
  - Update `docs/PHASE5_ADMIN_PANEL_COMPLETE.md`

- [ ] **Task 9.5:** **(V1.2)** Cấu hình Security Headers
  - File: `next.config.js` hoặc middleware
  - **Yêu cầu bắt buộc:**
    - `X-Content-Type-Options: nosniff`
    - `X-Frame-Options: DENY` hoặc `SAMEORIGIN`
    - `X-XSS-Protection: 1; mode=block`
    - `Strict-Transport-Security: max-age=31536000; includeSubDomains` (HTTPS only)
    - `Referrer-Policy: strict-origin-when-cross-origin`
    - `Permissions-Policy: ...` (tùy chọn)
  - Verify headers với security testing tools
  - Document trong deployment guide

**Deliverables:**
- ✅ Documentation đầy đủ
- ✅ Integration tests
- ✅ Updated main docs

---

## 📊 THEO DÕI TIẾN ĐỘ

### Status Legend:
- ⏳ **Pending** - Chưa bắt đầu
- 🔄 **In Progress** - Đang làm
- ✅ **Completed** - Hoàn thành
- ⚠️ **Blocked** - Bị chặn (cần giải quyết trước)

### Current Status:

| Phase | Status | Progress | Notes |
|-------|--------|----------|-------|
| Phase 1: Database Schema & Types | ⏳ | 0% | |
| Phase 2: Authentication & Security Utils | ⏳ | 0% | |
| Phase 3: Permission System & Middleware | ⏳ | 0% | |
| Phase 4: Auth APIs | ⏳ | 0% | |
| Phase 5: User Management APIs | ⏳ | 0% | |
| Phase 6: Frontend Components | ⏳ | 0% | |
| Phase 7: Update Existing APIs | ⏳ | 0% | |
| Phase 8: Migration & Data Seeding | ⏳ | 0% | |
| Phase 9: Documentation & Testing | ⏳ | 0% | |

---

## 🔒 SECURITY CONSIDERATIONS

### Implemented:
- ✅ Password hashing với bcrypt (12 rounds)
- ✅ Rate limiting cho login (5 attempts / 15 min)
- ✅ JWT token với expiration
- ✅ **V1.2:** Token revocation với token_version
- ✅ Permission-based access control
- ✅ Audit logging
- ✅ Soft delete (is_active flag)
- ✅ **V1.2:** Secure cookies (Secure flag, SameSite=Strict)
- ✅ **V1.2:** HTTP Security Headers

### Best Practices:
- ✅ Separate admin_users collection (tách biệt khỏi customer users)
- ✅ HttpOnly cookies cho refresh tokens
- ✅ **V1.2:** Secure cookies chỉ hoạt động trên HTTPS (production)
- ✅ **V1.2:** SameSite=Strict để chống CSRF
- ✅ Password strength validation
- ✅ must_change_password flag cho users mới
- ✅ Prevent self-modification/deletion của critical fields
- ✅ **V1.2:** Token version checking để revoke tokens ngay lập tức

---

## 📝 NOTES

### Technical Decisions:
1. **Separate Collection**: Tách `admin_users` khỏi `users` để bảo mật tốt hơn
2. **No Mongoose**: Tiếp tục dùng MongoDB native driver để consistent với codebase hiện tại
3. **NextAuth Integration**: Update NextAuth thay vì tạo auth system mới
4. **In-memory Rate Limiting**: Dùng Map để đơn giản, có thể upgrade sang Redis sau
5. **Soft Delete**: Dùng `is_active` flag thay vì hard delete

### Future Enhancements:
- [ ] Two-factor authentication (2FA)
- [ ] **V1.2:** Session management UI (view active sessions - in progress với token_version)
- [ ] Password history (prevent reuse)
- [ ] Account lockout policies (đã có rate limiting, có thể nâng cấp)
- [ ] Email notifications cho account changes
- [ ] Redis-based rate limiting cho production scale
- [ ] API key management cho service accounts
- [ ] **V1.2:** Device fingerprinting để track devices

---

## 🚀 QUICK START

Sau khi hoàn thành tất cả phases:

1. **Run migration:**
   ```bash
   npm run migrate:admin-users
   ```

2. **Seed admin users (optional):**
   ```bash
   npm run seed:admin-users
   ```

3. **Setup indexes:**
   ```bash
   npm run setup:admin-indexes
   ```

4. **Test login:**
   - Navigate to `/admin/login`
   - Login với credentials từ seed script
   - Change password lần đầu

---

**Last Updated:** 2025-01-11 (v1.2 - Security Enhancements)  
**Version History:**
- v1.0 (2025-01-11): Initial plan với RBAC cơ bản
- v1.2 (2025-01-11): Added token revocation, cookie security, security headers

**Next Review:** Sau mỗi phase completion
