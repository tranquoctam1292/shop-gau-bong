import { NextRequest, NextResponse } from 'next/server';
import { generateVietQR, formatAmountForVietQR, formatAddInfoForVietQR } from '@/lib/services/vietqr';
import { vietqrPaymentSchema } from '@/lib/validations/payment';
import { z } from 'zod';

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
    
    // Validate input with Zod
    const validatedData = vietqrPaymentSchema.parse(body);
    const { orderId, amount, accountNo, accountName, acqId } = validatedData;

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
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Dữ liệu không hợp lệ',
          details: error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }
    
    // Handle other errors
    console.error('VietQR API error:', error);
    return NextResponse.json(
      { error: error.message || 'Không thể tạo QR code' },
      { status: 500 }
    );
  }
}

