'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Eye, Save, Send, Loader2, Lock, Globe, Key, Trash2, Edit2, Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface PublishBoxProps {
  status: 'draft' | 'publish' | 'trash';
  isActive: boolean;
  visibility?: 'public' | 'private' | 'password';
  scheduledDate?: Date | string | null;
  password?: string;
  onStatusChange: (status: 'draft' | 'publish' | 'trash') => void;
  onIsActiveChange: (isActive: boolean) => void;
  onVisibilityChange?: (visibility: 'public' | 'private' | 'password') => void;
  onPasswordChange?: (password: string) => void;
  onScheduledDateChange?: (date: Date | null) => void;
  onPublish: () => void;
  onSaveDraft: () => void;
  onPreview?: () => void;
  onDelete?: () => void;
  loading?: boolean;
  productId?: string;
  productSlug?: string;
  hasUnsavedChanges?: boolean;
}

/**
 * Publish Box - Sidebar component cho publish/save actions
 * Theo spec publish_box.md:
 * - Top Actions (Lưu nháp, Xem thử)
 * - Status Info với icon màu và nút Chỉnh sửa
 * - Visibility (Công khai/Riêng tư/Mật khẩu)
 * - Schedule với Date & Time Picker
 * - Primary Action (Đăng/Cập nhật)
 * - Footer (Di chuyển vào thùng rác)
 * - Unsaved Changes Warning
 */
