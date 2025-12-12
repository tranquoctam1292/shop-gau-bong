import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { uploadToBlob } from '@/lib/utils/vercelBlob';

// Maximum file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Allowed media types
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg'];
const ALLOWED_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES];

/**
 * API endpoint để upload media files (images, videos)
 * POST /api/admin/media/upload
 * 
 * Body: FormData với:
 * - file: File to upload
 * 
 * Uploads to Vercel Blob Storage
 * Requires admin authentication
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'File type not allowed. Only images (JPEG, PNG, GIF, WebP) and videos (MP4, WebM, OGG) are supported.' },
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
    const originalName = file.name || (file.type.startsWith('image/') ? 'image.jpg' : 'video.mp4');
    const ext = originalName.split('.').pop() || (file.type.startsWith('image/') ? 'jpg' : 'mp4');
    const fileName = `${Date.now()}-${originalName}`;

    // Upload to Vercel Blob Storage
    const blobFile = await uploadToBlob(file, fileName, {
      access: 'public',
      contentType: file.type,
      cacheControlMaxAge: 31536000, // 1 year cache
    });

    return NextResponse.json({
      success: true,
      id: blobFile.pathname, // Use pathname as ID
      url: blobFile.url,
      thumbnail_url: file.type.startsWith('image/') ? blobFile.url : undefined,
      type: file.type.startsWith('image/') ? 'image' : 'video',
      title: originalName.replace(/\.[^/.]+$/, ''), // Remove extension
      alt: originalName.replace(/\.[^/.]+$/, ''),
      size: blobFile.size,
      contentType: blobFile.contentType,
    });
  } catch (error) {
    console.error('Error uploading media:', error);
    return NextResponse.json(
      { error: 'Failed to upload media file' },
      { status: 500 }
    );
  }
}
