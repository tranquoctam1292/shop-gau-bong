/**
 * Recalculate Order Totals Utility
 * 
 * Calculates order totals based on:
 * - Order items (subtotal)
 * - Tax (if applicable)
 * - Shipping (based on address and items)
 * - Discount (coupon)
 * - Grand total = max(0, subtotal + tax + shipping - discount)
 */

export interface OrderItem {
  _id?: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  total: number;
  variant?: {
    size?: string;
    color?: string;
  };
}

export interface ShippingAddress {
  province?: string;
  district?: string;
  ward?: string;
  address1?: string;
  city?: string;
  postcode?: string;
  country?: string;
}

export interface OrderTotals {
  subtotal: number;
  taxTotal: number;
  shippingTotal: number;
  discountTotal: number;
  grandTotal: number;
}

export interface RecalculateOrderTotalsParams {
  items: OrderItem[];
  shippingAddress?: ShippingAddress;
  currentShippingTotal?: number;
  discountTotal?: number;
  taxRate?: number; // Tax rate as decimal (e.g., 0.1 for 10%)
}

/**
 * Calculate shipping cost based on address and items
 * This is a simplified version - in production, you'd integrate with shipping providers
 */
function calculateShipping(
  items: OrderItem[],
  shippingAddress?: ShippingAddress,
  currentShippingTotal?: number
): number {
  // If shipping address is not provided, return current shipping total or 0
  if (!shippingAddress) {
    return currentShippingTotal || 0;
  }

  // For now, return current shipping total if available
  // In production, you'd calculate based on:
  // - Province/District/Ward
  // - Total weight/volumetric weight of items
  // - Shipping provider rates
  if (currentShippingTotal !== undefined) {
    return currentShippingTotal;
  }

  // Default shipping cost (can be enhanced with shipping calculator)
  // BUSINESS LOGIC FIX: Ensure shipping cost is always an integer (VND)
  return Math.round(30000); // 30,000 VND default
}

/**
 * Recalculate order totals
 * 
 * @param params - Parameters for recalculation
 * @returns Calculated totals
 */
export function recalculateOrderTotals(
  params: RecalculateOrderTotalsParams
): OrderTotals {
  const {
    items,
    shippingAddress,
    currentShippingTotal,
    discountTotal = 0,
    taxRate = 0,
  } = params;

  // BUSINESS LOGIC FIX: Normalize rounding for all calculations
  // All calculations must use Math.round() to ensure integer VND values (no Float)
  // This prevents Float values from being sent to payment gateways
  
  // Calculate subtotal from items (round each item total to avoid accumulation errors)
  const subtotal = Math.round(
    items.reduce((sum, item) => {
      const itemTotal = item.total || item.price * item.quantity || 0;
      return sum + itemTotal;
    }, 0)
  );

  // Calculate tax (if applicable) - round immediately
  const taxTotal = taxRate > 0 ? Math.round(subtotal * taxRate) : 0;

  // Calculate shipping - ensure calculateShipping returns rounded value
  const shippingTotal = Math.round(
    calculateShipping(
      items,
      shippingAddress,
      currentShippingTotal
    )
  );

  // Calculate grand total
  // grandTotal = max(0, subtotal + tax + shipping - discount)
  // All components are already rounded, but round final result for safety
  const grandTotal = Math.round(
    Math.max(
      0,
      subtotal + taxTotal + shippingTotal - discountTotal
    )
  );

  return {
    subtotal,
    taxTotal,
    shippingTotal,
    discountTotal: Math.round(discountTotal), // Ensure discountTotal is rounded
    grandTotal,
  };
}

