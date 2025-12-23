/**
 * Order Validation Schemas
 * 
 * Zod schemas for order-related API routes
 * 
 * Note: Main order creation schema is already in app/api/cms/orders/route.ts
 * This file contains reusable schemas and additional validation helpers
 */

import { z } from 'zod';

/**
 * Order Update Schema (for admin)
 */
export const updateOrderSchema = z.object({
  status: z.enum([
    'pending',
    'processing',
    'on-hold',
    'completed',
    'cancelled',
    'refunded',
    'failed',
    'awaiting-payment',
    'shipping',
  ]).optional(),
  paymentStatus: z.enum(['pending', 'paid', 'refunded', 'failed']).optional(),
  customerNote: z.string().max(1000, 'Ghi chú không được vượt quá 1000 ký tự').optional(),
  shippingTotal: z.number().min(0, 'Phí vận chuyển không được âm').optional(),
  total: z.number().min(0, 'Tổng tiền không được âm').optional(),
  cancelledReason: z.string().max(500, 'Lý do hủy không được vượt quá 500 ký tự').optional(),
  trackingNumber: z.string().optional(),
  carrier: z.string().optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'Phải có ít nhất một trường để cập nhật' }
);

export type UpdateOrderInput = z.infer<typeof updateOrderSchema>;

/**
 * Order Item Schema
 */
export const orderItemSchema = z.object({
  productId: z.string().min(1, 'Product ID là bắt buộc'),
  variationId: z.string().optional(),
  productName: z.string().min(1, 'Tên sản phẩm là bắt buộc'),
  quantity: z.number().int().positive('Số lượng phải là số nguyên dương'),
  price: z.number().min(0, 'Giá không được âm'),
});

/**
 * Shipping Address Schema
 */
export const shippingAddressSchema = z.object({
  firstName: z.string().min(1, 'Tên là bắt buộc'),
  lastName: z.string().min(1, 'Họ là bắt buộc'),
  address1: z.string().min(1, 'Địa chỉ là bắt buộc'),
  address2: z.string().optional(),
  city: z.string().min(1, 'Thành phố là bắt buộc'),
  province: z.string().min(1, 'Tỉnh/Thành phố là bắt buộc').optional(),
  district: z.string().min(1, 'Quận/Huyện là bắt buộc').optional(),
  ward: z.string().min(1, 'Phường/Xã là bắt buộc').optional(),
  postcode: z.string().optional(),
  country: z.string().default('VN'),
});

/**
 * Billing Address Schema
 */
export const billingAddressSchema = shippingAddressSchema;

/**
 * Order Creation Schema (reusable version)
 * 
 * Note: This is a more complete version than the inline one in route.ts
 * Consider refactoring route.ts to use this schema
 */
export const createOrderSchema = z.object({
  customerName: z.string().min(1, 'Tên khách hàng là bắt buộc').max(100, 'Tên không được vượt quá 100 ký tự'),
  customerEmail: z.string().email('Email không hợp lệ'),
  customerPhone: z.string().regex(/^[0-9]{10,11}$/, 'Số điện thoại không hợp lệ (10-11 số)').optional(),
  orderType: z.enum(['personal', 'gift']).default('personal'),
  buyerInfo: z.object({
    name: z.string().min(1),
    email: z.string().email(),
    phone: z.string().regex(/^[0-9]{10,11}$/),
  }).optional(),
  recipientInfo: z.object({
    name: z.string().min(1),
    phone: z.string().regex(/^[0-9]{10,11}$/),
    address: z.string().min(1),
  }).optional(),
  billing: billingAddressSchema,
  shipping: shippingAddressSchema,
  lineItems: z.array(orderItemSchema).min(1, 'Giỏ hàng không được trống'),
  paymentMethod: z.enum(['vietqr', 'momo', 'cod', 'bank_transfer']),
  paymentMethodTitle: z.string().min(1),
  subtotal: z.number().min(0, 'Tổng phụ không được âm'),
  shippingTotal: z.number().min(0, 'Phí vận chuyển không được âm'),
  total: z.number().min(0, 'Tổng tiền không được âm'),
  customerNote: z.string().max(1000, 'Ghi chú không được vượt quá 1000 ký tự').optional(),
}).refine(
  (data) => data.subtotal + data.shippingTotal === data.total,
  {
    message: 'Tổng tiền không khớp (subtotal + shippingTotal phải bằng total)',
    path: ['total'],
  }
);

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
