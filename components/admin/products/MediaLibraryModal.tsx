'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, X, Image as ImageIcon, Video, File, Loader2, Link as LinkIcon } from 'lucide-react';
import { convertVideoUrlToEmbed, isAllowedVideoDomain } from '@/lib/utils/videoEmbed';

export interface MediaItem {
  id: string;
  url: string;
  thumbnail_url?: string; // Thumbnail URL for images
  type: 'image' | 'video' | 'file';
  alt?: string;
  title?: string;
  caption?: string;
  description?: string;
}

interface MediaLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert?: (html: string) => void; // For editor mode (legacy)
  onSelect?: (items: MediaItem | MediaItem[]) => void; // For image selection mode (new)
  mode?: 'single' | 'multiple'; // Selection mode: single for featured image, multiple for gallery
  selectedIds?: string[]; // Pre-select existing images by IDs (for gallery mode)
  buttonText?: string; // Custom button text (default: "Chèn vào bài viết" or "Thiết lập ảnh sản phẩm")
}

/**
 * Media Library Modal - Giống WordPress Add Media
 * Features:
 * - Upload Files tab với drag & drop
 * - Media Library tab với grid view
 * - Attachment Details sidebar
 * - Display Settings (alignment, link, size)
 */
export function MediaLibraryModal({ 
  isOpen, 
  onClose, 
  onInsert,
  onSelect,
  mode = 'single',
  selectedIds = [],
  buttonText,
}: MediaLibraryModalProps) {
  const [activeTab, setActiveTab] = useState<'upload' | 'library' | 'url'>('upload');
  const [videoUrl, setVideoUrl] = useState('');
  const [videoAltText, setVideoAltText] = useState('');
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [selectedMediaMultiple, setSelectedMediaMultiple] = useState<MediaItem[]>([]); // For multiple selection
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(false);
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
      setSelectedMediaMultiple([]);
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

  // Pre-select existing images when modal opens
  useEffect(() => {
    if (isOpen && selectedIds.length > 0 && mediaItems.length > 0) {
      const preSelected = mediaItems.filter(item => selectedIds.includes(item.id));
      if (mode === 'multiple') {
        setSelectedMediaMultiple(preSelected);
      } else if (preSelected.length > 0) {
        setSelectedMedia(preSelected[0]);
      }
    }
  }, [isOpen, selectedIds, mediaItems, mode]);

  // Load media library from API when modal opens and library tab is active
  useEffect(() => {
    if (isOpen && activeTab === 'library') {
      const fetchMedia = async () => {
        setLoadingMedia(true);
        try {
          const response = await fetch('/api/admin/media?page=1&limit=100&sort=newest');
          if (!response.ok) {
            throw new Error('Failed to fetch media');
          }
          const result = await response.json();
          
          if (result.success && result.data) {
            // Map API response to MediaItem format
            const mappedItems: MediaItem[] = result.data.map((item: any) => ({
              id: item._id,
              url: item.url,
              thumbnail_url: item.thumbnail_url || (item.type === 'image' ? item.url : undefined),
              type: item.type === 'image' ? 'image' : item.type === 'video' ? 'video' : 'file',
              alt: item.altText || item.name,
              title: item.name,
              caption: item.caption,
              description: item.description,
            }));
            setMediaItems(mappedItems);
          } else {
            setMediaItems([]);
          }
        } catch (error) {
          console.error('Error fetching media:', error);
          setMediaItems([]);
        } finally {
          setLoadingMedia(false);
        }
      };
      
      fetchMedia();
    } else if (!isOpen) {
      // Reset media items when modal closes
      setMediaItems([]);
    }
  }, [isOpen, activeTab]);

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
        // Upload to Vercel Blob via API
        setUploadProgress((prev) => ({ ...prev, [fileId]: 0 }));
        
        const uploadFormData = new FormData();
        uploadFormData.append('file', file);

        // Use new Media Library API endpoint
        const uploadResponse = await fetch('/api/admin/media', {
          method: 'POST',
          body: uploadFormData,
        });

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json();
          throw new Error(errorData.error || 'Upload failed');
        }

        const uploadResult = await uploadResponse.json();
        setUploadProgress((prev) => ({ ...prev, [fileId]: 100 }));

        // Map new API response format to MediaItem
        const mediaItem: MediaItem = {
          id: uploadResult.data._id || fileId,
          url: uploadResult.data.url,
          thumbnail_url: uploadResult.data.thumbnail_url || (file.type.startsWith('image/') ? uploadResult.data.url : undefined),
          type: uploadResult.data.type === 'image' ? 'image' : uploadResult.data.type === 'video' ? 'video' : 'file',
          title: uploadResult.data.name || file.name.replace(/\.[^/.]+$/, ''),
          alt: uploadResult.data.altText || file.name.replace(/\.[^/.]+$/, ''),
          caption: uploadResult.data.caption,
          description: uploadResult.data.description,
        };

        newItems.push(mediaItem);
      } catch (error) {
        console.error(`Error uploading file ${file.name}:`, error);
        alert(`Không thể upload file ${file.name}: ${error instanceof Error ? error.message : 'Lỗi không xác định'}. Vui lòng thử lại.`);
        setUploadProgress((prev) => {
          const next = { ...prev };
          delete next[fileId];
          return next;
        });
      }
    }

    // Refresh media list from API after upload to ensure sync with main Media Library
    // This ensures modal shows all media including newly uploaded ones
    if (activeTab === 'library') {
      const refreshMedia = async () => {
        try {
          const response = await fetch('/api/admin/media?page=1&limit=100&sort=newest');
          if (response.ok) {
            const result = await response.json();
            if (result.success && result.data) {
              const mappedItems: MediaItem[] = result.data.map((item: any) => ({
                id: item._id,
                url: item.url,
                thumbnail_url: item.thumbnail_url || (item.type === 'image' ? item.url : undefined),
                type: item.type === 'image' ? 'image' : item.type === 'video' ? 'video' : 'file',
                alt: item.altText || item.name,
                title: item.name,
                caption: item.caption,
                description: item.description,
              }));
              setMediaItems(mappedItems);
            }
          }
        } catch (error) {
          console.error('Error refreshing media:', error);
          // Fallback: add new items to existing list if refresh fails
          setMediaItems((prev) => [...prev, ...newItems]);
        }
      };
      refreshMedia();
    } else {
      // If not on library tab, just add to list
      setMediaItems((prev) => [...prev, ...newItems]);
    }
    setUploading(false);
    setUploadProgress({});

    // Auto-select first uploaded item and switch to library tab to show uploaded images
    if (newItems.length > 0) {
      // Switch to library tab to show uploaded images
      setActiveTab('library');
      
      if (mode === 'multiple') {
        setSelectedMediaMultiple(prev => [...prev, ...newItems]);
      } else {
        setSelectedMedia(newItems[0]);
        setAltText(newItems[0].alt || '');
        setTitle(newItems[0].title || '');
      }
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

  const handleMediaClick = (item: MediaItem) => {
    if (mode === 'multiple') {
      // Toggle selection in multiple mode
      const isSelected = selectedMediaMultiple.some(m => m.id === item.id);
      if (isSelected) {
        setSelectedMediaMultiple(prev => prev.filter(m => m.id !== item.id));
      } else {
        setSelectedMediaMultiple(prev => [...prev, item]);
      }
    } else {
      // Single selection mode
      setSelectedMedia(item);
      setAltText(item.alt || '');
      setTitle(item.title || '');
      setCaption(item.caption || '');
      setDescription(item.description || '');
    }
  };

  const handleInsert = () => {
    // If onSelect is provided (image selection mode), use it
    if (onSelect) {
      if (mode === 'multiple') {
        if (selectedMediaMultiple.length === 0) {
          alert('Vui lòng chọn ít nhất một ảnh');
          return;
        }
        onSelect(selectedMediaMultiple);
      } else {
        if (!selectedMedia) {
          alert('Vui lòng chọn một ảnh');
          return;
        }
        onSelect(selectedMedia);
      }
      onClose();
      return;
    }

    // Legacy mode: onInsert (for editor)
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
        const captionId = selectedMedia.id ? `id="attachment_${selectedMedia.id}"` : '';
        const alignClass = alignment !== 'none' ? `align${alignment}` : 'aligncenter';
        html = `[caption ${captionId} align="${alignClass}" width="300"]${imgTag} ${caption}[/caption]`;
      }
    } else if (selectedMedia.type === 'video') {
      // Check if it's an embeddable video URL (YouTube, Vimeo, etc.)
      const embedHtml = convertVideoUrlToEmbed(selectedMedia.url);
      if (embedHtml) {
        html = embedHtml;
      } else {
        // Regular video file
        html = `<video src="${selectedMedia.url}" controls></video>`;
      }
    }

    onInsert?.(html);
    onClose();
  };

  const handleInsertFromUrl = () => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/b261569c-76a6-4f8c-839c-264dc5457f92',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MediaLibraryModal.tsx:297',message:'handleInsertFromUrl called',data:{videoUrl:videoUrl.substring(0,100)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
    // #endregion
    
    if (!videoUrl.trim()) {
      alert('Vui lòng nhập URL video');
      return;
    }

    // Validate URL
    try {
      new URL(videoUrl);
    } catch {
      alert('URL không hợp lệ');
      return;
    }

    // Check if it's an embeddable video URL
    const embedHtml = convertVideoUrlToEmbed(videoUrl.trim());
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/b261569c-76a6-4f8c-839c-264dc5457f92',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MediaLibraryModal.tsx:312',message:'convertVideoUrlToEmbed result',data:{hasEmbedHtml:!!embedHtml},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
    // #endregion
    
    if (embedHtml) {
      // Insert video embed
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/b261569c-76a6-4f8c-839c-264dc5457f92',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MediaLibraryModal.tsx:315',message:'Calling onInsert with embedHtml',data:{embedHtmlLength:embedHtml.length,hasOnInsert:!!onInsert},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
      // #endregion
      onInsert?.(embedHtml);
      setVideoUrl('');
      setVideoAltText('');
      onClose();
    } else if (isAllowedVideoDomain(videoUrl)) {
      // Direct video file URL
      const altAttr = videoAltText ? ` alt="${videoAltText}"` : '';
      const html = `<video src="${videoUrl.trim()}" controls${altAttr}></video>`;
      onInsert?.(html);
      setVideoUrl('');
      setVideoAltText('');
      onClose();
    } else {
      alert('URL video không được hỗ trợ. Vui lòng sử dụng YouTube, Vimeo, TikTok hoặc URL video trực tiếp (mp4).');
    }
  };

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <div 
      className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4" 
      style={{ isolation: 'isolate' }}
      onClick={(e) => {
        // Close on backdrop click
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="bg-background rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col relative z-[10000]" 
        style={{ isolation: 'isolate' }}
        onClick={(e) => e.stopPropagation()}
      >
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
          <button
            type="button"
            onClick={() => setActiveTab('url')}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'url'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <LinkIcon className="h-4 w-4 inline mr-1" />
            Chèn từ URL
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
                {uploading && Object.keys(uploadProgress).length > 0 && (
                  <div className="mt-4 space-y-2">
                    {Object.entries(uploadProgress).map(([fileId, progress]) => (
                      <div key={fileId} className="text-sm text-muted-foreground">
                        Đang upload... {progress}%
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : activeTab === 'url' ? (
              <div className="space-y-4 max-w-2xl mx-auto">
                <div>
                  <Label htmlFor="videoUrl">URL Video</Label>
                  <Input
                    id="videoUrl"
                    type="url"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=... hoặc https://vimeo.com/..."
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Hỗ trợ: YouTube, Vimeo, TikTok, hoặc URL video trực tiếp (mp4)
                  </p>
                </div>
                <div>
                  <Label htmlFor="videoAltText">Alt Text (tùy chọn)</Label>
                  <Input
                    id="videoAltText"
                    type="text"
                    value={videoAltText}
                    onChange={(e) => setVideoAltText(e.target.value)}
                    placeholder="Mô tả video cho người dùng khiếm thị"
                    className="mt-2"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                  >
                    Hủy
                  </Button>
                  <Button
                    type="button"
                    onClick={handleInsertFromUrl}
                    disabled={!videoUrl.trim()}
                  >
                    Chèn video
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                {loadingMedia ? (
                  <div className="text-center py-12">
                    <Loader2 className="h-16 w-16 mx-auto text-muted-foreground mb-4 animate-spin" />
                    <p className="text-muted-foreground">Đang tải media...</p>
                  </div>
                ) : mediaItems.length === 0 ? (
                  <div className="text-center py-12">
                    <ImageIcon className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Chưa có media nào</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-4">
                    {mediaItems.map((item) => {
                      const isSelected = mode === 'multiple' 
                        ? selectedMediaMultiple.some(m => m.id === item.id)
                        : selectedMedia?.id === item.id;
                      
                      return (
                        <div
                          key={item.id}
                          onClick={() => handleMediaClick(item)}
                          className={`cursor-pointer border-2 rounded-lg overflow-hidden transition-all ${
                            isSelected
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
                          {isSelected && mode === 'multiple' && (
                            <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs">
                              {selectedMediaMultiple.findIndex(m => m.id === item.id) + 1}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Attachment Details Sidebar */}
          {(selectedMedia || (mode === 'multiple' && selectedMediaMultiple.length > 0)) && (
            <div className="w-80 border-l p-4 overflow-y-auto">
              <h3 className="font-semibold mb-4">
                {mode === 'multiple' 
                  ? `Đã chọn ${selectedMediaMultiple.length} ảnh`
                  : 'Chi tiết đính kèm'}
              </h3>

              {/* Preview - Only show in single mode or first selected in multiple mode */}
              {mode === 'single' && selectedMedia && (
                <>
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

                  {/* Metadata Fields - Only in single mode */}
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

                {/* Display Settings - Only in single mode and when onInsert is used */}
                {onInsert && (
                  <div className="mt-6 pt-6 border-t space-y-4">
                    <h3 className="font-semibold mb-4">Thiết lập hiển thị</h3>

                    <div>
                      <Label htmlFor="media-alignment">Căn chỉnh</Label>
                      <Select
                        value={alignment}
                        onValueChange={(value) => setAlignment(value as typeof alignment)}
                      >
                        <SelectTrigger id="media-alignment" className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Không</SelectItem>
                          <SelectItem value="left">Trái</SelectItem>
                          <SelectItem value="center">Giữa</SelectItem>
                          <SelectItem value="right">Phải</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="media-link">Liên kết tới</Label>
                      <Select
                        value={linkTo}
                        onValueChange={(value) => setLinkTo(value as typeof linkTo)}
                      >
                        <SelectTrigger id="media-link" className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Không</SelectItem>
                          <SelectItem value="file">Tập tin đa phương tiện</SelectItem>
                          <SelectItem value="attachment">Trang đính kèm</SelectItem>
                          <SelectItem value="custom">Tùy chỉnh URL</SelectItem>
                        </SelectContent>
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
                          value={size}
                          onValueChange={(value) => setSize(value as typeof size)}
                        >
                          <SelectTrigger id="media-size" className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="thumbnail">Thumbnail (150x150)</SelectItem>
                            <SelectItem value="medium">Medium (300x300)</SelectItem>
                            <SelectItem value="large">Large (1024x1024)</SelectItem>
                            <SelectItem value="full">Full Size</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                )}
                </>
              )}

              {/* Multiple selection preview */}
              {mode === 'multiple' && selectedMediaMultiple.length > 0 && (
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {selectedMediaMultiple.map((item) => (
                    <div key={item.id} className="relative">
                      {item.type === 'image' ? (
                        <img
                          src={item.thumbnail_url || item.url}
                          alt={item.alt || ''}
                          className="w-full rounded-lg"
                        />
                      ) : (
                        <div className="w-full aspect-square bg-muted rounded-lg flex items-center justify-center">
                          <Video className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => setSelectedMediaMultiple(prev => prev.filter(m => m.id !== item.id))}
                        className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-destructive/90"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
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
            disabled={
              mode === 'multiple' 
                ? selectedMediaMultiple.length === 0
                : !selectedMedia
            }
          >
            {buttonText || (mode === 'single' 
              ? (onSelect ? 'Thiết lập ảnh sản phẩm' : 'Chèn vào bài viết')
              : (onSelect ? 'Thêm vào thư viện' : 'Chèn vào bài viết'))}
          </Button>
        </div>
      </div>
    </div>
  );

  // Render modal using Portal to ensure it's always on top
  return createPortal(modalContent, document.body);
}
