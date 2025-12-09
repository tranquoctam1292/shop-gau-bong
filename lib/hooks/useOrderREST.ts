'use client';

import { useState, useEffect } from 'react';
import type { WooCommerceOrder } from '@/types/woocommerce';

/**
 * Hook để fetch single order từ WooCommerce REST API
 * 
 * @param orderId - Order ID (number)
 * @returns Order, loading, error
 */
export function useOrderREST(orderId: string | number | null | undefined) {
  const [order, setOrder] = useState<WooCommerceOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchOrder() {
      if (!orderId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const orderIdNum = typeof orderId === 'string' ? parseInt(orderId, 10) : orderId;
        if (isNaN(orderIdNum)) {
          throw new Error('Invalid order ID');
        }

        // Fetch order từ Next.js API route (proxy)
        const response = await fetch(`/api/woocommerce/orders/${orderIdNum}`);
        
        if (!response.ok) {
          throw new Error('Order not found');
        }

        const data = await response.json();
        setOrder(data.order);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch order'));
        setOrder(null);
      } finally {
        setLoading(false);
      }
    }

    fetchOrder();
  }, [orderId]);

  return {
    order,
    loading,
    error,
  };
}

