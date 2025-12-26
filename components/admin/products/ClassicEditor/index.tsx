/**
 * ClassicEditor Main Component
 * 
 * Refactored from ClassicEditor.tsx (1,949 lines → < 300 lines)
 * Uses Folder Pattern with hooks, components, utils, and context
 */

'use client';

import { useState, useRef, useCallback, useMemo } from 'react';
import { useToastContext } from '@/components/providers/ToastProvider';
import { MediaLibraryModal } from '../MediaLibraryModal';
import { ClassicEditorToolbar } from './components/ClassicEditorToolbar';
import { ClassicEditorStickyToolbar } from './components/ClassicEditorStickyToolbar';
import { ClassicEditorVisualMode } from './components/ClassicEditorVisualMode';
import { ClassicEditorTextMode } from './components/ClassicEditorTextMode';
import { useClassicEditor } from './hooks/useClassicEditor';
import { useClassicEditorPaste } from './hooks/useClassicEditorPaste';
import { useClassicEditorMode } from './hooks/useClassicEditorMode';
import { useClassicEditorKeyboard } from './hooks/useClassicEditorKeyboard';
import { useClassicEditorSticky } from './hooks/useClassicEditorSticky';
import { useClassicEditorTimeout } from './hooks/useClassicEditorTimeout';
import { insertQuickTag, addLinkToEditor, addImageToEditor, insertReadMoreTag } from './utils/classicEditorHelpers';
import { ClassicEditorContext, type ClassicEditorContextValue } from './context/ClassicEditorContext';
import type { ClassicEditorProps, EditorMode } from './types';

/**
 * Classic WordPress Editor Component
 * Features:
 * - Visual/Text mode toggle
 * - Add Media button với modal
 * - Full toolbar (2 hàng)
 * - Text mode với QuickTags
 */
