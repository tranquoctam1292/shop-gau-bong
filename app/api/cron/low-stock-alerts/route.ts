/**
 * Cron Job: Low Stock Alerts
 * GET /api/cron/low-stock-alerts
 *
 * This endpoint is designed to be called by external cron services
 * (Vercel Cron, cron-job.org, etc.)
 *
 * Security: Uses CRON_SECRET env variable for authentication
 *
 * Recommended schedule: Daily at 8:00 AM Vietnam time
 * Cron expression: 0 8 * * * (or 0 1 * * * UTC)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getLowStockItems } from '@/lib/repositories/inventoryRepository';
import { sendLowStockAlertEmail } from '@/lib/services/email';
import { sendLowStockAlertTelegram } from '@/lib/services/telegram';

/**
 * Verify cron secret for security
 */
function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  // If no CRON_SECRET is set, only allow in development
  if (!cronSecret) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[Cron] CRON_SECRET not set, allowing in development mode');
      return true;
    }
    return false;
  }

  // Check Bearer token
  if (authHeader === `Bearer ${cronSecret}`) {
    return true;
  }

  // Check query parameter (for services that don't support headers)
  const url = new URL(request.url);
  const secretParam = url.searchParams.get('secret');
  if (secretParam === cronSecret) {
    return true;
  }

  return false;
}

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    if (!verifyCronSecret(request)) {
      console.error('[Cron Low Stock] Unauthorized request');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[Cron Low Stock] Starting low stock check...');

    // Get low stock items
    const lowStockData = await getLowStockItems(undefined, true);

    if (lowStockData.items.length === 0) {
      console.log('[Cron Low Stock] No low stock items found');
      return NextResponse.json({
        success: true,
        message: 'No low stock items',
        itemCount: 0,
        emailSent: false,
        timestamp: new Date().toISOString(),
      });
    }

    console.log(`[Cron Low Stock] Found ${lowStockData.items.length} low stock items`);

    // Transform to email format
    const emailItems = lowStockData.items.map((item) => ({
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
      items: emailItems,
      generatedAt: new Date(),
    };

    // Send both email and Telegram
    let emailSent = false;
    let telegramSent = false;

    // Send email
    const emailResult = await sendLowStockAlertEmail(alertData);
    emailSent = emailResult.success;
    if (!emailResult.success) {
      console.error('[Cron Low Stock] Failed to send email:', emailResult.error);
    }

    // Send Telegram
    const telegramResult = await sendLowStockAlertTelegram(alertData);
    telegramSent = telegramResult.success;
    if (!telegramResult.success) {
      console.error('[Cron Low Stock] Failed to send Telegram:', telegramResult.error);
    }

    // If both failed, return error
    if (!emailSent && !telegramSent) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to send alerts via any channel',
          itemCount: lowStockData.items.length,
          emailSent: false,
          telegramSent: false,
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      );
    }

    console.log(`[Cron Low Stock] Successfully sent alert for ${lowStockData.items.length} items (email: ${emailSent}, telegram: ${telegramSent})`);

    return NextResponse.json({
      success: true,
      message: `Alert sent for ${lowStockData.items.length} items`,
      itemCount: lowStockData.items.length,
      emailSent,
      telegramSent,
      summary: {
        out_of_stock: lowStockData.items.filter((i) => i.severity === 'out_of_stock').length,
        critical: lowStockData.items.filter((i) => i.severity === 'critical').length,
        warning: lowStockData.items.filter((i) => i.severity === 'warning').length,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Cron Low Stock] Error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Also support POST for flexibility
export { GET as POST };
