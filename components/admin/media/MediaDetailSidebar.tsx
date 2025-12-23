'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Copy, Trash2, Save, Loader2, Check } from 'lucide-react';
import Image from 'next/image';
import type { MediaGridItem } from './MediaGrid';

interface MediaDetailSidebarProps {
  item: MediaGridItem | null;
  onClose: () => void;
  onUpdate?: (id: string, updates: {
    name?: string;
    altText?: string;
    caption?: string;
    description?: string;
  }) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  className?: string;
}

/**
 * MediaDetailSidebar Component
 * 
 * Sidebar showing media details with edit form
 */
export function MediaDetailSidebar({
  item,
  onClose,
  onUpdate,
  onDelete,
  className,
}: MediaDetailSidebarProps) {
  const [name, setName] = useState('');
  const [altText, setAltText] = useState('');
  const [caption, setCaption] = useState('');
  const [description, setDescription] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (item) {
      setName(item.name || '');
      setAltText(item.altText || '');
      setCaption('');
      setDescription('');
    }
  }, [item]);

  if (!item) {
    return null;
  }

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(item.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy URL:', error);
    }
  };

  const handleSave = async () => {
    if (!onUpdate || !item) return;

    setIsUpdating(true);
    try {
      await onUpdate(item._id, {
        name: name || undefined,
        altText: altText || undefined,
        caption: caption || undefined,
        description: description || undefined,
      });
    } catch (error) {
      console.error('Failed to update media:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete || !item) return;

    const confirmed = window.confirm(
      `Bạn có chắc chắn muốn xóa "${item.name}"? Hành động này không thể hoàn tác.`
    );

    if (!confirmed) return;

    setIsDeleting(true);
    try {
      await onDelete(item._id);
      onClose();
    } catch (error) {
      console.error('Failed to delete media:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isImage = item.type === 'image';
  const thumbnailUrl = item.thumbnail_url || item.url;

  return (
    <div className={`w-full md:w-96 border-l bg-white h-full flex flex-col ${className || ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold">Chi tiết Media</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Preview */}
        <Card>
          <CardContent className="p-4">
            <div className="relative aspect-square bg-gray-100 rounded overflow-hidden">
              {isImage ? (
                <Image
                  src={thumbnailUrl}
                  alt={item.altText || item.name}
                  fill
                  className="object-contain"
                  sizes="384px"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-gray-400">Preview không khả dụng</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Edit Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Thông tin</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Tên</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tên media"
              />
            </div>

            <div>
              <Label htmlFor="altText">Alt Text</Label>
              <Input
                id="altText"
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
                placeholder="Mô tả ảnh cho SEO"
              />
            </div>

            <div>
              <Label htmlFor="caption">Chú thích</Label>
              <Input
                id="caption"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Chú thích ảnh"
              />
            </div>

            <div>
              <Label htmlFor="description">Mô tả</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mô tả chi tiết"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* File Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Thông tin file</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Loại:</span>
              <span className="capitalize">{item.type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Kích thước:</span>
              <span>{formatFileSize(item.size)}</span>
            </div>
            {item.width && item.height && (
              <div className="flex justify-between">
                <span className="text-gray-600">Kích thước ảnh:</span>
                <span>{item.width} × {item.height}px</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600">Ngày tạo:</span>
              <span>{formatDate(item.createdAt)}</span>
            </div>
          </CardContent>
        </Card>

        {/* URL */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">URL</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                value={item.url}
                readOnly
                className="flex-1 text-xs font-mono"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyUrl}
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="p-4 border-t space-y-2">
        <Button
          className="w-full"
          onClick={handleSave}
          disabled={isUpdating}
        >
          {isUpdating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Đang lưu...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Lưu thay đổi
            </>
          )}
        </Button>
        <Button
          variant="destructive"
          className="w-full"
          onClick={handleDelete}
          disabled={isDeleting}
        >
          {isDeleting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Đang xóa...
            </>
          ) : (
            <>
              <Trash2 className="mr-2 h-4 w-4" />
              Xóa media
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
