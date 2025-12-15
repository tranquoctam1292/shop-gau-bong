/**
 * Admin Product Export API Route
 * GET /api/admin/products/export - Export products to CSV/Excel/JSON
 * 
 * Protected route - requires authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCollections } from '@/lib/db';
import { withAuthAdmin, AuthenticatedRequest } from '@/lib/middleware/authMiddleware';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return withAuthAdmin(request, async (req: AuthenticatedRequest) => {
    try {
      const searchParams = req.nextUrl.searchParams;
    const format = searchParams.get('format') || 'json'; // json, csv, excel
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    
    const { products, categories } = await getCollections();
    
    // Build query
    const query: any = {};
    if (category) {
      const categoryDoc = await categories.findOne({
        $or: [{ name: category }, { slug: category }],
      });
      if (categoryDoc) {
        query.categoryId = categoryDoc._id.toString();
      }
    }
    if (status) {
      query.status = status;
    }
    
    // Fetch products
    const productsList = await products.find(query).toArray();
    
    // Transform products for export
    const exportData = productsList.map((product: any) => ({
      name: product.name || '',
      slug: product.slug || '',
      description: product.description || '',
      shortDescription: product.shortDescription || '',
      sku: product.sku || '',
      price: product.price || 0,
      category: product.categoryId || '',
      tags: (product.tags || []).join(','),
      images: (product.images || []).join(','),
      status: product.status || 'draft',
      isActive: product.isActive !== false,
      stockQuantity: product.stockQuantity || 0,
      length: product.length || '',
      width: product.width || '',
      height: product.height || '',
      weight: product.weight || '',
      volumetricWeight: product.volumetricWeight || '',
      material: product.material || '',
      origin: product.origin || '',
    }));
    
    if (format === 'json') {
      return NextResponse.json(exportData, {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="products-${Date.now()}.json"`,
        },
      });
    }
    
    if (format === 'csv') {
      // Convert to CSV
      const headers = Object.keys(exportData[0] || {});
      const csvRows = [
        headers.join(','),
        ...exportData.map((row) =>
          headers.map((header) => {
            const value = row[header as keyof typeof row];
            // Escape commas and quotes in CSV
            if (typeof value === 'string') {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          }).join(',')
        ),
      ];
      
      const csv = csvRows.join('\n');
      
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="products-${Date.now()}.csv"`,
        },
      });
    }
    
    // Excel format (return as JSON for now, can be enhanced with xlsx library)
    return NextResponse.json(
      { error: 'Excel format not yet implemented. Use CSV or JSON.' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('[Admin Product Export API] Error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to export products',
        details: process.env.NODE_ENV === 'development' 
          ? { stack: error.stack }
          : undefined,
      },
      { status: 500 }
    );
    }
  }, 'product:read'); // Export only requires read permission
}

