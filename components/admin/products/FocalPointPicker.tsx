'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Editor } from '@tiptap/react';
import { Button } from '@/components/ui/button';

interface FocalPointPickerProps {
  editor: Editor | null;
  selectedImage: HTMLElement | null;
  isOpen: boolean;
  onClose: () => void;
}

export function FocalPointPicker({
  editor,
  selectedImage,
  isOpen,
  onClose,
}: FocalPointPickerProps) {
  const [focalPoint, setFocalPoint] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);

  // Load existing focal point
  useEffect(() => {
    if (!selectedImage || !isOpen) return;

    const dataFocalX = selectedImage.getAttribute('data-focal-x');
    const dataFocalY = selectedImage.getAttribute('data-focal-y');

    if (dataFocalX && dataFocalY) {
      setFocalPoint({
        x: parseFloat(dataFocalX),
        y: parseFloat(dataFocalY),
      });
    } else {
      // Default to center
      setFocalPoint({ x: 50, y: 50 });
    }
  }, [selectedImage, isOpen]);

  const updateFocalPoint = useCallback((e: React.MouseEvent | MouseEvent) => {
    if (!containerRef.current || !selectedImage) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    // Clamp values between 0 and 100
    const clampedX = Math.max(0, Math.min(100, x));
    const clampedY = Math.max(0, Math.min(100, y));

    setFocalPoint({ x: clampedX, y: clampedY });
  }, [selectedImage]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return;
    setIsDragging(true);
    updateFocalPoint(e);
  }, [updateFocalPoint]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    updateFocalPoint(e);
  }, [isDragging, updateFocalPoint]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Handle global mouse events for dragging
  useEffect(() => {
    if (!isDragging) return;

    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      updateFocalPoint(e);
    };

    const handleGlobalMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, updateFocalPoint]);

  const handleSave = () => {
    if (!editor || !selectedImage || !focalPoint) return;

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
        // Update image with focal point
        // Preserve existing style (like filters) and merge object-position
        const existingStyle = imageNode.attrs.style || '';
        let mergedStyle = existingStyle;
        // Remove existing object-position if any
        mergedStyle = mergedStyle.replace(/object-position:\s*[^;]+;?/g, '');
        // Add new object-position
        mergedStyle = `${mergedStyle} object-position: ${focalPoint.x}% ${focalPoint.y}%;`.trim();
        
        editor
          .chain()
          .focus()
          .setNodeSelection(imagePos)
          .updateAttributes('image', {
            ...imageNode.attrs,
            'data-focal-x': focalPoint.x.toString(),
            'data-focal-y': focalPoint.y.toString(),
            style: mergedStyle || undefined,
          })
          .run();
      }
    }

    onClose();
  };

  if (!isOpen || !selectedImage) return null;

  const imageUrl = selectedImage.getAttribute('src') || '';
  const imageWidth = selectedImage.offsetWidth || 400;
  const imageHeight = selectedImage.offsetHeight || 300;

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg shadow-lg max-w-2xl w-full p-6">
        <h3 className="text-lg font-semibold mb-4">Điểm lấy nét thông minh</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Click hoặc kéo điểm đỏ để đặt vị trí quan trọng nhất của ảnh. Điểm này sẽ được căn giữa khi ảnh hiển thị ở kích thước khác.
        </p>

        <div
          ref={containerRef}
          className="relative border-2 border-dashed border-input rounded-lg overflow-hidden bg-muted"
          style={{
            width: '100%',
            maxWidth: '600px',
            aspectRatio: `${imageWidth} / ${imageHeight}`,
            margin: '0 auto',
            cursor: 'crosshair',
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          <img
            src={imageUrl}
            alt="Preview"
            className="w-full h-full object-cover"
            style={{
              objectPosition: focalPoint ? `${focalPoint.x}% ${focalPoint.y}%` : 'center',
            }}
            draggable={false}
          />

          {/* Focal point dot */}
          {focalPoint && (
            <div
              ref={dotRef}
              className="absolute w-4 h-4 bg-red-500 border-2 border-white rounded-full shadow-lg transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
              style={{
                left: `${focalPoint.x}%`,
                top: `${focalPoint.y}%`,
              }}
            />
          )}
        </div>

        {/* Coordinates display */}
        {focalPoint && (
          <div className="mt-4 text-center text-sm text-muted-foreground">
            Vị trí: {focalPoint.x.toFixed(1)}%, {focalPoint.y.toFixed(1)}%
          </div>
        )}

        <div className="flex justify-end gap-2 mt-6">
          <Button type="button" variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button type="button" onClick={handleSave}>
            Lưu
          </Button>
        </div>
      </div>
    </div>
  );
}
