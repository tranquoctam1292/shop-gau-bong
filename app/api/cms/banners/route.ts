/**
 * Public Banners API Route
 * GET /api/cms/banners
 * 
 * Fetch active banners for homepage carousel
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCollections } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { banners } = await getCollections();
    
    // Fetch active banners, sorted by position
    const bannersList = await banners
      .find({ active: true })
      .sort({ position: 1 })
      .toArray();
    
    return NextResponse.json({ banners: bannersList });
  } catch (error: any) {
    console.error('[Banners API] Error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to fetch banners',
        details: process.env.NODE_ENV === 'development' 
          ? { stack: error.stack }
          : undefined,
      },
      { status: 500 }
    );
  }
}

