# ⚙️ Vercel Environment Variables Setup cho Notifications

**Ngày tạo:** 2025-01-XX  
**Mục đích:** Hướng dẫn cấu hình environment variables trên Vercel cho Email và Telegram notifications

---

## 📋 Tổng Quan

Khi deploy lên Vercel, bạn cần thêm các environment variables cho notification services (Email và Telegram) vào Vercel dashboard.

---

## 🔧 Các Environment Variables Cần Thiết

### 1. Email Notification (Resend)

```env
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=Shop Gấu Bông <noreply@lienhe.teddyland.vn>
ADMIN_EMAIL=admin@lienhe.teddyland.vn
EMAIL_REPLY_TO=support@lienhe.teddyland.vn
```

### 2. Telegram Notification

```env
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_CHAT_ID=your_chat_id_here
```

### 3. Site Configuration (Đã có sẵn)

```env
NEXT_PUBLIC_SITE_URL=https://teddyland.vn
```

---

## 🚀 Cách Thêm vào Vercel

### Bước 1: Truy cập Vercel Dashboard

1. Đăng nhập vào [Vercel Dashboard](https://vercel.com/dashboard)
2. Chọn project của bạn
3. Vào **Settings** → **Environment Variables**

### Bước 2: Thêm Environment Variables

Thêm từng biến một:

#### Email Configuration

1. **RESEND_API_KEY**
   - Key: `RESEND_API_KEY`
   - Value: `re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx` (từ Resend dashboard)
   - Environment: `Production`, `Preview`, `Development` (chọn tất cả)

2. **EMAIL_FROM**
   - Key: `EMAIL_FROM`
   - Value: `Shop Gấu Bông <noreply@lienhe.teddyland.vn>`
   - Environment: `Production`, `Preview`, `Development`

3. **ADMIN_EMAIL**
   - Key: `ADMIN_EMAIL`
   - Value: `admin@lienhe.teddyland.vn` (hoặc email thật của bạn)
   - Environment: `Production`, `Preview`, `Development`

4. **EMAIL_REPLY_TO**
   - Key: `EMAIL_REPLY_TO`
   - Value: `support@lienhe.teddyland.vn`
   - Environment: `Production`, `Preview`, `Development`

#### Telegram Configuration

5. **TELEGRAM_BOT_TOKEN**
   - Key: `TELEGRAM_BOT_TOKEN`
   - Value: `8321066924:AAGBKGP7H0TwBFpHnaVvNih_xxDWx1Z0juA` (bot token của bạn)
   - Environment: `Production`, `Preview`, `Development`

6. **TELEGRAM_CHAT_ID**
   - Key: `TELEGRAM_CHAT_ID`
   - Value: `1899159757` (chat ID của bạn)
   - Environment: `Production`, `Preview`, `Development`

#### Site URL (Nếu chưa có)

7. **NEXT_PUBLIC_SITE_URL**
   - Key: `NEXT_PUBLIC_SITE_URL`
   - Value: `https://teddyland.vn` (hoặc domain production của bạn)
   - Environment: `Production`, `Preview`, `Development`

---

## ✅ Checklist

Sau khi thêm, đảm bảo có đủ các biến sau:

- [ ] `RESEND_API_KEY`
- [ ] `EMAIL_FROM`
- [ ] `ADMIN_EMAIL`
- [ ] `EMAIL_REPLY_TO`
- [ ] `TELEGRAM_BOT_TOKEN`
- [ ] `TELEGRAM_CHAT_ID`
- [ ] `NEXT_PUBLIC_SITE_URL` (nếu chưa có)

---

## 🔄 Redeploy

Sau khi thêm environment variables:

1. **Option 1: Redeploy tự động**
   - Vercel sẽ tự động redeploy khi bạn push code mới lên GitHub

2. **Option 2: Redeploy thủ công**
   - Vào **Deployments** tab
   - Click vào deployment mới nhất
   - Click **Redeploy** (hoặc tạo deployment mới)

---

## 🧪 Testing trên Vercel

Sau khi deploy, test notification:

1. **Tạo đơn hàng test** từ production site
2. **Kiểm tra email** tại `ADMIN_EMAIL`
3. **Kiểm tra Telegram** notification
4. **Kiểm tra logs** trong Vercel dashboard nếu có lỗi

---

## ⚠️ Lưu Ý Quan Trọng

### 1. Environment Scope

- **Production**: Chỉ áp dụng cho production deployments
- **Preview**: Áp dụng cho preview deployments (pull requests)
- **Development**: Áp dụng cho local development (nếu dùng Vercel CLI)

**Khuyến nghị:** Chọn cả 3 environments để đảm bảo notifications hoạt động ở mọi môi trường.

### 2. Security

- **KHÔNG** commit environment variables vào Git
- Chỉ thêm vào Vercel dashboard
- Rotate keys định kỳ nếu cần

### 3. Sensitive Values

- `RESEND_API_KEY`: Bảo mật, không share
- `TELEGRAM_BOT_TOKEN`: Bảo mật, không share
- `TELEGRAM_CHAT_ID`: Private, không share

---

## 🔍 Troubleshooting

### Notification không hoạt động trên Vercel

1. **Kiểm tra environment variables:**
   - Vào Vercel dashboard → Settings → Environment Variables
   - Verify tất cả biến đã được thêm đúng

2. **Kiểm tra logs:**
   - Vào Vercel dashboard → Deployments → Click vào deployment
   - Xem **Logs** tab để tìm lỗi
   - Tìm `[Email Service]` hoặc `[Telegram Service]` messages

3. **Kiểm tra environment scope:**
   - Đảm bảo biến được thêm cho đúng environment (Production/Preview)

4. **Redeploy:**
   - Sau khi thêm/sửa environment variables, cần redeploy

### Lỗi "API key not found"

- **Nguyên nhân:** Environment variable chưa được thêm hoặc sai tên
- **Giải pháp:** 
  1. Kiểm tra tên biến trong Vercel dashboard
  2. Đảm bảo không có khoảng trắng thừa
  3. Redeploy sau khi sửa

---

## 📊 So Sánh Local vs Vercel

| Biến | Local (.env.local) | Vercel Dashboard |
|------|-------------------|------------------|
| `RESEND_API_KEY` | ✅ Có | ✅ Cần thêm |
| `EMAIL_FROM` | ✅ Có | ✅ Cần thêm |
| `ADMIN_EMAIL` | ✅ Có | ✅ Cần thêm |
| `EMAIL_REPLY_TO` | ✅ Có | ✅ Cần thêm |
| `TELEGRAM_BOT_TOKEN` | ✅ Có | ✅ Cần thêm |
| `TELEGRAM_CHAT_ID` | ✅ Có | ✅ Cần thêm |
| `NEXT_PUBLIC_SITE_URL` | ✅ Có | ⚠️ Có thể đã có |

---

## 🚀 Quick Setup Script

Bạn có thể copy các giá trị từ `.env.local` và paste vào Vercel dashboard:

```env
# Copy các dòng này và thêm vào Vercel
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=Shop Gấu Bông <noreply@lienhe.teddyland.vn>
ADMIN_EMAIL=admin@lienhe.teddyland.vn
EMAIL_REPLY_TO=support@lienhe.teddyland.vn
TELEGRAM_BOT_TOKEN=8321066924:AAGBKGP7H0TwBFpHnaVvNih_xxDWx1Z0juA
TELEGRAM_CHAT_ID=1899159757
NEXT_PUBLIC_SITE_URL=https://teddyland.vn
```

**Lưu ý:** Thay các giá trị placeholder bằng giá trị thật của bạn.

---

## 📚 Resources

- **Vercel Environment Variables:** [https://vercel.com/docs/concepts/projects/environment-variables](https://vercel.com/docs/concepts/projects/environment-variables)
- **Vercel Dashboard:** [https://vercel.com/dashboard](https://vercel.com/dashboard)

---

**END OF GUIDE**

