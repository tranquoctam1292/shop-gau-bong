/**
 * Admin Menu Item Resolve Link API Route
 * POST /api/admin/menu-items/resolve-link - Resolve menu item link and check reference status
 * 
 * Protected route - requires authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { resolveMenuItemLink } from '@/lib/utils/menuUtils';
import { ObjectId } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const { requireAdmin } = await import('@/lib/auth');
    try {
      await requireAdmin();
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const { type, url, referenceId, title } = body;
    
    if (!type) {
      return NextResponse.json({ error: 'Type is required' }, { status: 400 });
    }
    
    // Resolve link
    const resolved = await resolveMenuItemLink({
      type,
      url: url || null,
      referenceId: referenceId ? (typeof referenceId === 'string' ? new ObjectId(referenceId) : referenceId) : null,
      title: title || null,
    });
    
    return NextResponse.json({
      url: resolved.url,
      title: resolved.title,
      exists: resolved.exists,
      active: resolved.active,
    });
  } catch (error: any) {
    console.error('[Admin Menu Item Resolve Link API] Error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to resolve menu item link',
        details: process.env.NODE_ENV === 'development'
          ? { stack: error.stack }
          : undefined,
      },
      { status: 500 }
    );
  }
}

