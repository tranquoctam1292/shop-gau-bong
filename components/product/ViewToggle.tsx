'use client';

import { Button } from '@/components/ui/button';

type ViewMode = 'grid' | 'list';

interface ViewToggleProps {
  view: ViewMode;
  onViewChange: (view: ViewMode) => void;
}

export function ViewToggle({ view, onViewChange }: ViewToggleProps) {
  return (
    <div className="flex items-center gap-2 border rounded-full p-1">
      <Button
        type="button"
        variant={view === 'grid' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewChange('grid')}
        className="h-8 w-8 p-0"
        aria-label="Grid view"
      >
        ⊞
      </Button>
      <Button
        type="button"
        variant={view === 'list' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewChange('list')}
        className="h-8 w-8 p-0"
        aria-label="List view"
      >
        ☰
      </Button>
    </div>
  );
}