export function ClassicEditor({ value, onChange, placeholder = 'Nhập nội dung...' }: ClassicEditorProps) {
  const { showToast } = useToastContext();
  const [mode, setMode] = useState<EditorMode>('visual');
  const [showToolbarRow2, setShowToolbarRow2] = useState(false);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [textContent, setTextContent] = useState(value);
  const [isToolbarSticky, setIsToolbarSticky] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);

  // Timeout management for memory leak prevention
  const { setTimeoutSafe, isMounted } = useClassicEditorTimeout();

  // ✅ PERFORMANCE: Helper function to clean HTML before saving
  // Only clean HTML from visual editor (not text mode raw HTML)
  const handleHtmlChange = useCallback((html: string, isFromVisualEditor: boolean = true) => {
    if (isFromVisualEditor && mode === 'visual') {
      // Clean HTML from visual editor to reduce data bloat
      const { cleanHtmlForStorage } = require('@/lib/utils/sanitizeHtml');
      const cleanedHtml = cleanHtmlForStorage(html);
      onChange(cleanedHtml);
    } else {
      // Text mode: pass through as-is (user is editing raw HTML)
      onChange(html);
    }
  }, [mode, onChange]);

  // Initialize editor
  const editor = useClassicEditor({
    value,
    placeholder,
    mode,
    textContent,
    setTextContent,
    handleHtmlChange,
  });

  // Handle paste events
  useClassicEditorPaste({
    editor,
    setTextContent,
    handleHtmlChange,
  });

  // Handle mode switching and content sync
  useClassicEditorMode({
    editor,
    mode,
    value,
    textContent,
    setTextContent,
  });

  // Handle sticky toolbar
  useClassicEditorSticky({
    toolbarRef,
    editorContainerRef,
    setIsToolbarSticky,
  });

  // Helper functions wrapped for context
  const insertQuickTagFn = useCallback((openTag: string, closeTag: string, insertText?: string) => {
    insertQuickTag(textareaRef, openTag, closeTag, insertText, setTextContent, onChange, setTimeoutSafe, isMounted);
  }, [setTextContent, onChange, setTimeoutSafe, isMounted]);

  const addLinkFn = useCallback(() => {
    const url = prompt('Nhập URL:');
    if (!url) return;
    addLinkToEditor(mode, editor, textareaRef, url, insertQuickTagFn, setTextContent, onChange, handleHtmlChange);
  }, [mode, editor, insertQuickTagFn, setTextContent, onChange, handleHtmlChange]);

  const addImageFn = useCallback(() => {
    const url = prompt('Nhập URL hình ảnh:');
    if (!url) return;
    const alt = prompt('Nhập Alt Text (tùy chọn):') || '';
    addImageToEditor(mode, editor, textareaRef, url, alt, setTextContent, onChange, handleHtmlChange, setTimeoutSafe, isMounted);
  }, [mode, editor, setTextContent, onChange, handleHtmlChange, setTimeoutSafe, isMounted]);

  const insertReadMoreFn = useCallback(() => {
    insertReadMoreTag(mode, editor, textareaRef, setTextContent, onChange, handleHtmlChange, setTimeoutSafe, isMounted);
  }, [mode, editor, setTextContent, onChange, handleHtmlChange, setTimeoutSafe, isMounted]);

  // Handle keyboard shortcuts
  useClassicEditorKeyboard({
    editor,
    mode,
    textareaRef,
    showToolbarRow2,
    setShowToolbarRow2,
    setShowMediaModal,
    insertQuickTag: insertQuickTagFn,
    addLink: addLinkFn,
    setTextContent,
    onChange,
  });

  // Context value
  const contextValue = useMemo<ClassicEditorContextValue>(() => ({
    editor,
    mode,
    setMode,
    textContent,
    setTextContent,
    showToolbarRow2,
    setShowToolbarRow2,
    showMediaModal,
    setShowMediaModal,
    isToolbarSticky,
    textareaRef,
    toolbarRef,
    onChange,
    handleHtmlChange,
    insertQuickTag: insertQuickTagFn,
    addLink: addLinkFn,
    addImage: addImageFn,
    insertReadMore: insertReadMoreFn,
    setTimeoutSafe,
    isMounted,
  }), [
    editor,
    mode,
    textContent,
    showToolbarRow2,
    showMediaModal,
    isToolbarSticky,
    onChange,
    handleHtmlChange,
    insertQuickTagFn,
    addLinkFn,
    addImageFn,
    insertReadMoreFn,
    setTimeoutSafe,
    isMounted,
  ]);

  // Show loading state while editor initializes
  if (!editor) {
    return (
      <div className="border border-input rounded-lg p-8 text-center">
        <div className="text-muted-foreground">Đang tải editor...</div>
      </div>
    );
  }

  return (
    <ClassicEditorContext.Provider value={contextValue}>
      <div ref={editorContainerRef} className="border border-input rounded-lg overflow-hidden">
        {/* Sticky Toolbar */}
        <ClassicEditorStickyToolbar />

        {/* Main Toolbar */}
        <ClassicEditorToolbar />

        {/* Editor Content */}
        {mode === 'visual' ? (
          <ClassicEditorVisualMode />
        ) : (
          <ClassicEditorTextMode />
        )}

        {/* Media Library Modal */}
        <MediaLibraryModal
          isOpen={showMediaModal}
          onClose={() => setShowMediaModal(false)}
          onInsert={(html) => {
            if (!html) return;
            if (mode === 'visual' && editor) {
              // Check if we're inserting a video embed wrapper
              if (html.includes('video-embed-wrapper')) {
                // Parse the HTML to extract wrapper and iframe
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = html;
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
                  
                  try {
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
                  } catch (error) {
                    // Fallback to raw HTML insert
                    editor.chain().focus().insertContent(html).run();
                  }
                } else {
                  // Fallback to raw HTML insert
                  editor.chain().focus().insertContent(html).run();
                }
              } else {
                // Insert HTML into Tiptap editor
                editor.chain().focus().insertContent(html).run();
              }
              
              // Update textContent for sync
              const newHtml = editor.getHTML();
              setTextContent(newHtml);
              handleHtmlChange(newHtml, true);
            } else {
              // Insert into textarea
              if (textareaRef.current) {
                const textarea = textareaRef.current;
                const start = textarea.selectionStart;
                const newText =
                  textarea.value.substring(0, start) + html + textarea.value.substring(start);
                setTextContent(newText);
                onChange(newText);
                
                // Update textarea and set cursor position
                setTimeoutSafe(() => {
                  if (isMounted() && textareaRef.current) {
                    textareaRef.current.value = newText;
                    const newCursorPos = start + html.length;
                    textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
                    textareaRef.current.focus();
                  }
                }, 0);
              }
            }
          }}
        />
      </div>
    </ClassicEditorContext.Provider>
  );
}

