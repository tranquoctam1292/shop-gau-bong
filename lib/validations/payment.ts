/**
 * Payment Validation Schemas
 * 
 * Zod schemas for payment-related API routes
 */

import { z } from 'zod';

/**
 * MoMo Payment Request Schema
 */
export const momoPaymentSchema = z.object({
  orderId: z.union([z.string(), z.number()]).transform((val) => String(val)),
  amount: z.number().positive('Số tiền phải lớn hơn 0'),
  returnUrl: z.string().url('Return URL không hợp lệ'),
  notifyUrl: z.string().url('Notify URL không hợp lệ'),
});

export type MoMoPaymentInput = z.infer<typeof momoPaymentSchema>;

/**
 * VietQR Payment Request Schema
 */
export const vietqrPaymentSchema = z.object({
  orderId: z.union([z.string(), z.number()]).transform((val) => String(val)),
  amount: z.number().positive('Số tiền phải lớn hơn 0'),
  accountNo: z.string().min(1, 'Số tài khoản là bắt buộc'),
  accountName: z.string().min(1, 'Tên chủ tài khoản là bắt buộc'),
  acqId: z.string().min(1, 'Mã ngân hàng là bắt buộc'),
});

export type VietQRPaymentInput = z.infer<typeof vietqrPaymentSchema>;

/**
 * Bank Transfer Receipt Upload Schema
 * 
 * Note: File validation is handled separately in the route
 * This schema is for FormData fields
 */
export const bankTransferUploadSchema = z.object({
  orderId: z.string().min(1, 'Order ID là bắt buộc'),
  // File is validated separately in route handler
});

export type BankTransferUploadInput = z.infer<typeof bankTransferUploadSchema>;

/**
 * File Upload Validation (for bank transfer receipt)
 */
export const validateBankTransferFile = (file: File): { valid: boolean; error?: string } => {
  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Loại file không hợp lệ. Chỉ chấp nhận JPG, PNG, và PDF.',
    };
  }

  // Validate file size (max 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'Kích thước file vượt quá 5MB',
    };
  }

  return { valid: true };
};
