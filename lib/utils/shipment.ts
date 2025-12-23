/**
 * Shipment Utilities (Client-Safe)
 * 
 * Client-side utilities for shipment tracking.
 * This file does NOT import any server-side code (MongoDB, etc.)
 */

export type Carrier = 'ghtk' | 'ghn' | 'custom';

/**
 * Get carrier tracking URL
 * 
 * @param carrier - Carrier type
 * @param trackingNumber - Tracking number
 * @returns Tracking URL
 */
export function getCarrierTrackingUrl(carrier: Carrier, trackingNumber: string): string {
  switch (carrier) {
    case 'ghtk':
      return `https://giaohangtietkiem.vn/tracking/${trackingNumber}`;
    case 'ghn':
      return `https://ghn.vn/tracking/${trackingNumber}`;
    case 'custom':
    default:
      return `#`;
  }
}

/**
 * Get carrier label in Vietnamese
 * 
 * @param carrier - Carrier type
 * @returns Carrier label
 */
export function getCarrierLabel(carrier: Carrier | string): string {
  const labels: Record<string, string> = {
    ghtk: 'Giao Hàng Tiết Kiệm',
    ghn: 'Giao Hàng Nhanh',
    custom: 'Tùy chỉnh',
  };
  return labels[carrier] || carrier;
}

