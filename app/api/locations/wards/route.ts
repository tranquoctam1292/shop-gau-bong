import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import type { Ward } from '@/lib/utils/vietnamAddress';

// Mark route as dynamic (uses query parameters)
export const dynamic = 'force-dynamic';

/**
 * GET /api/locations/wards?districtId=xxx
 * 
 * Get wards by district ID
 * 
 * Query params:
 * - districtId (required): District ID
 * 
 * Returns: Array of Ward objects
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const districtId = searchParams.get('districtId');

    if (!districtId) {
      return NextResponse.json(
        {
          error: 'Missing required parameter: districtId',
        },
        {
          status: 400,
        }
      );
    }

    // Read JSON file from data folder
    const filePath = join(process.cwd(), 'data', 'vietnam-seo-2.json');
    const fileContent = await readFile(filePath, 'utf-8');
    const data = JSON.parse(fileContent);

    const wards: Ward[] = (data.ward || []).filter(
      (w: Ward) => w.districtId === districtId
    );

    return NextResponse.json(
      {
        wards,
        count: wards.length,
        districtId,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800', // 1 day cache, 7 days stale
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error: any) {
    console.error('[Locations API] Error loading wards:', error);
    return NextResponse.json(
      {
        error: 'Failed to load wards',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-cache',
        },
      }
    );
  }
}
