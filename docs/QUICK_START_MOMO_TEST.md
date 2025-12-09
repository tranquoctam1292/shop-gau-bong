# Quick Start: Test MoMo Payment

## 🚀 Bước 1: Setup Environment Variables

Thêm vào `.env.local`:

```env
# MoMo Sandbox (Test)
MOMO_PARTNER_CODE=your_partner_code
MOMO_ACCESS_KEY=your_access_key
MOMO_SECRET_KEY=your_secret_key
MOMO_ENV=sandbox
```

**Lấy credentials từ:**
- Đăng ký tại: https://business.momo.vn/
- Hoặc dùng test credentials từ MoMo documentation

## 🧪 Bước 2: Start Dev Server

```bash
npm run dev
```

## 📱 Bước 3: Access Test Page

Mở browser: `http://localhost:3000/test/momo`

## ✅ Bước 4: Test

### Test 1: Check Environment
- Scroll xuống "Environment Check"
- Verify các biến đã được set ✅

### Test 2: Test API Call
1. Click "Test API Call"
2. Xem kết quả:
   - ✅ Success: Có `payUrl` hoặc `deeplink`
   - ❌ Error: Check error message

### Test 3: Test Payment Component
1. Scroll xuống "MoMo Payment Component Test"
2. Click "Thanh toán qua MoMo"
3. Should redirect đến MoMo payment page

## 🐛 Common Issues

### "Cấu hình MoMo chưa được thiết lập"
→ Check `.env.local` có đủ 4 biến: `MOMO_PARTNER_CODE`, `MOMO_ACCESS_KEY`, `MOMO_SECRET_KEY`, `MOMO_ENV`

### "Invalid signature"
→ Verify `MOMO_SECRET_KEY` đúng

### Payment redirect không hoạt động
→ Check return URL là absolute URL (http://localhost:3000/...)

## 📚 Full Documentation

Xem `docs/TEST_MOMO_PAYMENT.md` để biết chi tiết.

