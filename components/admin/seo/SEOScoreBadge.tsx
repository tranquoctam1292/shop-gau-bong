'use client';

import { cn } from '@/lib/utils';
import { getScoreCategory } from '@/lib/utils/seoAudit';

interface SEOScoreBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
};

export function SEOScoreBadge({
  score,
  size = 'md',
  showLabel = false,
  className,
}: SEOScoreBadgeProps) {
  const category = getScoreCategory(score);

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div
        className={cn(
          'flex items-center justify-center rounded-full border-2 font-semibold',
          sizeClasses[size],
          category.bgColor,
          category.color,
          'border-current'
        )}
        title={`Điểm SEO: ${score}/100 - ${category.label}`}
      >
        {score}
      </div>
      {showLabel && (
        <span className={cn('text-sm font-medium', category.color)}>
          {category.label}
        </span>
      )}
    </div>
  );
}

// Score bar variant for inline display
interface SEOScoreBarProps {
  score: number;
  className?: string;
}

export function SEOScoreBar({ score, className }: SEOScoreBarProps) {
  const category = getScoreCategory(score);

  // Get background color class for progress bar
  const progressBgClass = category.bgColor.includes('green') ? 'bg-green-500' :
                         category.bgColor.includes('emerald') ? 'bg-emerald-500' :
                         category.bgColor.includes('yellow') ? 'bg-yellow-500' :
                         'bg-red-500';

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={cn('h-full transition-all duration-300', progressBgClass)}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className={cn('text-xs font-medium w-8 text-right', category.color)}>
        {score}
      </span>
    </div>
  );
}

export default SEOScoreBadge;
