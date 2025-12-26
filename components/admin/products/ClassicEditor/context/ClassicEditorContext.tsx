/**
 * ClassicEditor Context
 * 
 * Provides shared state and functions to all ClassicEditor components
 */

import { createContext, useContext } from 'react';
import type { Editor } from '@tiptap/react';
import type { EditorMode } from '../types';

export interface ClassicEditorContextValue {
  // Editor instance
  editor: Editor | null;
  
  // Mode
  mode: EditorMode;
  setMode: (mode: EditorMode) => void;
  
  // State
  textContent: string;
  setTextContent: (content: string) => void;
  showToolbarRow2: boolean;
  setShowToolbarRow2: (show: boolean) => void;
  showMediaModal: boolean;
  setShowMediaModal: (show: boolean) => void;
  isToolbarSticky: boolean;
  
  // Refs
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  toolbarRef: React.RefObject<HTMLDivElement>;
  
  // Callbacks
  onChange: (html: string) => void;
  handleHtmlChange: (html: string, isFromVisualEditor: boolean) => void;
  insertQuickTag: (openTag: string, closeTag: string, insertText?: string) => void;
  addLink: () => void;
  addImage: () => void;
  insertReadMore: () => void;
  // Timeout management
  setTimeoutSafe: (callback: () => void, delay?: number) => NodeJS.Timeout | null;
  isMounted: () => boolean;
}

export const ClassicEditorContext = createContext<ClassicEditorContextValue | null>(null);

export function useClassicEditorContext(): ClassicEditorContextValue {
  const context = useContext(ClassicEditorContext);
  if (!context) {
    throw new Error('useClassicEditorContext must be used within ClassicEditorProvider');
  }
  return context;
}

