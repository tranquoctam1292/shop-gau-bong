/**
 * Dialog Container Component
 * 
 * PHASE 6: Extract Dialog/Sheet Container
 * 
 * Handles mobile Sheet and desktop Dialog rendering with scroll progress
 */

'use client';

import React, { useRef } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ArrowUp } from 'lucide-react';
import { QuickEditDialogHeader } from './QuickEditDialogHeader';
import { QuickEditDialogFooter } from './QuickEditDialogFooter';

export interface QuickEditDialogContainerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isMobile: boolean;
  isBulkMode: boolean;
  bulkProductCount?: number;
  productId?: string;
  isDirty: boolean;
  formIsDirty: boolean;
  isLoading: boolean;
  showSuccessIndicator: boolean;
  lastSavedTime: Date | null;
  activeTab: string;
  scrollProgress: number;
  showScrollToTop: boolean;
  onScroll: (e: React.UIEvent<HTMLDivElement>) => void;
  onShowShortcutsHelp: () => void;
  onClose: () => void;
  onReset: () => void;
  onShowComparison?: () => void;
  onShowSchedule?: () => void;
  children: React.ReactNode;
}

export const QuickEditDialogContainer = React.memo<QuickEditDialogContainerProps>(({
  open,
  onOpenChange,
  isMobile,
  isBulkMode,
  bulkProductCount,
  productId,
  isDirty,
  formIsDirty,
  isLoading,
  showSuccessIndicator,
  lastSavedTime,
  activeTab,
  scrollProgress,
  showScrollToTop,
  onScroll,
  onShowShortcutsHelp,
  onClose,
  onReset,
  onShowComparison,
  onShowSchedule,
  children,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // FIX: Don't return null when open is false - let Radix UI handle visibility
  // Returning null causes immediate unmount, preventing controlled close behavior
  // Radix UI Dialog/Sheet will handle hiding when open={false}

  if (isMobile) {
    return (
      <Sheet 
        open={open} 
        onOpenChange={onOpenChange}
      >
        <SheetContent 
          side="bottom" 
          className="h-[90vh] rounded-t-2xl overflow-hidden flex flex-col p-0"
        >
          <QuickEditDialogHeader
            isMobile={true}
            isBulkMode={isBulkMode}
            bulkProductCount={bulkProductCount}
            productId={productId}
            isDirty={isDirty}
            onShowShortcutsHelp={onShowShortcutsHelp}
          />
          {/* UX/UI UPGRADE Phase 3.1.1: Improved scroll progress bar */}
          {scrollProgress > 0 && scrollProgress < 100 && (
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-slate-100/50 z-50 rounded-b-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-slate-600 via-slate-500 to-slate-600 transition-all duration-300 ease-out rounded-r-full shadow-sm"
                style={{ width: `${scrollProgress}%` }}
              />
            </div>
          )}
          {/* PHASE 5.3.6: Mobile compact layout - Reduce padding on mobile */}
          <div 
            ref={containerRef}
            className="flex-1 overflow-y-auto px-4 py-3 md:px-6 md:py-4 relative"
            onScroll={onScroll}
          >
            {children}
          </div>
          {/* PHASE 2: Mobile Sheet Scrolling Issues (7.11.8) - Scroll to top button */}
          {showScrollToTop && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => {
                if (containerRef.current) {
                  containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
              className="fixed bottom-24 right-6 z-50 h-12 w-12 rounded-full shadow-lg bg-white border-slate-200 hover:bg-slate-50 md:hidden"
              aria-label="Cuộn lên đầu"
            >
              <ArrowUp className="h-5 w-5" />
            </Button>
          )}
          {/* PHASE 4: Extract Components - QuickEditDialogFooter */}
          {/* PHASE 3: Product History Tab (4.3.5) - Only show footer when edit tab is active or bulk mode */}
          {(activeTab === 'edit' || isBulkMode) && (
            <QuickEditDialogFooter
              isMobile={true}
              isBulkMode={isBulkMode}
              isDirty={isDirty}
              formIsDirty={formIsDirty}
              isLoading={isLoading}
              showSuccessIndicator={showSuccessIndicator}
              lastSavedTime={lastSavedTime}
              onClose={onClose}
              onReset={onReset}
              onShowComparison={onShowComparison}
              onShowSchedule={onShowSchedule}
            />
          )}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog 
      open={open} 
      onOpenChange={onOpenChange}
      modal={true}
    >
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 flex flex-col overflow-hidden">
        <QuickEditDialogHeader
          isMobile={false}
          isBulkMode={isBulkMode}
          bulkProductCount={bulkProductCount ?? undefined}
          productId={productId}
          isDirty={isDirty}
          onShowShortcutsHelp={onShowShortcutsHelp}
        />
        {/* UX/UI UPGRADE Phase 3.1.1: Improved scroll progress bar */}
        {scrollProgress > 0 && scrollProgress < 100 && (
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-slate-100/50 z-50 rounded-b-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-slate-600 via-slate-500 to-slate-600 transition-all duration-300 ease-out rounded-r-full shadow-sm"
              style={{ width: `${scrollProgress}%` }}
            />
          </div>
        )}
        <div 
          className="flex-1 overflow-y-auto px-6 py-4 relative"
          onScroll={onScroll}
        >
          {children}
        </div>
        {/* PHASE 2: Mobile Sheet Scrolling Issues (7.11.8) - Scroll to top button (desktop) */}
        {showScrollToTop && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => {
              // Find the scrollable container within DialogContent
              const dialogContent = document.querySelector('[class*="DialogContent"]');
              const scrollContainer = dialogContent?.querySelector('[class*="overflow-y-auto"]') as HTMLElement;
              if (scrollContainer) {
                scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
            className="fixed bottom-24 right-6 z-50 h-12 w-12 rounded-full shadow-lg bg-white border-slate-200 hover:bg-slate-50 hidden md:flex"
            aria-label="Cuộn lên đầu"
          >
            <ArrowUp className="h-5 w-5" />
          </Button>
        )}
        {/* PHASE 4: Extract Components - QuickEditDialogFooter */}
        {/* PHASE 3: Product History Tab (4.3.5) - Only show footer when edit tab is active or bulk mode */}
        {(activeTab === 'edit' || isBulkMode) && (
          <QuickEditDialogFooter
            isMobile={false}
            isBulkMode={isBulkMode}
            isDirty={isDirty}
            formIsDirty={formIsDirty}
            isLoading={isLoading}
            showSuccessIndicator={showSuccessIndicator}
            lastSavedTime={lastSavedTime}
            onClose={onClose}
            onReset={onReset}
            onShowComparison={onShowComparison}
            onShowSchedule={onShowSchedule}
          />
        )}
      </DialogContent>
    </Dialog>
  );
});

QuickEditDialogContainer.displayName = 'QuickEditDialogContainer';

