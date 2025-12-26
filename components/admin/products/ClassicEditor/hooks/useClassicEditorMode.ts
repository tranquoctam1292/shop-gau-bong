/**
 * ClassicEditor Mode Switching Hook
 * 
 * Handles mode switching between visual and text mode, and content synchronization
 */

import { useEffect } from 'react';
import type { Editor } from '@tiptap/react';
import type { EditorMode } from '../types';

interface UseClassicEditorModeOptions {
  editor: Editor | null;
  mode: EditorMode;
  value: string;
  textContent: string;
  setTextContent: (content: string) => void;
}

export function useClassicEditorMode({
  editor,
  mode,
  value,
  textContent,
  setTextContent,
}: UseClassicEditorModeOptions): void {
  // Sync content when value prop changes (only if different to avoid loops)
  useEffect(() => {
    if (!editor || value === undefined) return;
    
    const currentHtml = editor.getHTML();
    // Only update if value is actually different and not from our own onChange
    if (value !== currentHtml) {
      editor.commands.setContent(value || '');
      setTextContent(value || '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]); // Only depend on value, not editor or textContent

  // Sync between Visual and Text mode
  useEffect(() => {
    if (!editor) return;
    
    if (mode === 'text') {
      // When switching to text mode, get HTML from visual editor
      const html = editor.getHTML();
      if (html !== textContent) {
        setTextContent(html);
      }
    } else if (mode === 'visual') {
      // When switching to visual mode, set content from text mode
      const currentHtml = editor.getHTML();
      // Only update if textContent is different to avoid unnecessary updates
      if (textContent && textContent !== currentHtml) {
        editor.commands.setContent(textContent);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]); // Only trigger on mode change, not editor or textContent
}

