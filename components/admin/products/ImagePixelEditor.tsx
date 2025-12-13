'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Editor } from '@tiptap/react';
import Cropper from 'cropperjs';
import 'cropperjs/dist/cropper.css';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RotateCw, RotateCcw, FlipVertical, FlipHorizontal, Undo2, Eye } from 'lucide-react';

interface ImagePixelEditorProps {
  isOpen: boolean;
  onClose: () => void;
  editor: Editor | null;
  selectedImage: HTMLElement | null;
  originalImageUrl?: string; // URL của ảnh gốc để restore
}

export function ImagePixelEditor({
  isOpen,
  onClose,
  editor,
  selectedImage,
  originalImageUrl,
}: ImagePixelEditorProps) {
  const imageRef = useRef<HTMLImageElement>(null);
  const cropperRef = useRef<Cropper | null>(null);
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);

  // Initialize Cropper.js
  useEffect(() => {
    if (!isOpen || !imageRef.current || !selectedImage) return;

    const imageUrl = selectedImage.getAttribute('src') || '';
    if (!imageUrl) return;

    // Set image source
    if (imageRef.current) {
      imageRef.current.src = imageUrl;
    }

    // Initialize Cropper
    const cropper = new Cropper(imageRef.current!, {
      aspectRatio: aspectRatio || undefined,
      viewMode: 1,
      dragMode: 'move',
      autoCropArea: 0.8,
      restore: false,
      guides: true,
      center: true,
      highlight: false,
      cropBoxMovable: true,
      cropBoxResizable: true,
      toggleDragModeOnDblclick: false,
      scalable: true,
      zoomable: true,
      ready() {
        setHasChanges(false);
      },
      crop() {
        setHasChanges(true);
      },
    });

    cropperRef.current = cropper;

    return () => {
      if (cropperRef.current) {
        cropperRef.current.destroy();
        cropperRef.current = null;
      }
    };
  }, [isOpen, selectedImage, aspectRatio]);

  const handleRotateLeft = () => {
    if (!cropperRef.current) return;
    cropperRef.current.rotate(-90);
    setHasChanges(true);
  };

  const handleRotateRight = () => {
    if (!cropperRef.current) return;
    cropperRef.current.rotate(90);
    setHasChanges(true);
  };

  const handleFlipVertical = () => {
    if (!cropperRef.current) return;
    cropperRef.current.scaleY(-1);
    setHasChanges(true);
  };

  const handleFlipHorizontal = () => {
    if (!cropperRef.current) return;
    cropperRef.current.scaleX(-1);
    setHasChanges(true);
  };

  const handleAspectRatioChange = (ratio: string) => {
    if (!cropperRef.current) return;
    
    if (ratio === 'free') {
      setAspectRatio(null);
      cropperRef.current.setAspectRatio(NaN);
    } else {
      const [width, height] = ratio.split(':').map(Number);
      const aspect = width / height;
      setAspectRatio(aspect);
      cropperRef.current.setAspectRatio(aspect);
    }
    setHasChanges(true);
  };

  const handleRestore = async () => {
    if (!editor || !selectedImage || !originalImageUrl) return;

    const src = selectedImage.getAttribute('src') || '';
    if (!src) return;

    // Find image node position
    let imagePos: number | null = null;
    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === 'image' && node.attrs.src === src) {
        imagePos = pos;
        return false;
      }
    });

    if (imagePos !== null) {
      const imageNode = editor.state.doc.nodeAt(imagePos);
      if (imageNode && imageNode.type.name === 'image') {
        // Restore to original image
        editor
          .chain()
          .focus()
          .setNodeSelection(imagePos)
          .updateAttributes('image', {
            ...imageNode.attrs,
            src: originalImageUrl,
            'data-original-src': undefined,
            'data-edited': undefined,
          })
          .run();
      }
    }

    onClose();
  };

  const handleSave = async () => {
    if (!cropperRef.current || !editor || !selectedImage || isProcessing) return;

    setIsProcessing(true);

    try {
      // Get cropped canvas with options in a single call
      const canvas = cropperRef.current.getCroppedCanvas({
        imageSmoothingEnabled: true,
        imageSmoothingQuality: 'high',
      });

      // Convert canvas to blob
      canvas.toBlob(async (blob) => {
        if (!blob) {
          setIsProcessing(false);
          return;
        }

        // Create FormData for upload
        const formData = new FormData();
        const originalSrc = selectedImage.getAttribute('src') || '';
        const fileName = originalSrc.split('/').pop() || 'image.jpg';
        const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
        const ext = fileName.split('.').pop() || 'jpg';
        const timestamp = Date.now();
        const newFileName = `${nameWithoutExt}-edited-${timestamp}.${ext}`;
        
        formData.append('file', blob, newFileName);
        formData.append('originalUrl', originalSrc);

        // Upload to server
        const response = await fetch('/api/admin/images/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Failed to upload edited image');
        }

        const data = await response.json();
        const newImageUrl = data.url;
        
        if (!newImageUrl) {
          throw new Error('No URL returned from server');
        }

        // Update image in editor
        const src = selectedImage.getAttribute('src') || '';
        if (!src) {
          setIsProcessing(false);
          return;
        }
        
        // Find image node position
        let imagePos: number | null = null;
        editor.state.doc.descendants((node, pos) => {
          if (node.type.name === 'image' && node.attrs.src === src) {
            imagePos = pos;
            return false;
          }
        });

        if (imagePos !== null) {
          const imageNode = editor.state.doc.nodeAt(imagePos);
          if (imageNode && imageNode.type.name === 'image') {
            // Store original URL for restore
            const originalSrc = imageNode.attrs['data-original-src'] || src;
            
            // Update image with new URL
            editor
              .chain()
              .focus()
              .setNodeSelection(imagePos)
              .updateAttributes('image', {
                ...imageNode.attrs,
                src: newImageUrl,
                'data-original-src': originalSrc,
                'data-edited': 'true',
              })
              .run();
          }
        }

        setIsProcessing(false);
        setHasChanges(false);
        onClose();
      }, 'image/jpeg', 0.9);
    } catch (error) {
      console.error('Error saving edited image:', error);
      alert('Có lỗi xảy ra khi lưu ảnh đã chỉnh sửa');
      setIsProcessing(false);
    }
  };

  if (!selectedImage) return null;

  const imageUrl = selectedImage.getAttribute('src') || '';
  const originalSrc = selectedImage.getAttribute('data-original-src') || originalImageUrl || imageUrl;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa hình ảnh</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Toolbar */}
          <div className="flex items-center gap-2 flex-wrap border-b pb-4">
            {/* Rotate buttons */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRotateLeft}
              title="Xoay trái 90°"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Xoay trái
            </Button>
            
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRotateRight}
              title="Xoay phải 90°"
            >
              <RotateCw className="h-4 w-4 mr-2" />
              Xoay phải
            </Button>

            <div className="h-6 w-px bg-border mx-1" />

            {/* Flip buttons */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleFlipVertical}
              title="Lật dọc"
            >
              <FlipVertical className="h-4 w-4 mr-2" />
              Lật dọc
            </Button>
            
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleFlipHorizontal}
              title="Lật ngang"
            >
              <FlipHorizontal className="h-4 w-4 mr-2" />
              Lật ngang
            </Button>

            <div className="h-6 w-px bg-border mx-1" />

            {/* Aspect Ratio */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Tỷ lệ:</label>
              <Select
                defaultValue="free"
                onValueChange={(value) => handleAspectRatioChange(value)}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1:1">1:1 (Vuông)</SelectItem>
                  <SelectItem value="16:9">16:9 (Video)</SelectItem>
                  <SelectItem value="4:3">4:3 (Ảnh)</SelectItem>
                  <SelectItem value="free">Tự do</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Restore button */}
            {originalSrc !== imageUrl && (
              <>
                <div className="h-6 w-px bg-border mx-1" />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleRestore}
                  title="Khôi phục ảnh gốc"
                >
                  <Undo2 className="h-4 w-4 mr-2" />
                  Khôi phục
                </Button>
              </>
            )}
          </div>

          {/* Cropper container */}
          <div className="relative w-full" style={{ minHeight: '400px' }}>
            <div className="relative" style={{ minHeight: '400px' }}>
              {/* Compare View - Show original when holding button */}
              {showOriginal && originalSrc !== imageUrl && (
                <div className="absolute inset-0 z-10 border-4 border-primary rounded overflow-hidden">
                  <img
                    src={originalSrc}
                    alt="Original image"
                    className="w-full h-full object-contain bg-muted"
                    style={{ display: 'block' }}
                  />
                  <div className="absolute top-2 left-2 bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-medium">
                    Ảnh gốc
                  </div>
                </div>
              )}
              
              <img
                ref={imageRef}
                src={imageUrl}
                alt="Image to edit"
                className="max-w-full"
                style={{ display: 'block', maxWidth: '100%' }}
              />
              
              {!showOriginal && originalSrc !== imageUrl && (
                <div className="absolute bottom-2 right-2 bg-background/80 backdrop-blur-sm px-3 py-2 rounded text-xs pointer-events-none">
                  Nhấn giữ để xem ảnh gốc
                </div>
              )}
            </div>
          </div>

          {/* Compare View Button */}
          {originalSrc !== imageUrl && (
            <div className="flex justify-center">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onMouseDown={() => setShowOriginal(true)}
                onMouseUp={() => setShowOriginal(false)}
                onMouseLeave={() => setShowOriginal(false)}
                onTouchStart={() => setShowOriginal(true)}
                onTouchEnd={() => setShowOriginal(false)}
                className="w-full"
              >
                {showOriginal ? 'Thả để xem ảnh đã chỉnh sửa' : 'Nhấn giữ để xem ảnh gốc'}
              </Button>
            </div>
          )}

          {/* Instructions */}
          <div className="text-sm text-muted-foreground">
            <p>• Kéo để di chuyển vùng cắt</p>
            <p>• Kéo các góc để thay đổi kích thước</p>
            <p>• Sử dụng các nút xoay và lật để chỉnh sửa</p>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={isProcessing}>
            Hủy
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isProcessing || !hasChanges}
          >
            {isProcessing ? 'Đang xử lý...' : 'Lưu ảnh đã chỉnh sửa'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
