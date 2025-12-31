'use client';

import { useState, useEffect } from 'react';
import { useCreateRedirect, useUpdateRedirect } from '@/lib/hooks/useSEO';
import type { SEORedirect } from '@/types/seo';
import { Loader2, Save, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RedirectFormProps {
  redirect?: SEORedirect | null;
  onClose: () => void;
  className?: string;
}

export function RedirectForm({ redirect, onClose, className }: RedirectFormProps) {
  const isEditing = !!redirect;

  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [type, setType] = useState<301 | 302>(301);
  const [enabled, setEnabled] = useState(true);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  const { mutate: createRedirect, isPending: isCreating } = useCreateRedirect();
  const { mutate: updateRedirect, isPending: isUpdating } = useUpdateRedirect();

  const isPending = isCreating || isUpdating;

  // Initialize form when editing
  useEffect(() => {
    if (redirect) {
      setSource(redirect.source);
      setDestination(redirect.destination);
      setType(redirect.type);
      setEnabled(redirect.enabled);
      setNote(redirect.note || '');
    } else {
      setSource('');
      setDestination('');
      setType(301);
      setEnabled(true);
      setNote('');
    }
  }, [redirect]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate
    if (!source.startsWith('/')) {
      setError('Source phải bắt đầu bằng /');
      return;
    }

    if (!destination) {
      setError('Destination không được để trống');
      return;
    }

    const data = {
      source: source.trim(),
      destination: destination.trim(),
      type,
      enabled,
      note: note.trim() || undefined,
    };

    if (isEditing && redirect && redirect._id) {
      updateRedirect(
        { id: redirect._id, data },
        {
          onSuccess: () => {
            onClose();
          },
          onError: (err) => {
            setError(err.message || 'Lỗi khi cập nhật redirect');
          },
        }
      );
    } else {
      createRedirect(data, {
        onSuccess: () => {
          onClose();
        },
        onError: (err) => {
          setError(err.message || 'Lỗi khi tạo redirect');
        },
      });
    }
  };

  return (
    <div className={cn('bg-white rounded-lg border p-6', className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">
          {isEditing ? 'Sửa Redirect' : 'Thêm Redirect Mới'}
        </h3>
        <button
          onClick={onClose}
          className="p-1 text-gray-400 hover:text-gray-600 rounded"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Source Path *
            </label>
            <input
              type="text"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="/old-page"
              required
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Đường dẫn gốc (bắt đầu bằng /)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Destination *
            </label>
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="/new-page hoặc https://..."
              required
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Đường dẫn đích (relative hoặc absolute URL)
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Redirect Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(Number(e.target.value) as 301 | 302)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value={301}>301 - Permanent (khuyến nghị)</option>
              <option value={302}>302 - Temporary</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              301 cho SEO tốt hơn, 302 cho redirect tạm thời
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Trạng thái
            </label>
            <div className="flex items-center gap-4 py-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="enabled"
                  checked={enabled}
                  onChange={() => setEnabled(true)}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm">Hoạt động</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="enabled"
                  checked={!enabled}
                  onChange={() => setEnabled(false)}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm">Tắt</span>
              </label>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ghi chú
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Lý do redirect..."
            rows={2}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {isEditing ? 'Cập nhật' : 'Tạo redirect'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default RedirectForm;
