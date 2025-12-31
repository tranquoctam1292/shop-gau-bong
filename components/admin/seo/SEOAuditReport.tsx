'use client';

import { memo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Loader2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Minus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SEOAuditResult } from '@/types/seo';

interface SEOAuditReportProps {
  productId: string;
  className?: string;
}

// Fetch audit for single product
async function fetchProductAudit(productId: string): Promise<SEOAuditResult | null> {
  const response = await fetch('/api/admin/seo/audit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ productId }),
  });

  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error('Lỗi khi chạy SEO audit');
  }

  const data = await response.json();
  return data.audit;
}

// Score color helper
function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-yellow-600';
  if (score >= 40) return 'text-orange-600';
  return 'text-red-600';
}

function getScoreBgColor(score: number): string {
  if (score >= 80) return 'bg-green-100';
  if (score >= 60) return 'bg-yellow-100';
  if (score >= 40) return 'bg-orange-100';
  return 'bg-red-100';
}

function getScoreLabel(score: number): string {
  if (score >= 80) return 'Tốt';
  if (score >= 60) return 'Khá';
  if (score >= 40) return 'Cần cải thiện';
  return 'Kém';
}

// Issue severity icon - uses 'type' field from SEOIssue
function IssueSeverityIcon({ type }: { type: 'error' | 'warning' | 'info' }) {
  switch (type) {
    case 'error':
      return <XCircle className="h-4 w-4 text-red-500" />;
    case 'warning':
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    case 'info':
      return <CheckCircle2 className="h-4 w-4 text-blue-500" />;
    default:
      return <Minus className="h-4 w-4 text-gray-400" />;
  }
}

function SEOAuditReportComponent({ productId, className }: SEOAuditReportProps) {
  const {
    data: audit,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['seo', 'audit', productId],
    queryFn: () => fetchProductAudit(productId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!productId,
  });

  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center py-8', className)}>
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-500">Đang phân tích SEO...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('text-center py-8', className)}>
        <AlertTriangle className="h-6 w-6 mx-auto mb-2 text-red-500" />
        <p className="text-red-500 text-sm">Lỗi khi phân tích SEO</p>
      </div>
    );
  }

  if (!audit) {
    return (
      <div className={cn('text-center py-8', className)}>
        <p className="text-gray-500 text-sm">Không tìm thấy dữ liệu audit</p>
      </div>
    );
  }

  // Count issues by type
  const errorCount = audit.issues?.filter(i => i.type === 'error').length || 0;
  const warningCount = audit.issues?.filter(i => i.type === 'warning').length || 0;
  const infoCount = audit.issues?.filter(i => i.type === 'info').length || 0;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header with score */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'w-16 h-16 rounded-full flex items-center justify-center',
              getScoreBgColor(audit.score)
            )}
          >
            <span className={cn('text-2xl font-bold', getScoreColor(audit.score))}>
              {audit.score}
            </span>
          </div>
          <div>
            <p className={cn('text-lg font-semibold', getScoreColor(audit.score))}>
              {getScoreLabel(audit.score)}
            </p>
            <p className="text-sm text-gray-500">
              Điểm SEO tổng thể
            </p>
          </div>
        </div>

        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
        >
          <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
          Phân tích lại
        </button>
      </div>

      {/* Issue summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-red-50 rounded-lg p-3 text-center">
          <span className="text-2xl font-bold text-red-600">{errorCount}</span>
          <p className="text-xs text-red-600">Lỗi nghiêm trọng</p>
        </div>
        <div className="bg-yellow-50 rounded-lg p-3 text-center">
          <span className="text-2xl font-bold text-yellow-600">{warningCount}</span>
          <p className="text-xs text-yellow-600">Cảnh báo</p>
        </div>
        <div className="bg-blue-50 rounded-lg p-3 text-center">
          <span className="text-2xl font-bold text-blue-600">{infoCount}</span>
          <p className="text-xs text-blue-600">Gợi ý</p>
        </div>
      </div>

      {/* Issues list */}
      {audit.issues && audit.issues.length > 0 && (
        <div className="bg-white rounded-lg border">
          <div className="px-4 py-3 border-b bg-gray-50">
            <h4 className="font-medium text-gray-900">
              Vấn đề cần khắc phục ({audit.issues.length})
            </h4>
          </div>
          <div className="divide-y">
            {audit.issues.map((issue, index) => (
              <div key={index} className="px-4 py-3">
                <div className="flex items-start gap-3">
                  <IssueSeverityIcon type={issue.type} />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {issue.message}
                    </p>
                    {issue.suggestion && (
                      <p className="text-xs text-gray-500 mt-1">
                        {issue.suggestion}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No issues */}
      {(!audit.issues || audit.issues.length === 0) && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <CheckCircle2 className="h-6 w-6 mx-auto mb-2 text-green-500" />
          <p className="text-green-700 font-medium">Không có vấn đề SEO</p>
          <p className="text-green-600 text-sm">Sản phẩm này đã được tối ưu tốt</p>
        </div>
      )}

      {/* Passed checks */}
      {audit.passed && audit.passed.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-700 mb-2">
            Đã đạt ({audit.passed.length})
          </h4>
          <ul className="space-y-1">
            {audit.passed.map((check, index) => (
              <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
                <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                {check.message}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export const SEOAuditReport = memo(SEOAuditReportComponent);
export default SEOAuditReport;
