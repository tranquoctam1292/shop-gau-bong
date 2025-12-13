/**
 * Security Settings Page
 * 
 * V1.2: Security settings including force logout all devices
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToastContext } from '@/components/providers/ToastProvider';
import { signOut } from 'next-auth/react';
import { LogOut } from 'lucide-react';

export default function SecuritySettingsPage() {
  const router = useRouter();
  const { showToast } = useToastContext();
  const [loading, setLoading] = useState(false);

  const handleForceLogoutAll = async () => {
    if (!confirm('Bạn có chắc muốn đăng xuất khỏi tất cả thiết bị? Bạn sẽ cần đăng nhập lại trên mọi thiết bị.')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/admin/auth/logout-all', {
        method: 'POST',
        credentials: 'include',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to logout all devices');
      }

      showToast('Đã đăng xuất khỏi tất cả thiết bị', 'success');

      // Logout and redirect to login
      setTimeout(() => {
        signOut({ callbackUrl: '/admin/login?loggedOutAll=true' });
      }, 1500);
    } catch (error: any) {
      showToast(error.message || 'Đã xảy ra lỗi', 'error');
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Cài đặt bảo mật</CardTitle>
          <CardDescription>Quản lý cài đặt bảo mật tài khoản của bạn</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Force Logout All Devices */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Đăng xuất khỏi tất cả thiết bị</h3>
              <p className="text-sm text-gray-600 mb-4">
                Nếu bạn nghi ngờ tài khoản của mình bị xâm nhập hoặc muốn đảm bảo chỉ bạn có quyền truy cập,
                bạn có thể đăng xuất khỏi tất cả thiết bị ngay lập tức. Tất cả các phiên đăng nhập hiện tại
                sẽ bị chấm dứt và bạn sẽ cần đăng nhập lại.
              </p>
              <Button
                variant="destructive"
                onClick={handleForceLogoutAll}
                disabled={loading}
              >
                <LogOut className="h-4 w-4 mr-2" />
                {loading ? 'Đang xử lý...' : 'Đăng xuất khỏi tất cả thiết bị'}
              </Button>
            </div>
          </div>

          {/* Change Password Link */}
          <div className="pt-4 border-t">
            <h3 className="text-lg font-semibold mb-2">Đổi mật khẩu</h3>
            <p className="text-sm text-gray-600 mb-4">
              Thay đổi mật khẩu của bạn để bảo mật tài khoản tốt hơn.
            </p>
            <Button variant="outline" onClick={() => router.push('/admin/change-password')}>
              Đổi mật khẩu
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
