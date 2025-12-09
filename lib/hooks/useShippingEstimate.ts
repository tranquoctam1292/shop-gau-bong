'use client';

import { useMemo } from 'react';
import { useCartStore, type CartItem } from '@/lib/store/cartStore';
import { calculateTotalShippingWeight } from '@/lib/utils/shipping';
import { getCustomShippingRates, type ShippingItem, type ShippingAddress, type ShippingConfig } from '@/lib/services/shipping';

/**
 * Hook để tính phí ship ước tính trong cart (không cần địa chỉ)
 * Sử dụng custom shipping rates với địa chỉ mặc định
 */
export function useShippingEstimate() {
  const { items } = useCartStore();

  // Tính shipping weight
  const shippingWeight = useMemo(() => {
    return calculateTotalShippingWeight(
      items.map((item: CartItem) => ({
        quantity: item.quantity,
        product: {
          weight: item.weight,
          productSpecs: {
            length: item.length,
            width: item.width,
            height: item.height,
            volumetricWeight: item.volumetricWeight,
          },
        },
      }))
    );
  }, [items]);

  // Tính shipping cost estimate (sử dụng custom rates với địa chỉ mặc định)
  const shippingEstimate = useMemo(() => {
    if (items.length === 0 || shippingWeight === 0) {
      return null;
    }

    // Convert cart items to shipping items
    const shippingItems: ShippingItem[] = items.map((item: CartItem) => ({
      weight: item.weight || 0,
      length: item.length || 0,
      width: item.width || 0,
      height: item.height || 0,
      quantity: item.quantity,
    }));

    // Default address (Hà Nội - trung tâm)
    const defaultAddress: ShippingAddress = {
      province: 'Hà Nội',
      district: 'Quận Hoàn Kiếm',
      ward: 'Phường Tràng Tiền',
      address: '',
    };

    // Shipping config từ env hoặc defaults
    const shippingConfig: ShippingConfig = {
      provider: 'custom',
      defaultRate: parseInt(process.env.NEXT_PUBLIC_SHIPPING_DEFAULT_RATE || '30000'),
    };

    // Tính shipping rates (chỉ dùng custom, không gọi API)
    const rates = getCustomShippingRates(shippingItems, defaultAddress, shippingConfig);
    
    // Lấy rate đầu tiên (thường chỉ có 1 rate với custom)
    return rates[0]?.cost || null;
  }, [items, shippingWeight]);

  return {
    shippingWeight,
    shippingEstimate,
    isLoading: false, // Không có async operation
  };
}

