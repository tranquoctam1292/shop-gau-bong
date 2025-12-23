import { NextRequest, NextResponse } from 'next/server';
import { readFile, existsSync } from 'fs';
import { join } from 'path';
import { promisify } from 'util';

const readFileAsync = promisify(readFile);

/**
 * API endpoint để khôi phục ảnh gốc
 * POST /api/admin/images/restore
 * 
 * Body: JSON với:
 * - imageUrl: URL của ảnh hiện tại (đã chỉnh sửa)
 * - originalUrl: URL của ảnh gốc cần khôi phục
 * 
 * Note: Endpoint này chủ yếu để tracking/logging.
 * Việc khôi phục thực tế được xử lý ở client-side
 * bằng cách cập nhật src attribute trong editor.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageUrl, originalUrl } = body;

    if (!imageUrl || !originalUrl) {
      return NextResponse.json(
        { error: 'Both imageUrl and originalUrl are required' },
        { status: 400 }
      );
    }

    // Verify original file exists
    const originalPath = originalUrl.startsWith('/')
      ? join(process.cwd(), 'public', originalUrl)
      : originalUrl;

    if (!existsSync(originalPath)) {
      return NextResponse.json(
        { error: 'Original image not found' },
        { status: 404 }
      );
    }


    return NextResponse.json({
      success: true,
      message: 'Image restore logged successfully',
      originalUrl,
    });
  } catch (error) {
    console.error('Error in restore endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to process restore request' },
      { status: 500 }
    );
  }
}
