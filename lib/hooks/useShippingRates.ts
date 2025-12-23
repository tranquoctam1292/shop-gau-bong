'use client';

import { useState, useEffect } from 'react';
import { getShippingRates, type ShippingItem, type ShippingAddress, type ShippingRate, type ShippingConfig } from '@/lib/services/shipping';
import { useCartStore, type CartItem } from '@/lib/store/cartStore';

// Re-export ShippingAddress for convenience
export type { ShippingAddress };

export function useShippingRates(
  address: ShippingAddress | null,
  config?: Partial<ShippingConfig>
) {
  const { items } = useCartStore();
  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Convert cart items to shipping items
  const shippingItems: ShippingItem[] = items.map((item: CartItem) => ({
    weight: item.weight || 0,
    length: item.length || 0,
    width: item.width || 0,
    height: item.height || 0,
    quantity: item.quantity,
  }));

  // Get shipping config from environment or use defaults
  const shippingConfig: ShippingConfig = {
    provider: (process.env.NEXT_PUBLIC_SHIPPING_PROVIDER as any) || 'custom',
    apiKey: process.env.NEXT_PUBLIC_SHIPPING_API_KEY,
    shopId: process.env.NEXT_PUBLIC_SHIPPING_SHOP_ID,
    defaultRate: parseInt(process.env.NEXT_PUBLIC_SHIPPING_DEFAULT_RATE || '30000'),
    ...config,
  };

  useEffect(() => {
    if (!address || shippingItems.length === 0) {
      setRates([]);
      return;
    }

    const fetchRates = async () => {
      setLoading(true);
      setError(null);

      try {
        const calculatedRates = await getShippingRates(
          shippingItems,
          address,
          shippingConfig
        );
        setRates(calculatedRates);
      } catch (err: any) {
        setError(err.message || 'Không thể tính phí vận chuyển');
        setRates([]);
      } finally {
        setLoading(false);
      }
    };

    // Debounce API calls
    const timeoutId = setTimeout(fetchRates, 500);
    return () => clearTimeout(timeoutId);
  }, [address, JSON.stringify(shippingItems), JSON.stringify(shippingConfig)]);

  return {
    rates,
    loading,
    error,
    selectedRate: rates[0] || null, // Default to first rate
  };
}

