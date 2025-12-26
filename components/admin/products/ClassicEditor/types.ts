/**
 * ClassicEditor Types
 * 
 * Type definitions for ClassicEditor component
 */

export interface ClassicEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export type EditorMode = 'visual' | 'text';

