/**
 * ClassicEditor Helper Functions
 * 
 * Pure utility functions for text mode operations
 */

import type { Editor } from '@tiptap/react';
import type { EditorMode } from '../types';

/**
 * Insert QuickTag in text mode textarea
 */
export function insertQuickTag(
  textareaRef: React.RefObject<HTMLTextAreaElement>,
  openTag: string,
  closeTag: string,
  insertText: string | undefined,
  setTextContent: (content: string) => void,
  onChange: (html: string) => void,
  setTimeoutSafe: (callback: () => void, delay?: number) => NodeJS.Timeout | null,
  isMounted: () => boolean
): void {
  if (!textareaRef.current) return;

  const textarea = textareaRef.current;
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selectedText = textarea.value.substring(start, end);
  const textToWrap = insertText || selectedText;

  let newText: string;
  let newCursorPos: number;

  if (textToWrap) {
    // Wrap text (either selected or provided)
    newText =
      textarea.value.substring(0, start) +
      `${openTag}${textToWrap}${closeTag}` +
      textarea.value.substring(end);
    newCursorPos = start + openTag.length + textToWrap.length + closeTag.length;
  } else {
    // Insert tags at cursor (for empty selection)
    newText =
      textarea.value.substring(0, start) +
      `${openTag}${closeTag}` +
      textarea.value.substring(end);
    newCursorPos = start + openTag.length;
  }

  // Update state and textarea
  setTextContent(newText);
  onChange(newText);
  
  // Use setTimeout to ensure DOM is updated before setting selection
  // Use setTimeoutSafe to prevent memory leaks
  setTimeoutSafe(() => {
    if (isMounted() && textareaRef.current) {
      textareaRef.current.value = newText;
      textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      textareaRef.current.focus();
    }
  }, 0);
}

/**
 * Validate URL format
 */
export function validateUrl(url: string): { isValid: boolean; normalizedUrl?: string } {
  try {
    new URL(url);
    return { isValid: true, normalizedUrl: url };
  } catch {
    // If not valid URL, try adding http://
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      const fullUrl = `http://${url}`;
      try {
        new URL(fullUrl);
        return { isValid: true, normalizedUrl: fullUrl };
      } catch {
        return { isValid: false };
      }
    }
    return { isValid: false };
  }
}

/**
 * Add link to editor (visual or text mode)
 */
export function addLinkToEditor(
  mode: EditorMode,
  editor: Editor | null,
  textareaRef: React.RefObject<HTMLTextAreaElement>,
  url: string,
  insertQuickTagFn: (openTag: string, closeTag: string, insertText?: string) => void,
  setTextContent: (content: string) => void,
  onChange: (html: string) => void,
  handleHtmlChange: (html: string, isFromVisualEditor: boolean) => void
): void {
  const validation = validateUrl(url);
  if (!validation.isValid) {
    alert('URL không hợp lệ');
    return;
  }

  const normalizedUrl = validation.normalizedUrl || url;

  if (mode === 'visual' && editor) {
    const selectedText = editor.state.doc.textBetween(
      editor.state.selection.from,
      editor.state.selection.to
    );
    if (selectedText) {
      // If text is selected, wrap it in link
      editor.chain().focus().setLink({ href: normalizedUrl }).run();
    } else {
      // If no text selected, insert link with URL as text
      editor.chain().focus().insertContent(`<a href="${normalizedUrl}">${normalizedUrl}</a>`).run();
    }
  } else {
    // Text mode
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    
    const linkText = selectedText || prompt('Nhập text hiển thị:', normalizedUrl) || normalizedUrl;
    insertQuickTagFn(`<a href="${normalizedUrl}">`, '</a>', linkText);
  }
}

/**
 * Add image to editor (visual or text mode)
 */
export function addImageToEditor(
  mode: EditorMode,
  editor: Editor | null,
  textareaRef: React.RefObject<HTMLTextAreaElement>,
  url: string,
  alt: string,
  setTextContent: (content: string) => void,
  onChange: (html: string) => void,
  handleHtmlChange: (html: string, isFromVisualEditor: boolean) => void,
  setTimeoutSafe: (callback: () => void, delay?: number) => NodeJS.Timeout | null,
  isMounted: () => boolean
): void {
  // Validate URL
  const validation = validateUrl(url);
  if (!validation.isValid && !url.startsWith('/')) {
    alert('URL không hợp lệ. Vui lòng nhập URL đầy đủ (VD: https://example.com/image.jpg)');
    return;
  }

  if (mode === 'visual' && editor) {
    editor.chain().focus().setImage({ src: url, alt: alt || undefined }).run();
    // Update textContent for sync
    const newHtml = editor.getHTML();
    setTextContent(newHtml);
    handleHtmlChange(newHtml, true);
  } else {
    const imgTag = alt ? `<img src="${url}" alt="${alt}" />` : `<img src="${url}" />`;
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const newText =
        textarea.value.substring(0, start) + imgTag + textarea.value.substring(start);
      setTextContent(newText);
      onChange(newText);
      
      setTimeoutSafe(() => {
        if (isMounted() && textareaRef.current) {
          textareaRef.current.value = newText;
          const newCursorPos = start + imgTag.length;
          textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
          textareaRef.current.focus();
        }
      }, 0);
    }
  }
}

/**
 * Insert read more tag
 */
export function insertReadMoreTag(
  mode: EditorMode,
  editor: Editor | null,
  textareaRef: React.RefObject<HTMLTextAreaElement>,
  setTextContent: (content: string) => void,
  onChange: (html: string) => void,
  handleHtmlChange: (html: string, isFromVisualEditor: boolean) => void,
  setTimeoutSafe: (callback: () => void, delay?: number) => NodeJS.Timeout | null,
  isMounted: () => boolean
): void {
  if (mode === 'visual' && editor) {
    editor.chain().focus().insertContent('<!--more-->').run();
    // Update textContent for sync
    const newHtml = editor.getHTML();
    setTextContent(newHtml);
    handleHtmlChange(newHtml, true);
  } else {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const newText =
        textarea.value.substring(0, start) +
        '<!--more-->' +
        textarea.value.substring(start);
      setTextContent(newText);
      onChange(newText);
      
      setTimeoutSafe(() => {
        if (isMounted() && textareaRef.current) {
          textareaRef.current.value = newText;
          const newCursorPos = start + '<!--more-->'.length;
          textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
          textareaRef.current.focus();
        }
      }, 0);
    }
  }
}

