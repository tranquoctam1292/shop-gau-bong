/**
 * Reset Password Page for Admin User
 * 
 * Allows SUPER_ADMIN to reset password for any user
 */

'use client';

import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ObjectId } from 'mongodb';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PermissionGuard } from '@/components/admin/PermissionGuard';
import { AdminRole } from '@/types/admin';
import { useAdminUser } from '@/lib/hooks/useAdminUsers';
import { useToastContext } from '@/components/providers/ToastProvider';

const resetPasswordSchema = z.object({
  new_password: z.string().min(8, 'Mật khẩu phải có ít nhất 8 ký tự'),
  confirm_password: z.string(),
}).refine((data) => data.new_password === data.confirm_password, {
  message: 'Mật khẩu xác nhận không khớp',
  path: ['confirm_password'],
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  // 🔒 SECURITY FIX: Use useParams hook for client components instead of params prop
  const params = useParams();
  const userId = params.id as string;
  const router = useRouter();
  const { showToast } = useToastContext();
  
  // 🔒 SECURITY FIX: Validate userId before fetching
  const isValidUserId = userId && ObjectId.isValid(userId);
  
  // Hook will automatically disable if userId is null/undefined/empty
  const { data: userData, isLoading, error } = useAdminUser(isValidUserId ? userId : null);
  const [loading, setLoading] = useState(false);

  // 🔒 SECURITY FIX: Redirect if userId is invalid
  useEffect(() => {
    if (!isValidUserId) {
      showToast('ID người dùng không hợp lệ', 'error');
      router.push('/admin/users');
    }
  }, [isValidUserId, router, showToast]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    // 🔒 SECURITY FIX: Validate userId before submitting
    if (!isValidUserId || !userId) {
      showToast('ID người dùng không hợp lệ', 'error');
      return;
    }

    if (!confirm('Bạn có chắc muốn reset mật khẩu cho người dùng này? Người dùng sẽ phải đổi mật khẩu khi đăng nhập lại.')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}/reset-password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          new_password: data.new_password,
        }),
      });

      // 🔒 SECURITY FIX: Better error handling
      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        
        // Handle specific error codes
        if (response.status === 403) {
          showToast('Bạn không có quyền thực hiện hành động này', 'error');
          return;
        }
        
        if (response.status === 404) {
          showToast('Người dùng không tồn tại', 'error');
          router.push('/admin/users');
          return;
        }
        
        throw new Error(result.message || result.error || 'Không thể reset mật khẩu');
      }

      const result = await response.json();
      showToast(result.message || 'Đã reset mật khẩu thành công', 'success');
      router.push('/admin/users');
    } catch (error: unknown) {
      // 🔒 SECURITY FIX: Better error handling with type safety
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Đã xảy ra lỗi không xác định';
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  // 🔒 SECURITY FIX: Don't render if userId is invalid
  if (!isValidUserId) {
    return null; // Will redirect via useEffect
  }

  if (isLoading) {
    return (
      <PermissionGuard role={AdminRole.SUPER_ADMIN}>
      <div className="p-6">
        <div className="text-center py-8">Đang tải...</div>
      </div>
      </PermissionGuard>
    );
  }

  // 🔒 SECURITY FIX: Handle error state
  if (error || !userData?.data) {
    return (
      <PermissionGuard role={AdminRole.SUPER_ADMIN}>
        <div className="p-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-red-600 text-center">
                {(error as Error)?.message || 'Không tìm thấy người dùng'}
              </div>
              <div className="mt-4 text-center">
                <Button onClick={() => router.push('/admin/users')} variant="outline">
                  Quay lại danh sách người dùng
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </PermissionGuard>
    );
  }

  const user = userData.data;

  return (
    <PermissionGuard role={AdminRole.SUPER_ADMIN}>
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Reset mật khẩu</CardTitle>
            <CardDescription>
              Reset mật khẩu cho: {user?.username} ({user?.email})
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-800">
                  <strong>Lưu ý:</strong> Reset mật khẩu sẽ đăng xuất người dùng khỏi tất cả thiết bị.
                  Người dùng sẽ phải đổi mật khẩu khi đăng nhập lại.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="new_password">Mật khẩu mới *</Label>
                <Input
                  id="new_password"
                  type="password"
                  {...register('new_password')}
                  disabled={loading}
                />
                <p className="text-sm text-gray-500">
                  Tối thiểu 8 ký tự, có chữ hoa, chữ thường và số
                </p>
                {errors.new_password && (
                  <p className="text-sm text-red-600">{errors.new_password.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm_password">Xác nhận mật khẩu *</Label>
                <Input
                  id="confirm_password"
                  type="password"
                  {...register('confirm_password')}
                  disabled={loading}
                />
                {errors.confirm_password && (
                  <p className="text-sm text-red-600">{errors.confirm_password.message}</p>
                )}
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={loading}
                >
                  Hủy
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Đang reset...' : 'Reset mật khẩu'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </PermissionGuard>
  );
}
