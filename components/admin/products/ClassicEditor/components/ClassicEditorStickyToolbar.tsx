/**
 * ClassicEditor Sticky Toolbar
 * 
 * Sticky toolbar that appears when scrolling (duplicate of main toolbar)
 */

'use client';

import { ClassicEditorToolbarRow1 } from './ClassicEditorToolbarRow1';
import { ClassicEditorToolbarRow2 } from './ClassicEditorToolbarRow2';
import { ClassicEditorModeToggle } from './ClassicEditorModeToggle';
import { useClassicEditorContext } from '../context/ClassicEditorContext';

export function ClassicEditorStickyToolbar() {
  const { toolbarRef, showToolbarRow2, isToolbarSticky } = useClassicEditorContext();

  if (!isToolbarSticky || !toolbarRef.current) return null;

  const toolbar = toolbarRef.current;
  const toolbarRect = toolbar.getBoundingClientRect();
  const stickyStyle: React.CSSProperties = {
    position: 'fixed',
    top: '32px',
    width: toolbar.offsetWidth + 'px',
    left: toolbarRect.left + 'px',
    zIndex: 9999,
    backgroundColor: 'hsl(var(--muted))',
  };

  return (
    <div 
      className="bg-muted border-b border-input shadow-lg"
      style={stickyStyle}
    >
      <ClassicEditorToolbarRow1 />
      {showToolbarRow2 && <ClassicEditorToolbarRow2 />}
      <ClassicEditorModeToggle />
    </div>
  );
}

