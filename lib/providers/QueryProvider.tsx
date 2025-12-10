'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

/**
 * QueryClient Provider cho React Query
 * 
 * Cung cấp QueryClient instance cho toàn bộ ứng dụng
 * với cấu hình tối ưu cho caching và deduplication
 */
export function QueryProvider({ children }: { children: React.ReactNode }) {
  // Tạo QueryClient instance với cấu hình tối ưu
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Stale time: Data được coi là "fresh" trong 5 phút
            // Trong thời gian này, React Query sẽ không refetch tự động
            staleTime: 5 * 60 * 1000, // 5 phút
            
            // Cache time: Data được giữ trong cache 10 phút sau khi không còn component nào sử dụng
            gcTime: 10 * 60 * 1000, // 10 phút (trước đây là cacheTime)
            
            // Retry: Tự động retry 1 lần nếu request fail
            retry: 1,
            
            // Refetch on window focus: Không tự động refetch khi user quay lại tab
            // (tốt cho performance, tránh spam requests)
            refetchOnWindowFocus: false,
            
            // Refetch on reconnect: Refetch khi mạng reconnect
            refetchOnReconnect: true,
            
            // Refetch on mount: Không refetch khi component mount nếu data đã có trong cache
            refetchOnMount: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* React Query Devtools - Optional, chỉ hiển thị nếu package được cài đặt */}
      {/* Note: Để sử dụng devtools, cài đặt: npm install @tanstack/react-query-devtools --save-dev */}
    </QueryClientProvider>
  );
}

