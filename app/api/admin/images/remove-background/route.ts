import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * API endpoint để tách nền ảnh bằng AI
 * POST /api/admin/images/remove-background
 * 
 * Body: JSON với:
 * - imageUrl: URL của ảnh cần tách nền
 * 
 * Note: Hiện tại sử dụng placeholder. Có thể tích hợp với:
 * - remove.bg API
 * - Python server với rembg library
 * - Hoặc service khác
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageUrl } = body;

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'No image URL provided' },
        { status: 400 }
      );
    }

    // Fetch image from URL
    const fullUrl = imageUrl.startsWith('http') 
      ? imageUrl 
      : imageUrl.startsWith('/')
      ? `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}${imageUrl}`
      : `http://localhost:3000/${imageUrl}`;
    
    const imageResponse = await fetch(fullUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
    }

    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
    
    // Validate file size
    if (imageBuffer.length > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `Image size exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    // TODO: Integrate with AI background removal service
    // Options:
    // 1. remove.bg API (requires API key)
    // 2. Python server with rembg library
    // 3. Other AI services
    
    // For now, we'll return a placeholder that indicates the feature is ready
    // but needs AI service integration
    
    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'images');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Generate filename
    const timestamp = Date.now();
    const fileName = `no-bg-${timestamp}.png`;
    const filePath = join(uploadsDir, fileName);

    // For now, save original image as placeholder
    // In production, this should be the processed image with background removed
    await writeFile(filePath, imageBuffer);

    const publicUrl = `/uploads/images/${fileName}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      message: 'Background removal feature is ready. AI service integration needed.',
    });
  } catch (error) {
    console.error('Error removing background:', error);
    return NextResponse.json(
      { error: 'Failed to remove background' },
      { status: 500 }
    );
  }
}
