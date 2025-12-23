'use client';

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { sanitizeHtml } from '@/lib/utils/sanitizeHtml';

interface ProductDescriptionProps {
  content: string;
  className?: string;
  maxHeight?: number; // Max height in pixels when collapsed (default: 300)
}

export function ProductDescription({ 
  content, 
  className,
  maxHeight = 300 
}: ProductDescriptionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [needsExpandButton, setNeedsExpandButton] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Check if content exceeds maxHeight
  useEffect(() => {
    if (contentRef.current && !isExpanded) {
      const height = contentRef.current.scrollHeight;
      setNeedsExpandButton(height > maxHeight);
    }
  }, [content, maxHeight, isExpanded]);

  if (!content || !content.trim()) {
    return null;
  }

  return (
    <div className={cn('bg-white rounded-2xl p-4 md:p-6', className)}>
      <h3 className="font-heading text-lg font-semibold mb-4 text-text-main">
        Mô tả sản phẩm
      </h3>
      
      <div className="relative">
        {/* Content Container */}
        <div
          ref={contentRef}
          className={cn(
            'overflow-hidden transition-all duration-300 ease-in-out',
            !isExpanded && needsExpandButton ? `max-h-[${maxHeight}px]` : 'max-h-none'
          )}
          style={{
            maxHeight: !isExpanded && needsExpandButton ? `${maxHeight}px` : 'none',
          }}
        >
          {/* HTML Content with Typography Plugin */}
          {/* Sanitized to prevent XSS attacks */}
          <div
            className="prose prose-sm md:prose-base max-w-none prose-headings:font-heading prose-headings:text-text-main prose-p:text-text-main prose-p:leading-relaxed prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-strong:text-text-main prose-strong:font-semibold prose-ul:text-text-main prose-ol:text-text-main prose-li:text-text-main prose-img:rounded-lg prose-img:max-w-full prose-img:h-auto prose-img:my-4 prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }}
          />
        </div>

        {/* Gradient Fade Effect (only when collapsed and needs expand) */}
        {!isExpanded && needsExpandButton && (
          <div 
            className="absolute bottom-0 left-0 right-0 h-20 pointer-events-none"
            style={{
              background: 'linear-gradient(to bottom, rgba(255, 255, 255, 0), rgba(255, 255, 255, 1))',
            }}
          />
        )}
      </div>

      {/* Expand/Collapse Button */}
      {needsExpandButton && (
        <div className="flex justify-center mt-4">
          <Button
            variant="outline"
            onClick={() => setIsExpanded(!isExpanded)}
            className="border-pink-200 text-primary hover:bg-pink-50 hover:border-pink-300 min-h-[44px] px-6"
            aria-expanded={isExpanded}
            aria-label={isExpanded ? 'Thu gọn mô tả' : 'Xem thêm mô tả'}
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4 mr-2" />
                Thu gọn
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 mr-2" />
                Xem thêm
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

