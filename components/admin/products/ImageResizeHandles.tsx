'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Editor } from '@tiptap/react';

interface ImageResizeHandlesProps {
  editor: Editor | null;
  selectedImage: HTMLElement | null;
  onResize?: (width: number, height: number) => void;
}

interface ResizeState {
  isResizing: boolean;
  handle: 'nw' | 'ne' | 'sw' | 'se' | null;
  startX: number;
  startY: number;
  startWidth: number;
  startHeight: number;
  aspectRatio: number;
}

export function ImageResizeHandles({ 
  editor, 
  selectedImage,
  onResize 
}: ImageResizeHandlesProps) {
  const [resizeState, setResizeState] = useState<ResizeState>({
    isResizing: false,
    handle: null,
    startX: 0,
    startY: 0,
    startWidth: 0,
    startHeight: 0,
    aspectRatio: 1,
  });
  const [currentSize, setCurrentSize] = useState<{ width: number; height: number } | null>(null);
  const handlesRef = useRef<HTMLDivElement>(null);

  // Calculate handle positions
  useEffect(() => {
    if (!selectedImage) {
      setCurrentSize(null);
      return;
    }

    const updatePosition = () => {
      const rect = selectedImage.getBoundingClientRect();
      const editorElement = editor?.view.dom;
      if (!editorElement) return;

      const editorRect = editorElement.getBoundingClientRect();
      
      setCurrentSize({
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      });
    };

    updatePosition();
    
    // Update on scroll/resize
    const handleUpdate = () => updatePosition();
    window.addEventListener('scroll', handleUpdate, true);
    window.addEventListener('resize', handleUpdate);

    return () => {
      window.removeEventListener('scroll', handleUpdate, true);
      window.removeEventListener('resize', handleUpdate);
    };
  }, [selectedImage, editor]);

  // Handle mouse down on resize handle
  const handleMouseDown = (e: React.MouseEvent, handle: 'nw' | 'ne' | 'sw' | 'se') => {
    if (!selectedImage) return;

    e.preventDefault();
    e.stopPropagation();

    const rect = selectedImage.getBoundingClientRect();
    const aspectRatio = rect.width / rect.height;

    setResizeState({
      isResizing: true,
      handle,
      startX: e.clientX,
      startY: e.clientY,
      startWidth: rect.width,
      startHeight: rect.height,
      aspectRatio,
    });
  };

  // Handle mouse move for resizing
  useEffect(() => {
    if (!resizeState.isResizing || !selectedImage || !editor) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - resizeState.startX;
      const deltaY = e.clientY - resizeState.startY;
      
      let newWidth = resizeState.startWidth;
      let newHeight = resizeState.startHeight;

      // Calculate new dimensions based on handle
      switch (resizeState.handle) {
        case 'nw': // Top-left
          newWidth = resizeState.startWidth - deltaX;
          newHeight = newWidth / resizeState.aspectRatio;
          break;
        case 'ne': // Top-right
          newWidth = resizeState.startWidth + deltaX;
          newHeight = newWidth / resizeState.aspectRatio;
          break;
        case 'sw': // Bottom-left
          newWidth = resizeState.startWidth - deltaX;
          newHeight = newWidth / resizeState.aspectRatio;
          break;
        case 'se': // Bottom-right
          newWidth = resizeState.startWidth + deltaX;
          newHeight = newWidth / resizeState.aspectRatio;
          break;
      }

      // Minimum size constraints
      const minSize = 50;
      newWidth = Math.max(minSize, newWidth);
      newHeight = Math.max(minSize, newHeight);

      // Update image size in DOM (temporary visual update)
      // Always update both style and attributes for consistency
      selectedImage.style.width = `${newWidth}px`;
      selectedImage.style.height = `${newHeight}px`;
      selectedImage.setAttribute('width', `${newWidth}`);
      selectedImage.setAttribute('height', `${newHeight}`);

      // Update size display
      setCurrentSize({
        width: Math.round(newWidth),
        height: Math.round(newHeight),
      });
    };

    const handleMouseUp = () => {
      if (!selectedImage || !editor) return;

      // Get final dimensions from style or attributes
      let finalWidth: number;
      let finalHeight: number;
      
      if (selectedImage.style.width && selectedImage.style.height) {
        finalWidth = Math.round(parseFloat(selectedImage.style.width));
        finalHeight = Math.round(parseFloat(selectedImage.style.height));
      } else {
        finalWidth = Math.round(selectedImage.offsetWidth);
        finalHeight = Math.round(selectedImage.offsetHeight);
      }

      // Update image in editor
      const src = selectedImage.getAttribute('src') || '';
      if (!src) return;
      
      // Find image node position
      let imagePos: number | null = null;
      let foundNodes = 0;
      editor.state.doc.descendants((node, pos) => {
        if (node.type.name === 'image' && node.attrs.src === src) {
          foundNodes++;
          imagePos = pos;
        return false;
      }
    });

    if (imagePos !== null) {
      const imageNode = editor.state.doc.nodeAt(imagePos);
      if (imageNode && imageNode.type.name === 'image') {
        // Update image attributes with width and height
          editor
            .chain()
            .focus()
            .setNodeSelection(imagePos)
            .updateAttributes('image', {
              ...imageNode.attrs,
              width: finalWidth.toString(),
              height: finalHeight.toString(),
            })
            .run();
          
          // Also update style to ensure visual consistency
          selectedImage.setAttribute('width', finalWidth.toString());
          selectedImage.setAttribute('height', finalHeight.toString());
        selectedImage.style.width = `${finalWidth}px`;
        selectedImage.style.height = `${finalHeight}px`;
      }
    }

      // Call onResize callback if provided
      if (onResize) {
        onResize(finalWidth, finalHeight);
      }

      // Reset resize state
      setResizeState({
        isResizing: false,
        handle: null,
        startX: 0,
        startY: 0,
        startWidth: 0,
        startHeight: 0,
        aspectRatio: 1,
      });
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizeState, selectedImage, editor, onResize]);

  if (!selectedImage || !currentSize) {
    return null;
  }

  const rect = selectedImage.getBoundingClientRect();
  const editorElement = editor?.view.dom;
  if (!editorElement) return null;

  const editorRect = editorElement.getBoundingClientRect();
  const relativeTop = rect.top - editorRect.top;
  const relativeLeft = rect.left - editorRect.left;

  const handleSize = 8;
  const handleOffset = handleSize / 2;

  return (
    <>
      {/* Resize Handles */}
      <div
        ref={handlesRef}
        className="absolute pointer-events-none"
        style={{
          top: `${relativeTop - handleOffset}px`,
          left: `${relativeLeft - handleOffset}px`,
          width: `${rect.width + handleSize}px`,
          height: `${rect.height + handleSize}px`,
        }}
      >
        {/* Top-left */}
        <div
          className="absolute bg-primary border-2 border-background rounded-sm cursor-nwse-resize pointer-events-auto"
          style={{
            top: 0,
            left: 0,
            width: `${handleSize}px`,
            height: `${handleSize}px`,
          }}
          onMouseDown={(e) => handleMouseDown(e, 'nw')}
        />
        
        {/* Top-right */}
        <div
          className="absolute bg-primary border-2 border-background rounded-sm cursor-nesw-resize pointer-events-auto"
          style={{
            top: 0,
            right: 0,
            width: `${handleSize}px`,
            height: `${handleSize}px`,
          }}
          onMouseDown={(e) => handleMouseDown(e, 'ne')}
        />
        
        {/* Bottom-left */}
        <div
          className="absolute bg-primary border-2 border-background rounded-sm cursor-nesw-resize pointer-events-auto"
          style={{
            bottom: 0,
            left: 0,
            width: `${handleSize}px`,
            height: `${handleSize}px`,
          }}
          onMouseDown={(e) => handleMouseDown(e, 'sw')}
        />
        
        {/* Bottom-right */}
        <div
          className="absolute bg-primary border-2 border-background rounded-sm cursor-nwse-resize pointer-events-auto"
          style={{
            bottom: 0,
            right: 0,
            width: `${handleSize}px`,
            height: `${handleSize}px`,
          }}
          onMouseDown={(e) => handleMouseDown(e, 'se')}
        />
      </div>

      {/* Size Tooltip - shown during resize */}
      {resizeState.isResizing && (
        <div
          className="fixed z-[1001] bg-foreground text-background text-xs px-2 py-1 rounded shadow-lg pointer-events-none"
          style={{
            left: `${resizeState.startX + 10}px`,
            top: `${resizeState.startY + 10}px`,
          }}
        >
          {currentSize.width} × {currentSize.height}px
        </div>
      )}
    </>
  );
}
