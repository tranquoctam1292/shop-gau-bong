/**
 * ClassicEditor Toolbar
 * 
 * Main toolbar wrapper with Row 1, Row 2, and Mode Toggle
 */

'use client';

import { ClassicEditorToolbarRow1 } from './ClassicEditorToolbarRow1';
import { ClassicEditorToolbarRow2 } from './ClassicEditorToolbarRow2';
import { ClassicEditorModeToggle } from './ClassicEditorModeToggle';
import { useClassicEditorContext } from '../context/ClassicEditorContext';

export function ClassicEditorToolbar() {
  const { toolbarRef, showToolbarRow2 } = useClassicEditorContext();

  return (
    <div ref={toolbarRef} className="bg-muted border-b border-input">
      <ClassicEditorToolbarRow1 />
      {showToolbarRow2 && <ClassicEditorToolbarRow2 />}
      <ClassicEditorModeToggle />
    </div>
  );
}

