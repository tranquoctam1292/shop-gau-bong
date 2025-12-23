/**
 * Telegram Bot Service
 * 
 * Service để gửi notification qua Telegram Bot
 * Miễn phí, real-time, phổ biến ở Việt Nam
 */

const TELEGRAM_API_URL = 'https://api.telegram.org/bot';

/**
 * Telegram configuration
 * Read from environment variables each time (not cached at module load time)
 */
export function getTelegramConfig() {
  return {
    botToken: process.env.TELEGRAM_BOT_TOKEN || '',
    chatId: process.env.TELEGRAM_CHAT_ID || '',
  };
}

/**
 * Send notification về đơn hàng mới qua Telegram
 */
export async function sendTelegramNotification(
  orderData: {
    orderNumber: string;
    customerName: string;
    customerEmail: string;
    customerPhone?: string;
    grandTotal: number;
    paymentMethod: string;
    paymentMethodTitle: string;
    items: Array<{
      productName: string;
      quantity: number;
      price: number;
      total: number;
    }>;
    shippingAddress?: {
      address1: string;
      address2?: string;
      province?: string;
      postcode?: string;
    };
    createdAt: Date;
    adminUrl?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get configuration (read from env vars each time)
    const config = getTelegramConfig();
    
    // Validate configuration
    if (!config.botToken) {
      console.error('[Telegram Service] TELEGRAM_BOT_TOKEN not configured');
      return { success: false, error: 'Telegram bot token not configured' };
    }

    if (!config.chatId) {
      console.error('[Telegram Service] TELEGRAM_CHAT_ID not configured');
      return { success: false, error: 'Telegram chat ID not configured' };
    }

    // Format currency
    const formatCurrency = (amount: number): string => {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
      }).format(amount);
    };

    // Format date
    const formatDate = (date: Date): string => {
      return new Intl.DateTimeFormat('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(date));
    };

    // Format shipping address
    const formatAddress = (address?: typeof orderData.shippingAddress): string => {
      if (!address) return 'Chưa có địa chỉ';
      
      const parts: string[] = [];
      if (address.address1) parts.push(address.address1);
      if (address.address2) parts.push(address.address2);
      if (address.province) parts.push(address.province);
      if (address.postcode) parts.push(`Mã bưu điện: ${address.postcode}`);
      
      return parts.length > 0 ? parts.join(', ') : 'Chưa có địa chỉ';
    };

    // Build message with HTML formatting
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://teddyland.vn';
    const adminUrl = orderData.adminUrl || `${siteUrl}/admin/orders/${orderData.orderNumber}`;
    
    const itemsText = orderData.items
      .map((item) => `  • ${item.productName} x${item.quantity} = ${formatCurrency(item.total)}`)
      .join('\n');

    const message = `
🧸 <b>Đơn hàng mới</b>

📦 <b>Thông tin đơn hàng:</b>
  • Mã đơn: <code>${orderData.orderNumber}</code>
  • Ngày đặt: ${formatDate(orderData.createdAt)}
  • Tổng tiền: <b>${formatCurrency(orderData.grandTotal)}</b>
  • Thanh toán: ${orderData.paymentMethodTitle}

👤 <b>Thông tin khách hàng:</b>
  • Tên: ${orderData.customerName}
  • Email: ${orderData.customerEmail}
${orderData.customerPhone ? `  • Điện thoại: <a href="tel:${orderData.customerPhone}">${orderData.customerPhone}</a>` : ''}
  • Địa chỉ: ${formatAddress(orderData.shippingAddress)}

🛍️ <b>Sản phẩm:</b>
${itemsText}

🔗 <a href="${adminUrl}">Xem chi tiết đơn hàng</a>
    `.trim();

    // Send message via Telegram Bot API
    const response = await fetch(
      `${TELEGRAM_API_URL}${config.botToken}/sendMessage`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: config.chatId,
          text: message,
          parse_mode: 'HTML',
          disable_web_page_preview: false,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.description || `HTTP ${response.status}`;
      console.error('[Telegram Service] Failed to send message:', errorMessage);
      return { success: false, error: errorMessage };
    }

    const data = await response.json();
    if (data.ok) {
      console.log('[Telegram Service] Message sent successfully:', data.result.message_id);
      return { success: true };
    } else {
      console.error('[Telegram Service] Failed to send message:', data);
      return { success: false, error: 'Unknown error' };
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[Telegram Service] Error sending message:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Get chat ID from Telegram Bot
 * 
 * Cách sử dụng:
 * 1. Chat với bot trên Telegram
 * 2. Gọi API này để lấy chat ID
 * 3. Thêm chat ID vào .env.local
 */
export async function getChatId(): Promise<string | null> {
  try {
    const config = getTelegramConfig();
    
    if (!config.botToken) {
      console.error('[Telegram Service] TELEGRAM_BOT_TOKEN not configured');
      return null;
    }

    const response = await fetch(
      `${TELEGRAM_API_URL}${config.botToken}/getUpdates`,
      {
        method: 'GET',
      }
    );

    if (!response.ok) {
      console.error('[Telegram Service] Failed to get updates');
      return null;
    }

    const data = await response.json();
    if (data.ok && data.result && data.result.length > 0) {
      // Get the latest message chat ID
      const latestUpdate = data.result[data.result.length - 1];
      const chatId = latestUpdate.message?.chat?.id;
      return chatId ? String(chatId) : null;
    }

    return null;
  } catch (error: unknown) {
    console.error('[Telegram Service] Error getting chat ID:', error);
    return null;
  }
}

