/**
 * ClassicEditor Paste Handler Hook
 * 
 * Handles paste events for image upload and video embedding
 */

import { useEffect, useRef } from 'react';
import type { Editor } from '@tiptap/react';
import { convertVideoUrlToEmbed, isStandaloneVideoUrl } from '@/lib/utils/videoEmbed';
import { useToastContext } from '@/components/providers/ToastProvider';

interface UseClassicEditorPasteOptions {
  editor: Editor | null;
  setTextContent: (content: string) => void;
  handleHtmlChange: (html: string, isFromVisualEditor: boolean) => void;
}

export function useClassicEditorPaste({
  editor,
  setTextContent,
  handleHtmlChange,
}: UseClassicEditorPasteOptions): void {
  const { showToast } = useToastContext();
  const timeoutRefs = useRef<Set<NodeJS.Timeout>>(new Set());
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    // Capture ref value at effect setup time
    const currentTimeouts = timeoutRefs.current;
    return () => {
      isMountedRef.current = false;
      // Clear all pending timeouts using captured value
      currentTimeouts.forEach((timeoutId) => {
        clearTimeout(timeoutId);
      });
      currentTimeouts.clear();
    };
  }, []);

  useEffect(() => {
    if (!editor) return;

    const handlePaste = async (view: any, event: ClipboardEvent) => {
      const clipboardData = event.clipboardData || (window as any).clipboardData;
      if (!clipboardData) {
        return false;
      }

      // Handle image paste - upload to server instead of Base64
      const items = Array.from(clipboardData.items) as DataTransferItem[];
      const imageItem = items.find((item) => item.type.indexOf('image') !== -1);
      
      if (imageItem) {
        event.preventDefault();
        const file = imageItem.getAsFile();
        if (file) {
          // Upload image to server
          try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('folder', 'products'); // Organize in products folder
            
            const response = await fetch('/api/admin/media/upload', {
              method: 'POST',
              body: formData,
            });

            if (response.ok) {
              const data = await response.json();
              const imageUrl = data.url || data.media?.url;
              
              if (imageUrl) {
                // Insert image with server URL
                editor.chain().focus().setImage({ 
                  src: imageUrl,
                  alt: file.name || 'Product image'
                }).run();
                
                // Update content
                const newHtml = editor.getHTML();
                setTextContent(newHtml);
                handleHtmlChange(newHtml, true);
                return true;
              }
            } else {
              const errorData = await response.json().catch(() => ({}));
              showToast(errorData.error || 'Không thể upload ảnh. Vui lòng thử lại.', 'error');
            }
          } catch (error) {
            if (process.env.NODE_ENV === 'development') {
              console.error('Error uploading pasted image:', error);
            }
            showToast('Có lỗi xảy ra khi upload ảnh. Vui lòng thử lại.', 'error');
          }
        }
        return true;
      }

      const pastedText = clipboardData.getData('text/plain');
      if (!pastedText) return false;

      // Check if pasted text is a standalone video URL
      const isStandalone = isStandaloneVideoUrl(pastedText);
      
      if (isStandalone) {
        const embedHtml = convertVideoUrlToEmbed(pastedText.trim());
        
        if (embedHtml) {
          event.preventDefault();
          // Insert video embed using editor commands
          const timeoutId = setTimeout(() => {
            timeoutRefs.current.delete(timeoutId);
            if (!isMountedRef.current || !editor) return;
            
            // Parse HTML to extract wrapper and iframe for proper node structure
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = embedHtml;
            const wrapper = tempDiv.querySelector('div.video-embed-wrapper');
            const iframe = wrapper?.querySelector('iframe');
            
            if (wrapper && iframe) {
              // Extract attributes
              const wrapperStyle = wrapper.getAttribute('style') || '';
              const wrapperClass = wrapper.getAttribute('class') || 'video-embed-wrapper';
              const iframeAttrs = {
                src: iframe.getAttribute('src') || '',
                frameborder: iframe.getAttribute('frameborder') || '0',
                allowfullscreen: iframe.hasAttribute('allowfullscreen'),
                allow: iframe.getAttribute('allow') || '',
                style: iframe.getAttribute('style') || '',
                class: iframe.getAttribute('class') || '',
                width: iframe.getAttribute('width') || '100%',
                height: iframe.getAttribute('height') || '400px',
              };
              
              // Insert as proper node structure to avoid paragraph wrapping
              editor.chain()
                .focus()
                .insertContent({
                  type: 'videoEmbedWrapper',
                  attrs: {
                    style: wrapperStyle,
                    class: wrapperClass,
                  },
                  content: [
                    {
                      type: 'iframe',
                      attrs: iframeAttrs,
                    },
                  ],
                })
                .run();
            } else {
              // Fallback to raw HTML insert
              editor.commands.insertContent(embedHtml);
            }
          }, 0);
          timeoutRefs.current.add(timeoutId);
          return true;
        }
      }

      // Check if pasted text contains video URLs on their own lines
      const lines = pastedText.split('\n');
      let hasVideoUrl = false;
      let modifiedText = pastedText;

      for (const line of lines) {
        const trimmedLine = line.trim();
        if (isStandaloneVideoUrl(trimmedLine)) {
          const embedHtml = convertVideoUrlToEmbed(trimmedLine);
          if (embedHtml) {
            hasVideoUrl = true;
            // Replace the line with embed HTML
            modifiedText = modifiedText.replace(trimmedLine, embedHtml);
          }
        }
      }

      if (hasVideoUrl) {
        event.preventDefault();
        const timeoutId = setTimeout(() => {
          timeoutRefs.current.delete(timeoutId);
          if (isMountedRef.current && editor) {
            editor.commands.insertContent(modifiedText);
          }
        }, 0);
        timeoutRefs.current.add(timeoutId);
        return true;
      }

      return false; // Let default paste handler handle it
    };

    // Register paste handler
    editor.view.dom.addEventListener('paste', (e: ClipboardEvent) => {
      handlePaste(editor.view, e);
    });

    return () => {
      editor.view.dom.removeEventListener('paste', handlePaste as any);
    };
  }, [editor, setTextContent, handleHtmlChange, showToast]);
}

