# ⚡ Phase 3 Quick Test Guide

## 🎯 Quick Test Steps

### Step 1: Test Order Creation (5 phút)

1. **Add product to cart:**
   - Mở `http://localhost:3000/products`
   - Click vào một product
   - Click "Thêm vào giỏ"
   - Verify cart icon updates

2. **Go to checkout:**
   - Click cart icon → "Thanh toán"
   - Hoặc navigate to `http://localhost:3000/checkout`

3. **Fill form:**
   - Step 1: Fill customer info (Họ, Tên, Email, Phone)
   - Step 2: Fill shipping address (Địa chỉ, Thành phố, Mã bưu điện)
   - Step 3: Select payment method (COD)
   - Click "Đặt hàng"

4. **Verify:**
   - [ ] Loading overlay hiển thị
   - [ ] Redirect to order confirmation page
   - [ ] Order number hiển thị
   - [ ] Cart cleared

### Step 2: Test Order Confirmation (2 phút)

1. **Verify order details:**
   - [ ] Order number hiển thị
   - [ ] Total amount hiển thị đúng
   - [ ] Payment component hiển thị (COD)

2. **Check WooCommerce admin:**
   - [ ] Order created trong WooCommerce
   - [ ] Order status = "Pending"
   - [ ] Billing address đúng
   - [ ] Line items đúng

### Step 3: Test Invoice Download (1 phút)

1. **Download invoice:**
   - Navigate to `/api/invoice/[orderId]` (replace với actual order ID)
   - Hoặc click "Tải hóa đơn" button (nếu có)

2. **Verify PDF:**
   - [ ] PDF downloads
   - [ ] PDF contains order info
   - [ ] PDF formatting OK

### Step 4: Test API Routes (2 phút)

1. **Test Orders API:**
   ```
   GET http://localhost:3000/api/woocommerce/orders?per_page=5
   ```
   - [ ] Response 200
   - [ ] Has `orders` array

2. **Test Single Order API:**
   ```
   GET http://localhost:3000/api/woocommerce/orders/[orderId]
   ```
   - [ ] Response 200
   - [ ] Has `order` object

### Step 5: Check Console (1 phút)

1. **Open DevTools (F12)**
2. **Console tab:**
   - [ ] No errors
   - [ ] Warnings OK

3. **Network tab:**
   - [ ] API requests 200
   - [ ] No CORS errors

## ✅ Quick Pass Criteria

- [ ] Order creation works
- [ ] Order confirmation displays
- [ ] Invoice downloads
- [ ] API routes work
- [ ] No console errors

## 🐛 If Issues Found

1. **Order creation fails:**
   - Check WooCommerce REST API credentials
   - Check API key permissions
   - Check console for errors

2. **Order not found:**
   - Verify order ID
   - Check order in WooCommerce admin

3. **PDF fails:**
   - Check order data format
   - Check console for errors

## 📝 Test Result

```
✅ All tests pass → Ready for Phase 4
❌ Issues found → Fix issues first
```

