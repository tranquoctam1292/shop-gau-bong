/**
 * Email Service
 * 
 * Service để gửi email notifications sử dụng Resend API
 */

import { Resend } from 'resend';
import { SITE_CONFIG } from '@/lib/constants/config';

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Email configuration
 */
export const EMAIL_CONFIG = {
  from: process.env.EMAIL_FROM || `Shop Gấu Bông <noreply@${process.env.NEXT_PUBLIC_SITE_URL?.replace(/^https?:\/\//, '') || 'shop-gaubong.com'}>`,
  adminEmail: process.env.ADMIN_EMAIL || SITE_CONFIG.email,
  replyTo: process.env.EMAIL_REPLY_TO || SITE_CONFIG.email,
} as const;

/**
 * Send email notification về đơn hàng mới cho admin
 */
export async function sendNewOrderNotificationEmail(
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
      ward?: string;
      district?: string;
      province?: string;
      postcode?: string;
      phone?: string;
    };
    createdAt: Date;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate API key
    if (!process.env.RESEND_API_KEY) {
      console.error('[Email Service] RESEND_API_KEY not configured');
      return { success: false, error: 'Email service not configured' };
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
      if (address.ward) parts.push(address.ward);
      if (address.district) parts.push(address.district);
      if (address.province) parts.push(address.province);
      if (address.postcode) parts.push(`Mã bưu điện: ${address.postcode}`);
      
      return parts.length > 0 ? parts.join(', ') : 'Chưa có địa chỉ';
    };

    // Build order items HTML
    const itemsHtml = orderData.items
      .map(
        (item) => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${item.productName}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatCurrency(item.price)}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: bold;">${formatCurrency(item.total)}</td>
      </tr>
    `
      )
      .join('');

    // Email HTML template
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Đơn hàng mới - ${orderData.orderNumber}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">🧸 Đơn hàng mới</h1>
  </div>
  
  <div style="background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none;">
    <p style="font-size: 16px; margin-top: 0;">Xin chào,</p>
    <p>Bạn có một đơn hàng mới cần xử lý:</p>
    
    <div style="background: white; padding: 16px; border-radius: 8px; margin: 20px 0; border: 1px solid #e5e7eb;">
      <h2 style="margin-top: 0; color: #667eea; font-size: 20px;">📦 Thông tin đơn hàng</h2>
      <p style="margin: 8px 0;"><strong>Mã đơn hàng:</strong> ${orderData.orderNumber}</p>
      <p style="margin: 8px 0;"><strong>Ngày đặt:</strong> ${formatDate(orderData.createdAt)}</p>
      <p style="margin: 8px 0;"><strong>Tổng tiền:</strong> <span style="color: #dc2626; font-size: 18px; font-weight: bold;">${formatCurrency(orderData.grandTotal)}</span></p>
      <p style="margin: 8px 0;"><strong>Phương thức thanh toán:</strong> ${orderData.paymentMethodTitle}</p>
    </div>
    
    <div style="background: white; padding: 16px; border-radius: 8px; margin: 20px 0; border: 1px solid #e5e7eb;">
      <h2 style="margin-top: 0; color: #667eea; font-size: 20px;">👤 Thông tin khách hàng</h2>
      <p style="margin: 8px 0;"><strong>Tên:</strong> ${orderData.customerName}</p>
      <p style="margin: 8px 0;"><strong>Email:</strong> <a href="mailto:${orderData.customerEmail}" style="color: #667eea;">${orderData.customerEmail}</a></p>
      ${orderData.customerPhone ? `<p style="margin: 8px 0;"><strong>Điện thoại:</strong> <a href="tel:${orderData.customerPhone}" style="color: #667eea;">${orderData.customerPhone}</a></p>` : ''}
      <p style="margin: 8px 0;"><strong>Địa chỉ giao hàng:</strong><br>${formatAddress(orderData.shippingAddress)}</p>
    </div>
    
    <div style="background: white; padding: 16px; border-radius: 8px; margin: 20px 0; border: 1px solid #e5e7eb;">
      <h2 style="margin-top: 0; color: #667eea; font-size: 20px;">🛍️ Sản phẩm đã đặt</h2>
      <table style="width: 100%; border-collapse: collapse; margin-top: 12px;">
        <thead>
          <tr style="background: #f3f4f6;">
            <th style="padding: 8px; text-align: left; border-bottom: 2px solid #e5e7eb;">Sản phẩm</th>
            <th style="padding: 8px; text-align: center; border-bottom: 2px solid #e5e7eb;">SL</th>
            <th style="padding: 8px; text-align: right; border-bottom: 2px solid #e5e7eb;">Đơn giá</th>
            <th style="padding: 8px; text-align: right; border-bottom: 2px solid #e5e7eb;">Thành tiền</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${SITE_CONFIG.url}/admin/orders/${orderData.orderNumber}" 
         style="display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
        Xem chi tiết đơn hàng
      </a>
    </div>
    
    <p style="color: #6b7280; font-size: 14px; margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 20px;">
      Email này được gửi tự động từ hệ thống <strong>${SITE_CONFIG.name}</strong>.<br>
      Vui lòng không trả lời email này.
    </p>
  </div>
</body>
</html>
    `.trim();

    // Plain text version
    const text = `
Đơn hàng mới - ${orderData.orderNumber}

Thông tin đơn hàng:
- Mã đơn hàng: ${orderData.orderNumber}
- Ngày đặt: ${formatDate(orderData.createdAt)}
- Tổng tiền: ${formatCurrency(orderData.grandTotal)}
- Phương thức thanh toán: ${orderData.paymentMethodTitle}

Thông tin khách hàng:
- Tên: ${orderData.customerName}
- Email: ${orderData.customerEmail}
${orderData.customerPhone ? `- Điện thoại: ${orderData.customerPhone}` : ''}
- Địa chỉ: ${formatAddress(orderData.shippingAddress)}

Sản phẩm:
${orderData.items.map((item) => `- ${item.productName} x${item.quantity} = ${formatCurrency(item.total)}`).join('\n')}

Xem chi tiết: ${SITE_CONFIG.url}/admin/orders/${orderData.orderNumber}
    `.trim();

    // Send email
    const { data, error } = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to: EMAIL_CONFIG.adminEmail,
      replyTo: EMAIL_CONFIG.replyTo,
      subject: `🧸 Đơn hàng mới - ${orderData.orderNumber}`,
      html,
      text,
    });

    if (error) {
      console.error('[Email Service] Failed to send email:', error);
      return { success: false, error: error.message || 'Failed to send email' };
    }

    console.log('[Email Service] Email sent successfully:', data?.id);
    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[Email Service] Error sending email:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

