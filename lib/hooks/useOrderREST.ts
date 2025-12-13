'use client';

import { useState, useEffect } from 'react';
import type { Order } from '@/types/mongodb';

/**
 * Hook để fetch single order từ CMS API
 * 
 * @param orderId - Order ID (MongoDB ObjectId string or orderNumber)
 * @returns Order, loading, error
 * 
 * Note: Returns Order type which is compatible with both WooCommerce and MongoDB formats
 */
export function useOrderREST(orderId: string | number | null | undefined) {
  const [order, setOrder] = useState<Order | null>(null);
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

        // Convert to string (CMS API accepts ObjectId string or orderNumber)
        const orderIdStr = String(orderId);

        // Fetch order từ CMS API
        const response = await fetch(`/api/cms/orders/${orderIdStr}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Order not found');
          }
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to fetch order');
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

