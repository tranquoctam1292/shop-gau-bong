'use client';

import React from 'react';

export interface QuickEditSkipLinksProps {
  loadingProduct: boolean;
}

export const QuickEditSkipLinks = React.memo<QuickEditSkipLinksProps>(({
  loadingProduct,
}) => {
  if (loadingProduct) {
    return null;
  }

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      element.focus();
    }
  };

  return (
    <nav 
      className="sr-only focus-within:not-sr-only focus-within:absolute focus-within:top-2 focus-within:left-2 focus-within:z-50 focus-within:bg-white focus-within:border focus-within:border-slate-300 focus-within:rounded-md focus-within:shadow-lg focus-within:p-2" 
      aria-label="Skip to sections"
    >
      <ul className="flex flex-wrap gap-2">
        <li>
          <a
            href="#section-basic-info"
            className="px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection('section-basic-info');
            }}
          >
            Bỏ qua đến: Thông tin cơ bản
          </a>
        </li>
        <li>
          <a
            href="#section-pricing"
            className="px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection('section-pricing');
            }}
          >
            Bỏ qua đến: Giá & Trạng thái
          </a>
        </li>
        <li>
          <a
            href="#section-images"
            className="px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection('section-images');
            }}
          >
            Bỏ qua đến: Hình ảnh
          </a>
        </li>
        <li>
          <a
            href="#section-seo"
            className="px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection('section-seo');
            }}
          >
            Bỏ qua đến: SEO & URL
          </a>
        </li>
      </ul>
    </nav>
  );
});

QuickEditSkipLinks.displayName = 'QuickEditSkipLinks';