export function PublishBox({
  status,
  isActive,
  visibility = 'public',
  scheduledDate,
  password = '',
  onStatusChange,
  onIsActiveChange,
  onVisibilityChange,
  onPasswordChange,
  onScheduledDateChange,
  onPublish,
  onSaveDraft,
  onPreview,
  onDelete,
  loading = false,
  productId,
  productSlug,
  hasUnsavedChanges = false,
}: PublishBoxProps) {
  const [showStatusEdit, setShowStatusEdit] = useState(false);
  const [showSchedulePicker, setShowSchedulePicker] = useState(false);
  const [scheduleDateTime, setScheduleDateTime] = useState<string>('');
  const [showPasswordInput, setShowPasswordInput] = useState(visibility === 'password');
  const [passwordValue, setPasswordValue] = useState(password);

  // Status display với icon màu
  const getStatusDisplay = () => {
    switch (status) {
      case 'publish':
        return { text: 'Đã đăng', icon: '🟢', color: 'text-green-600' };
      case 'draft':
        return { text: 'Bản nháp', icon: '🟡', color: 'text-yellow-600' };
      case 'trash':
        return { text: 'Thùng rác', icon: '🔴', color: 'text-red-600' };
      default:
        return { text: 'Bản nháp', icon: '🟡', color: 'text-yellow-600' };
    }
  };

  const statusDisplay = getStatusDisplay();

  // Format scheduled date
  useEffect(() => {
    if (scheduledDate) {
      const date = scheduledDate instanceof Date ? scheduledDate : new Date(scheduledDate);
      // Format for datetime-local input: YYYY-MM-DDTHH:mm
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      setScheduleDateTime(`${year}-${month}-${day}T${hours}:${minutes}`);
    } else {
      setScheduleDateTime('');
    }
  }, [scheduledDate]);

  // Auto-save đã bị loại bỏ hoàn toàn - chỉ lưu khi người dùng click button
  // Không có useEffect nào tự động gọi onSaveDraft hoặc onPublish

  // Unsaved Changes Warning
  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'Dữ liệu chưa được lưu sẽ bị mất. Bạn có chắc chắn muốn rời đi?';
      return e.returnValue;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  const handlePreview = () => {
    if (onPreview) {
      onPreview();
    } else if (productSlug) {
      window.open(`/products/${productSlug}`, '_blank');
    } else {
      alert('Vui lòng nhập slug để xem trước sản phẩm');
    }
  };

  const handleScheduleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setScheduleDateTime(value);
    if (value && onScheduledDateChange) {
      const date = new Date(value);
      onScheduledDateChange(date);
    } else if (!value && onScheduledDateChange) {
      onScheduledDateChange(null);
    }
  };

  const handleVisibilityChange = (newVisibility: 'public' | 'private' | 'password') => {
    if (onVisibilityChange) {
      onVisibilityChange(newVisibility);
    }
    setShowPasswordInput(newVisibility === 'password');
    if (newVisibility !== 'password' && onPasswordChange) {
      onPasswordChange('');
      setPasswordValue('');
    }
  };

  const handlePasswordChange = (value: string) => {
    setPasswordValue(value);
    if (onPasswordChange) {
      onPasswordChange(value);
    }
  };

  const handleDelete = () => {
    if (confirm('Bạn có chắc chắn muốn di chuyển sản phẩm này vào thùng rác?')) {
      if (onDelete) {
        onDelete();
      } else {
        onStatusChange('trash');
      }
    }
  };

  return (
    <>
      <Card>
        {/* Header - Có thể ẩn (optional) */}
        {/* <CardHeader className="pb-3">
          <CardTitle className="text-base">Xuất bản</CardTitle>
        </CardHeader> */}

        <CardContent className="space-y-4">
          {/* Phần 1: Top Actions (Hành động phụ) */}
          <div className="space-y-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onSaveDraft}
              disabled={loading}
              className="w-full justify-start"
            >
              <Save className="h-4 w-4 mr-2" />
              Lưu nháp
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handlePreview}
              disabled={loading || !productSlug}
              className="w-full justify-start"
            >
              <Eye className="h-4 w-4 mr-2" />
              Xem thử
            </Button>
          </div>

          {/* Phần 2: Thông tin Trạng thái */}
          <div className="space-y-4 pt-2 border-t">
            {/* Status Display */}
            <div className="space-y-2">
              <Label>Trạng thái</Label>
              {!showStatusEdit ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{statusDisplay.icon}</span>
                    <span className={`font-semibold ${statusDisplay.color}`}>
                      {statusDisplay.text}
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowStatusEdit(true)}
                    className="h-7 text-xs"
                  >
                    <Edit2 className="h-3 w-3 mr-1" />
                    Chỉnh sửa
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <select
                    value={status}
                    onChange={(e) => {
                      onStatusChange(e.target.value as 'draft' | 'publish' | 'trash');
                      setShowStatusEdit(false);
                    }}
                    className="w-full px-3 py-2 border rounded-md text-sm"
                    disabled={loading}
                  >
                    <option value="draft">🟡 Bản nháp</option>
                    <option value="publish">🟢 Đã đăng</option>
                    <option value="trash">🔴 Thùng rác</option>
                  </select>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowStatusEdit(false)}
                    className="w-full text-xs"
                  >
                    Hủy
                  </Button>
                </div>
              )}
            </div>

            {/* Visibility */}
            {onVisibilityChange && (
              <div className="space-y-2">
                <Label>Hiển thị</Label>
                <select
                  value={visibility}
                  onChange={(e) =>
                    handleVisibilityChange(e.target.value as 'public' | 'private' | 'password')
                  }
                  className="w-full px-3 py-2 border rounded-md text-sm"
                  disabled={loading}
                >
                  <option value="public">Công khai</option>
                  <option value="private">Riêng tư</option>
                  <option value="password">Mật khẩu</option>
                </select>
                {showPasswordInput && (
                  <div className="space-y-1">
                    <Label htmlFor="password" className="text-xs">
                      Mật khẩu
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      value={passwordValue}
                      onChange={(e) => handlePasswordChange(e.target.value)}
                      placeholder="Nhập mật khẩu..."
                      className="text-sm"
                    />
                  </div>
                )}
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  {visibility === 'public' ? (
                    <>
                      <Globe className="h-3 w-3" />
                      Sản phẩm sẽ hiển thị công khai
                    </>
                  ) : visibility === 'private' ? (
                    <>
                      <Lock className="h-3 w-3" />
                      Sản phẩm chỉ hiển thị cho admin
                    </>
                  ) : (
                    <>
                      <Key className="h-3 w-3" />
                      Sản phẩm được bảo vệ bằng mật khẩu
                    </>
                  )}
                </p>
              </div>
            )}

            {/* Schedule */}
            {onScheduledDateChange && (
              <div className="space-y-2">
                <Label>Lịch đăng</Label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="schedule"
                      checked={showSchedulePicker}
                      onChange={(e) => {
                        setShowSchedulePicker(e.target.checked);
                        if (!e.target.checked && onScheduledDateChange) {
                          onScheduledDateChange(null);
                          setScheduleDateTime('');
                        }
                      }}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <Label htmlFor="schedule" className="text-sm font-normal cursor-pointer">
                      Lên lịch đăng
                    </Label>
                  </div>
                  {showSchedulePicker && (
                    <div className="space-y-2 pl-6">
                      <Input
                        type="datetime-local"
                        value={scheduleDateTime}
                        onChange={handleScheduleChange}
                        className="text-sm"
                        min={new Date().toISOString().slice(0, 16)}
                      />
                      {scheduleDateTime && (
                        <p className="text-xs text-muted-foreground">
                          Sẽ đăng vào:{' '}
                      {format(new Date(scheduleDateTime), "dd/MM/yyyy 'lúc' HH:mm")}
                        </p>
                      )}
                    </div>
                  )}
                  {!showSchedulePicker && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Đăng ngay lập tức
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Active Status */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActive"
                checked={isActive}
                onChange={(e) => onIsActiveChange(e.target.checked)}
                disabled={loading}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <Label htmlFor="isActive" className="text-sm font-normal cursor-pointer">
                Sản phẩm đang hoạt động
              </Label>
            </div>
          </div>

          {/* Phần 3: Primary Action */}
          <div className="pt-2 border-t">
            <Button
              type="button"
              onClick={onPublish}
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  {productId ? 'Cập nhật' : 'Đăng sản phẩm'}
                </>
              )}
            </Button>
          </div>

          {/* Footer: Di chuyển vào thùng rác */}
          {productId && (
            <div className="pt-2 border-t">
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="text-xs text-red-600 hover:text-red-700 hover:underline flex items-center gap-1"
              >
                <Trash2 className="h-3 w-3" />
                Di chuyển vào thùng rác
              </button>
            </div>
          )}

          {/* Info Message */}
          {!productSlug && (
            <p className="text-xs text-muted-foreground">
              Nhập slug để sử dụng tính năng xem trước
            </p>
          )}

        </CardContent>
      </Card>

    </>
  );
}
