/**
 * ClassicEditor Mode Toggle
 * 
 * Toggle buttons for Visual/Text mode
 */

'use client';

import { Button } from '@/components/ui/button';
import { Eye, Code2 } from 'lucide-react';
import { useClassicEditorContext } from '../context/ClassicEditorContext';

export function ClassicEditorModeToggle() {
  const { mode, setMode } = useClassicEditorContext();

  return (
    <div className="flex items-center justify-between p-2 bg-background">
      <div className="flex gap-1">
        <Button
          type="button"
          variant={mode === 'visual' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setMode('visual')}
          className="h-7"
        >
          <Eye className="h-3 w-3 mr-1" />
          Trực quan
        </Button>
        <Button
          type="button"
          variant={mode === 'text' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setMode('text')}
          className="h-7"
        >
          <Code2 className="h-3 w-3 mr-1" />
          Văn bản
        </Button>
      </div>
    </div>
  );
}

