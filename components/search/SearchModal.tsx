'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { EnhancedSearchBar } from './EnhancedSearchBar';

interface SearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Search Modal Component
 * 
 * Mobile-first search modal that opens when clicking search icon
 * Uses Sheet component for smooth slide-in animation
 * Contains EnhancedSearchBar with suggestions and history
 */
export function SearchModal({ open, onOpenChange }: SearchModalProps) {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  // Mount check for client-side only rendering
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle search submission - navigate to search page and close modal
  const handleSearch = (query: string) => {
    router.push(`/search?q=${encodeURIComponent(query)}`);
    onOpenChange(false); // Close modal after search
  };

  if (!mounted) {
    return null;
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="top" 
        className="w-full h-auto max-h-[90vh] overflow-y-auto p-0"
      >
        <SheetHeader className="px-4 pt-4 pb-2 border-b">
          <SheetTitle className="text-left font-heading text-lg font-bold text-primary">
            🔍 Tìm kiếm sản phẩm
          </SheetTitle>
        </SheetHeader>
        
        <div className="p-4">
          <EnhancedSearchBar 
            onSearch={handleSearch}
            autoFocus={true}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}

