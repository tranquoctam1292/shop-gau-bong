'use client';

import { useState } from 'react';
import type { CartItem } from '@/lib/store/cartStore';

export interface CheckoutFormData {
  // Customer info
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  
  // Billing address
  billingAddress1: string;
  billingAddress2?: string;
  billingProvince?: string; // cityId
  billingProvinceName?: string; // city name
  billingDistrict?: string; // districtId
  billingDistrictName?: string; // district name
  billingWard?: string; // wardId
  billingWardName?: string; // ward name
  billingCity: string; // Keep for backward compatibility (will use province name)
  billingPostcode: string;
  billingCountry: string;
  
  // Shipping address (same as billing if not provided)
  shippingFirstName?: string;
  shippingLastName?: string;
  shippingAddress1?: string;
  shippingAddress2?: string;
  shippingProvince?: string; // cityId
  shippingProvinceName?: string; // city name
  shippingDistrict?: string; // districtId
  shippingDistrictName?: string; // district name
  shippingWard?: string; // wardId
  shippingWardName?: string; // ward name
  shippingCity?: string; // Keep for backward compatibility
  shippingPostcode?: string;
  shippingCountry?: string;
  
  // Shipping method
  shippingMethod?: string;
  
  // Payment method
  paymentMethod: 'bacs' | 'cod' | 'momo' | 'bank_transfer';
  
  // Notes
  customerNote?: string;
}

/**
 * Get payment method title for display
 */
function getPaymentMethodTitle(method: string): string {
  const titles: Record<string, string> = {
    cod: 'Thanh toán khi nhận hàng (COD)',
    bacs: 'Chuyển khoản ngân hàng (VietQR)',
    momo: 'Ví MoMo',
    bank_transfer: 'Chuyển khoản ngân hàng',
  };
  return titles[method] || method;
}

export function useCheckoutREST() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitOrder = async (
    formData: CheckoutFormData,
    cartItems: CartItem[],
    subtotal: number,
    shippingTotal: number = 0,
    total: number
  ) => {
    setIsProcessing(true);
    setError(null);

    try {
      // Build customer name from firstName and lastName
      const customerName = [formData.firstName, formData.lastName].filter(Boolean).join(' ') || formData.firstName;

      // Use shipping address if provided, otherwise use billing
      const shippingAddress = {
        firstName: formData.shippingFirstName || formData.firstName,
        lastName: formData.shippingLastName || formData.lastName,
        address1: formData.shippingAddress1 || formData.billingAddress1,
        address2: formData.shippingAddress2 || formData.billingAddress2 || '',
        city: formData.shippingCity || formData.billingCity,
        postcode: formData.shippingPostcode || formData.billingPostcode,
        country: formData.shippingCountry || formData.billingCountry,
      };

      // Build billing address
      const billingAddress = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        address1: formData.billingAddress1,
        address2: formData.billingAddress2 || '',
        city: [formData.billingProvinceName, formData.billingDistrictName, formData.billingWardName]
          .filter(Boolean)
          .join(', ') || formData.billingCity,
        postcode: formData.billingPostcode,
        country: formData.billingCountry,
      };

      // Convert cart items to line items format for CMS API
      const lineItems = cartItems.map((item) => ({
        productId: String(item.productId), // Convert to string for MongoDB ObjectId
        variationId: item.variationId ? String(item.variationId) : undefined,
        productName: item.productName,
        quantity: item.quantity,
        price: parseFloat(item.price) || 0, // Convert price string to number
      }));

      // Build order input according to CMS API format
      const orderInput = {
        customerName,
        customerEmail: formData.email,
        customerPhone: formData.phone,
        orderType: 'personal' as const, // Can be extended to support 'gift' later
        billing: billingAddress,
        shipping: shippingAddress,
        lineItems,
        paymentMethod: formData.paymentMethod,
        paymentMethodTitle: getPaymentMethodTitle(formData.paymentMethod),
        subtotal,
        shippingTotal,
        total,
        customerNote: formData.customerNote || undefined,
      };

      // Create order via CMS API
      const response = await fetch('/api/cms/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderInput),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || 'Không thể tạo đơn hàng');
      }

      const data = await response.json();
      const order = data.order;

      if (!order || !order._id) {
        throw new Error('Không thể tạo đơn hàng');
      }

      const orderId = order._id.toString();

      // Store payment method in localStorage for order confirmation
      if (formData.paymentMethod) {
        localStorage.setItem(`order_${orderId}_paymentMethod`, formData.paymentMethod);
      }

      // Return order data for component to handle redirect
      return {
        orderId,
        order,
      };
    } catch (err: any) {
      setError(err?.message || 'Có lỗi xảy ra khi tạo đơn hàng. Vui lòng thử lại.');
      console.error('Order creation error:', err);
      throw err; // Re-throw to allow component to handle
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    submitOrder,
    isProcessing,
    error,
  };
}

