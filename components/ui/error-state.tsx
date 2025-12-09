/**
 * Error State Component
 * Display user-friendly error messages
 */

import { ReactNode } from 'react';
import { Button } from './button';
import { Card } from './card';
import { cn } from '@/lib/utils/cn';

interface ErrorStateProps {
  title?: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  variant?: 'default' | 'destructive';
}

export function ErrorState({
  title = 'Có lỗi xảy ra',
  message,
  action,
  className,
  variant = 'default',
}: ErrorStateProps) {
  return (
    <Card
      className={cn(
        'p-6 text-center',
        variant === 'destructive' && 'bg-destructive/10 text-destructive',
        className
      )}
    >
      <div className="mb-4 text-4xl">⚠️</div>
      <h3 className="font-heading text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-text-muted mb-4">{message}</p>
      {action && (
        <Button onClick={action.onClick} variant="outline">
          {action.label}
        </Button>
      )}
    </Card>
  );
}

/**
 * Network Error State
 */
export function NetworkErrorState({ onRetry }: { onRetry?: () => void }) {
  return (
    <ErrorState
      title="Không thể kết nối"
      message="Vui lòng kiểm tra kết nối internet và thử lại"
      action={
        onRetry
          ? {
              label: 'Thử lại',
              onClick: onRetry,
            }
          : undefined
      }
      variant="destructive"
    />
  );
}

/**
 * Not Found Error State
 */
export function NotFoundErrorState({
  title = 'Không tìm thấy',
  message = 'Nội dung bạn đang tìm không tồn tại hoặc đã bị xóa',
}: {
  title?: string;
  message?: string;
}) {
  return (
    <ErrorState
      title={title}
      message={message}
      variant="default"
    />
  );
}

