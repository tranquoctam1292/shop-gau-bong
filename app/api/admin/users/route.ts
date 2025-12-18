/**
 * Admin Users API Route
 * GET /api/admin/users - List admin users
 * POST /api/admin/users - Create new admin user
 * 
 * Requires: SUPER_ADMIN permission
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuthAdmin, requireSuperAdmin } from '@/lib/middleware/authMiddleware';
import { getCollections, ObjectId } from '@/lib/db';
import { hashPassword, validatePasswordStrength } from '@/lib/utils/passwordUtils';
import { logActivity } from '@/lib/utils/auditLogger';
import { AdminAction, AdminRole, Permission, CreateAdminUserInput, AdminUserPublic } from '@/types/admin';
import { isValidPermission } from '@/lib/constants/adminRoles';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const createUserSchema = z.object({
  username: z.string().min(3, 'Tên đăng nhập phải có ít nhất 3 ký tự').max(50),
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(1, 'Mật khẩu không được để trống'),
  full_name: z.string().min(1, 'Tên đầy đủ không được để trống'),
  role: z.nativeEnum(AdminRole, {
    errorMap: () => ({ message: 'Vai trò không hợp lệ' }),
  }),
  permissions: z.array(z.string()).optional(),
  is_active: z.boolean().optional().default(true),
});

/**
 * Map AdminUser to AdminUserPublic (remove sensitive fields)
 */
