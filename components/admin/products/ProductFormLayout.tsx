'use client';

import { ReactNode } from 'react';

interface ProductFormLayoutProps {
  children: ReactNode;
  sidebar: ReactNode;
  header?: ReactNode;
}

/**
 * Product Form Layout với 2 cột (giống WordPress)
 * - Cột trái: Form chính (70%)
 * - Cột phải: Sidebar với các chức năng nhanh (30%)
 * - Responsive: Sidebar chuyển xuống dưới trên mobile
 */
export function ProductFormLayout({ children, sidebar, header }: ProductFormLayoutProps) {
  return (
    <div className="space-y-6">
      {/* Header (optional) */}
      {header && (
        <div className="border-b pb-4">
          {header}
        </div>
      )}

      {/* Main Layout: 2 columns on desktop, stacked on mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-6">
        {/* Main Form (Left Column - 70% on desktop) */}
        <div className="space-y-6 min-w-0 pb-8">
          {children}
        </div>

        {/* Sidebar (Right Column - 30% on desktop) */}
        <div className="space-y-6">
          {/* Sticky sidebar on desktop */}
          <div className="lg:sticky lg:top-6 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto lg:overflow-x-visible lg:pb-8 lg:pr-4">
            <div className="space-y-6">
              {sidebar}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



