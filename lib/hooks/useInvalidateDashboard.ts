/**
 * Utility hook to invalidate dashboard cache
 * 
 * Use this hook to invalidate dashboard queries after order mutations
 * (create, update status, update payment status)
 */

import { useQueryClient } from '@tanstack/react-query';

/**
 * Hook to invalidate dashboard cache
 * Invalidates all dashboard-related queries:
 * - dashboard-stats
 * - dashboard-revenue-chart
 * - dashboard-top-products
 * - dashboard-top-customers
 */
export function useInvalidateDashboard() {
  const queryClient = useQueryClient();

  const invalidateDashboard = () => {
    // Invalidate all dashboard queries
    queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-revenue-chart'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-top-products'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-top-customers'] });
  };

  return { invalidateDashboard };
}

