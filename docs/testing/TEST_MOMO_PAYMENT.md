# Test MoMo Payment Integration

## 🎯 Mục đích

Test page và hướng dẫn để verify MoMo Payment Integration hoạt động đúng.

## 📋 Prerequisites

### 1. MoMo Account Setup

1. **Đăng ký tài khoản MoMo Business:**
   - Truy cập: https://business.momo.vn/
   - Đăng ký tài khoản doanh nghiệp
   - Hoàn tất verification process

2. **Lấy thông tin API:**
   - Partner Code
   - Access Key
   - Secret Key
   - Public Key (nếu cần)

3. **Cấu hình URLs:**
   - Return URL: `https://yourdomain.com/test/momo?status=success`
   - Notify URL (Webhook): `https://yourdomain.com/api/payment/webhook/momo`

### 2. Environment Variables

Thêm vào `.env.local`:

```env
# MoMo Configuration
MOMO_PARTNER_CODE=your_partner_code
MOMO_ACCESS_KEY=your_access_key
MOMO_SECRET_KEY=your_secret_key
MOMO_ENV=sandbox

# Public (optional, for client-side checks)
NEXT_PUBLIC_MOMO_PARTNER_CODE=your_partner_code
NEXT_PUBLIC_MOMO_ACCESS_KEY=your_access_key
NEXT_PUBLIC_MOMO_ENV=sandbox
```

**⚠️ Lưu ý:** `MOMO_SECRET_KEY` KHÔNG nên expose qua `NEXT_PUBLIC_*` vì security reasons.

## 🧪 Test Steps

### Step 1: Access Test Page

1. Start dev server: `npm run dev`
2. Navigate to: `http://localhost:3000/test/momo`
3. Verify test page loads correctly

### Step 2: Check Environment Variables

1. Scroll to "Environment Check" section
2. Verify:
   - ✅ MOMO_PARTNER_CODE: Set
   - ✅ MOMO_ACCESS_KEY: Set
   - ⚠️ MOMO_SECRET_KEY: Should be set (server-side only, not visible here)

### Step 3: Test API Call

1. **Configure test data:**
   - Order ID: Auto-generated (có thể thay đổi)
   - Amount: 10000 VND (test amount)
   - Return URL: Auto-filled
   - Notify URL: Auto-filled

2. **Click "Test API Call"**
   - Should see loading state
   - Wait for response

3. **Verify response:**
   - ✅ Success: Should see `payUrl`, `deeplink`, or `qrCodeUrl`
   - ❌ Error: Check error message

### Step 4: Test Payment Component

1. **Scroll to "MoMo Payment Component Test"**
2. **Click "Thanh toán qua MoMo"**
   - Should redirect to MoMo payment page
   - Or show QR code if available

3. **Complete payment in MoMo:**
   - Use MoMo test account
   - Complete payment
   - Should redirect back to return URL

### Step 5: Test Webhook

1. **Check webhook endpoint:**
   - URL: `http://localhost:3000/api/payment/webhook/momo`
   - Method: POST
   - Should return: `{ message: 'MoMo Webhook Endpoint', status: 'active' }`

2. **Test webhook với MoMo:**
   - MoMo sẽ gửi POST request sau khi payment
   - Check server logs để verify
   - Verify signature validation

## 🔍 Test Cases

### Test Case 1: API Call Success
- **Input:** Valid orderId, amount, URLs
- **Expected:** Returns `payUrl` or `deeplink`
- **Status:** ✅/❌

### Test Case 2: API Call Error (Missing Config)
- **Input:** Missing environment variables
- **Expected:** Returns error "Cấu hình MoMo chưa được thiết lập"
- **Status:** ✅/❌

### Test Case 3: Payment Redirect
- **Input:** Valid payment request
- **Expected:** Redirects to MoMo payment page
- **Status:** ✅/❌

### Test Case 4: Webhook Verification
- **Input:** Valid MoMo callback
- **Expected:** Signature verified, order updated
- **Status:** ✅/❌

### Test Case 5: Payment Success Flow
- **Input:** Complete payment in MoMo
- **Expected:** Redirects to return URL with success status
- **Status:** ✅/❌

## 🐛 Troubleshooting

### Error: "Cấu hình MoMo chưa được thiết lập"
- **Cause:** Missing environment variables
- **Fix:** Add `MOMO_PARTNER_CODE`, `MOMO_ACCESS_KEY`, `MOMO_SECRET_KEY` to `.env.local`

### Error: "Invalid signature"
- **Cause:** Signature creation incorrect
- **Fix:** Check `createMoMoSignature()` function, verify secret key

### Error: "API error: 401"
- **Cause:** Invalid credentials
- **Fix:** Verify Partner Code, Access Key, Secret Key from MoMo dashboard

### Payment redirect không hoạt động
- **Cause:** Return URL không đúng format
- **Fix:** Ensure return URL is absolute URL (https://...)

### Webhook không nhận được
- **Cause:** Webhook URL không accessible từ internet
- **Fix:** 
  - Use ngrok for local development: `ngrok http 3000`
  - Update notify URL trong MoMo dashboard
  - Or deploy to staging server

## 📝 Test Checklist

- [ ] Test page loads correctly
- [ ] Environment variables configured
- [ ] API call returns success
- [ ] Payment component renders
- [ ] Payment redirect works
- [ ] Webhook endpoint accessible
- [ ] Signature verification works
- [ ] Payment success flow complete
- [ ] Error handling works

## 🚀 Next Steps

Sau khi test thành công:

1. **Switch to Production:**
   - Update `MOMO_ENV=production`
   - Update credentials với production keys
   - Update return/notify URLs

2. **Integrate vào Checkout:**
   - Verify MoMoPayment component trong checkout flow
   - Test end-to-end payment flow

3. **Monitor:**
   - Check webhook logs
   - Monitor payment success rate
   - Handle edge cases

## 📚 References

- MoMo Developers: https://developers.momo.vn/
- MoMo API Documentation: https://developers.momo.vn/v3/docs/payment/
- Test Environment: https://test-payment.momo.vn/

