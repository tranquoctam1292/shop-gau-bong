'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils/cn';

export interface ToastProps {
  message: string;
  type?: 'info' | 'warning' | 'error' | 'success';
  duration?: number;
  onClose?: () => void;
}

/**
 * Simple Toast Notification Component
 * Hiển thị thông báo tạm thời ở góc màn hình
 */
export function Toast({ message, type = 'info', duration = 5000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onClose?.(), 300); // Wait for fade out animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!isVisible) return null;

  const typeStyles = {
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    success: 'bg-green-50 border-green-200 text-green-800',
  };

  return (
    <div className="fixed top-4 right-4 z-[130] animate-in slide-in-from-right duration-300">
      <Card
        className={cn(
          'p-4 shadow-lg border-2 min-w-[300px] max-w-md',
          typeStyles[type]
        )}
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 text-xl">
            {type === 'warning' && '⚠️'}
            {type === 'error' && '❌'}
            {type === 'success' && '✅'}
            {type === 'info' && 'ℹ️'}
          </div>
          <p className="text-sm font-medium flex-1">{message}</p>
          <button
            onClick={() => {
              setIsVisible(false);
              setTimeout(() => onClose?.(), 300);
            }}
            className="flex-shrink-0 text-lg leading-none opacity-70 hover:opacity-100"
            aria-label="Đóng"
          >
            ×
          </button>
        </div>
      </Card>
    </div>
  );
}

/**
 * Toast Manager - Hook để quản lý toasts
 */
export function useToast() {
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: ToastProps['type'] }>>([]);

  const showToast = (message: string, type: ToastProps['type'] = 'info') => {
    const id = Math.random().toString(36).substring(7);
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const ToastContainer = () => (
    <>
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </>
  );

  return { showToast, ToastContainer };
}


