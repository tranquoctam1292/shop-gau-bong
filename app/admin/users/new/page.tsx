/**
 * Create New Admin User Page
 */

'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserForm } from '@/components/admin/users/UserForm';
import { PermissionGuard } from '@/components/admin/PermissionGuard';
import { AdminRole } from '@/types/admin';

export default function NewAdminUserPage() {
  const router = useRouter();

  const handleSuccess = () => {
    router.push('/admin/users');
  };

  const handleCancel = () => {
    router.push('/admin/users');
  };

  return (
    <PermissionGuard role={AdminRole.SUPER_ADMIN}>
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Tạo người dùng Admin mới</CardTitle>
          </CardHeader>
          <CardContent>
            <UserForm onSuccess={handleSuccess} onCancel={handleCancel} />
          </CardContent>
        </Card>
      </div>
    </PermissionGuard>
  );
}
