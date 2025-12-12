'use client';

import { useEffect, useRef, useState } from 'react';
import { Editor } from '@tiptap/react';
import { Button } from '@/components/ui/button';
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  X,
  Pencil,
  Trash2,
  Crop,
  Sparkles,
} from 'lucide-react';
import { ImageResizeHandles } from './ImageResizeHandles';
import { ImageDetailsModal } from './ImageDetailsModal';
import { ImagePixelEditor } from './ImagePixelEditor';

interface InlineImageToolbarProps {
  editor: Editor | null;
}

interface ImagePosition {
  top: number;
  left: number;
  width: number;
}

export function InlineImageToolbar({ editor }: InlineImageToolbarProps) {
  const [selectedImage, setSelectedImage] = useState<HTMLElement | null>(null);
  const [position, setPosition] = useState<ImagePosition | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPixelEditor, setShowPixelEditor] = useState(false);
  const [isRemovingBackground, setIsRemovingBackground] = useState(false);
  const toolbarRef = useRef<HTMLDivElement>(null);

  // Use ref to track selectedImage without causing re-renders
  const selectedImageRef = useRef<HTMLElement | null>(null);
  const showEditModalRef = useRef(false);
  const showPixelEditorRef = useRef(false);
  
  useEffect(() => {
    selectedImageRef.current = selectedImage;
  }, [selectedImage]);
  
  useEffect(() => {
    showEditModalRef.current = showEditModal;
  }, [showEditModal]);
  
  useEffect(() => {
    showPixelEditorRef.current = showPixelEditor;
  }, [showPixelEditor]);

  useEffect(() => {
    if (!editor) return;

    const handleImageClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      // Check if clicked element is an image or inside an image wrapper
      const img = target.closest('img');
      if (!img) {
        // If clicking outside, hide toolbar
        if (selectedImageRef.current && !toolbarRef.current?.contains(target)) {
          setSelectedImage(null);
          setPosition(null);
        }
        return;
      }

      // Get image position for toolbar placement
      const rect = img.getBoundingClientRect();
      const editorElement = editor.view.dom;
      const editorRect = editorElement.getBoundingClientRect();
      
      setSelectedImage(img);
      setPosition({
        top: rect.top - editorRect.top - 40, // Position above image
        left: rect.left - editorRect.left + rect.width / 2, // Center horizontally
        width: rect.width,
      });
    };

    const handleClickOutside = (event: MouseEvent) => {
      // Use ref to access current selectedImage without dependency
      if (!selectedImageRef.current) return;
      
      const target = event.target as HTMLElement;
      
      // Don't hide toolbar if modals are open
      if (showEditModalRef.current || showPixelEditorRef.current) {
        return;
      }
      
      // Don't hide toolbar if clicking inside modal/dialog (fallback check)
      if (
        target.closest('[role="dialog"]') ||
        target.closest('[data-radix-portal]') ||
        target.closest('[data-radix-dialog-content]') ||
        target.closest('[data-radix-dialog-overlay]')
      ) {
        return;
      }
      
      if (
        !toolbarRef.current?.contains(target) &&
        !target.closest('img') &&
        !target.closest('[data-image-toolbar]')
      ) {
        setSelectedImage(null);
        setPosition(null);
      }
    };

    const editorElement = editor.view.dom;
    editorElement.addEventListener('click', handleImageClick);
    document.addEventListener('click', handleClickOutside);

    return () => {
      editorElement.removeEventListener('click', handleImageClick);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [editor]); // Removed selectedImage from dependencies to prevent re-setup

  // Update toolbar position on scroll/resize
  useEffect(() => {
    if (!selectedImage || !editor) return;

    const updatePosition = () => {
      if (!selectedImage) return;
      
      const rect = selectedImage.getBoundingClientRect();
      const editorElement = editor.view.dom;
      const editorRect = editorElement.getBoundingClientRect();
      
      setPosition({
        top: rect.top - editorRect.top - 40,
        left: rect.left - editorRect.left + rect.width / 2,
        width: rect.width,
      });
    };

    // Update on scroll/resize
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [selectedImage, editor]); // Removed position from dependencies to prevent re-setup

  if (!selectedImage || !position || !editor) {
    return null;
  }

  const updateImageAlignment = (alignment: 'left' | 'center' | 'right' | 'none') => {
    if (!selectedImage || !editor) return;
    
    const src = selectedImage.getAttribute('src') || '';
    const alt = selectedImage.getAttribute('alt') || '';
    
    // Find image node position in editor
    let imagePos: number | null = null;
    let foundNodes = 0;
    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === 'image' && node.attrs.src === src) {
        imagePos = pos;
        return false;
      }
    });
    
    if (imagePos === null) {
      return;
    }
    
    // Get current image node
    const imageNode = editor.state.doc.nodeAt(imagePos);
    if (!imageNode || imageNode.type.name !== 'image') return;
    
    // Build new attributes based on alignment
    let newClass = '';
    let newStyle = '';
    
    switch (alignment) {
      case 'left':
        newClass = 'alignleft';
        newStyle = 'float: left; margin-right: 1rem;';
        break;
      case 'center':
        newClass = 'aligncenter';
        newStyle = 'display: block; margin: 0 auto;';
        break;
      case 'right':
        newClass = 'alignright';
        newStyle = 'float: right; margin-left: 1rem;';
        break;
      case 'none':
        newClass = '';
        newStyle = '';
        break;
    }
    
    // Update image node with new attributes
    const currentAttrs = imageNode.attrs;
    const currentClass = currentAttrs.class || '';
    const currentStyle = currentAttrs.style || '';
    
    // Remove old alignment classes
    const cleanedClass = currentClass
      .split(' ')
      .filter(c => !c.startsWith('align'))
      .join(' ')
      .trim();
    
    const finalClass = cleanedClass ? `${cleanedClass} ${newClass}`.trim() : newClass;
    
    // Update image
    editor
      .chain()
      .focus()
      .setNodeSelection(imagePos)
      .updateAttributes('image', {
        ...currentAttrs,
        class: finalClass || undefined,
        style: newStyle || undefined,
      })
      .run();
    
    // Wait for Tiptap to update DOM, then sync DOM element
    // Use requestAnimationFrame to ensure DOM is updated after Tiptap's internal update cycle
    requestAnimationFrame(() => {
      // Find the updated image element using Tiptap's nodeDOM API (most reliable)
      const domNode = editor.view.nodeDOM(imagePos);
      let updatedImg: HTMLElement | null = null;
      
      if (domNode) {
        if (domNode.nodeType === Node.ELEMENT_NODE && (domNode as HTMLElement).tagName === 'IMG') {
          updatedImg = domNode as HTMLElement;
        } else if (domNode.nodeType === Node.ELEMENT_NODE) {
          // If it's a wrapper element, find the img inside
          updatedImg = (domNode as HTMLElement).querySelector('img');
        }
      }
      
      // Fallback: use selectedImage if nodeDOM lookup fails
      if (!updatedImg && selectedImage) {
        updatedImg = selectedImage;
      }
      
      if (updatedImg) {
        // Get current DOM classes to preserve Tiptap-added classes (like max-w-full, h-auto)
        const currentDomClass = updatedImg.getAttribute('class') || '';
        const domClasses = currentDomClass.split(' ').filter(c => c.trim());
        
        // Preserve Tiptap system classes that shouldn't be removed
        const systemClasses = ['max-w-full', 'h-auto'];
        const preservedClasses = domClasses.filter(c => systemClasses.includes(c));
        
        // Merge preserved classes with our alignment classes
        const mergedClasses = [
          ...preservedClasses,
          ...(finalClass ? finalClass.split(' ').filter(c => c.trim()) : [])
        ].filter((v, i, a) => a.indexOf(v) === i); // Remove duplicates
        
        // Sync DOM attributes with Tiptap state, preserving system classes
        if (mergedClasses.length > 0) {
          updatedImg.setAttribute('class', mergedClasses.join(' '));
        } else {
          updatedImg.removeAttribute('class');
        }
        
        if (newStyle) {
          updatedImg.setAttribute('style', newStyle);
        } else {
          updatedImg.removeAttribute('style');
        }
        
        // Update selectedImage reference to the newly rendered element
        if (updatedImg !== selectedImage) {
          setSelectedImage(updatedImg);
        }
      }
    });
  };

  const handleAlignLeft = () => updateImageAlignment('left');
  const handleAlignCenter = () => updateImageAlignment('center');
  const handleAlignRight = () => updateImageAlignment('right');
  const handleNoAlignment = () => updateImageAlignment('none');

  const handleEdit = () => {
    setShowEditModal(true);
  };

  const handleEditPixel = () => {
    setShowPixelEditor(true);
  };

  const handleRemoveBackground = async () => {
    if (!editor || !selectedImage || isRemovingBackground) return;

    const src = selectedImage.getAttribute('src') || '';
    if (!src) return;

    setIsRemovingBackground(true);

    try {
      // Call API to remove background
      const response = await fetch('/api/admin/images/remove-background', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUrl: src,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to remove background');
      }

      const data = await response.json();
      const newImageUrl = data.url;

      if (!newImageUrl) {
        throw new Error('No URL returned from server');
      }

      // Update image in editor
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
          
          editor
            .chain()
            .focus()
            .setNodeSelection(imagePos)
            .updateAttributes('image', {
              ...imageNode.attrs,
              src: newImageUrl,
              'data-original-src': originalSrc,
              'data-background-removed': 'true',
            })
            .run();
        }
      }

      // Update selected image reference
      selectedImage.setAttribute('src', newImageUrl);
    } catch (error) {
      console.error('Error removing background:', error);
      alert('Có lỗi xảy ra khi tách nền. Vui lòng thử lại.');
    } finally {
      setIsRemovingBackground(false);
    }
  };

  const handleRemove = () => {
    if (!selectedImage || !editor) return;
    
    const src = selectedImage.getAttribute('src');
    if (!src) return;
    
    // Find image node position in editor
    let imagePos: number | null = null;
    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === 'image' && node.attrs.src === src) {
        imagePos = pos;
        return false;
      }
    });
    
    if (imagePos !== null) {
      // Delete image node
      editor
        .chain()
        .focus()
        .setNodeSelection(imagePos)
        .deleteSelection()
        .run();
    }
    
    setSelectedImage(null);
    setPosition(null);
  };

  return (
    <>
      {/* Image Details Modal */}
      <ImageDetailsModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        editor={editor}
        selectedImage={selectedImage}
      />

      {/* Pixel Editor Modal */}
      {selectedImage && (
        <ImagePixelEditor
          isOpen={showPixelEditor}
          onClose={() => setShowPixelEditor(false)}
          editor={editor}
          selectedImage={selectedImage}
          originalImageUrl={selectedImage.getAttribute('data-original-src') || undefined}
        />
      )}

      {/* Resize Handles */}
      {selectedImage && (
        <ImageResizeHandles 
          editor={editor} 
          selectedImage={selectedImage}
        />
      )}
      
      {/* Toolbar - hidden when modals are open */}
      {!showEditModal && !showPixelEditor && (
        <div
          ref={toolbarRef}
          data-image-toolbar="true"
          className="absolute z-[50] bg-background border border-input rounded-md shadow-lg p-1 flex items-center gap-1"
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`,
            transform: 'translateX(-50%)',
          }}
        >
        {/* Alignment buttons */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={handleAlignLeft}
          title="Căn trái"
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={handleAlignCenter}
          title="Căn giữa"
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={handleAlignRight}
          title="Căn phải"
        >
          <AlignRight className="h-4 w-4" />
        </Button>
        
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={handleNoAlignment}
          title="Không căn chỉnh"
        >
          <X className="h-4 w-4" />
        </Button>
        
        <div className="h-4 w-px bg-border mx-1" />
        
        {/* Edit button (Image Details) */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={handleEdit}
          title="Chi tiết hình ảnh"
        >
          <Pencil className="h-4 w-4" />
        </Button>

        {/* Pixel Editor button (Crop/Rotate) */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={handleEditPixel}
          title="Cắt cúp & Xoay"
        >
          <Crop className="h-4 w-4" />
        </Button>

        {/* Remove Background button */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={handleRemoveBackground}
          disabled={isRemovingBackground}
          title="Tách nền AI"
        >
          <Sparkles className={`h-4 w-4 ${isRemovingBackground ? 'animate-spin' : ''}`} />
        </Button>
        
        {/* Remove button */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-destructive hover:text-destructive"
          onClick={handleRemove}
          title="Xóa"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
        </div>
      )}
    </>
  );
}
