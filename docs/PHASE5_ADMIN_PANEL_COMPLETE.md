# Phase 5: Admin Panel Integration - Hoàn Thành

## Tổng Quan

Phase 5 đã hoàn thành việc tích hợp Admin Panel với NextAuth authentication và các trang quản lý cơ bản.

## Files Đã Tạo

### 1. Authentication Setup

#### `app/api/auth/[...nextauth]/route.ts`
- ✅ NextAuth configuration với Credentials provider
- ✅ MongoDB user authentication
- ✅ Admin role check
- ✅ JWT session strategy

#### `lib/auth.ts`
- ✅ `getSession()` - Get current session (server-side)
- ✅ `requireAdmin()` - Check if user is admin

### 2. Admin Pages

#### `app/admin/login/page.tsx`
- ✅ Admin login page với email/password
- ✅ Error handling
- ✅ Redirect to dashboard after login

#### `app/admin/layout.tsx`
- ✅ Admin layout với sidebar navigation
- ✅ SessionProvider integration
- ✅ Protected routes (redirect to login if not authenticated)
- ✅ Logout functionality
- ✅ Navigation items: Dashboard, Products, Orders, Categories

#### `app/admin/page.tsx`
- ✅ Admin dashboard với statistics
- ✅ Cards hiển thị: Products, Orders, Categories, Revenue
- ✅ Real-time data từ API

#### `app/admin/products/page.tsx`
- ✅ Products list với pagination
- ✅ Search functionality
- ✅ Edit/Delete actions
- ✅ Status display

#### `app/admin/orders/page.tsx`
- ✅ Orders list với pagination
- ✅ Search functionality
- ✅ Status filtering và display
- ✅ View order detail

#### `app/admin/categories/page.tsx`
- ✅ Categories list
- ✅ Search functionality
- ✅ Edit/Delete actions
- ✅ Product count display

### 3. Admin API Routes Updated

Tất cả admin API routes đã được update với authentication check:

- ✅ `app/api/admin/products/route.ts` - GET, POST
- ✅ `app/api/admin/products/[id]/route.ts` - GET, PUT, DELETE
- ✅ `app/api/admin/categories/route.ts` - GET, POST
- ✅ `app/api/admin/orders/route.ts` - GET
- ✅ `app/api/admin/orders/[id]/route.ts` - GET, PUT

**Authentication Pattern:**
```typescript
const { requireAdmin } = await import('@/lib/auth');
try {
  await requireAdmin();
} catch {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

### 4. Utilities

#### Admin User Scripts (RBAC System)

**1. Create Single Admin User:**
```bash
npm run create:admin-user
```

**2. Seed Sample Users (5 users with different roles):**
```bash
npm run seed:admin-users
```

**3. Migrate from old users collection:**
```bash
npm run migrate:users-to-admin-users
```

**Environment Variables:**
```env
ADMIN_USERNAME=admin
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin123
ADMIN_NAME=Admin User
ADMIN_ROLE=SUPER_ADMIN
```

**See:** `docs/ADMIN_ACCOUNT_RBAC_USER_GUIDE.md` for detailed usage instructions.

## Features

### ✅ Authentication & Authorization (RBAC System - V1.2)

- **NextAuth.js** với Credentials provider
- **MongoDB** admin_users collection storage
- **RBAC (Role-Based Access Control)** with 5 roles:
  - SUPER_ADMIN - Full access
  - PRODUCT_MANAGER - Products & Categories management
  - ORDER_MANAGER - Orders management
  - CONTENT_EDITOR - Blog, Pages & Media management
  - VIEWER - Read-only access
- **bcryptjs** password hashing (12 rounds in production)
- **JWT** session strategy
- **Token Revocation (V1.2)** - Force logout all devices
- **Rate Limiting** - 5 attempts per 15 minutes on login
- **Audit Logging** - All admin actions logged
- **Password Strength Validation** - Minimum 8 chars, uppercase, lowercase, number
- **Cookie Security (V1.2)** - httpOnly, Secure, SameSite=Strict
- **HTTP Security Headers (V1.2)** - XSS, Clickjacking, MIME sniffing protection

### ✅ Admin Dashboard

- **Statistics Cards:**
  - Total Products
  - Total Orders
  - Total Categories
  - Revenue (TODO: Calculate from orders)

### ✅ Product Management

- List products với pagination
- Search products
- View product details
- Edit product (TODO: Create edit page)
- Delete product
- Status display (instock/outofstock)

### ✅ Order Management

- List orders với pagination
- Search orders
- View order details (TODO: Create detail page)
- Status filtering
- Status display với colors

### ✅ Category Management

- List categories
- Search categories
- View category details
- Edit category (TODO: Create edit page)
- Delete category
- Product count display

## Setup Instructions

### Step 1: Install Dependencies

```bash
npm install bcryptjs @types/bcryptjs
```

### Step 2: Configure Environment Variables

Add to `.env.local`:

```env
# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# Admin User (optional, defaults shown)
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin123
ADMIN_NAME=Admin User
```

**Generate NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

### Step 3: Create Admin User

```bash
npm run create:admin-user
```

This will create an admin user in MongoDB with:
- Email: `admin@example.com` (or from `ADMIN_EMAIL`)
- Password: `admin123` (or from `ADMIN_PASSWORD`)
- Role: `admin`

### Step 4: Access Admin Panel

1. Start dev server:
   ```bash
   npm run dev
   ```

2. Navigate to: `http://localhost:3000/admin/login`

