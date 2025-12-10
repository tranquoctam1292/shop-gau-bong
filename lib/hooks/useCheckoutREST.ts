'use client';

import { useState } from 'react';
import type { WooCommerceOrderCreateInput } from '@/types/woocommerce';

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
    lineItems: Array<{ product_id: number; quantity: number }>
  ) => {
    setIsProcessing(true);
    setError(null);

    try {
      // Use shipping address if provided, otherwise use billing
      const shippingAddress = {
        first_name: formData.shippingFirstName || formData.firstName,
        last_name: formData.shippingLastName || formData.lastName,
        address_1: formData.shippingAddress1 || formData.billingAddress1,
        address_2: formData.shippingAddress2 || formData.billingAddress2 || '',
        city: formData.shippingCity || formData.billingCity,
        postcode: formData.shippingPostcode || formData.billingPostcode,
        country: formData.shippingCountry || formData.billingCountry,
      };

      // Build order input according to WooCommerce REST API format
      const orderInput: WooCommerceOrderCreateInput = {
        payment_method: formData.paymentMethod,
        payment_method_title: getPaymentMethodTitle(formData.paymentMethod),
        set_paid: false, // COD và bank transfer không paid ngay
        billing: {
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          address_1: formData.billingAddress1,
          address_2: formData.billingAddress2 || '',
          city: [formData.billingProvinceName, formData.billingDistrictName, formData.billingWardName]
            .filter(Boolean)
            .join(', ') || formData.billingCity,
          postcode: formData.billingPostcode,
          country: formData.billingCountry,
        },
        shipping: shippingAddress,
        line_items: lineItems,
      };

      // Add shipping lines if shipping method is provided
      // Note: Shipping cost sẽ được tính bởi WooCommerce dựa trên shipping method
      if (formData.shippingMethod) {
        orderInput.shipping_lines = [
          {
            method_id: formData.shippingMethod,
            method_title: 'Shipping',
            total: '0', // Will be calculated by WooCommerce
          },
        ];
      }

      // Add customer note if provided
      if (formData.customerNote) {
        orderInput.customer_note = formData.customerNote;
      }

      // Create order via Next.js API route (proxy)
      const response = await fetch('/api/woocommerce/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderInput),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Không thể tạo đơn hàng');
      }

      const data = await response.json();
      const order = data.order;

      if (!order || !order.id) {
        throw new Error('Không thể tạo đơn hàng');
      }

      const orderId = order.id;

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

