import { NextRequest, NextResponse } from 'next/server';
import { generateVietQR, formatAmountForVietQR, formatAddInfoForVietQR } from '@/lib/services/vietqr';

/**
 * API Route: Generate VietQR Code
 * POST /api/payment/vietqr
 * 
 * Body:
 * {
 *   orderId: string | number,
 *   amount: number,
 *   accountNo: string,
 *   accountName: string,
 *   acqId: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, amount, accountNo, accountName, acqId } = body;

    // Validate required fields
    if (!orderId || !amount || !accountNo || !accountName || !acqId) {
      return NextResponse.json(
        { error: 'Thiếu thông tin bắt buộc' },
        { status: 400 }
      );
    }

    // Generate QR code
    const qrCodeUrl = await generateVietQR({
      accountNo,
      accountName,
      acqId,
      template: 'compact',
      amount: formatAmountForVietQR(amount),
      addInfo: formatAddInfoForVietQR(orderId),
    });

    return NextResponse.json({
      success: true,
      qrCodeUrl,
      paymentContent: formatAddInfoForVietQR(orderId),
    });
  } catch (error: any) {
    console.error('VietQR API error:', error);
    return NextResponse.json(
      { error: error.message || 'Không thể tạo QR code' },
      { status: 500 }
    );
  }
}

