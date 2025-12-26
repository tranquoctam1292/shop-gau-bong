/**
 * ClassicEditor Visual Mode
 * 
 * Visual mode with Tiptap EditorContent and InlineImageToolbar
 */

'use client';

import { EditorContent } from '@tiptap/react';
import { InlineImageToolbar } from '../../InlineImageToolbar';
import { ImageEditorErrorBoundary } from '../../ImageEditorErrorBoundary';
import { useClassicEditorContext } from '../context/ClassicEditorContext';

export function ClassicEditorVisualMode() {
  const { editor } = useClassicEditorContext();

  if (!editor) return null;

  return (
    <ImageEditorErrorBoundary>
      <div className="relative">
        <EditorContent editor={editor} />
        <InlineImageToolbar editor={editor} />
      </div>
    </ImageEditorErrorBoundary>
  );
}

