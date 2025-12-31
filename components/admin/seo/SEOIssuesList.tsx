'use client';

import { AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SEO_ISSUE_CODES, type SEOIssueCode } from '@/types/seo';

interface SEOIssuesListProps {
  issues: string[];
  className?: string;
  maxItems?: number;
  compact?: boolean;
}

type IssueSeverity = 'error' | 'warning' | 'info';

const severityConfig: Record<IssueSeverity, { icon: typeof AlertTriangle; color: string; bg: string }> = {
  error: {
    icon: XCircle,
    color: 'text-red-600',
    bg: 'bg-red-50',
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-yellow-600',
    bg: 'bg-yellow-50',
  },
  info: {
    icon: Info,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
  },
};

// Map issue codes to severity and descriptions
const issueDetails: Record<SEOIssueCode, { severity: IssueSeverity; description: string }> = {
  NO_FOCUS_KEYWORD: {
    severity: 'error',
    description: 'Chưa có từ khóa trọng tâm',
  },
  MISSING_TITLE: {
    severity: 'error',
    description: 'Thiếu tiêu đề SEO',
  },
  MISSING_SEO_DESCRIPTION: {
    severity: 'error',
    description: 'Thiếu mô tả SEO',
  },
  MISSING_IMAGE: {
    severity: 'error',
    description: 'Sản phẩm chưa có hình ảnh',
  },
  MISSING_PRICE: {
    severity: 'warning',
    description: 'Sản phẩm chưa có giá',
  },
  SHORT_TITLE: {
    severity: 'warning',
    description: 'Tiêu đề SEO quá ngắn (< 30 ký tự)',
  },
  LONG_TITLE: {
    severity: 'warning',
    description: 'Tiêu đề SEO quá dài (> 60 ký tự)',
  },
  NO_KEYWORD_IN_TITLE: {
    severity: 'warning',
    description: 'Từ khóa chưa xuất hiện trong tiêu đề',
  },
  KEYWORD_NOT_IN_TITLE: {
    severity: 'warning',
    description: 'Từ khóa chính không có trong tiêu đề SEO',
  },
  SHORT_DESCRIPTION: {
    severity: 'warning',
    description: 'Mô tả SEO quá ngắn (< 120 ký tự)',
  },
  LONG_DESCRIPTION: {
    severity: 'warning',
    description: 'Mô tả SEO quá dài (> 160 ký tự)',
  },
  NO_KEYWORD_IN_DESCRIPTION: {
    severity: 'warning',
    description: 'Từ khóa chưa xuất hiện trong mô tả',
  },
  KEYWORD_NOT_IN_DESCRIPTION: {
    severity: 'warning',
    description: 'Từ khóa chính không có trong mô tả SEO',
  },
  NO_KEYWORD_IN_SLUG: {
    severity: 'info',
    description: 'Từ khóa chưa xuất hiện trong URL slug',
  },
  SHORT_CONTENT: {
    severity: 'warning',
    description: 'Nội dung quá ngắn (< 300 từ)',
  },
  LOW_KEYWORD_DENSITY: {
    severity: 'info',
    description: 'Mật độ từ khóa thấp (< 0.5%)',
  },
  HIGH_KEYWORD_DENSITY: {
    severity: 'warning',
    description: 'Mật độ từ khóa cao (> 2.5%) - có thể bị coi là spam',
  },
  NO_IMAGES: {
    severity: 'info',
    description: 'Sản phẩm chưa có hình ảnh',
  },
  MISSING_IMAGE_ALT: {
    severity: 'warning',
    description: 'Hình ảnh thiếu thuộc tính alt',
  },
  NO_INTERNAL_LINKS: {
    severity: 'info',
    description: 'Chưa có liên kết nội bộ trong mô tả',
  },
  NO_PRICE: {
    severity: 'warning',
    description: 'Sản phẩm chưa có giá (ảnh hưởng Schema)',
  },
  MISSING_CANONICAL: {
    severity: 'info',
    description: 'Chưa có Canonical URL',
  },
  MISSING_OG_IMAGE: {
    severity: 'info',
    description: 'Chưa có hình Open Graph',
  },
  MISSING_SLUG: {
    severity: 'warning',
    description: 'Sản phẩm chưa có slug',
  },
  LONG_SLUG: {
    severity: 'info',
    description: 'Slug quá dài (> 60 ký tự)',
  },
  MISSING_SHORT_DESCRIPTION: {
    severity: 'info',
    description: 'Thiếu mô tả ngắn sản phẩm',
  },
};

