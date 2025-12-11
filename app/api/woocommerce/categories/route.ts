import { NextRequest, NextResponse } from 'next/server';
import { wcApi } from '@/lib/api/woocommerce';

/**
 * API Route: Proxy WooCommerce Categories API
 * GET /api/woocommerce/categories
 * 
 * Proxy requests từ client đến WooCommerce REST API
 */
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Convert URLSearchParams to object
    const params: Record<string, any> = {};
    searchParams.forEach((value, key) => {
      params[key] = value;
    });

    const categories = await wcApi.getCategories(params);

    return NextResponse.json({ categories });
  } catch (error: any) {
    console.error('Error fetching categories:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      cause: error.cause,
    });
    return NextResponse.json(
      { 
        error: error.message || 'Failed to fetch categories',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

