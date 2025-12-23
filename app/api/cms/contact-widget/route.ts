/**
 * Contact Widget Public API
 * GET /api/cms/contact-widget - Get public contact widget settings (only enabled items)
 * 
 * Public route - no authentication required
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPublicContactWidgetSettings } from '@/lib/repositories/contactWidgetRepository';

// ✅ FIX: Bỏ 'force-dynamic', dùng ISR revalidate 60s
// Giúp giảm tải DB tới 99% - Cache response tại CDN/Edge trong 60 giây
export const revalidate = 60;

/**
 * GET /api/cms/contact-widget
 * Get public contact widget settings (only enabled and active items)
 */
export async function GET(request: NextRequest) {
  try {
    const settings = await getPublicContactWidgetSettings();

    // Return null if widget is disabled or no active items
    return NextResponse.json({
      success: true,
      data: settings,
    });
  } catch (error: any) {
    console.error('[Contact Widget Public API] GET error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Có lỗi xảy ra khi lấy cấu hình',
      },
      { status: 500 }
    );
  }
}