function mapToPublicUser(user: any): AdminUserPublic {
  return {
    _id: user._id.toString(),
    username: user.username,
    email: user.email,
    full_name: user.full_name,
    role: user.role,
    permissions: user.permissions || [],
    is_active: user.is_active,
    must_change_password: user.must_change_password,
    last_login: user.last_login,
    created_by: user.created_by?.toString(),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

/**
 * GET /api/admin/users
 * List admin users with pagination and filters
 */
export async function GET(request: NextRequest) {
  return withAuthAdmin(request, async (req) => {
    if (!req.adminUser) {
      return NextResponse.json(
        {
          success: false,
          code: 'UNAUTHORIZED',
          message: 'Unauthorized',
        },
        { status: 401 }
      );
    }

    // Check SUPER_ADMIN permission
    if (!requireSuperAdmin(req.adminUser)) {
      return NextResponse.json(
        {
          success: false,
          code: 'PERMISSION_DENIED',
          message: 'Chỉ quản trị viên cấp cao mới có quyền truy cập',
        },
        { status: 403 }
      );
    }

    try {
      const searchParams = request.nextUrl.searchParams;
      const page = parseInt(searchParams.get('page') || '1', 10);
      const limit = parseInt(searchParams.get('limit') || '20', 10);
      const search = searchParams.get('search') || '';
      const role = searchParams.get('role') as AdminRole | null;
      const isActiveParam = searchParams.get('is_active');

      const { adminUsers } = await getCollections();

      // Build query
      const query: any = {};

      // Search filter (username, email, full_name)
      if (search) {
        query.$or = [
          { username: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { full_name: { $regex: search, $options: 'i' } },
        ];
      }

      // Role filter
      if (role) {
        query.role = role;
      }

      // is_active filter
      if (isActiveParam !== null && isActiveParam !== '') {
        query.is_active = isActiveParam === 'true';
      }

      // Get total count
      const total = await adminUsers.countDocuments(query);

      // Get users with pagination
      const skip = (page - 1) * limit;
      const users = await adminUsers
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray();

      // Map to public format (remove password_hash)
      const publicUsers = users.map(mapToPublicUser);

      return NextResponse.json({
        success: true,
        data: {
          users: publicUsers,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error('[Get Users] Error:', error);
      return NextResponse.json(
        {
          success: false,
          code: 'INTERNAL_ERROR',
          message: 'Đã xảy ra lỗi khi lấy danh sách người dùng',
        },
        { status: 500 }
      );
    }
  }, 'admin:manage');
}

/**
 * POST /api/admin/users
 * Create new admin user
 */
export async function POST(request: NextRequest) {
  return withAuthAdmin(request, async (req) => {
    if (!req.adminUser) {
      return NextResponse.json(
        {
          success: false,
          code: 'UNAUTHORIZED',
          message: 'Unauthorized',
        },
        { status: 401 }
      );
    }

    // Check SUPER_ADMIN permission
    if (!requireSuperAdmin(req.adminUser)) {
      return NextResponse.json(
        {
          success: false,
          code: 'PERMISSION_DENIED',
          message: 'Chỉ quản trị viên cấp cao mới có quyền tạo người dùng',
        },
        { status: 403 }
      );
    }

    try {
      const body = await request.json();

      // Validate input
      const validation = createUserSchema.safeParse(body);
      if (!validation.success) {
        return NextResponse.json(
          {
            success: false,
            code: 'VALIDATION_ERROR',
            message: validation.error.errors[0]?.message || 'Dữ liệu không hợp lệ',
            errors: validation.error.errors,
          },
          { status: 400 }
        );
      }

      const { username, email, password, full_name, role, permissions, is_active } = validation.data;

      // Validate permissions if provided
      if (permissions && permissions.length > 0) {
        const invalidPerms = permissions.filter((perm) => !isValidPermission(perm));
        if (invalidPerms.length > 0) {
          return NextResponse.json(
            {
              success: false,
              code: 'INVALID_PERMISSIONS',
              message: `Quyền không hợp lệ: ${invalidPerms.join(', ')}`,
            },
            { status: 400 }
          );
        }
      }

      // Validate password strength
      const strengthCheck = validatePasswordStrength(password);
      if (!strengthCheck.valid) {
        return NextResponse.json(
          {
            success: false,
            code: 'WEAK_PASSWORD',
            message: 'Mật khẩu không đủ mạnh',
            errors: strengthCheck.errors,
          },
          { status: 400 }
        );
      }

      const { adminUsers } = await getCollections();

      // Check username uniqueness
      const existingUserByUsername = await adminUsers.findOne({ username });
      if (existingUserByUsername) {
        return NextResponse.json(
          {
            success: false,
            code: 'USERNAME_EXISTS',
            message: 'Tên đăng nhập đã tồn tại',
          },
          { status: 400 }
        );
      }

      // Check email uniqueness
      const existingUserByEmail = await adminUsers.findOne({ email });
      if (existingUserByEmail) {
        return NextResponse.json(
          {
            success: false,
            code: 'EMAIL_EXISTS',
            message: 'Email đã tồn tại',
          },
          { status: 400 }
        );
      }

      // Hash password
      const passwordHash = await hashPassword(password);

      // Create user
      const now = new Date();
      const newUser = {
        username,
        email,
        password_hash: passwordHash,
        full_name,
        role: role as AdminRole,
        permissions: (permissions as Permission[]) || [],
        is_active: is_active ?? true,
        must_change_password: true, // Force password change on first login
        token_version: 0, // V1.2: Token version for revocation
        version: 1, // Optimistic locking: Start at version 1
        created_by: new ObjectId(req.adminUser._id),
        createdAt: now,
        updatedAt: now,
      };

      const result = await adminUsers.insertOne(newUser);

      // Log activity
      await logActivity(
        AdminAction.CREATE_USER,
        req.adminUser._id.toString(),
        {
          target_collection: 'admin_users',
          target_id: result.insertedId.toString(),
          new_value: {
            username,
            email,
            full_name,
            role,
          },
        },
        request
      );

      // Get created user (without password_hash)
      const createdUser = await adminUsers.findOne({ _id: result.insertedId });
      const publicUser = createdUser ? mapToPublicUser(createdUser) : null;

      return NextResponse.json(
        {
          success: true,
          data: publicUser,
          message: 'Tạo người dùng thành công',
        },
        { status: 201 }
      );
    } catch (error) {
      console.error('[Create User] Error:', error);
      return NextResponse.json(
        {
          success: false,
          code: 'INTERNAL_ERROR',
          message: 'Đã xảy ra lỗi khi tạo người dùng',
        },
        { status: 500 }
      );
    }
  }, 'admin:manage');
}
