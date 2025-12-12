/**
 * Admin Product Stock API Route
 * GET /api/admin/products/[id]/stock - Check stock availability
 * 
 * Protected route - requires authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCollections, ObjectId } from '@/lib/db';
import { checkStockAvailability } from '@/lib/services/inventory';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authentication check
    const { requireAdmin } = await import('@/lib/auth');
    try {
      await requireAdmin();
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const searchParams = request.nextUrl.searchParams;
    const variationId = searchParams.get('variationId') || undefined;
    const quantity = parseInt(searchParams.get('quantity') || '1', 10);

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid product ID' },
        { status: 400 }
      );
    }

    const stockInfo = await checkStockAvailability(id, variationId, quantity);

    return NextResponse.json({
      productId: id,
      variationId,
      quantity,
      stock: stockInfo,
    });
  } catch (error: any) {
    console.error('[Admin Product Stock API] Error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to check stock availability',
        details:
          process.env.NODE_ENV === 'development'
            ? { stack: error.stack }
            : undefined,
      },
      { status: 500 }
    );
  }
}

