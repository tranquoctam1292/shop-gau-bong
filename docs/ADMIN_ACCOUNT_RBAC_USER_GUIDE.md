# User Guide: Admin Account Management (RBAC)

**Version:** 1.2 (Security Enhancements)  
**Last Updated:** 2025-01-11

## Overview

This guide explains how to use the Admin Account Management system with Role-Based Access Control (RBAC). This system allows SUPER_ADMIN to manage admin accounts, assign roles, and control access permissions.

---

## Roles and Permissions

### Available Roles

The system has 5 predefined roles:

| Role | Display Name | Description |
|------|--------------|-------------|
| `SUPER_ADMIN` | Quản trị cấp cao | Full access to everything, including user management |
| `PRODUCT_MANAGER` | Quản lý sản phẩm | Can manage products and categories |
| `ORDER_MANAGER` | Quản lý đơn hàng | Can view and update orders |
| `CONTENT_EDITOR` | Biên tập nội dung | Can manage blog posts, pages, and media |
| `VIEWER` | Người xem | Read-only access to most features |

### Permissions

Each role has specific permissions:

**SUPER_ADMIN:**
- All permissions (`*`)
- Can manage other admin users
- Access to all features

**PRODUCT_MANAGER:**
- `product:create`, `product:read`, `product:update`, `product:delete`
- `category:read`, `category:manage`

**ORDER_MANAGER:**
- `order:read`, `order:update`
- `customer:read`

**CONTENT_EDITOR:**
- `blog:read`, `blog:manage`
- `page:manage`
- `media:read`, `media:upload`

**VIEWER:**
- `product:read`, `category:read`
- `order:read`, `customer:read`
- `blog:read`, `media:read`

### Custom Permissions

SUPER_ADMIN can assign custom permissions to override role defaults. This allows fine-grained access control.

---

## Login

### First Time Setup

1. **Initial Admin User:**
   - Run `npm run seed:admin-users` to create sample users
   - Or run `npm run create:admin-user` to create a single admin user

2. **Default Credentials (from seed):**
   - Username: `admin`
   - Password: `ChangeMe@123`
   - **⚠️ Important:** You MUST change the password on first login!

### Login Process

1. Navigate to `/admin/login`
2. Enter your **username** (not email)
3. Enter your password
4. Click "Đăng nhập"

**Note:** The system uses username-based login, not email-based.

### After Login

- If `must_change_password` is true, you will be redirected to change password page
- Otherwise, you'll be redirected to the admin dashboard

---

## Change Password

### When Required

You must change your password if:
- `must_change_password` flag is set to `true`
- Your password was reset by SUPER_ADMIN
- You want to update your password for security

### How to Change Password

1. Navigate to `/admin/change-password`
2. Enter your current password
3. Enter your new password (minimum 8 characters, uppercase, lowercase, number)
4. Confirm your new password
5. Click "Đổi mật khẩu"

**⚠️ Security Warning (V1.2):**
- Changing password will **logout you from all devices**
- This is a security feature to ensure only you have access
- You'll need to login again after changing password

---

## Force Logout All Devices (V1.2)

If you suspect your account has been compromised or want to ensure only you have access:

1. Navigate to `/admin/settings/security`
2. Click "Đăng xuất khỏi tất cả thiết bị"
3. Confirm the action

**What happens:**
- All active sessions on all devices are immediately invalidated
- You'll be logged out from the current session
- You'll need to login again
- This is useful if you:
  - Lost a device
  - Suspect unauthorized access
  - Want to ensure maximum security

---

## User Management (SUPER_ADMIN Only)

### Access User Management

Only SUPER_ADMIN can access user management:
1. Navigate to `/admin/users`
2. The menu item "Quản lý tài khoản" is only visible to SUPER_ADMIN

### List Users

The users list page shows:
- Username, Email, Full Name
- Role
- Status (Active/Inactive, Must Change Password)
- Last Login date
- Actions menu

**Features:**
- Search by username, email, or full name
- Filter by role
- Filter by active status
- Pagination

### Create New User

1. Click "Tạo người dùng mới" button
2. Fill in the form:
   - **Username:** Unique username for login
   - **Email:** Valid email address
   - **Password:** Minimum 8 characters, uppercase, lowercase, number
   - **Full Name:** Display name
   - **Role:** Select from available roles
   - **Custom Permissions:** (Optional) Override role permissions
   - **Active:** Check to activate the account
3. Click "Tạo người dùng"

**Notes:**
- New users must change password on first login
- Password must meet strength requirements

### Edit User

1. Click the actions menu (⋮) next to a user
2. Click "Chỉnh sửa"
3. Update user information:
   - Full Name
   - Role
   - Custom Permissions
   - Active Status
4. Click "Cập nhật"

**Restrictions:**
- Users cannot modify their own role or active status
- SUPER_ADMIN can modify any user

### Reset User Password

1. Click the actions menu (⋮) next to a user
2. Click "Reset mật khẩu"
3. Enter a new password
4. Confirm the password
5. Click "Reset mật khẩu"

