/**
 * Admin Auth API - Get Current User
 * GET /api/admin/auth/me
 * 
 * Returns current authenticated admin user information
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuthAdmin } from '@/lib/middleware/authMiddleware';
import { AdminUserPublic } from '@/types/admin';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';

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

    const publicUser = mapToPublicUser(req.adminUser);

    return NextResponse.json({
      success: true,
      data: publicUser,
    });
  });
}
