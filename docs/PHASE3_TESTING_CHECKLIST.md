# ✅ Phase 3 Testing Checklist

## 🎯 Mục tiêu

Test toàn bộ order-related features sau khi migrate từ WPGraphQL sang WooCommerce REST API.

## 📋 Pre-Test Setup

### 1. Verify WooCommerce REST API
- [ ] WooCommerce REST API credentials đã được setup
- [ ] API key có Read/Write permissions
- [ ] Test script `npm run test:wordpress-api` pass

### 2. Verify Cart Functionality
- [ ] Products có thể add to cart
- [ ] Cart items hiển thị đúng
- [ ] Cart total tính đúng

## 🧪 Test Cases

### Test 1: Order Creation (Checkout Flow)

#### 1.1. Navigate to Checkout
- [ ] Mở `http://localhost:3000/cart`
- [ ] Click "Thanh toán" button
- [ ] Verify redirect to `/checkout`
- [ ] Verify checkout form hiển thị

#### 1.2. Fill Customer Information (Step 1)
- [ ] Fill "Họ" field
- [ ] Fill "Tên" field
- [ ] Fill "Email" field (valid email format)
- [ ] Fill "Số điện thoại" field
- [ ] Click "Tiếp tục" button
- [ ] Verify step 2 hiển thị

#### 1.3. Fill Shipping Address (Step 2)
- [ ] Fill "Địa chỉ" field
- [ ] Fill "Thành phố" field
- [ ] Fill "Mã bưu điện" field
- [ ] Select "Quốc gia" (default: Việt Nam)
- [ ] Verify shipping rates hiển thị (nếu có)
- [ ] Select shipping method (nếu có)
- [ ] Click "Tiếp tục" button
- [ ] Verify step 3 hiển thị

#### 1.4. Select Payment Method (Step 3)
- [ ] Select "Chuyển khoản ngân hàng (VietQR)" - `bacs`
- [ ] Select "Thanh toán khi nhận hàng (COD)" - `cod`
- [ ] Select "Ví MoMo" - `momo`
- [ ] Select "Chuyển khoản ngân hàng (thủ công)" - `bank_transfer`
- [ ] Fill "Ghi chú đơn hàng" (optional)
- [ ] Click "Đặt hàng" button

#### 1.5. Verify Order Creation
- [ ] Loading overlay hiển thị
- [ ] Order được tạo thành công
- [ ] Cart được clear
- [ ] Redirect to `/order-confirmation?orderId=XXX&paymentMethod=XXX&total=XXX`
- [ ] Verify order trong WooCommerce admin:
  - [ ] Order status = "Pending"
  - [ ] Billing address đúng
  - [ ] Shipping address đúng
  - [ ] Line items đúng
  - [ ] Payment method đúng
  - [ ] Total amount đúng

### Test 2: Order Confirmation Page

#### 2.1. Verify Order Details
- [ ] Order number hiển thị đúng
- [ ] Total amount hiển thị đúng
- [ ] Success message hiển thị
- [ ] Order date hiển thị (nếu có)

#### 2.2. Verify Payment Component
- [ ] **COD Payment:**
  - [ ] Component hiển thị khi `paymentMethod=cod`
  - [ ] Order ID hiển thị đúng
  - [ ] Amount hiển thị đúng
  - [ ] Instructions hiển thị

- [ ] **VietQR Payment:**
  - [ ] Component hiển thị khi `paymentMethod=bacs`
  - [ ] QR code hiển thị (nếu có)
  - [ ] Account info hiển thị

- [ ] **MoMo Payment:**
  - [ ] Component hiển thị khi `paymentMethod=momo`
  - [ ] Payment button hiển thị

- [ ] **Bank Transfer Payment:**
  - [ ] Component hiển thị khi `paymentMethod=bank_transfer`
  - [ ] Upload receipt option hiển thị

#### 2.3. Verify Navigation Links
- [ ] "Tiếp tục mua sắm" link hoạt động
- [ ] Link redirect to `/products`

### Test 3: Invoice Download

#### 3.1. Download Invoice
- [ ] Click "Tải hóa đơn" button (nếu có trên order confirmation page)
- [ ] Hoặc navigate to `/api/invoice/[orderId]`
- [ ] PDF file downloads
- [ ] PDF filename = `invoice-[orderNumber].pdf`

#### 3.2. Verify PDF Content
- [ ] Shop name hiển thị
- [ ] Order number hiển thị đúng
- [ ] Order date hiển thị đúng
- [ ] Billing address đầy đủ:
  - [ ] Customer name
  - [ ] Email
  - [ ] Phone
  - [ ] Address
  - [ ] City, Postcode, Country
- [ ] Shipping address đầy đủ (nếu khác billing)
- [ ] Line items table:
  - [ ] Product names
  - [ ] SKU (nếu có)
  - [ ] Quantities
  - [ ] Prices
  - [ ] Totals
- [ ] Totals section:
  - [ ] Subtotal
  - [ ] Shipping total (nếu có)
  - [ ] Tax (nếu có)
  - [ ] Total
- [ ] Payment method hiển thị
- [ ] Customer note hiển thị (nếu có)

### Test 4: Error Handling

