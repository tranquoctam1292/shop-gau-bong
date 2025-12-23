# 📧 Email Notification Setup Guide

**Ngày tạo:** 2025-01-XX  
**Mục đích:** Hướng dẫn cấu hình email notification cho đơn hàng mới

---

## 📋 Tổng Quan

Hệ thống sử dụng **Resend** để gửi email thông báo khi có đơn hàng mới. Email sẽ được gửi tự động đến admin khi khách hàng đặt hàng thành công.

---

## 🚀 Cài Đặt

### 1. Đăng ký tài khoản Resend

1. Truy cập [https://resend.com](https://resend.com)
2. Đăng ký tài khoản miễn phí (free tier: 3,000 emails/tháng)
3. Tạo API key trong Dashboard → API Keys

### 2. Cấu hình Domain (Optional - Khuyến nghị cho Production)

**Development:** Có thể sử dụng domain mặc định của Resend (`onboarding@resend.dev`)

**Production:** Nên verify domain của bạn:
1. Vào Dashboard → Domains
2. Thêm domain của bạn (ví dụ: `shop-gaubong.com`)
3. Thêm DNS records theo hướng dẫn
4. Verify domain

---

## ⚙️ Environment Variables

Thêm các biến môi trường sau vào file `.env.local`:

```env
# Email Service - Resend
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Email Configuration
EMAIL_FROM=Shop Gấu Bông <noreply@shop-gaubong.com>
ADMIN_EMAIL=admin@shop-gaubong.com
EMAIL_REPLY_TO=support@shop-gaubong.com

# Site URL (đã có sẵn, cần cho email template)
NEXT_PUBLIC_SITE_URL=https://shop-gaubong.com
```

### Giải thích các biến:

- **`RESEND_API_KEY`**: API key từ Resend dashboard (bắt đầu với `re_`)
- **`EMAIL_FROM`**: Email gửi đi (format: `Tên <email@domain.com>`)
  - Development: Có thể dùng `onboarding@resend.dev`
  - Production: Nên dùng domain đã verify
- **`ADMIN_EMAIL`**: Email nhận thông báo đơn hàng mới (email của admin)
- **`EMAIL_REPLY_TO`**: Email để khách hàng reply (optional)
- **`NEXT_PUBLIC_SITE_URL`**: URL website (đã có sẵn trong project)

---

## 📧 Email Template

Email notification bao gồm:

- **Subject:** `🧸 Đơn hàng mới - [ORDER_NUMBER]`
- **Nội dung:**
  - Thông tin đơn hàng (mã đơn, ngày đặt, tổng tiền, phương thức thanh toán)
  - Thông tin khách hàng (tên, email, điện thoại, địa chỉ)
  - Danh sách sản phẩm đã đặt (tên, số lượng, đơn giá, thành tiền)
  - Link xem chi tiết đơn hàng trong admin panel

### Format Email

- **HTML:** Email đẹp với styling, bảng sản phẩm
- **Plain Text:** Fallback cho email client không hỗ trợ HTML

---

## 🔧 Cách Hoạt Động

1. **Khi khách hàng đặt hàng thành công:**
   - Order được tạo trong database
   - Order history được ghi lại
   - **Email notification được gửi tự động** (non-blocking)

2. **Error Handling:**
   - Nếu email gửi thất bại, **order vẫn được tạo thành công**
   - Lỗi được log vào console để debug
   - Không ảnh hưởng đến trải nghiệm khách hàng

3. **Non-blocking:**
   - Email được gửi bất đồng bộ
   - Không làm chậm response của API
   - Order creation không phụ thuộc vào email service

---

## 🧪 Testing

### Test trong Development

1. **Setup Resend API key:**
   ```bash
   # Thêm vào .env.local
   RESEND_API_KEY=re_your_api_key_here
   ADMIN_EMAIL=your-email@example.com
   ```

2. **Test tạo đơn hàng:**
   - Tạo đơn hàng từ checkout page
   - Kiểm tra email inbox của `ADMIN_EMAIL`
   - Kiểm tra console logs để xem email status

3. **Test error handling:**
   - Tắt `RESEND_API_KEY` hoặc dùng key sai
   - Tạo đơn hàng
   - Verify order vẫn được tạo thành công
   - Kiểm tra console logs có error message

### Test trong Production

1. Verify domain trong Resend dashboard
2. Test với email thật
3. Monitor email delivery rate trong Resend dashboard

---

## 📊 Monitoring

### Resend Dashboard

- **Analytics:** Xem số lượng email đã gửi, delivery rate
- **Logs:** Xem chi tiết từng email (sent, delivered, bounced)
- **API Usage:** Monitor API usage và limits

### Application Logs

Check console logs khi tạo đơn hàng:
- `[Email Service] Email sent successfully: [email_id]` - Thành công
- `[Email Service] Failed to send email: [error]` - Thất bại
- `[Orders API] Error sending email notification: [error]` - Lỗi trong API

---

## ⚠️ Troubleshooting

### Email không được gửi

1. **Kiểm tra API key:**
   - Verify `RESEND_API_KEY` đúng format (`re_...`)
   - Check API key có active trong Resend dashboard

2. **Kiểm tra email address:**
   - Verify `ADMIN_EMAIL` là email hợp lệ
   - Check domain đã verify (nếu dùng custom domain)

3. **Kiểm tra logs:**
   - Xem console logs khi tạo đơn hàng
   - Check Resend dashboard → Logs để xem chi tiết

### Email vào Spam

1. **Verify domain:** Verify domain trong Resend dashboard
2. **SPF/DKIM records:** Đảm bảo DNS records đã được setup đúng
3. **From address:** Sử dụng domain đã verify trong `EMAIL_FROM`

### Rate Limits

Resend free tier có giới hạn:
- **3,000 emails/tháng** (free tier)
- Nếu vượt quá, cần upgrade plan

---

## 🔐 Security

1. **API Key:**
   - **KHÔNG** commit `RESEND_API_KEY` vào Git
   - Chỉ lưu trong `.env.local` (đã có trong `.gitignore`)
   - Rotate API key định kỳ

2. **Email Addresses:**
   - `ADMIN_EMAIL` nên là email riêng tư
   - Không expose trong client-side code

---

## 📝 Code Reference

### Email Service

- **File:** `lib/services/email.ts`
- **Function:** `sendNewOrderNotificationEmail()`
- **Usage:** Tự động gọi từ `app/api/cms/orders/route.ts`

### Integration Point

- **File:** `app/api/cms/orders/route.ts`
- **Location:** Sau khi order được tạo thành công (line ~332)
- **Pattern:** Non-blocking, error không fail order creation

---

## 🚀 Future Enhancements

Có thể mở rộng thêm:

1. **Email cho khách hàng:** Gửi email xác nhận đơn hàng cho khách
2. **Email templates khác:** 
   - Order status updates
   - Shipping notifications
   - Payment confirmations
3. **Email preferences:** Cho phép admin bật/tắt email notifications
4. **Multiple recipients:** Gửi email cho nhiều admin
5. **Email queue:** Queue system cho high-volume orders

---

## 📚 Resources

- **Resend Documentation:** [https://resend.com/docs](https://resend.com/docs)
- **Resend API Reference:** [https://resend.com/docs/api-reference](https://resend.com/docs/api-reference)
- **Email Best Practices:** [https://resend.com/docs/best-practices](https://resend.com/docs/best-practices)

---

**END OF GUIDE**

