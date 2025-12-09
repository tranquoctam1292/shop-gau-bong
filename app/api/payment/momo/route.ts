import { NextRequest, NextResponse } from 'next/server';
import { createMoMoPayment, formatMoMoOrderInfo } from '@/lib/services/momo';

/**
 * API Route: Create MoMo Payment
 * POST /api/payment/momo
 * 
 * Body:
 * {
 *   orderId: string,
 *   amount: number,
 *   returnUrl: string,
 *   notifyUrl: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, amount, returnUrl, notifyUrl } = body;

    // Validate required fields
    if (!orderId || !amount || !returnUrl || !notifyUrl) {
      return NextResponse.json(
        { error: 'Thiếu thông tin bắt buộc' },
        { status: 400 }
      );
    }

    // Get MoMo config from environment
    const config = {
      partnerCode: process.env.MOMO_PARTNER_CODE || '',
      accessKey: process.env.MOMO_ACCESS_KEY || '',
      secretKey: process.env.MOMO_SECRET_KEY || '',
      environment: (process.env.MOMO_ENV || 'sandbox') as 'sandbox' | 'production',
    };

    // Validate config
    if (!config.partnerCode || !config.accessKey || !config.secretKey) {
      return NextResponse.json(
        { error: 'Cấu hình MoMo chưa được thiết lập' },
        { status: 500 }
      );
    }

    // Create payment request
    const response = await createMoMoPayment(config, {
      orderId: orderId.toString(),
      orderInfo: formatMoMoOrderInfo(orderId),
      amount,
      returnUrl,
      notifyUrl,
    });

    if (response.errorCode !== 0) {
      return NextResponse.json(
        { error: response.localMessage || response.message || 'Không thể tạo yêu cầu thanh toán' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      payUrl: response.payUrl,
      deeplink: response.deeplink,
      qrCodeUrl: response.qrCodeUrl,
    });
  } catch (error: any) {
    console.error('MoMo API error:', error);
    return NextResponse.json(
      { error: error.message || 'Không thể tạo yêu cầu thanh toán' },
      { status: 500 }
    );
  }
}

