/**
 * Low Stock Alerts API
 * POST /api/admin/inventory/alerts
 *
 * Trigger low stock email and Telegram alerts
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuthAdmin, AuthenticatedRequest } from '@/lib/middleware/authMiddleware';
import { getLowStockItems } from '@/lib/repositories/inventoryRepository';
import { sendLowStockAlertEmail } from '@/lib/services/email';
import { sendLowStockAlertTelegram, getTelegramConfig } from '@/lib/services/telegram';

/**
 * POST /api/admin/inventory/alerts
 * Trigger low stock notifications (email + Telegram)
 */
export async function POST(request: NextRequest) {
  return withAuthAdmin(request, async (req: AuthenticatedRequest) => {
    try {
      // Parse request body
      const body = await req.json().catch(() => ({}));
      const threshold = body.threshold as number | undefined;
      const includeOutOfStock = body.includeOutOfStock !== false;
      const channels = body.channels as string[] | undefined; // ['email', 'telegram']

      // Get low stock items
      const lowStockData = await getLowStockItems(threshold, includeOutOfStock);

      if (lowStockData.items.length === 0) {
        return NextResponse.json({
          success: true,
          message: 'Không có sản phẩm nào tồn kho thấp',
          itemCount: 0,
          emailSent: false,
          telegramSent: false,
        });
      }

      // Transform to notification format
      const alertItems = lowStockData.items.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        sku: item.sku || '',
        currentStock: item.currentStock,
        threshold: item.threshold,
        severity: item.severity,
        isVariant: !!item.variationId,
        variantInfo: item.variationLabel,
        variationLabel: item.variationLabel,
      }));

      const alertData = {
        items: alertItems,
        generatedAt: new Date(),
      };

      // Determine which channels to send
      const sendEmail = !channels || channels.includes('email');
      const sendTelegram = !channels || channels.includes('telegram');

      let emailSent = false;
      let telegramSent = false;
      const errors: string[] = [];

      // Send email
      if (sendEmail) {
        const emailResult = await sendLowStockAlertEmail(alertData);
        emailSent = emailResult.success;
        if (!emailResult.success && emailResult.error) {
          errors.push(`Email: ${emailResult.error}`);
        }
      }

      // Send Telegram
      if (sendTelegram) {
        const telegramResult = await sendLowStockAlertTelegram(alertData);
        telegramSent = telegramResult.success;
        if (!telegramResult.success && telegramResult.error) {
          errors.push(`Telegram: ${telegramResult.error}`);
        }
      }

      // Log the action
      console.log(
        `[Low Stock Alert] Sent alerts (email: ${emailSent}, telegram: ${telegramSent}) with ${lowStockData.items.length} items by ${req.adminUser?.full_name}`
      );

      // Build response message
      const sentChannels: string[] = [];
      if (emailSent) sentChannels.push('email');
      if (telegramSent) sentChannels.push('Telegram');

      const message = sentChannels.length > 0
        ? `Đã gửi cảnh báo qua ${sentChannels.join(' và ')} với ${lowStockData.items.length} sản phẩm`
        : 'Không thể gửi cảnh báo qua bất kỳ kênh nào';

      return NextResponse.json({
        success: emailSent || telegramSent,
        message,
        itemCount: lowStockData.items.length,
        emailSent,
        telegramSent,
        errors: errors.length > 0 ? errors : undefined,
        summary: {
          out_of_stock: lowStockData.items.filter((i) => i.severity === 'out_of_stock').length,
          critical: lowStockData.items.filter((i) => i.severity === 'critical').length,
          warning: lowStockData.items.filter((i) => i.severity === 'warning').length,
        },
      });
    } catch (error) {
      console.error('[Low Stock Alert API] Error:', error);
      return NextResponse.json(
        { error: 'Lỗi khi gửi cảnh báo tồn kho' },
        { status: 500 }
      );
    }
  });
}

/**
 * GET /api/admin/inventory/alerts
 * Get alert configuration and last sent info
 */
export async function GET(request: NextRequest) {
  return withAuthAdmin(request, async () => {
    try {
      // Get low stock items count
      const lowStockData = await getLowStockItems();
      const telegramConfig = getTelegramConfig();

      return NextResponse.json({
        success: true,
        config: {
          emailEnabled: !!process.env.RESEND_API_KEY,
          telegramEnabled: !!(telegramConfig.botToken && telegramConfig.chatId),
          defaultThreshold: 10,
        },
        currentAlerts: {
          total: lowStockData.total,
          out_of_stock: lowStockData.items.filter((i) => i.severity === 'out_of_stock').length,
          critical: lowStockData.items.filter((i) => i.severity === 'critical').length,
          warning: lowStockData.items.filter((i) => i.severity === 'warning').length,
        },
      });
    } catch (error) {
      console.error('[Low Stock Alert API] Error:', error);
      return NextResponse.json(
        { error: 'Lỗi khi lấy thông tin cảnh báo' },
        { status: 500 }
      );
    }
  });
}
