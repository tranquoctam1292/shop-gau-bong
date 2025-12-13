/**
 * Change Password Page
 * 
 * Allows current user to change their own password
 * V1.2: Shows warning that changing password will logout all devices
 */

'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToastContext } from '@/components/providers/ToastProvider';
import { signOut, useSession } from 'next-auth/react';

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Mật khẩu hiện tại không được để trống'),
  newPassword: z.string().min(8, 'Mật khẩu mới phải có ít nhất 8 ký tự'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Mật khẩu xác nhận không khớp',
  path: ['confirmPassword'],
});

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

function ChangePasswordForm() {
  // IMPORTANT: All hooks must be called before any conditional returns
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const { showToast } = useToastContext();
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Handle hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Show warning if password change is required
  const isRequired = searchParams.get('required') === 'true';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
  });

  // Show loading state after all hooks are called
  if (status === 'loading' || !mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  const onSubmit = async (data: ChangePasswordFormData) => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to change password');
      }

      showToast('Đổi mật khẩu thành công. Vui lòng đăng nhập lại', 'success');

      // V1.2: Logout and redirect to login (password change increments token_version)
      setTimeout(() => {
        signOut({ callbackUrl: '/admin/login?passwordChanged=true' });
      }, 1500);
    } catch (error: any) {
      showToast(error.message || 'Đã xảy ra lỗi', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-6">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Đổi mật khẩu</CardTitle>
          <CardDescription>
            {isRequired 
              ? 'Bạn phải đổi mật khẩu trước khi tiếp tục sử dụng hệ thống'
              : 'Thay đổi mật khẩu tài khoản của bạn'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* V1.2: Warning about force logout */}
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">
                <strong>Lưu ý quan trọng:</strong> Thay đổi mật khẩu sẽ đăng xuất bạn khỏi tất cả thiết bị
                để đảm bảo bảo mật. Bạn sẽ cần đăng nhập lại sau khi đổi mật khẩu.
              </p>
            </div>

            {/* Show message if password change is required */}
            {isRequired && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-800">
                  <strong>Yêu cầu bắt buộc:</strong> Đây là lần đăng nhập đầu tiên hoặc mật khẩu của bạn đã được reset.
                  Vui lòng đổi mật khẩu để tiếp tục.
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="currentPassword">Mật khẩu hiện tại *</Label>
              <Input
                id="currentPassword"
                type="password"
                {...register('currentPassword')}
                disabled={loading}
              />
              {errors.currentPassword && (
                <p className="text-sm text-red-600">{errors.currentPassword.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">Mật khẩu mới *</Label>
              <Input
                id="newPassword"
                type="password"
                {...register('newPassword')}
                disabled={loading}
              />
              <p className="text-sm text-gray-500">
                Tối thiểu 8 ký tự, có chữ hoa, chữ thường và số
              </p>
              {errors.newPassword && (
                <p className="text-sm text-red-600">{errors.newPassword.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Xác nhận mật khẩu mới *</Label>
              <Input
                id="confirmPassword"
                type="password"
                {...register('confirmPassword')}
                disabled={loading}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-red-600">{errors.confirmPassword.message}</p>
              )}
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              {!isRequired && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/admin')}
                  disabled={loading}
                >
                  Hủy
                </Button>
              )}
              <Button type="submit" disabled={loading}>
                {loading ? 'Đang đổi mật khẩu...' : 'Đổi mật khẩu'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ChangePasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      </div>
    }>
      <ChangePasswordForm />
    </Suspense>
  );
}