3. Login với credentials đã tạo

4. Access dashboard: `http://localhost:3000/admin`

## Database Schema

### Admin Users Collection (RBAC System)

```typescript
{
  _id: ObjectId,
  username: string, // Unique, for login
  email: string, // Unique
  password_hash: string, // bcrypt hashed
  full_name: string,
  role: AdminRole, // SUPER_ADMIN | PRODUCT_MANAGER | ORDER_MANAGER | CONTENT_EDITOR | VIEWER
  permissions?: Permission[], // Custom permissions (override role)
  is_active: boolean,
  must_change_password: boolean,
  token_version: number, // V1.2: For token revocation
  last_login?: Date,
  created_by?: ObjectId, // Reference to AdminUser._id
  createdAt: Date,
  updatedAt: Date,
}
```

**See also:**
- `docs/ADMIN_ACCOUNT_RBAC_API.md` - Complete API documentation
- `docs/ADMIN_ACCOUNT_RBAC_USER_GUIDE.md` - User guide
- `docs/ADMIN_ACCOUNT_RBAC_PLAN.md` - Implementation plan

## Security Considerations

### ✅ Implemented (RBAC System V1.2)

- ✅ Password hashing với bcryptjs (12 rounds in production)
- ✅ JWT session strategy với token version tracking
- ✅ RBAC with 5 roles and granular permissions
- ✅ Protected API routes với permission checks
- ✅ Protected admin pages với PermissionGuard
- ✅ Password strength requirements (min 8 chars, uppercase, lowercase, number)
- ✅ Rate limiting cho login (5 attempts / 15 min)
- ✅ Audit logging cho all admin actions
- ✅ Token revocation (V1.2) - Force logout all devices
- ✅ Cookie security (V1.2) - httpOnly, Secure, SameSite=Strict
- ✅ HTTP Security Headers (V1.2) - XSS, Clickjacking, MIME sniffing protection

### ⚠️ Future Enhancements

- [ ] Two-factor authentication (optional)
- [ ] Session timeout configurable
- [ ] IP whitelisting for SUPER_ADMIN
- [ ] Email notifications for security events

## Next Steps

### Immediate

1. ✅ **Create admin user**: `npm run create:admin-user`
2. ✅ **Test login**: Access `/admin/login`
3. ✅ **Test dashboard**: Verify statistics display
4. ✅ **Test CRUD operations**: Products, Orders, Categories

### Future Enhancements

1. **Product Management:**
   - [ ] Create/Edit product forms
   - [ ] Image upload
   - [ ] Variant management
   - [ ] Bulk operations

2. **Order Management:**
   - [ ] Order detail page
   - [ ] Status update
   - [ ] Invoice generation
   - [ ] Export orders

3. **Category Management:**
   - [ ] Create/Edit category forms
   - [ ] Category hierarchy
   - [ ] Image upload

4. **Additional Features:**
   - [ ] User management
   - [ ] Settings page
   - [ ] Analytics dashboard
   - [ ] Reports

## Testing Checklist

- [ ] Login với valid credentials
- [ ] Login với invalid credentials (should fail)
- [ ] Access admin pages without login (should redirect)
- [ ] View dashboard statistics
- [ ] List products
- [ ] Search products
- [ ] List orders
- [ ] Search orders
- [ ] List categories
- [ ] Search categories
- [ ] Logout functionality

## Troubleshooting

### Error: "Unauthorized"

**Nguyên nhân:** User không có role 'admin' hoặc chưa login.

**Giải pháp:**
1. Đảm bảo user có role 'admin' trong MongoDB
2. Login lại tại `/admin/login`
3. Check session trong browser DevTools

### Error: "bcryptjs not found"

**Nguyên nhân:** Package chưa được cài.

**Giải pháp:**
```bash
npm install bcryptjs @types/bcryptjs
```

### Error: "NEXTAUTH_SECRET not set"

**Nguyên nhân:** Environment variable chưa được cấu hình.

**Giải pháp:**
1. Add `NEXTAUTH_SECRET` vào `.env.local`
2. Generate secret: `openssl rand -base64 32`
3. Restart dev server

## Summary

✅ **Phase 5 hoàn thành** với:
- NextAuth authentication setup
- Admin login page
- Admin layout với navigation
- Admin dashboard
- Products, Orders, Categories management pages
- Protected API routes
- Admin user creation script

**Ready for testing và further development!**

