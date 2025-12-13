import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { validateBankTransferFile } from '@/lib/validations/payment';

/**
 * API Route: Upload bank transfer receipt
 * POST /api/payment/bank-transfer/upload
 */
export async function POST(request: NextRequest) {
  try {
    // Guest checkout - no authentication required
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const orderId = formData.get('orderId') as string;

    // Validate required fields
    if (!file || !orderId) {
      return NextResponse.json(
        { error: 'Thiếu file hoặc Order ID' },
        { status: 400 }
      );
    }

    // Validate orderId
    if (!orderId.trim()) {
      return NextResponse.json(
        { error: 'Order ID không được để trống' },
        { status: 400 }
      );
    }

    // Validate file using validation helper
    const fileValidation = validateBankTransferFile(file);
    if (!fileValidation.valid) {
      return NextResponse.json(
        { error: fileValidation.error },
        { status: 400 }
      );
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'bank-transfers');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const filename = `receipt-${orderId}-${timestamp}.${fileExtension}`;
    const filepath = join(uploadsDir, filename);

    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // TODO: Save receipt info to database (WordPress meta hoặc custom table)
    // TODO: Send notification to admin
    // TODO: Update order meta với receipt URL

    return NextResponse.json({
      success: true,
      message: 'Receipt uploaded successfully',
      filename,
      url: `/uploads/bank-transfers/${filename}`,
    });
  } catch (error: any) {
    console.error('Upload receipt error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload receipt' },
      { status: 500 }
    );
  }
}


