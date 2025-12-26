'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Clock, User, Globe } from 'lucide-react';
import { useProductHistory } from '@/lib/hooks/useProductHistory';

export interface QuickEditHistoryTabProps {
  productId: string | undefined;
  page: number;
  onPageChange: (page: number) => void;
  enabled?: boolean;
}

export const QuickEditHistoryTab = React.memo<QuickEditHistoryTabProps>(({
  productId,
  page,
  onPageChange,
  enabled = true,
}) => {
  const { data: historyData, isLoading: isLoadingHistory, error } = useProductHistory(
    productId,
    page,
    20, // 20 items per page
    enabled
  );

  if (!productId) {
    return (
      <div className="text-center py-8 text-slate-500">
        Không có sản phẩm được chọn
      </div>
    );
  }

  if (isLoadingHistory) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        <span className="ml-2 text-sm text-slate-500">Đang tải lịch sử...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-500">
        Có lỗi xảy ra khi tải lịch sử: {error instanceof Error ? error.message : 'Unknown error'}
      </div>
    );
  }

  if (!historyData || !historyData.logs || historyData.logs.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        Chưa có lịch sử thay đổi
      </div>
    );
  }

  const { logs, pagination } = historyData;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="space-y-4">
      {/* History List */}
      <div className="space-y-3">
        {logs.map((log) => (
          <div
            key={log._id}
            className="p-4 bg-slate-50 border border-slate-200 rounded-md hover:bg-slate-100 transition-colors"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-900">
                    {log.actionLabel || log.action}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-600">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{formatDate(log.createdAt)}</span>
                  </div>
                  {log.admin && (
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      <span>{log.admin.full_name || log.admin.username}</span>
                    </div>
                  )}
                  {log.ip_address && (
                    <div className="flex items-center gap-1">
                      <Globe className="h-3 w-3" />
                      <span>{log.ip_address}</span>
                    </div>
                  )}
                </div>
                {log.metadata && Object.keys(log.metadata).length > 0 && (
                  <div className="mt-2 text-xs text-slate-500">
                    {JSON.stringify(log.metadata, null, 2)}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
          <div className="text-sm text-slate-600">
            Trang {pagination.page} / {pagination.totalPages} ({pagination.total} bản ghi)
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page === 1}
              onClick={() => onPageChange(pagination.page - 1)}
              className="min-h-[44px]"
            >
              Trước
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page === pagination.totalPages}
              onClick={() => onPageChange(pagination.page + 1)}
              className="min-h-[44px]"
            >
              Sau
            </Button>
          </div>
        </div>
      )}
    </div>
  );
});

QuickEditHistoryTab.displayName = 'QuickEditHistoryTab';

