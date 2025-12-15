'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { Toast, type ToastProps } from '@/components/ui/toast';

interface ToastContextType {
  showToast: (message: string, type?: ToastProps['type']) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToastContext() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToastContext must be used within ToastProvider');
  }
  return context;
}

interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: ToastProps['type']; isReplacing?: boolean }>>([]);

  const showToast = (message: string, type: ToastProps['type'] = 'info') => {
    const id = Math.random().toString(36).substring(7);
    
    // Nếu đã có toast đang hiển thị, đánh dấu nó để đóng ngay
    setToasts((prev) => {
      // Chỉ giữ lại toast cuối cùng (nếu có) và đánh dấu nó là "replacing"
      // Điều này đảm bảo chỉ có tối đa 2 toast: 1 toast cũ (đang đóng) và 1 toast mới (đang mở)
      const lastToast = prev.length > 0 ? prev[prev.length - 1] : null;
      const markedToasts = lastToast ? [{ ...lastToast, isReplacing: true }] : [];
      // Thêm toast mới
      return [...markedToasts, { id, message, type, isReplacing: false }];
    });
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
          isReplacing={toast.isReplacing || false}
        />
      ))}
    </ToastContext.Provider>
  );
}


