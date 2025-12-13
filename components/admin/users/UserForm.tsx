/**
 * User Form Component
 * 
 * Form for creating and editing admin users
 */

'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { AdminRole, Permission, AdminUserPublic } from '@/types/admin';
import { ROLE_DISPLAY_NAMES, getRolePermissions } from '@/lib/constants/adminRoles';
import { getAllPermissions } from '@/lib/constants/adminRoles';
import { useCreateAdminUser, useUpdateAdminUser } from '@/lib/hooks/useAdminUsers';

const userFormSchema = z.object({
  username: z.string().min(3, 'Tên đăng nhập phải có ít nhất 3 ký tự').max(50),
  email: z.string().email('Email không hợp lệ'),
  password: z.string().optional(),
  full_name: z.string().min(1, 'Tên đầy đủ không được để trống'),
  role: z.nativeEnum(AdminRole),
  permissions: z.array(z.string()).optional(),
  is_active: z.boolean().default(true),
});

type UserFormData = z.infer<typeof userFormSchema>;

interface UserFormProps {
  userId?: string;
  initialData?: AdminUserPublic;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function UserForm({ userId, initialData, onSuccess, onCancel }: UserFormProps) {
  const isEditMode = !!userId;
  const createMutation = useCreateAdminUser();
  const updateMutation = useUpdateAdminUser();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: initialData
      ? {
          username: initialData.username,
          email: initialData.email,
          full_name: initialData.full_name,
          role: initialData.role,
          permissions: initialData.permissions || [],
          is_active: initialData.is_active,
        }
      : {
          role: AdminRole.VIEWER,
          is_active: true,
          permissions: [],
        },
  });

  const selectedRole = watch('role');
  const selectedPermissions = watch('permissions') || [];
  const allPermissions = getAllPermissions();
  
  // Get default permissions for the selected role
  const defaultRolePermissions = selectedRole ? getRolePermissions(selectedRole) : [];

  const onSubmit = async (data: UserFormData) => {
    try {
      if (isEditMode && userId) {
        // Update user (don't send password if not changing)
        const updateData: any = {
          full_name: data.full_name,
          role: data.role,
          permissions: data.permissions,
          is_active: data.is_active,
        };

        await updateMutation.mutateAsync({
          userId,
          data: updateData,
        });
      } else {
        // Create user (password required)
        if (!data.password || data.password.length < 8) {
          alert('Mật khẩu phải có ít nhất 8 ký tự');
          return;
        }

        await createMutation.mutateAsync({
          username: data.username,
          email: data.email,
          password: data.password,
          full_name: data.full_name,
          role: data.role,
          permissions: data.permissions as Permission[],
          is_active: data.is_active,
        });
      }

      onSuccess?.();
    } catch (error: any) {
      alert(error.message || 'Đã xảy ra lỗi');
    }
  };

  const togglePermission = (permission: Permission) => {
    const current = selectedPermissions;
    if (current.includes(permission)) {
      setValue(
        'permissions',
        current.filter((p) => p !== permission)
      );
    } else {
      setValue('permissions', [...current, permission]);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Username */}
      {!isEditMode && (
        <div className="space-y-2">
          <Label htmlFor="username">Tên đăng nhập *</Label>
          <Input
            id="username"
            {...register('username')}
            disabled={isEditMode || createMutation.isPending || updateMutation.isPending}
          />
          {errors.username && (
            <p className="text-sm text-red-600">{errors.username.message}</p>
          )}
        </div>
      )}

      {/* Email */}
      {!isEditMode && (
        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            {...register('email')}
            disabled={isEditMode || createMutation.isPending || updateMutation.isPending}
          />
          {errors.email && (
            <p className="text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>
      )}

      {/* Password (only for create) */}
      {!isEditMode && (
        <div className="space-y-2">
          <Label htmlFor="password">Mật khẩu *</Label>
          <Input
            id="password"
            type="password"
            {...register('password')}
            disabled={createMutation.isPending}
          />
          <p className="text-sm text-gray-500">
            Tối thiểu 8 ký tự, có chữ hoa, chữ thường và số
          </p>
          {errors.password && (
            <p className="text-sm text-red-600">{errors.password.message}</p>
          )}
        </div>
      )}

      {/* Full Name */}
      <div className="space-y-2">
        <Label htmlFor="full_name">Tên đầy đủ *</Label>
        <Input
          id="full_name"
          {...register('full_name')}
          disabled={createMutation.isPending || updateMutation.isPending}
        />
        {errors.full_name && (
          <p className="text-sm text-red-600">{errors.full_name.message}</p>
        )}
      </div>

      {/* Role */}
      <div className="space-y-2">
        <Label htmlFor="role">Vai trò *</Label>
        <Select
          value={selectedRole}
          onValueChange={(value) => setValue('role', value as AdminRole)}
          disabled={createMutation.isPending || updateMutation.isPending}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(ROLE_DISPLAY_NAMES).map(([role, label]) => (
              <SelectItem key={role} value={role}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.role && (
          <p className="text-sm text-red-600">{errors.role.message}</p>
        )}
      </div>

      {/* Permissions (optional, override role) */}
      {selectedRole !== AdminRole.SUPER_ADMIN && (
        <div className="space-y-2">
          <Label>Quyền (Permissions)</Label>
          
          {/* CRITICAL FIX: Show default role permissions as disabled & checked */}
          {defaultRolePermissions.length > 0 && (
            <div className="mb-3">
              <p className="text-sm font-medium text-gray-700 mb-2">
                Quyền mặc định của vai trò ({ROLE_DISPLAY_NAMES[selectedRole]}):
              </p>
              <div className="border rounded-md p-3 bg-gray-50 space-y-1">
                {defaultRolePermissions.map((permission) => (
                  <div key={permission} className="flex items-center space-x-2">
                    <Checkbox
                      id={`default-perm-${permission}`}
                      checked={true}
                      disabled={true}
                    />
                    <Label
                      htmlFor={`default-perm-${permission}`}
                      className="text-sm font-normal text-gray-600"
                    >
                      {permission} <span className="text-xs text-gray-400">(mặc định)</span>
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Custom permissions (override defaults) */}
          <div className="mb-2">
            <p className="text-sm font-medium text-gray-700 mb-2">
              Quyền tùy chỉnh (bổ sung hoặc override):
            </p>
            <div className="border rounded-md p-4 space-y-2 max-h-48 overflow-y-auto">
              {allPermissions.map((permission) => {
                const isDefault = defaultRolePermissions.includes(permission);
                const isCustomSelected = selectedPermissions.includes(permission);
                
                return (
                  <div key={permission} className="flex items-center space-x-2">
                    <Checkbox
                      id={`perm-${permission}`}
                      checked={isDefault || isCustomSelected}
                      onCheckedChange={() => togglePermission(permission)}
                      disabled={
                        isDefault || 
                        createMutation.isPending || 
                        updateMutation.isPending
                      }
                    />
                    <Label
                      htmlFor={`perm-${permission}`}
                      className={`text-sm font-normal ${
                        isDefault 
                          ? 'text-gray-500 cursor-not-allowed' 
                          : 'cursor-pointer'
                      }`}
                    >
                      {permission}
                      {isDefault && (
                        <span className="text-xs text-gray-400 ml-1">(đã có trong role mặc định)</span>
                      )}
                    </Label>
                  </div>
                );
              })}
            </div>
          </div>
          
          <p className="text-sm text-gray-500">
            💡 <strong>Lưu ý:</strong> Quyền mặc định của vai trò được hiển thị ở trên. 
            Bạn chỉ cần chọn thêm các quyền bổ sung nếu muốn mở rộng quyền cho user này.
          </p>
        </div>
      )}

      {/* Is Active */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="is_active"
          checked={watch('is_active')}
          onCheckedChange={(checked) => setValue('is_active', checked === true)}
          disabled={createMutation.isPending || updateMutation.isPending}
        />
        <Label htmlFor="is_active" className="cursor-pointer">
          Tài khoản đang hoạt động
        </Label>
      </div>

      {/* Actions */}
      <div className="flex justify-end space-x-2 pt-4">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            Hủy
          </Button>
        )}
        <Button
          type="submit"
          disabled={createMutation.isPending || updateMutation.isPending}
        >
          {createMutation.isPending || updateMutation.isPending
            ? 'Đang lưu...'
            : isEditMode
            ? 'Cập nhật'
            : 'Tạo người dùng'}
        </Button>
      </div>
    </form>
  );
}
