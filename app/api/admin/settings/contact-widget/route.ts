/**
 * Contact Widget Settings Management API
 * GET /api/admin/settings/contact-widget - Get current settings
 * POST /api/admin/settings/contact-widget - Create/Update settings
 * 
 * Protected route - requires authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuthAdmin, AuthenticatedRequest } from '@/lib/middleware/authMiddleware';
import { getContactWidgetSettings, updateContactWidgetSettings } from '@/lib/repositories/contactWidgetRepository';
import { z } from 'zod';
import type { ContactWidgetConfig } from '@/types/mongodb';

export const dynamic = 'force-dynamic';

// Request body schema for POST
const contactWidgetItemSchema = z.object({
  type: z.enum(['hotline', 'zalo', 'messenger']),
  active: z.boolean(),
  label: z.string().min(1, 'Label là bắt buộc'),
  value: z.string().min(1, 'Value là bắt buộc'),
  iconUrl: z.string().url().optional().or(z.literal('')), // Custom SVG icon URL (optional)
});

const contactWidgetConfigSchema = z.object({
  enabled: z.boolean(),
  position: z.enum(['left', 'right']),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Màu phải là hex code (ví dụ: #D6336C)'),
  items: z.array(contactWidgetItemSchema).min(0).max(3, 'Tối đa 3 items'),
});

/**
 * GET /api/admin/settings/contact-widget
 * Get current contact widget settings
 */
export async function GET(request: NextRequest) {
  return withAuthAdmin(request, async (req: AuthenticatedRequest) => {
    try {
      const settings = await getContactWidgetSettings();

      return NextResponse.json({
        success: true,
        data: settings,
      });
    } catch (error: any) {
      console.error('[Contact Widget Settings] GET error:', error);
      return NextResponse.json(
        {
          success: false,
          error: error.message || 'Có lỗi xảy ra khi lấy cấu hình',
        },
        { status: 500 }
      );
    }
  });
}

/**
 * POST /api/admin/settings/contact-widget
 * Create or update contact widget settings
 */
export async function POST(request: NextRequest) {
  return withAuthAdmin(request, async (req: AuthenticatedRequest) => {
    try {
      const body = await request.json();
      const validated = contactWidgetConfigSchema.parse(body);

      // Validate phone numbers for hotline and zalo
      for (const item of validated.items) {
        if ((item.type === 'hotline' || item.type === 'zalo') && item.active) {
          // ✅ FIX: Chỉ check độ dài tối thiểu/tối đa hợp lý (8-15 số)
          // Cho phép nhập dấu +, -, space, nhưng khi count thì chỉ tính số
          const phoneDigits = item.value.replace(/\D/g, '');
          if (phoneDigits.length < 8 || phoneDigits.length > 15) {
            return NextResponse.json(
              {
                success: false,
                error: `Số điện thoại ${item.label} không hợp lệ (phải từ 8-15 chữ số)`,
              },
              { status: 400 }
            );
          }
        }
        
        if (item.type === 'messenger' && item.active) {
          // Messenger value should be page ID or username (alphanumeric, dots, hyphens)
          if (!/^[a-zA-Z0-9._-]+$/.test(item.value)) {
            return NextResponse.json(
              {
                success: false,
                error: `Messenger Page ID không hợp lệ (chỉ cho phép chữ, số, dấu chấm, gạch ngang)`,
              },
              { status: 400 }
            );
          }
        }
      }

      const updated = await updateContactWidgetSettings(validated);

      return NextResponse.json({
        success: true,
        message: 'Đã lưu cấu hình thành công',
        data: updated,
      });
    } catch (error: any) {
      console.error('[Contact Widget Settings] POST error:', error);
      
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          {
            success: false,
            error: error.errors[0]?.message || 'Dữ liệu không hợp lệ',
            details: error.errors,
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: error.message || 'Có lỗi xảy ra khi lưu cấu hình',
        },
        { status: 500 }
      );
    }
  });
}