export function SEOIssuesList({
  issues,
  className,
  maxItems,
  compact = false,
}: SEOIssuesListProps) {
  if (!issues || issues.length === 0) {
    return (
      <div className={cn('flex items-center gap-2 text-green-600', className)}>
        <CheckCircle className="h-4 w-4" />
        <span className="text-sm">Không có vấn đề SEO</span>
      </div>
    );
  }

  const displayIssues = maxItems ? issues.slice(0, maxItems) : issues;
  const remainingCount = maxItems ? Math.max(0, issues.length - maxItems) : 0;

  // Sort by severity: error > warning > info
  const sortedIssues = [...displayIssues].sort((a, b) => {
    const severityOrder: Record<IssueSeverity, number> = { error: 0, warning: 1, info: 2 };
    const aSeverity = issueDetails[a as SEOIssueCode]?.severity || 'info';
    const bSeverity = issueDetails[b as SEOIssueCode]?.severity || 'info';
    return severityOrder[aSeverity] - severityOrder[bSeverity];
  });

  if (compact) {
    return (
      <div className={cn('flex flex-wrap gap-1', className)}>
        {sortedIssues.map((issue) => {
          const details = issueDetails[issue as SEOIssueCode];
          if (!details) return null;

          const config = severityConfig[details.severity];
          const Icon = config.icon;

          return (
            <span
              key={issue}
              className={cn(
                'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs',
                config.bg,
                config.color
              )}
              title={details.description}
            >
              <Icon className="h-3 w-3" />
              {issue.replace(/_/g, ' ').toLowerCase()}
            </span>
          );
        })}
        {remainingCount > 0 && (
          <span className="text-xs text-gray-500">+{remainingCount} khác</span>
        )}
      </div>
    );
  }

  return (
    <ul className={cn('space-y-2', className)}>
      {sortedIssues.map((issue) => {
        const details = issueDetails[issue as SEOIssueCode];
        if (!details) {
          return (
            <li key={issue} className="flex items-start gap-2 text-sm text-gray-600">
              <Info className="h-4 w-4 mt-0.5 text-gray-400" />
              <span>{issue}</span>
            </li>
          );
        }

        const config = severityConfig[details.severity];
        const Icon = config.icon;

        return (
          <li
            key={issue}
            className={cn('flex items-start gap-2 p-2 rounded-md', config.bg)}
          >
            <Icon className={cn('h-4 w-4 mt-0.5 flex-shrink-0', config.color)} />
            <span className={cn('text-sm', config.color)}>{details.description}</span>
          </li>
        );
      })}
      {remainingCount > 0 && (
        <li className="text-sm text-gray-500 pl-6">
          và {remainingCount} vấn đề khác...
        </li>
      )}
    </ul>
  );
}

// Summary component for quick overview
interface SEOIssuesSummaryProps {
  issues: string[];
  className?: string;
}

export function SEOIssuesSummary({ issues, className }: SEOIssuesSummaryProps) {
  const errorCount = issues.filter(
    (i) => issueDetails[i as SEOIssueCode]?.severity === 'error'
  ).length;
  const warningCount = issues.filter(
    (i) => issueDetails[i as SEOIssueCode]?.severity === 'warning'
  ).length;
  const infoCount = issues.filter(
    (i) => issueDetails[i as SEOIssueCode]?.severity === 'info'
  ).length;

  if (issues.length === 0) {
    return (
      <span className={cn('text-green-600 text-sm', className)}>
        ✓ Hoàn hảo
      </span>
    );
  }

  return (
    <div className={cn('flex items-center gap-2 text-xs', className)}>
      {errorCount > 0 && (
        <span className="text-red-600">{errorCount} lỗi</span>
      )}
      {warningCount > 0 && (
        <span className="text-yellow-600">{warningCount} cảnh báo</span>
      )}
      {infoCount > 0 && (
        <span className="text-blue-600">{infoCount} gợi ý</span>
      )}
    </div>
  );
}

export default SEOIssuesList;