#### 4.1. Invalid Order ID
- [ ] Navigate to `/order-confirmation?orderId=99999`
- [ ] Error message hiển thị: "Không tìm thấy đơn hàng"
- [ ] "Tiếp tục mua sắm" link hiển thị

#### 4.2. Network Error
- [ ] Disconnect internet
- [ ] Try to create order
- [ ] Error message hiển thị
- [ ] Form không bị reset

#### 4.3. Validation Errors
- [ ] Submit form với empty required fields
- [ ] Validation errors hiển thị
- [ ] Scroll to first error field
- [ ] Error messages rõ ràng

### Test 5: API Routes

#### 5.1. Test Orders API (GET)
```bash
# Test trong browser hoặc Postman
GET http://localhost:3000/api/woocommerce/orders?per_page=5
```
- [ ] Response status = 200
- [ ] Response có `orders` array
- [ ] Orders có đầy đủ fields

#### 5.2. Test Single Order API (GET)
```bash
# Replace [orderId] với actual order ID
GET http://localhost:3000/api/woocommerce/orders/[orderId]
```
- [ ] Response status = 200
- [ ] Response có `order` object
- [ ] Order có đầy đủ fields (billing, shipping, line_items, etc.)

#### 5.3. Test Create Order API (POST)
```bash
POST http://localhost:3000/api/woocommerce/orders
Content-Type: application/json

{
  "payment_method": "cod",
  "payment_method_title": "Thanh toán khi nhận hàng (COD)",
  "billing": {
    "first_name": "Test",
    "last_name": "User",
    "email": "test@example.com",
    "phone": "0123456789",
    "address_1": "123 Test Street",
    "city": "Ho Chi Minh",
    "postcode": "700000",
    "country": "VN"
  },
  "shipping": {
    "first_name": "Test",
    "last_name": "User",
    "address_1": "123 Test Street",
    "city": "Ho Chi Minh",
    "postcode": "700000",
    "country": "VN"
  },
  "line_items": [
    {
      "product_id": 91,
      "quantity": 1
    }
  ]
}
```
- [ ] Response status = 200
- [ ] Response có `order` object
- [ ] Order ID được tạo
- [ ] Order trong WooCommerce admin

#### 5.4. Test Invoice API
```bash
# Replace [orderId] với actual order ID
GET http://localhost:3000/api/invoice/[orderId]
```
- [ ] Response status = 200
- [ ] Content-Type = `application/pdf`
- [ ] PDF file downloads

### Test 6: Browser Console

#### 6.1. Check Console Errors
- [ ] Mở Browser DevTools (F12)
- [ ] Console tab:
  - [ ] No errors
  - [ ] Warnings OK (trừ hydration do extensions)

#### 6.2. Check Network Requests
- [ ] Network tab:
  - [ ] API requests thành công (200 status)
  - [ ] No CORS errors
  - [ ] Response times reasonable (< 2s)

## 🐛 Common Issues & Solutions

### Issue 1: Order Creation Fails
**Symptoms:** Error khi submit order
**Solutions:**
- Check WooCommerce REST API credentials
- Check API key permissions (Read/Write)
- Check WordPress plugin filters
- Check console for error messages

### Issue 2: Order Not Found
**Symptoms:** Order confirmation page shows "Không tìm thấy đơn hàng"
**Solutions:**
- Verify order ID trong URL
- Check order exists trong WooCommerce admin
- Check API route logs

### Issue 3: PDF Generation Fails
**Symptoms:** Invoice download fails hoặc PDF empty
**Solutions:**
- Check order data format
- Check `formatOrderForInvoiceREST()` function
- Check jsPDF library

### Issue 4: Payment Component Not Showing
**Symptoms:** Payment component không hiển thị
**Solutions:**
- Check `paymentMethod` trong URL params
- Check component props
- Check console for errors

## ✅ Pass Criteria

- [ ] Order creation works end-to-end
- [ ] Order confirmation page displays correctly
- [ ] Invoice PDF generates correctly
- [ ] All payment methods work
- [ ] Error handling works
- [ ] No console errors
- [ ] No network errors
- [ ] All API routes work

## 📝 Test Results Template

```
Date: [Date]
Tester: [Name]

Test 1: Order Creation
- Status: ✅ Pass / ❌ Fail
- Notes: [Any issues or observations]

Test 2: Order Confirmation
- Status: ✅ Pass / ❌ Fail
- Notes: [Any issues or observations]

Test 3: Invoice Download
- Status: ✅ Pass / ❌ Fail
- Notes: [Any issues or observations]

Test 4: Error Handling
- Status: ✅ Pass / ❌ Fail
- Notes: [Any issues or observations]

Test 5: API Routes
- Status: ✅ Pass / ❌ Fail
- Notes: [Any issues or observations]

Test 6: Browser Console
- Status: ✅ Pass / ❌ Fail
- Notes: [Any issues or observations]

Overall Status: ✅ Ready for Phase 4 / ❌ Needs Fixes
```

## 🚀 Next Steps

Sau khi test xong:
1. Document any issues found
2. Fix issues (nếu có)
3. Re-test fixes
4. Proceed to Phase 4: Remove GraphQL Dependencies

