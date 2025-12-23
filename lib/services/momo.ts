/**
 * MoMo Payment Service
 * Tích hợp MoMo Payment Gateway cho thanh toán tại Việt Nam
 * 
 * MoMo API Documentation: https://developers.momo.vn/
 */

export interface MoMoConfig {
  partnerCode: string;
  accessKey: string;
  secretKey: string;
  environment: 'sandbox' | 'production';
}

export interface MoMoPaymentRequest {
  orderId: string;
  orderInfo: string;
  amount: number; // Amount in VND
  returnUrl: string;
  notifyUrl: string;
  extraData?: string;
}

export interface MoMoPaymentResponse {
  requestId: string;
  errorCode: number;
  message: string;
  localMessage: string;
  requestType: string;
  payUrl?: string;
  deeplink?: string;
  qrCodeUrl?: string;
}

/**
 * Create MoMo Payment Request
 * 
 * @param config - MoMo configuration
 * @param paymentRequest - Payment request data
 * @returns Payment URL or QR code
 */
export async function createMoMoPayment(
  config: MoMoConfig,
  paymentRequest: MoMoPaymentRequest
): Promise<MoMoPaymentResponse> {
  try {
    const endpoint = config.environment === 'production'
      ? 'https://payment.momo.vn/v2/gateway/api/create'
      : 'https://test-payment.momo.vn/v2/gateway/api/create';

    // Build request data
    const requestData = {
      partnerCode: config.partnerCode,
      partnerName: 'Shop Gấu Bông',
      storeId: 'ShopGauBong',
      requestId: `${Date.now()}`,
      amount: paymentRequest.amount,
      orderId: paymentRequest.orderId,
      orderInfo: paymentRequest.orderInfo,
      redirectUrl: paymentRequest.returnUrl,
      ipnUrl: paymentRequest.notifyUrl,
      extraData: paymentRequest.extraData || '',
      requestType: 'captureWallet',
      autoCapture: true,
      lang: 'vi',
    };

    // Create signature
    const rawSignature = `accessKey=${config.accessKey}&amount=${requestData.amount}&extraData=${requestData.extraData}&ipnUrl=${requestData.ipnUrl}&orderId=${requestData.orderId}&orderInfo=${requestData.orderInfo}&partnerCode=${config.partnerCode}&redirectUrl=${requestData.redirectUrl}&requestId=${requestData.requestId}&requestType=${requestData.requestType}`;
    const signature = await createMoMoSignature(rawSignature, config.secretKey);

    // Send request
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...requestData,
        signature,
      }),
    });

    if (!response.ok) {
      throw new Error(`MoMo API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error('MoMo Payment error:', error);
    throw new Error(error.message || 'Không thể tạo yêu cầu thanh toán MoMo');
  }
}

/**
 * Create MoMo Signature
 * HMAC SHA256 signature for request authentication
 */
export async function createMoMoSignature(
  rawData: string,
  secretKey: string
): Promise<string> {
  // In Node.js, use crypto module
  const crypto = require('crypto');
  return crypto
    .createHmac('sha256', secretKey)
    .update(rawData)
    .digest('hex');
}

/**
 * Verify MoMo Payment Callback
 * Verify signature from MoMo callback
 */
export async function verifyMoMoCallback(
  callbackData: any,
  secretKey: string
): Promise<boolean> {
  try {
    const {
      partnerCode,
      accessKey,
      amount,
      orderId,
      orderInfo,
      orderType,
      transId,
      message,
      localMessage,
      responseTime,
      payType,
      extraData,
      signature,
    } = callbackData;

    // Build raw signature string
    const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${partnerCode}&payType=${payType}&responseTime=${responseTime}&resultCode=${callbackData.resultCode}&transId=${transId}`;

    // Create signature
    const expectedSignature = await createMoMoSignature(rawSignature, secretKey);

    // Compare signatures
    return signature === expectedSignature;
  } catch (error) {
    console.error('MoMo signature verification error:', error);
    return false;
  }
}

/**
 * Format order info for MoMo
 * Max 255 characters
 */
export function formatMoMoOrderInfo(orderId: string | number): string {
  return `Thanh toan don hang #${orderId}`.substring(0, 255);
}

