/**
 * Admin Product Analytics API Route
 * GET /api/admin/products/[id]/analytics - Get analytics for a product
 * POST /api/admin/products/[id]/analytics/track - Track analytics event
 * 
 * Protected route - requires authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCollections, ObjectId } from '@/lib/db';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// Analytics event schema
const analyticsEventSchema = z.object({
  eventType: z.enum(['view', 'click', 'conversion', 'search']),
  metadata: z.record(z.any()).optional(),
});

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
    
    const { productAnalytics, products } = await getCollections();
    const { id } = params;
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    // Verify product exists
    let product = null;
    if (ObjectId.isValid(id)) {
      product = await products.findOne({ _id: new ObjectId(id) });
    }
    if (!product) {
      product = await products.findOne({ slug: id });
    }
    
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }
    
    const productId = product._id.toString();
    
    // Build query
    const query: any = { productId };
    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = new Date(startDate);
      }
      if (endDate) {
        query.date.$lte = new Date(endDate);
      }
    }
    
    // Aggregate analytics
    const analytics = await productAnalytics
      .find(query)
      .sort({ date: -1 })
      .toArray();
    
    // Calculate totals
    const totals = analytics.reduce(
      (acc, record: any) => {
        acc.views += record.views || 0;
        acc.clicks += record.clicks || 0;
        acc.conversions += record.conversions || 0;
        acc.searches += record.searches || 0;
        return acc;
      },
      { views: 0, clicks: 0, conversions: 0, searches: 0 }
    );
    
    // Calculate conversion rate
    const conversionRate =
      totals.views > 0 ? (totals.conversions / totals.views) * 100 : 0;
    
    // Get popular variants
    const variantStats: Record<string, number> = {};
    analytics.forEach((record: any) => {
      if (record.popularVariants) {
        Object.entries(record.popularVariants).forEach(([variant, count]: [string, any]) => {
          variantStats[variant] = (variantStats[variant] || 0) + count;
        });
      }
    });
    
    const popularVariants = Object.entries(variantStats)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 5)
      .map(([variant, count]) => ({ variant, count }));
    
    // Get search keywords
    const keywordStats: Record<string, number> = {};
    analytics.forEach((record: any) => {
      if (record.searchKeywords) {
        record.searchKeywords.forEach((keyword: string) => {
          keywordStats[keyword] = (keywordStats[keyword] || 0) + 1;
        });
      }
    });
    
    const searchKeywords = Object.entries(keywordStats)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 10)
      .map(([keyword, count]) => ({ keyword, count }));
    
    return NextResponse.json({
      productId,
      totals,
      conversionRate: parseFloat(conversionRate.toFixed(2)),
      popularVariants,
      searchKeywords,
      dailyData: analytics,
    });
  } catch (error: any) {
    console.error('[Admin Product Analytics API] Error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to fetch analytics',
        details: process.env.NODE_ENV === 'development' 
          ? { stack: error.stack }
          : undefined,
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { productAnalytics, products } = await getCollections();
    const { id } = params;
    const body = await request.json();
    
    // Validate input
    const validatedData = analyticsEventSchema.parse(body);
    
    // Verify product exists
    let product = null;
    if (ObjectId.isValid(id)) {
      product = await products.findOne({ _id: new ObjectId(id) });
    }
    if (!product) {
      product = await products.findOne({ slug: id });
    }
    
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }
    
    const productId = product._id.toString();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Find or create today's analytics record
    const existingRecord = await productAnalytics.findOne({
      productId,
      date: today,
    });
    
    const updateField = validatedData.eventType === 'view' ? 'views' :
                        validatedData.eventType === 'click' ? 'clicks' :
                        validatedData.eventType === 'conversion' ? 'conversions' :
                        'searches';
    
    if (existingRecord) {
      // Update existing record
      await productAnalytics.updateOne(
        { productId, date: today },
        {
          $inc: { [updateField]: 1 },
          $set: { updatedAt: new Date() },
        }
      );
    } else {
      // Create new record
      await productAnalytics.insertOne({
        productId,
        date: today,
        views: validatedData.eventType === 'view' ? 1 : 0,
        clicks: validatedData.eventType === 'click' ? 1 : 0,
        conversions: validatedData.eventType === 'conversion' ? 1 : 0,
        searches: validatedData.eventType === 'search' ? 1 : 0,
        popularVariants: {},
        searchKeywords: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    
    // Handle metadata (variants, keywords)
    if (validatedData.metadata) {
      if (validatedData.metadata.variantId) {
        await productAnalytics.updateOne(
          { productId, date: today },
          {
            $inc: { [`popularVariants.${validatedData.metadata.variantId}`]: 1 },
          }
        );
      }
      if (validatedData.metadata.keyword) {
        await productAnalytics.updateOne(
          { productId, date: today },
          {
            $addToSet: { searchKeywords: validatedData.metadata.keyword },
          }
        );
      }
    }
    
    return NextResponse.json(
      { message: 'Analytics event tracked successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation error',
          details: error.errors,
        },
        { status: 400 }
      );
    }
    
    console.error('[Admin Product Analytics API] Error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to track analytics event',
        details: process.env.NODE_ENV === 'development' 
          ? { stack: error.stack }
          : undefined,
      },
      { status: 500 }
    );
  }
}

