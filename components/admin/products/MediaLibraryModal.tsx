'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, X, Image as ImageIcon, Video, File, Loader2 } from 'lucide-react';

interface MediaItem {
  id: string;
  url: string;
  type: 'image' | 'video' | 'file';
  alt?: string;
  title?: string;
  caption?: string;
  description?: string;
}

interface MediaLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (html: string) => void;
}

/**
 * Media Library Modal - Giống WordPress Add Media
 * Features:
 * - Upload Files tab với drag & drop
 * - Media Library tab với grid view
 * - Attachment Details sidebar
 * - Display Settings (alignment, link, size)
 */
export function MediaLibraryModal({ isOpen, onClose, onInsert }: MediaLibraryModalProps) {
  const [activeTab, setActiveTab] = useState<'upload' | 'library'>('upload');
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  
  // Attachment Details
  const [altText, setAltText] = useState('');
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [description, setDescription] = useState('');
  
  // Display Settings
  const [alignment, setAlignment] = useState<'left' | 'center' | 'right' | 'none'>('none');
  const [linkTo, setLinkTo] = useState<'file' | 'attachment' | 'custom' | 'none'>('file');
  const [customUrl, setCustomUrl] = useState('');
  const [size, setSize] = useState<'thumbnail' | 'medium' | 'large' | 'full'>('medium');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      // Reset all state when modal closes
      setSelectedMedia(null);
      setAltText('');
      setTitle('');
      setCaption('');
      setDescription('');
      setAlignment('none');
      setLinkTo('file');
      setCustomUrl('');
      setSize('medium');
      setUploadProgress({});
      setActiveTab('upload');
    }
  }, [isOpen]);

  // Load media library on mount
  useEffect(() => {
    if (isOpen) {
      // TODO: Fetch media from API
      // For now, use empty array
      setMediaItems([]);
    }
  }, [isOpen]);

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    const newItems: MediaItem[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      // Generate unique ID with timestamp and random to avoid collisions
      const fileId = `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${i}`;

      // Validate file type
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        alert(`File ${file.name} không được hỗ trợ. Chỉ chấp nhận hình ảnh và video.`);
        continue;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert(`File ${file.name} vượt quá 5MB`);
        continue;
      }

      try {
        // Convert to data URL (in production, upload to server)
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const result = e.target?.result;
            if (typeof result === 'string') {
              resolve(result);
            } else {
              reject(new Error('Failed to read file as data URL'));
            }
          };
          reader.onerror = () => reject(new Error('FileReader error'));
          reader.readAsDataURL(file);
        });

        const mediaItem: MediaItem = {
          id: fileId,
          url: dataUrl,
          type: file.type.startsWith('image/') ? 'image' : 'video',
          title: file.name.replace(/\.[^/.]+$/, ''), // Remove extension from title
          alt: file.name.replace(/\.[^/.]+$/, ''),
        };

        newItems.push(mediaItem);
        setUploadProgress((prev) => ({ ...prev, [fileId]: 100 }));
      } catch (error) {
        console.error(`Error reading file ${file.name}:`, error);
        alert(`Không thể đọc file ${file.name}. Vui lòng thử lại.`);
      }
    }

    setMediaItems((prev) => [...prev, ...newItems]);
    setUploading(false);
    setUploadProgress({});

    // Auto-select first uploaded item
    if (newItems.length > 0) {
      setSelectedMedia(newItems[0]);
      setAltText(newItems[0].alt || '');
      setTitle(newItems[0].title || '');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    handleFileSelect(files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleInsert = () => {
    if (!selectedMedia) {
      alert('Vui lòng chọn một media item');
      return;
    }

    // Validate custom URL if provided
    if (linkTo === 'custom' && customUrl) {
      try {
        new URL(customUrl);
      } catch {
        alert('URL tùy chỉnh không hợp lệ');
        return;
      }
    }

    let html = '';

    if (selectedMedia.type === 'image') {
      // Build image HTML
      const imgClass = alignment !== 'none' ? `align${alignment}` : '';
      const imgSize = size !== 'full' ? `size-${size}` : '';
      const classes = [imgClass, imgSize].filter(Boolean).join(' ');

      let imgTag = `<img`;
      if (classes) imgTag += ` class="${classes}"`;
      imgTag += ` src="${selectedMedia.url}"`;
      if (altText) imgTag += ` alt="${altText}"`;
      imgTag += ` />`;

      // Wrap with link if needed
      if (linkTo === 'file') {
        html = `<a href="${selectedMedia.url}">${imgTag}</a>`;
      } else if (linkTo === 'attachment') {
        html = `<a href="#attachment-${selectedMedia.id}">${imgTag}</a>`;
      } else if (linkTo === 'custom' && customUrl) {
        html = `<a href="${customUrl}">${imgTag}</a>`;
      } else {
        html = imgTag;
      }

      // Add caption if provided (WordPress-style caption)
      if (caption) {
        // WordPress caption format: [caption id="attachment_123" align="aligncenter" width="300"]<img ... /> Caption text[/caption]
        // Note: This is a shortcode format, not pure HTML. May need server-side processing.
        // When caption is used, we need to use the original imgTag (not wrapped in link)
        // because caption shortcode wraps everything
        const captionId = selectedMedia.id ? `id="attachment_${selectedMedia.id}"` : '';
        const alignClass = alignment !== 'none' ? `align${alignment}` : 'aligncenter';
        // Caption shortcode wraps the image, so use imgTag directly (not the html that may have link)
        html = `[caption ${captionId} align="${alignClass}" width="300"]${imgTag} ${caption}[/caption]`;
      }
    } else if (selectedMedia.type === 'video') {
      html = `<video src="${selectedMedia.url}" controls></video>`;
    }

    onInsert(html);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Thêm Media</h2>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'upload'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Tải tập tin lên
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('library')}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'library'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Thư viện Media
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Main Content Area */}
          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === 'upload' ? (
              <div
                ref={dropZoneRef}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                className="border-2 border-dashed border-input rounded-lg p-12 text-center"
              >
                <Upload className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">Kéo thả file vào đây</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Hoặc click để chọn file từ máy tính
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFileSelect(e.target.files)}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Đang upload...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Chọn file
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div>
                {mediaItems.length === 0 ? (
                  <div className="text-center py-12">
                    <ImageIcon className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Chưa có media nào</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-4">
                    {mediaItems.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => {
                          setSelectedMedia(item);
                          setAltText(item.alt || '');
                          setTitle(item.title || '');
                          setCaption(item.caption || '');
                          setDescription(item.description || '');
                        }}
                        className={`cursor-pointer border-2 rounded-lg overflow-hidden transition-all ${
                          selectedMedia?.id === item.id
                            ? 'border-primary ring-2 ring-primary'
                            : 'border-input hover:border-primary/50'
                        }`}
                      >
                        {item.type === 'image' ? (
                          <img
                            src={item.url}
                            alt={item.alt || ''}
                            className="w-full h-32 object-cover"
                          />
                        ) : (
                          <div className="w-full h-32 bg-muted flex items-center justify-center">
                            <Video className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                        <div className="p-2 text-xs truncate">{item.title}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Attachment Details Sidebar */}
          {selectedMedia && (
            <div className="w-80 border-l p-4 overflow-y-auto">
              <h3 className="font-semibold mb-4">Chi tiết đính kèm</h3>

              {/* Preview */}
              <div className="mb-4">
                {selectedMedia.type === 'image' ? (
                  <img
                    src={selectedMedia.url}
                    alt={selectedMedia.alt || ''}
                    className="w-full rounded-lg"
                  />
                ) : (
                  <div className="w-full aspect-video bg-muted rounded-lg flex items-center justify-center">
                    <Video className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
              </div>

              {/* Metadata Fields */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="media-alt">Văn bản thay thế (Alt Text)</Label>
                  <Input
                    id="media-alt"
                    value={altText}
                    onChange={(e) => setAltText(e.target.value)}
                    className="mt-1"
                    placeholder="Mô tả hình ảnh"
                  />
                </div>

                <div>
                  <Label htmlFor="media-title">Tiêu đề</Label>
                  <Input
                    id="media-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="media-caption">Chú thích</Label>
                  <Input
                    id="media-caption"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    className="mt-1"
                    placeholder="Hiển thị bên dưới hình ảnh"
                  />
                </div>

                <div>
                  <Label htmlFor="media-description">Mô tả</Label>
                  <textarea
                    id="media-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="mt-1 w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="Mô tả chi tiết"
                  />
                </div>
              </div>

              {/* Display Settings */}
              <div className="mt-6 pt-6 border-t space-y-4">
                <h3 className="font-semibold mb-4">Thiết lập hiển thị</h3>

                <div>
                  <Label htmlFor="media-alignment">Căn chỉnh</Label>
                  <Select
                    id="media-alignment"
                    value={alignment}
                    onChange={(e) => setAlignment(e.target.value as typeof alignment)}
                    className="mt-1"
                  >
                    <option value="none">Không</option>
                    <option value="left">Trái</option>
                    <option value="center">Giữa</option>
                    <option value="right">Phải</option>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="media-link">Liên kết tới</Label>
                  <Select
                    id="media-link"
                    value={linkTo}
                    onChange={(e) => setLinkTo(e.target.value as typeof linkTo)}
                    className="mt-1"
                  >
                    <option value="none">Không</option>
                    <option value="file">Tập tin đa phương tiện</option>
                    <option value="attachment">Trang đính kèm</option>
                    <option value="custom">Tùy chỉnh URL</option>
                  </Select>
                </div>

                {linkTo === 'custom' && (
                  <div>
                    <Label htmlFor="media-custom-url">URL tùy chỉnh</Label>
                    <Input
                      id="media-custom-url"
                      value={customUrl}
                      onChange={(e) => setCustomUrl(e.target.value)}
                      className="mt-1"
                      placeholder="https://..."
                      type="url"
                    />
                    {customUrl && !customUrl.match(/^https?:\/\//) && (
                      <p className="text-xs text-muted-foreground mt-1">
                        URL nên bắt đầu với http:// hoặc https://
                      </p>
                    )}
                  </div>
                )}

                {selectedMedia.type === 'image' && (
                  <div>
                    <Label htmlFor="media-size">Kích cỡ</Label>
                    <Select
                      id="media-size"
                      value={size}
                      onChange={(e) => setSize(e.target.value as typeof size)}
                      className="mt-1"
                    >
                      <option value="thumbnail">Thumbnail (150x150)</option>
                      <option value="medium">Medium (300x300)</option>
                      <option value="large">Large (1024x1024)</option>
                      <option value="full">Full Size</option>
                    </Select>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button
            type="button"
            onClick={handleInsert}
            disabled={!selectedMedia}
          >
            Chèn vào bài viết
          </Button>
        </div>
      </div>
    </div>
  );
}
