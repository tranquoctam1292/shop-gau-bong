import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import type { District } from '@/lib/utils/vietnamAddress';

// Mark route as dynamic (uses query parameters)
export const dynamic = 'force-dynamic';

/**
 * GET /api/locations/districts?provinceId=xxx
 * 
 * Get districts by province ID
 * 
 * Query params:
 * - provinceId (required): City/Province ID
 * 
 * Returns: Array of District objects
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const provinceId = searchParams.get('provinceId');

    if (!provinceId) {
      return NextResponse.json(
        {
          error: 'Missing required parameter: provinceId',
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

    const districts: District[] = (data.district || []).filter(
      (d: District) => d.cityId === provinceId
    );

    return NextResponse.json(
      {
        districts,
        count: districts.length,
        provinceId,
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
    console.error('[Locations API] Error loading districts:', error);
    return NextResponse.json(
      {
        error: 'Failed to load districts',
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
