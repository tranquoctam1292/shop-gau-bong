/**
 * VietQR Service
 * Tích hợp VietQR API để tạo QR code thanh toán
 * 
 * VietQR là dịch vụ tạo QR code chuyển khoản ngân hàng tự động tại Việt Nam
 * API Documentation: https://vietqr.io/
 */

export interface VietQRConfig {
  accountNo: string; // Số tài khoản ngân hàng
  accountName: string; // Tên chủ tài khoản
  acqId: string; // Mã ngân hàng (970415, 970422, etc.)
  template: 'compact' | 'compact2' | 'qr_only';
  amount?: number; // Số tiền (VND)
  addInfo?: string; // Nội dung chuyển khoản
}

export interface VietQRResponse {
  code: string; // Mã QR code
  desc: string; // Mô tả
  data: {
    qrCode: string; // QR code string
    qrDataURL: string; // QR code image URL
  };
}

/**
 * Generate VietQR code
 * 
 * @param config - VietQR configuration
 * @returns QR code data URL
 */
export async function generateVietQR(config: VietQRConfig): Promise<string> {
  try {
    // VietQR API endpoint
    const apiUrl = 'https://img.vietqr.io/image';
    
    // Build query parameters
    const params = new URLSearchParams({
      accountNo: config.accountNo,
      accountName: config.accountName,
      acqId: config.acqId,
      template: config.template || 'compact',
      ...(config.amount && { amount: config.amount.toString() }),
      ...(config.addInfo && { addInfo: config.addInfo }),
    });

    // Return QR code image URL
    return `${apiUrl}?${params.toString()}`;
  } catch (error) {
    console.error('Error generating VietQR:', error);
    throw new Error('Không thể tạo QR code. Vui lòng thử lại.');
  }
}

/**
 * Format amount for VietQR
 * VietQR expects amount in VND (no decimals)
 */
export function formatAmountForVietQR(amount: number): number {
  return Math.round(amount);
}

/**
 * Format addInfo (payment content) for VietQR
 * Max 25 characters, no special characters
 */
export function formatAddInfoForVietQR(orderId: string | number): string {
  const prefix = 'GB'; // Gấu Bông
  const orderStr = orderId.toString().padStart(6, '0');
  return `${prefix}${orderStr}`.substring(0, 25);
}

