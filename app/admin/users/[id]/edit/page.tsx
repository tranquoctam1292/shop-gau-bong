/**
 * Edit Admin User Page
 */

'use client';

import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { UserForm } from '@/components/admin/users/UserForm';
import { PermissionGuard } from '@/components/admin/PermissionGuard';
import { AdminRole } from '@/types/admin';
import { useAdminUser } from '@/lib/hooks/useAdminUsers';

export default function EditAdminUserPage() {
  // CRITICAL FIX: Use useParams hook for client components instead of params prop
  const params = useParams();
  const userId = params.id as string;
  const router = useRouter();
  const { data, isLoading, error } = useAdminUser(userId);

  const handleSuccess = () => {
    router.push('/admin/users');
  };

  const handleCancel = () => {
    router.push('/admin/users');
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center py-8">Đang tải...</div>
      </div>
    );
  }

  if (error || !data?.data) {
    return (
      <div className="p-6">
        <div className="text-red-600">Lỗi: {(error as Error)?.message || 'Không tìm thấy người dùng'}</div>
      </div>
    );
  }

  return (
    <PermissionGuard role={AdminRole.SUPER_ADMIN}>
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Chỉnh sửa người dùng</CardTitle>
            <CardDescription>Chỉnh sửa thông tin người dùng admin</CardDescription>
          </CardHeader>
          <CardContent>
            <UserForm
              userId={userId}
              initialData={data.data}
              onSuccess={handleSuccess}
              onCancel={handleCancel}
            />
          </CardContent>
        </Card>
      </div>
    </PermissionGuard>
  );
}
