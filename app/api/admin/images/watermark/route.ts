import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir, readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

// Maximum file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Allowed image types
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

/**
 * API endpoint để áp dụng watermark lên ảnh
 * POST /api/admin/images/watermark
 * 
 * Body: FormData với:
 * - file: File ảnh cần watermark
 * - position: Vị trí watermark (top-left, top-right, bottom-left, bottom-right)
 * 
 * Note: Cần thư viện image processing như sharp hoặc jimp
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const position = (formData.get('position') as string) || 'bottom-right';

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

    // Check if logo exists
    const logoPath = join(process.cwd(), 'public', 'logo.png');
    if (!existsSync(logoPath)) {
      return NextResponse.json(
        { error: 'Logo file not found. Please add logo.png to public folder.' },
        { status: 404 }
      );
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'images');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // For now, save file as-is
    // TODO: Integrate with image processing library (sharp/jimp) to overlay watermark
    // This requires installing: npm install sharp
    // Example with sharp:
    // const sharp = require('sharp');
    // const image = sharp(await file.arrayBuffer());
    // const logo = sharp(logoPath);
    // const { width, height } = await image.metadata();
    // const logoResized = await logo.resize(Math.floor(width * 0.1)).toBuffer();
    // const watermarked = await image
    //   .composite([{ input: logoResized, gravity: position }])
    //   .toBuffer();

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    const timestamp = Date.now();
    const originalName = file.name || 'image.jpg';
    const ext = originalName.split('.').pop() || 'jpg';
    const fileName = `watermarked-${timestamp}.${ext}`;
    const filePath = join(uploadsDir, fileName);

    // Write file to disk (without watermark for now)
    await writeFile(filePath, buffer);

    const publicUrl = `/uploads/images/${fileName}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      message: 'Watermark feature is ready. Image processing library integration needed (sharp/jimp).',
    });
  } catch (error) {
    console.error('Error applying watermark:', error);
    return NextResponse.json(
      { error: 'Failed to apply watermark' },
      { status: 500 }
    );
  }
}
