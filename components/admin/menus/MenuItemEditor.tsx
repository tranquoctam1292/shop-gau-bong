'use client';

import { useState, useEffect } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { Loader2, Save, X, ExternalLink, AlertTriangle } from 'lucide-react';
import { useToastContext } from '@/components/providers/ToastProvider';

interface MenuItem {
  id: string;
  title: string | null;
  type: 'custom' | 'category' | 'product' | 'page' | 'post';
  url: string | null;
  referenceId: string | null;
  target: '_self' | '_blank';
  iconClass: string | null;
  cssClass: string | null;
}

interface MenuItemEditorProps {
  item: MenuItem;
  onSave: (updates: Partial<MenuItem>) => Promise<void>;
  onCancel: () => void;
}

export function MenuItemEditor({ item, onSave, onCancel }: MenuItemEditorProps) {
  const { showToast } = useToastContext();
  const [formData, setFormData] = useState({
    title: item.title || '',
    target: item.target,
    iconClass: item.iconClass || '',
    cssClass: item.cssClass || '',
  });
  const [saving, setSaving] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [referenceStatus, setReferenceStatus] = useState<{
    exists: boolean;
    active: boolean;
  } | null>(null);

  // Load preview URL and reference status
  useEffect(() => {
    const loadPreview = async () => {
      if (item.type === 'custom') {
        setPreviewUrl(item.url || '#');
        setReferenceStatus({ exists: true, active: true });
      } else if (item.referenceId) {
        try {
          const response = await fetch('/api/admin/menu-items/resolve-link', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: item.type,
              referenceId: item.referenceId,
              url: item.url,
              title: item.title,
            }),
          });

          if (!response.ok) {
            throw new Error('Failed to resolve link');
          }

          const resolved = await response.json();
          setPreviewUrl(resolved.url);
          setReferenceStatus({
            exists: resolved.exists,
            active: resolved.active,
          });
        } catch (err) {
          setPreviewUrl('#');
          setReferenceStatus({ exists: false, active: false });
        }
      } else {
        setPreviewUrl('#');
        setReferenceStatus({ exists: false, active: false });
      }
    };

    loadPreview();
  }, [item]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      await onSave({
        title: formData.title || null,
        target: formData.target,
        iconClass: formData.iconClass || null,
        cssClass: formData.cssClass || null,
      });
      showToast('Cập nhật menu item thành công', 'success');
    } catch (err: any) {
      showToast(err.message || 'Không thể cập nhật menu item', 'error');
    } finally {
      setSaving(false);
    }
  };

  const hasChanges =
    formData.title !== (item.title || '') ||
    formData.target !== item.target ||
    formData.iconClass !== (item.iconClass || '') ||
    formData.cssClass !== (item.cssClass || '');

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg bg-white">
      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title">Tiêu đề</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
          placeholder="Nhập tiêu đề menu item"
          disabled={saving}
        />
      </div>

      {/* Target */}
      <div className="space-y-2">
        <Label htmlFor="target">Mở liên kết</Label>
        <Select
          value={formData.target}
          onValueChange={(value: '_self' | '_blank') =>
            setFormData((prev) => ({ ...prev, target: value }))
          }
          disabled={saving}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_self">Trong cùng tab</SelectItem>
            <SelectItem value="_blank">Tab mới</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Icon Class */}
      <div className="space-y-2">
        <Label htmlFor="iconClass">Icon Class (tùy chọn)</Label>
        <Input
          id="iconClass"
          value={formData.iconClass}
          onChange={(e) => setFormData((prev) => ({ ...prev, iconClass: e.target.value }))}
          placeholder="VD: fa fa-home"
          disabled={saving}
        />
        <p className="text-xs text-gray-500">
          CSS class cho icon (Font Awesome, Material Icons, etc.)
        </p>
      </div>

      {/* CSS Class */}
      <div className="space-y-2">
        <Label htmlFor="cssClass">CSS Class (tùy chọn)</Label>
        <Input
          id="cssClass"
          value={formData.cssClass}
          onChange={(e) => setFormData((prev) => ({ ...prev, cssClass: e.target.value }))}
          placeholder="VD: highlight-menu-item"
          disabled={saving}
        />
        <p className="text-xs text-gray-500">CSS class tùy chỉnh cho menu item</p>
      </div>

      {/* Preview URL & Reference Status */}
      {previewUrl && (
        <div className="space-y-2">
          <Label>URL Preview</Label>
          <div className="flex items-center gap-2 p-2 bg-gray-50 rounded border">
            <ExternalLink className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-700 truncate flex-1">{previewUrl}</span>
          </div>
        </div>
      )}

      {/* Reference Warning */}
      {referenceStatus && !referenceStatus.exists && (
        <div className="flex items-center gap-2 p-2 bg-orange-50 border border-orange-200 rounded">
          <AlertTriangle className="w-4 h-4 text-orange-600" />
          <span className="text-sm text-orange-800">
            Reference không tồn tại. Menu item này sẽ không hiển thị trên frontend.
          </span>
        </div>
      )}

      {referenceStatus && referenceStatus.exists && !referenceStatus.active && (
        <div className="flex items-center gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
          <AlertTriangle className="w-4 h-4 text-yellow-600" />
          <span className="text-sm text-yellow-800">
            Reference không active. Menu item này sẽ không hiển thị trên frontend.
          </span>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 pt-2 border-t">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onCancel}
          disabled={saving}
        >
          <X className="w-4 h-4 mr-2" />
          Hủy
        </Button>
        <Button type="submit" size="sm" disabled={saving || !hasChanges}>
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Đang lưu...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Lưu
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

