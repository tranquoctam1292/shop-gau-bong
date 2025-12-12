'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Editor } from '@tiptap/react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { FocalPointPicker } from './FocalPointPicker';
import { Sparkles, Wand2, Camera } from 'lucide-react';

interface ImageDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  editor: Editor | null;
  selectedImage: HTMLElement | null;
}

interface ImageData {
  src: string;
  alt: string;
  title: string;
  caption: string;
  width: string;
  height: string;
  displaySize: 'thumbnail' | 'medium' | 'large' | 'full' | 'custom';
  customWidth: string;
  customHeight: string;
  linkTo: 'none' | 'media' | 'custom';
  customUrl: string;
  cssClass: string;
  openInNewTab: boolean;
}

const DISPLAY_SIZES = {
  thumbnail: { width: 150, height: 150, label: 'Thumbnail (150px)' },
  medium: { width: 300, height: 300, label: 'Medium (300px)' },
  large: { width: 1024, height: 1024, label: 'Large (1024px)' },
  full: { width: 0, height: 0, label: 'Full Size (Gốc)' },
  custom: { width: 0, height: 0, label: 'Custom Size' },
};

export function ImageDetailsModal({ 
  isOpen, 
  onClose, 
  editor, 
  selectedImage 
}: ImageDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<'general' | 'advanced'>('general');
  const [formData, setFormData] = useState<ImageData>({
    src: '',
    alt: '',
    title: '',
    caption: '',
    width: '',
    height: '',
    displaySize: 'full',
    customWidth: '',
    customHeight: '',
    linkTo: 'none',
    customUrl: '',
    cssClass: '',
    openInNewTab: false,
  });
  const [aspectRatio, setAspectRatio] = useState<number>(1);
  const [lockAspectRatio, setLockAspectRatio] = useState(true);
  const [altTextError, setAltTextError] = useState(false);
  const [showFocalPointPicker, setShowFocalPointPicker] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string>('none');
  const [showWatermark, setShowWatermark] = useState(false);

  // Parse image data from selected image
  useEffect(() => {
    if (!selectedImage || !isOpen) return;

    const src = selectedImage.getAttribute('src') || '';
    const alt = selectedImage.getAttribute('alt') || '';
    const title = selectedImage.getAttribute('title') || '';
    const width = selectedImage.getAttribute('width') || '';
    const height = selectedImage.getAttribute('height') || '';
    const cssClass = selectedImage.getAttribute('class') || '';
    // Remove alignment classes from cssClass for display (they're managed separately)
    const cssClassWithoutAlignment = cssClass
      .split(' ')
      .filter(c => !c.startsWith('align'))
      .join(' ')
      .trim();
    
    // Check if image has caption in data attribute or figure
    const figure = selectedImage.closest('figure');
    let caption = figure?.querySelector('figcaption')?.textContent || '';
    // Also check data attribute
    if (!caption) {
      caption = selectedImage.getAttribute('data-caption') || '';
    }

    // Load filter and watermark settings
    const dataFilter = selectedImage.getAttribute('data-filter') || 'none';
    const dataWatermark = selectedImage.getAttribute('data-watermark') === 'true';

    // Determine display size
    let displaySize: 'thumbnail' | 'medium' | 'large' | 'full' | 'custom' = 'full';
    if (width) {
      const widthNum = parseInt(width);
      if (widthNum <= 150) displaySize = 'thumbnail';
      else if (widthNum <= 300) displaySize = 'medium';
      else if (widthNum <= 1024) displaySize = 'large';
      else displaySize = 'custom';
    }

    // Calculate aspect ratio
    const widthNum = parseInt(width) || selectedImage.offsetWidth;
    const heightNum = parseInt(height) || selectedImage.offsetHeight;
    const ratio = widthNum > 0 && heightNum > 0 ? widthNum / heightNum : 1;
    setAspectRatio(ratio);

    // Check if image has link (from DOM or data attributes)
    const parentLink = selectedImage.closest('a');
    let linkTo: 'none' | 'media' | 'custom' = 'none';
    let customUrl = '';
    let openInNewTab = false;
    
    // Check data attributes first
    const dataLinkTo = selectedImage.getAttribute('data-link-to');
    if (dataLinkTo === 'media' || dataLinkTo === 'custom') {
      linkTo = dataLinkTo;
      customUrl = selectedImage.getAttribute('data-link-url') || '';
      openInNewTab = selectedImage.getAttribute('data-link-target') === '_blank';
    } else if (parentLink) {
      // Fallback to DOM link
      const href = parentLink.getAttribute('href') || '';
      const target = parentLink.getAttribute('target');
      openInNewTab = target === '_blank';
      
      if (href === src) {
        linkTo = 'media';
      } else if (href) {
        linkTo = 'custom';
        customUrl = href;
      }
    }

    setFormData({
      src,
      alt,
      title,
      caption,
      width: width || '',
      height: height || '',
      displaySize: displaySize === 'full' && (width || height) ? 'custom' : displaySize,
      customWidth: width || '',
      customHeight: height || '',
      linkTo,
      customUrl,
      cssClass: cssClassWithoutAlignment,
      openInNewTab,
    });

    // Set filter and watermark states
    setSelectedFilter(dataFilter);
    setShowWatermark(dataWatermark);
  }, [selectedImage, isOpen]);

  const handleInputChange = (field: keyof ImageData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Validate alt text
    if (field === 'alt') {
      setAltTextError(value.trim() === '');
    }

    // Handle aspect ratio lock for custom size
    if (lockAspectRatio && aspectRatio > 0) {
      if (field === 'customWidth' && value) {
        const newHeight = Math.round(parseInt(value) / aspectRatio);
        setFormData(prev => ({ ...prev, customHeight: newHeight.toString() }));
      } else if (field === 'customHeight' && value) {
        const newWidth = Math.round(parseInt(value) * aspectRatio);
        setFormData(prev => ({ ...prev, customWidth: newWidth.toString() }));
      }
    }
  };

  const handleDisplaySizeChange = (size: 'thumbnail' | 'medium' | 'large' | 'full' | 'custom') => {
    setFormData(prev => ({ ...prev, displaySize: size }));
    
    if (size !== 'custom' && size !== 'full') {
      const sizeData = DISPLAY_SIZES[size];
      const newWidth = Math.round(sizeData.width);
      const newHeight = lockAspectRatio && aspectRatio > 0 
        ? Math.round(newWidth / aspectRatio)
        : Math.round(sizeData.height);
      
      setFormData(prev => ({
        ...prev,
        customWidth: newWidth.toString(),
        customHeight: newHeight.toString(),
      }));
    }
  };

  const handleSave = () => {
    if (!editor || !selectedImage) return;

    // Validate alt text
    if (!formData.alt.trim()) {
      setAltTextError(true);
      return;
    }

    const src = formData.src;
    if (!src) return;

    // Find image node position
    let imagePos: number | null = null;
    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === 'image' && node.attrs.src === src) {
        imagePos = pos;
        return false;
      }
    });

    if (imagePos === null) return;

    const imageNode = editor.state.doc.nodeAt(imagePos);
    if (!imageNode || imageNode.type.name !== 'image') return;

    // Build attributes
    // Preserve alignment classes from existing class attribute
    const existingClass = imageNode.attrs.class || '';
    const alignmentClasses = existingClass.split(' ').filter(c => c.startsWith('align'));
    const otherClasses = existingClass.split(' ').filter(c => !c.startsWith('align') && c.trim());
    
    // Merge CSS classes
    const allClasses = [
      ...alignmentClasses,
      ...otherClasses,
      formData.cssClass,
    ].filter(Boolean).join(' ').trim();
    
    // Build style string
    let styleString = imageNode.attrs.style || '';
    
    // Add filter style if selected
    if (selectedFilter !== 'none') {
      let filterValue = '';
      switch (selectedFilter) {
        case 'brighten':
          filterValue = 'brightness(1.1)';
          break;
        case 'vivid':
          filterValue = 'saturate(1.3)';
          break;
        case 'vintage':
          filterValue = 'sepia(0.5) contrast(1.1)';
          break;
      }
      if (filterValue) {
        // Remove existing filter if any
        styleString = styleString.replace(/filter:\s*[^;]+;?/g, '');
        styleString = `${styleString} filter: ${filterValue};`.trim();
      }
    } else {
      // Remove filter if none selected
      styleString = styleString.replace(/filter:\s*[^;]+;?/g, '').trim();
    }
    
    const attrs: any = {
      ...imageNode.attrs,
      alt: formData.alt,
      title: formData.title || undefined,
      class: allClasses || undefined,
      style: styleString || undefined,
      'data-filter': selectedFilter !== 'none' ? selectedFilter : undefined,
      'data-watermark': showWatermark ? 'true' : undefined,
    };

    // Handle size
    if (formData.displaySize === 'custom' && formData.customWidth && formData.customHeight) {
      attrs.width = formData.customWidth;
      attrs.height = formData.customHeight;
    } else if (formData.displaySize !== 'full') {
      const sizeData = DISPLAY_SIZES[formData.displaySize];
      attrs.width = sizeData.width.toString();
      attrs.height = lockAspectRatio && aspectRatio > 0
        ? Math.round(sizeData.width / aspectRatio).toString()
        : sizeData.height.toString();
    } else {
      // Full size - remove width/height
      attrs.width = undefined;
      attrs.height = undefined;
    }

    // Handle caption - store in data attribute for now
    // Full figure/figcaption support requires custom extension
    if (formData.caption.trim()) {
      attrs['data-caption'] = formData.caption;
    } else {
      attrs['data-caption'] = undefined;
    }

    // Handle watermark if enabled
    if (showWatermark) {
      // Store watermark flag - actual watermark will be applied on save via API
      attrs['data-watermark'] = 'true';
      attrs['data-watermark-position'] = 'bottom-right';
    } else {
      attrs['data-watermark'] = undefined;
      attrs['data-watermark-position'] = undefined;
    }

    // Handle link - for now, we'll update the image
    // Full link wrapping requires more complex node manipulation
    // The link functionality will be handled at render time or via custom extension
    if (formData.linkTo === 'media') {
      attrs['data-link-to'] = 'media';
      attrs['data-link-url'] = formData.src;
      attrs['data-link-target'] = formData.openInNewTab ? '_blank' : undefined;
    } else if (formData.linkTo === 'custom' && formData.customUrl) {
      attrs['data-link-to'] = 'custom';
      attrs['data-link-url'] = formData.customUrl;
      attrs['data-link-target'] = formData.openInNewTab ? '_blank' : undefined;
    } else {
      attrs['data-link-to'] = undefined;
      attrs['data-link-url'] = undefined;
      attrs['data-link-target'] = undefined;
    }

    // Update image attributes - single update with all attributes
    editor
      .chain()
      .focus()
      .setNodeSelection(imagePos)
      .updateAttributes('image', attrs)
      .run();

    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Chi tiết hình ảnh</DialogTitle>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex border-b mb-4">
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'general'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Cài đặt Chung
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('advanced')}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'advanced'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Nâng cao
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'general' && (
          <div className="space-y-4">
            {/* Alt Text */}
            <div>
              <Label htmlFor="alt-text">
                Văn bản thay thế (Alt Text) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="alt-text"
                value={formData.alt}
                onChange={(e) => handleInputChange('alt', e.target.value)}
                className={altTextError ? 'border-destructive' : ''}
                placeholder="Mô tả hình ảnh cho SEO"
              />
              {altTextError && (
                <p className="text-sm text-destructive mt-1">
                  Văn bản thay thế là bắt buộc cho SEO
                </p>
              )}
            </div>

            {/* Caption */}
            <div>
              <Label htmlFor="caption">Chú thích (Caption)</Label>
              <Textarea
                id="caption"
                value={formData.caption}
                onChange={(e) => handleInputChange('caption', e.target.value)}
                placeholder="Chú thích cho hình ảnh (tùy chọn)"
                rows={3}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Chú thích sẽ được hiển thị bên dưới hình ảnh
              </p>
            </div>

            {/* Display Size */}
            <div>
              <Label htmlFor="display-size">Kích thước hiển thị</Label>
              <Select
                id="display-size"
                value={formData.displaySize}
                onChange={(e) => handleDisplaySizeChange(e.target.value as any)}
              >
                <option value="thumbnail">Thumbnail (150px)</option>
                <option value="medium">Medium (300px)</option>
                <option value="large">Large (1024px)</option>
                <option value="full">Full Size (Gốc)</option>
                <option value="custom">Custom Size</option>
              </Select>
            </div>

            {/* Custom Size */}
            {formData.displaySize === 'custom' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="custom-width">Rộng (px)</Label>
                  <Input
                    id="custom-width"
                    type="number"
                    value={formData.customWidth}
                    onChange={(e) => handleInputChange('customWidth', e.target.value)}
                    placeholder="Width"
                  />
                </div>
                <div>
                  <Label htmlFor="custom-height">Cao (px)</Label>
                  <Input
                    id="custom-height"
                    type="number"
                    value={formData.customHeight}
                    onChange={(e) => handleInputChange('customHeight', e.target.value)}
                    placeholder="Height"
                  />
                </div>
              </div>
            )}

            {/* Lock Aspect Ratio */}
            {formData.displaySize === 'custom' && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="lock-aspect"
                  checked={lockAspectRatio}
                  onCheckedChange={(checked) => setLockAspectRatio(checked === true)}
                />
                <Label htmlFor="lock-aspect" className="text-sm font-normal cursor-pointer">
                  Khóa tỷ lệ khung hình
                </Label>
              </div>
            )}

            {/* Link To */}
            <div>
              <Label htmlFor="link-to">Liên kết tới</Label>
              <Select
                id="link-to"
                value={formData.linkTo}
                onChange={(e) => handleInputChange('linkTo', e.target.value as any)}
              >
                <option value="none">None (Không link)</option>
                <option value="media">Media File (Link xem ảnh gốc)</option>
                <option value="custom">Custom URL</option>
              </Select>
            </div>

            {/* Custom URL */}
            {formData.linkTo === 'custom' && (
              <div>
                <Label htmlFor="custom-url">URL tùy chỉnh</Label>
                <Input
                  id="custom-url"
                  type="url"
                  value={formData.customUrl}
                  onChange={(e) => handleInputChange('customUrl', e.target.value)}
                  placeholder="https://example.com"
                />
              </div>
            )}
          </div>
        )}

        {activeTab === 'advanced' && (
          <div className="space-y-4">
            {/* Focal Point Picker */}
            <div>
              <Label>Điểm lấy nét thông minh</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Đặt điểm quan trọng nhất của ảnh để tự động căn giữa khi hiển thị ở kích thước khác
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowFocalPointPicker(true)}
                className="w-full"
              >
                <Camera className="h-4 w-4 mr-2" />
                Đặt điểm lấy nét
              </Button>
            </div>

            {/* Instant Filters */}
            <div>
              <Label>Bộ lọc màu nhanh</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Áp dụng bộ lọc màu để làm ảnh đẹp hơn (preview bằng CSS)
              </p>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  type="button"
                  variant={selectedFilter === 'brighten' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedFilter(selectedFilter === 'brighten' ? 'none' : 'brighten')}
                  className="flex flex-col items-center gap-1 h-auto py-2"
                >
                  <Sparkles className="h-4 w-4" />
                  <span className="text-xs">Sáng hơn</span>
                </Button>
                <Button
                  type="button"
                  variant={selectedFilter === 'vivid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedFilter(selectedFilter === 'vivid' ? 'none' : 'vivid')}
                  className="flex flex-col items-center gap-1 h-auto py-2"
                >
                  <Wand2 className="h-4 w-4" />
                  <span className="text-xs">Rực rỡ</span>
                </Button>
                <Button
                  type="button"
                  variant={selectedFilter === 'vintage' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedFilter(selectedFilter === 'vintage' ? 'none' : 'vintage')}
                  className="flex flex-col items-center gap-1 h-auto py-2"
                >
                  <Camera className="h-4 w-4" />
                  <span className="text-xs">Vintage</span>
                </Button>
              </div>
            </div>

            {/* Watermark Toggle */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="watermark"
                checked={showWatermark}
                onCheckedChange={(checked) => setShowWatermark(checked === true)}
              />
              <Label htmlFor="watermark" className="text-sm font-normal cursor-pointer">
                Đóng dấu logo Shop
              </Label>
              <p className="text-xs text-muted-foreground ml-2">
                (Áp dụng khi lưu)
              </p>
            </div>

            <div className="h-px bg-border my-4" />

            {/* Title Attribute */}
            <div>
              <Label htmlFor="title-attr">Thuộc tính tiêu đề (Title Attribute)</Label>
              <Input
                id="title-attr"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Tooltip khi hover vào ảnh"
              />
            </div>

            {/* CSS Class */}
            <div>
              <Label htmlFor="css-class">CSS Class</Label>
              <Input
                id="css-class"
                value={formData.cssClass}
                onChange={(e) => handleInputChange('cssClass', e.target.value)}
                placeholder="shadow-box, rounded-border"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Thêm class tùy biến cho hình ảnh
              </p>
            </div>

            {/* Open in new tab */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="open-new-tab"
                checked={formData.openInNewTab}
                onCheckedChange={(checked) => handleInputChange('openInNewTab', checked === true)}
              />
              <Label htmlFor="open-new-tab" className="text-sm font-normal cursor-pointer">
                Mở trong tab mới (target="_blank")
              </Label>
            </div>
          </div>
        )}

        {/* Focal Point Picker Modal */}
        {showFocalPointPicker && (
          <FocalPointPicker
            editor={editor}
            selectedImage={selectedImage}
            isOpen={showFocalPointPicker}
            onClose={() => setShowFocalPointPicker(false)}
          />
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button type="button" onClick={handleSave}>
            Cập nhật
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
