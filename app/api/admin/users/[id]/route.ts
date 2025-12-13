/**
 * Admin Users API Route - User Detail
 * GET /api/admin/users/[id] - Get user detail
 * PUT /api/admin/users/[id] - Update user
 * DELETE /api/admin/users/[id] - Soft delete user
 * 
 * Requires: SUPER_ADMIN permission
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuthAdmin, requireSuperAdmin } from '@/lib/middleware/authMiddleware';
import { getCollections, ObjectId } from '@/lib/db';
import { logActivity } from '@/lib/utils/auditLogger';
import { AdminAction, AdminRole, Permission } from '@/types/admin';
import { isValidPermission } from '@/lib/constants/adminRoles';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const updateUserSchema = z.object({
  full_name: z.string().min(1).optional(),
  role: z.nativeEnum(AdminRole).optional(),
  permissions: z.array(z.string()).optional(),
  is_active: z.boolean().optional(),
});

/**
 * Map AdminUser to AdminUserPublic (remove sensitive fields)
 */
function mapToPublicUser(user: any): any {
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
 * GET /api/admin/users/[id]
 * Get user detail
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
      const { id } = params;
      
      if (!ObjectId.isValid(id)) {
        return NextResponse.json(
          {
            success: false,
            code: 'INVALID_ID',
            message: 'ID không hợp lệ',
          },
          { status: 400 }
        );
      }

      const { adminUsers } = await getCollections();
      const user = await adminUsers.findOne({ _id: new ObjectId(id) });

      if (!user) {
        return NextResponse.json(
          {
            success: false,
            code: 'USER_NOT_FOUND',
            message: 'Người dùng không tồn tại',
          },
          { status: 404 }
        );
      }

      const publicUser = mapToPublicUser(user);

      return NextResponse.json({
        success: true,
        data: publicUser,
      });
    } catch (error) {
      console.error('[Get User] Error:', error);
      return NextResponse.json(
        {
          success: false,
          code: 'INTERNAL_ERROR',
          message: 'Đã xảy ra lỗi khi lấy thông tin người dùng',
        },
        { status: 500 }
      );
    }
  }, 'admin:manage');
}

/**
 * PUT /api/admin/users/[id]
 * Update user
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
          message: 'Chỉ quản trị viên cấp cao mới có quyền cập nhật người dùng',
        },
        { status: 403 }
      );
    }

    try {
      const { id } = params;
      
      if (!ObjectId.isValid(id)) {
        return NextResponse.json(
          {
            success: false,
            code: 'INVALID_ID',
            message: 'ID không hợp lệ',
          },
          { status: 400 }
        );
      }

      const userId = new ObjectId(id);
      const currentUserId = new ObjectId(req.adminUser._id);

      // Prevent self-modification of role/is_active
      const isSelfModification = userId.equals(currentUserId);

      const body = await request.json();
      const validation = updateUserSchema.safeParse(body);

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

      const { full_name, role, permissions, is_active } = validation.data;

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

      // Prevent self-modification of critical fields
      if (isSelfModification) {
        if (role !== undefined || is_active !== undefined) {
          return NextResponse.json(
            {
              success: false,
              code: 'SELF_MODIFICATION_DENIED',
              message: 'Bạn không thể thay đổi vai trò hoặc trạng thái tài khoản của chính mình',
            },
            { status: 400 }
          );
        }
      }

      const { adminUsers } = await getCollections();

      // Get user before update (for audit log)
      const userBefore = await adminUsers.findOne({ _id: userId });
      if (!userBefore) {
        return NextResponse.json(
          {
            success: false,
            code: 'USER_NOT_FOUND',
            message: 'Người dùng không tồn tại',
          },
          { status: 404 }
        );
      }

      // Build update object
      const updateData: any = {
        updatedAt: new Date(),
      };

      if (full_name !== undefined) {
        updateData.full_name = full_name;
      }
      if (role !== undefined) {
        updateData.role = role;
      }
      if (permissions !== undefined) {
        updateData.permissions = permissions as Permission[];
      }
      if (is_active !== undefined) {
        updateData.is_active = is_active;
      }

      // Update user
      await adminUsers.updateOne(
        { _id: userId },
        { $set: updateData }
      );

      // Get updated user
      const userAfter = await adminUsers.findOne({ _id: userId });

      // Log activity
      await logActivity(
        AdminAction.UPDATE_USER,
        req.adminUser._id.toString(),
        {
          target_collection: 'admin_users',
          target_id: id,
          old_value: {
            full_name: userBefore.full_name,
            role: userBefore.role,
            permissions: userBefore.permissions,
            is_active: userBefore.is_active,
          },
          new_value: updateData,
        },
        request
      );

      const publicUser = userAfter ? mapToPublicUser(userAfter) : null;

      return NextResponse.json({
        success: true,
        data: publicUser,
        message: 'Cập nhật người dùng thành công',
      });
    } catch (error) {
      console.error('[Update User] Error:', error);
      return NextResponse.json(
        {
          success: false,
          code: 'INTERNAL_ERROR',
          message: 'Đã xảy ra lỗi khi cập nhật người dùng',
        },
        { status: 500 }
      );
    }
  }, 'admin:manage');
}

/**
 * DELETE /api/admin/users/[id]
 * Soft delete user (set is_active = false)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
          message: 'Chỉ quản trị viên cấp cao mới có quyền xóa người dùng',
        },
        { status: 403 }
      );
    }

    try {
      const { id } = params;
      
      if (!ObjectId.isValid(id)) {
        return NextResponse.json(
          {
            success: false,
            code: 'INVALID_ID',
            message: 'ID không hợp lệ',
          },
          { status: 400 }
        );
      }

      const userId = new ObjectId(id);
      const currentUserId = new ObjectId(req.adminUser._id);

      // Prevent self-deletion
      if (userId.equals(currentUserId)) {
        return NextResponse.json(
          {
            success: false,
            code: 'SELF_DELETION_DENIED',
            message: 'Bạn không thể xóa tài khoản của chính mình',
          },
          { status: 400 }
        );
      }

      const { adminUsers } = await getCollections();

      // Get user before delete (for audit log)
      const userBefore = await adminUsers.findOne({ _id: userId });
      if (!userBefore) {
        return NextResponse.json(
          {
            success: false,
            code: 'USER_NOT_FOUND',
            message: 'Người dùng không tồn tại',
          },
          { status: 404 }
        );
      }

      // Soft delete (set is_active = false)
      await adminUsers.updateOne(
        { _id: userId },
        {
          $set: {
            is_active: false,
            updatedAt: new Date(),
          },
        }
      );

      // Log activity
      await logActivity(
        AdminAction.DELETE_USER,
        req.adminUser._id.toString(),
        {
          target_collection: 'admin_users',
          target_id: id,
          old_value: {
            username: userBefore.username,
            email: userBefore.email,
            is_active: userBefore.is_active,
          },
        },
        request
      );

      return NextResponse.json({
        success: true,
        message: 'Đã vô hiệu hóa người dùng thành công',
      });
    } catch (error) {
      console.error('[Delete User] Error:', error);
      return NextResponse.json(
        {
          success: false,
          code: 'INTERNAL_ERROR',
          message: 'Đã xảy ra lỗi khi xóa người dùng',
        },
        { status: 500 }
      );
    }
  }, 'admin:manage');
}
