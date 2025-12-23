import { NextRequest, NextResponse } from 'next/server';
import { uploadToBlob } from '@/lib/utils/vercelBlob';

// Maximum file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Allowed image types
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

/**
 * API endpoint để upload ảnh đã chỉnh sửa
 * POST /api/admin/images/upload
 * 
 * Body: FormData với:
 * - file: File blob của ảnh đã chỉnh sửa
 * - originalUrl: URL của ảnh gốc (optional)
 * 
 * Uploads to Vercel Blob Storage
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const originalUrl = formData.get('originalUrl') as string | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith('image/') || !ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'File must be a valid image (JPEG, PNG, GIF, or WebP)' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    // Generate filename
    const originalName = file.name || 'image.jpg';
    const ext = originalName.split('.').pop() || 'jpg';
    const fileName = `edited-${Date.now()}.${ext}`;

    // Upload to Vercel Blob Storage
    const blobFile = await uploadToBlob(file, fileName, {
      access: 'public',
      contentType: file.type,
      cacheControlMaxAge: 31536000, // 1 year cache
    });

    return NextResponse.json({
      success: true,
      url: blobFile.url,
      path: blobFile.pathname,
      size: blobFile.size,
      contentType: blobFile.contentType,
      originalUrl: originalUrl || null,
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    );
  }
}
