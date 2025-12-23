import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import type { City } from '@/lib/utils/vietnamAddress';

/**
 * GET /api/locations/provinces
 * 
 * Get all provinces (cities)
 * 
 * Returns: Array of City objects
 */
export async function GET() {
  try {
    // Read JSON file from data folder
    const filePath = join(process.cwd(), 'data', 'vietnam-seo-2.json');
    const fileContent = await readFile(filePath, 'utf-8');
    const data = JSON.parse(fileContent);

    const cities: City[] = data.city || [];

    return NextResponse.json(
      {
        provinces: cities,
        count: cities.length,
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
    console.error('[Locations API] Error loading provinces:', error);
    return NextResponse.json(
      {
        error: 'Failed to load provinces',
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
