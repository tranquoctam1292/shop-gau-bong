/**
 * Shipping Service
 * Tính phí vận chuyển dựa trên volumetric weight và địa chỉ giao hàng
 * 
 * Support multiple shipping providers:
 * - GHTK (Giao Hàng Tiết Kiệm)
 * - GHN (Giao Hàng Nhanh)
 * - Custom shipping rates
 */

import { calculateVolumetricWeight, getShippingWeight } from '@/lib/utils/shipping';

export interface ShippingAddress {
  province: string; // Tỉnh/Thành phố
  district: string; // Quận/Huyện
  ward?: string; // Phường/Xã
  address: string; // Địa chỉ chi tiết
}

export interface ShippingItem {
  weight: number; // kg
  length: number; // cm
  width: number; // cm
  height: number; // cm
  quantity: number;
}

export interface ShippingRate {
  provider: string;
  service: string;
  cost: number; // VND
  estimatedDays: number;
  note?: string;
}

export interface ShippingConfig {
  provider: 'ghtk' | 'ghn' | 'custom';
  apiKey?: string;
  shopId?: string;
  defaultRate?: number; // VND per kg
}

/**
 * Calculate shipping weight for items
 * Uses volumetric weight logic: max(actual, volumetric)
 */
export function calculateShippingWeight(items: ShippingItem[]): number {
  return items.reduce((total, item) => {
    const volumetricWeight = calculateVolumetricWeight(
      item.length,
      item.width,
      item.height
    );
    const itemWeight = getShippingWeight(item.weight, volumetricWeight);
    return total + itemWeight * item.quantity;
  }, 0);
}

/**
 * Get shipping rates from GHTK (Giao Hàng Tiết Kiệm)
 * API Documentation: https://docs.giaohangtietkiem.vn/
 */
export async function getGHTKRates(
  items: ShippingItem[],
  address: ShippingAddress,
  config: ShippingConfig
): Promise<ShippingRate[]> {
  try {
    if (!config.apiKey) {
      throw new Error('GHTK API key not configured');
    }

    const totalWeight = calculateShippingWeight(items);
    
    // GHTK API endpoint
    const endpoint = 'https://services.giaohangtietkiem.vn/services/shipment/fee';
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Token': config.apiKey,
      },
      body: JSON.stringify({
        pick_province: 'Hà Nội', // Shop location
        pick_district: 'Quận Cầu Giấy',
        province: address.province,
        district: address.district,
        weight: totalWeight * 1000, // Convert to grams
        value: 0, // Product value (optional)
      }),
    });

    if (!response.ok) {
      throw new Error(`GHTK API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.success) {
      return [{
        provider: 'GHTK',
        service: 'Standard',
        cost: data.fee.fee,
        estimatedDays: data.fee.delivery,
        note: data.fee.delivery_text,
      }];
    }

    return [];
  } catch (error: any) {
    console.error('GHTK API error:', error);
    // Return fallback rate
    return getCustomShippingRates(items, address, config);
  }
}

/**
 * Get shipping rates from GHN (Giao Hàng Nhanh)
 * API Documentation: https://api.ghn.vn/
 */
export async function getGHNRates(
  items: ShippingItem[],
  address: ShippingAddress,
  config: ShippingConfig
): Promise<ShippingRate[]> {
  try {
    if (!config.apiKey || !config.shopId) {
      throw new Error('GHN API key or shop ID not configured');
    }

    // Validate address
    if (!address.province || !address.district || !address.address) {
      throw new Error('Địa chỉ giao hàng chưa đầy đủ (thiếu tỉnh/thành phố, quận/huyện, hoặc địa chỉ chi tiết)');
    }

    const totalWeight = calculateShippingWeight(items);
    
    // Get shop location from environment or use defaults
    const shopDistrictId = parseInt(process.env.NEXT_PUBLIC_SHIPPING_SHOP_DISTRICT_ID || '1444');
    const shopWardCode = process.env.NEXT_PUBLIC_SHIPPING_SHOP_WARD_CODE || '1A0101';
    
    // GHN API endpoint
    const endpoint = 'https://online-gateway.ghn.vn/shiip/public-api/v2/shipping-order/fee';
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Token': config.apiKey,
        'ShopId': config.shopId,
      },
      body: JSON.stringify({
        from_district_id: shopDistrictId,
        from_ward_code: shopWardCode,
        to_district_id: 0, // Need to map address to district ID (requires GHN location API)
        to_ward_code: address.ward || '',
        weight: totalWeight * 1000, // Convert to grams
        service_type_id: 2, // Standard service
      }),
    });

    if (!response.ok) {
      throw new Error(`GHN API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.code === 200) {
      return [{
        provider: 'GHN',
        service: 'Standard',
        cost: data.data.total,
        estimatedDays: data.data.leadtime || 2,
      }];
    }

    return [];
  } catch (error: any) {
    console.error('GHN API error:', error);
    // Return fallback rate
    return getCustomShippingRates(items, address, config);
  }
}

/**
 * Get custom shipping rates (fallback)
 * Simple calculation based on weight and distance
 */
export function getCustomShippingRates(
  items: ShippingItem[],
  address: ShippingAddress,
  config: ShippingConfig
): ShippingRate[] {
  const totalWeight = calculateShippingWeight(items);
  const defaultRate = config.defaultRate || 30000; // 30,000 VND per kg default
  
  // Simple tiered pricing
  let cost = 0;
  if (totalWeight <= 1) {
    cost = 30000; // 30k for first kg
  } else if (totalWeight <= 2) {
    cost = 30000 + (totalWeight - 1) * 20000; // +20k per additional kg
  } else if (totalWeight <= 5) {
    cost = 50000 + (totalWeight - 2) * 15000; // +15k per additional kg
  } else {
    cost = 95000 + (totalWeight - 5) * 10000; // +10k per additional kg
  }

  return [{
    provider: 'Custom',
    service: 'Standard',
    cost: Math.round(cost),
    estimatedDays: 2,
    note: 'Phí vận chuyển ước tính',
  }];
}

/**
 * Get shipping rates (main function)
 * Tries provider APIs first, falls back to custom rates
 */
export async function getShippingRates(
  items: ShippingItem[],
  address: ShippingAddress,
  config: ShippingConfig
): Promise<ShippingRate[]> {
  try {
    switch (config.provider) {
      case 'ghtk':
        return await getGHTKRates(items, address, config);
      case 'ghn':
        return await getGHNRates(items, address, config);
      case 'custom':
      default:
        return getCustomShippingRates(items, address, config);
    }
  } catch (error: any) {
    console.error('Shipping rate calculation error:', error);
    // Always return fallback rates
    return getCustomShippingRates(items, address, config);
  }
}

/**
 * Format shipping cost for display
 */
export function formatShippingCost(cost: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(cost);
}

