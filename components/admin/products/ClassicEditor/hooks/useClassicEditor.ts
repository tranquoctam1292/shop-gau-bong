/**
 * ClassicEditor Main Hook
 * 
 * Initializes and manages Tiptap editor instance
 */

import { useEditor } from '@tiptap/react';
import { useCallback, useEffect, useRef } from 'react';
import { createClassicEditorExtensions } from '../utils/classicEditorExtensions';
import type { EditorMode } from '../types';

interface UseClassicEditorOptions {
  value: string;
  placeholder: string;
  mode: EditorMode;
  textContent: string;
  setTextContent: (content: string) => void;
  handleHtmlChange: (html: string, isFromVisualEditor: boolean) => void;
}

export function useClassicEditor({
  value,
  placeholder,
  mode,
  textContent,
  setTextContent,
  handleHtmlChange,
}: UseClassicEditorOptions) {
  // ✅ PERFORMANCE: Helper function to clean HTML before saving
  // Only clean HTML from visual editor (not text mode raw HTML)
  const handleHtmlChangeCallback = useCallback((html: string, isFromVisualEditor: boolean = true) => {
    handleHtmlChange(html, isFromVisualEditor);
  }, [handleHtmlChange]);

  // Initialize Tiptap editor for Visual mode
  // Use useRef to store latest values for onUpdate callback to avoid stale closures
  const textContentRef = useRef(textContent);
  const handleHtmlChangeRef = useRef(handleHtmlChangeCallback);
  const setTextContentRef = useRef(setTextContent);

  // Update refs when values change
  useEffect(() => {
    textContentRef.current = textContent;
    handleHtmlChangeRef.current = handleHtmlChangeCallback;
    setTextContentRef.current = setTextContent;
  }, [textContent, handleHtmlChangeCallback, setTextContent]);

  const editor = useEditor({
    extensions: createClassicEditorExtensions(placeholder),
    content: value || '',
    immediatelyRender: false, // Fix SSR hydration mismatch
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      // Only update if different to avoid unnecessary re-renders
      // Use refs to access latest values without causing re-initialization
      if (html !== textContentRef.current) {
        setTextContentRef.current(html);
        // ✅ PERFORMANCE: Clean HTML before saving to reduce data bloat
        handleHtmlChangeRef.current(html, true);
      }
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[300px] p-4 border border-input rounded-b',
      },
    },
  });

  return editor;
}

