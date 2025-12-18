'use client';

import { useMemo } from 'react';
import { useCartStore, type CartItem } from '@/lib/store/cartStore';
import { calculateTotalShippingWeight } from '@/lib/utils/shipping';
import { getCustomShippingRates, type ShippingItem, type ShippingAddress, type ShippingConfig } from '@/lib/services/shipping';

/**
 * Hook để tính phí ship ước tính trong cart (không cần địa chỉ)
 * Sử dụng custom shipping rates với địa chỉ mặc định
 * 
 * ✅ PERFORMANCE: Memoized calculations để tránh tính toán lại không cần thiết
 */
export function useShippingEstimate() {
  const { items } = useCartStore();

  // ✅ PERFORMANCE: Memoize cart items transformation để tránh tạo array mới mỗi lần render
  // Chỉ tính toán lại khi items thay đổi (reference hoặc content)
  const transformedItems = useMemo(() => {
    return items.map((item: CartItem) => ({
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
    }));
  }, [items]);

  // ✅ PERFORMANCE: Memoize shipping items transformation để tái sử dụng trong shippingEstimate
  const shippingItems = useMemo((): ShippingItem[] => {
    return items.map((item: CartItem) => ({
      weight: item.weight || 0,
      length: item.length || 0,
      width: item.width || 0,
      height: item.height || 0,
      quantity: item.quantity,
    }));
  }, [items]);

  // ✅ PERFORMANCE: Memoize shipping weight calculation
  // Chỉ tính toán lại khi transformedItems thay đổi
  const shippingWeight = useMemo(() => {
    if (transformedItems.length === 0) {
      return 0;
    }
    return calculateTotalShippingWeight(transformedItems);
  }, [transformedItems]);

  // ✅ PERFORMANCE: Memoize default address và config (không thay đổi)
  const defaultAddress: ShippingAddress = useMemo(() => ({
    province: 'Hà Nội',
    district: 'Quận Hoàn Kiếm',
    ward: 'Phường Tràng Tiền',
    address: '',
  }), []);

  const shippingConfig: ShippingConfig = useMemo(() => ({
    provider: 'custom',
    defaultRate: parseInt(process.env.NEXT_PUBLIC_SHIPPING_DEFAULT_RATE || '30000'),
  }), []);

  // ✅ PERFORMANCE: Memoize shipping cost estimate
  // Chỉ tính toán lại khi shippingItems hoặc shippingWeight thay đổi
  const shippingEstimate = useMemo(() => {
    if (items.length === 0 || shippingWeight === 0) {
      return null;
    }

    // Tính shipping rates (chỉ dùng custom, không gọi API)
    const rates = getCustomShippingRates(shippingItems, defaultAddress, shippingConfig);
    
    // Lấy rate đầu tiên (thường chỉ có 1 rate với custom)
    return rates[0]?.cost || null;
  }, [items.length, shippingItems, shippingWeight, defaultAddress, shippingConfig]);

  return {
    shippingWeight,
    shippingEstimate,
    isLoading: false, // Không có async operation
  };
}