**Notes:**
- **V1.2:** This will logout the user from all devices
- User must change password on next login
- Password must meet strength requirements

### Force Logout User (V1.2)

1. Click the actions menu (⋮) next to a user
2. Click "Đăng xuất tất cả thiết bị"
3. Confirm the action

**Notes:**
- Immediately invalidates all sessions for that user
- Useful if user loses device or account is compromised
- User will need to login again

### Deactivate User

1. Click the actions menu (⋮) next to a user
2. Click "Vô hiệu hóa"
3. Confirm the action

**Notes:**
- Sets `is_active = false` (soft delete)
- User cannot login while inactive
- Users cannot delete their own account
- Can be reactivated by editing the user

---

## Permission-Based Access

### How Permissions Work

- Each API endpoint requires specific permissions
- Your role determines your default permissions
- SUPER_ADMIN can assign custom permissions
- The system checks permissions on every request

### What Happens Without Permission?

- **API Calls:** Return `403 Forbidden` with `PERMISSION_DENIED` error
- **UI Elements:** Hidden or disabled (via `PermissionGuard` component)
- **Pages:** Redirect to dashboard or show access denied message

### Example Scenarios

**PRODUCT_MANAGER:**
- ✅ Can view, create, update, delete products
- ✅ Can manage categories
- ❌ Cannot view or manage orders
- ❌ Cannot view or manage other users

**VIEWER:**
- ✅ Can view products, orders, posts
- ❌ Cannot create, update, or delete anything
- ❌ Cannot access user management

---

## Security Features (V1.2)

### Token Revocation

The system supports instant token revocation:
- Each user has a `token_version` field
- Incrementing `token_version` invalidates all tokens
- Happens automatically on:
  - Password change
  - Force logout all devices
  - Admin reset password
  - Admin force logout

### Cookie Security

Session cookies are configured with:
- `httpOnly`: Prevents JavaScript access (XSS protection)
- `secure`: HTTPS only (in production)
- `sameSite: strict`: CSRF protection

### Rate Limiting

Login endpoint is protected with rate limiting:
- **5 attempts per 15 minutes** per IP:username combination
- Prevents brute force attacks
- Lockout message shows retry time

---

## Troubleshooting

### Cannot Login

**Issue:** Login fails even with correct credentials

**Solutions:**
1. Check if account is active (`is_active = true`)
2. Verify username (not email)
3. Check if rate limited (wait 15 minutes)
4. Verify password (case-sensitive)
5. Contact SUPER_ADMIN if account is locked

### Must Change Password

**Issue:** Redirected to change password page

**Solution:**
1. This is required for security
2. Navigate to `/admin/change-password`
3. Enter current and new password
4. Complete the change

### Permission Denied

**Issue:** "Bạn không có quyền thực hiện hành động này"

**Solution:**
1. Your role doesn't have the required permission
2. Contact SUPER_ADMIN to:
   - Change your role
   - Add custom permissions
   - Grant access to specific features

### Logged Out Unexpectedly

**Issue:** Session becomes invalid

**Possible Causes:**
1. **Password Changed:** You or SUPER_ADMIN changed your password
2. **Force Logout:** SUPER_ADMIN force logged you out
3. **Token Revoked:** Security measure (V1.2)

**Solution:**
1. Login again with current credentials
2. Contact SUPER_ADMIN if issues persist

---

## Best Practices

### For SUPER_ADMIN

1. **Create Users Carefully:**
   - Assign appropriate roles
   - Use strong passwords (users must change on first login)
   - Set `must_change_password: true` for new users

2. **Monitor Activity:**
   - Review audit logs regularly
   - Check for suspicious activity
   - Deactivate unused accounts

3. **Security:**
   - Use force logout if account is compromised
   - Reset passwords regularly
   - Keep your own password secure

### For All Users

1. **Password Security:**
   - Use strong passwords (8+ chars, mixed case, numbers)
   - Change password regularly
   - Don't share passwords

2. **Session Management:**
   - Logout when done
   - Use "Logout All Devices" if device is lost
   - Don't stay logged in on shared computers

3. **Report Issues:**
   - Contact SUPER_ADMIN if you see permission issues
   - Report suspicious activity
   - Request role/permission changes if needed

---

## FAQ

### Q: Can I change my own role?
**A:** No, only SUPER_ADMIN can change roles.

### Q: Why do I need to change password on first login?
**A:** This is a security requirement to ensure only you know your password.

### Q: What happens if I forget my password?
**A:** Contact SUPER_ADMIN to reset your password.

### Q: Can I access user management as PRODUCT_MANAGER?
**A:** No, only SUPER_ADMIN can manage users.

### Q: Why was I logged out suddenly?
**A:** This could happen if:
- Your password was changed
- SUPER_ADMIN force logged you out
- Token was revoked for security (V1.2)

### Q: How do I get more permissions?
**A:** Contact SUPER_ADMIN to:
- Change your role
- Add custom permissions to your account

---

## Support

For issues or questions:
1. Check this documentation
2. Contact SUPER_ADMIN
3. Review audit logs for activity history
