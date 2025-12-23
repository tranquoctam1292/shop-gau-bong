# 🧪 Hướng dẫn Test Order API với Authentication

## Prerequisites

1. **Dev server đang chạy:**
   ```bash
   npm run dev
   ```

2. **Admin user đã được tạo:**
   ```bash
   npm run create:admin-user
   ```
   - Email: `admin@example.com`
   - Password: `admin123`

## Cách Test

### Option 1: Test qua Browser (Recommended)

1. **Login vào Admin Panel:**
   - Mở browser: `http://localhost:3000/admin/login`
   - Login với credentials: `admin@example.com` / `admin123`

2. **Test Order Creation:**
   - Tạo order qua checkout flow hoặc API
   - Verify order được tạo với status `pending`

3. **Test Status Transitions:**
   - Vào `/admin/orders/[orderId]`
   - Thử update status:
     - ✅ Valid: `pending -> confirmed -> processing -> shipping -> completed`
     - ❌ Invalid: `pending -> completed` (should fail)
     - ❌ Invalid: `completed -> pending` (should fail)

4. **Verify Order History:**
   - Check `/api/admin/orders/[orderId]/history`
   - Verify history entries được tạo cho mỗi status change

### Option 2: Test với Postman/Insomnia

1. **Login và lấy session cookie:**
   ```
   POST http://localhost:3000/api/auth/callback/credentials
   Content-Type: application/x-www-form-urlencoded
   
   email=admin@example.com&password=admin123&redirect=false&json=true
   ```
   - Copy `next-auth.session-token` cookie từ response

2. **Test Order Update API:**
   ```
   PUT http://localhost:3000/api/admin/orders/[orderId]
   Content-Type: application/json
   Cookie: next-auth.session-token=[your-token]
   
   {
     "status": "confirmed"
   }
   ```

3. **Test Order History API:**
   ```
   GET http://localhost:3000/api/admin/orders/[orderId]/history
   Cookie: next-auth.session-token=[your-token]
   ```

### Option 3: Test với cURL

```bash
# 1. Login và lấy cookie
curl -X POST http://localhost:3000/api/auth/callback/credentials \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "email=admin@example.com&password=admin123&redirect=false&json=true" \
  -c cookies.txt

# 2. Create order (public endpoint, no auth needed)
curl -X POST http://localhost:3000/api/cms/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "Test Customer",
    "customerEmail": "test@example.com",
    "billing": {
      "firstName": "Test",
      "lastName": "Customer",
      "address1": "123 Test St",
      "city": "Ho Chi Minh",
      "postcode": "70000",
      "country": "VN"
    },
    "shipping": {
      "firstName": "Test",
      "lastName": "Customer",
      "address1": "123 Test St",
      "city": "Ho Chi Minh",
      "postcode": "70000",
      "country": "VN",
      "province": "Ho Chi Minh",
      "district": "District 1",
      "ward": "Ward 1"
    },
    "lineItems": [{
      "productId": "test-id",
      "productName": "Test Product",
      "quantity": 1,
      "price": 100000
    }],
    "paymentMethod": "cod",
    "paymentMethodTitle": "COD",
    "subtotal": 100000,
    "shippingTotal": 30000,
    "total": 130000
  }'

# 3. Update order status (requires auth)
curl -X PUT http://localhost:3000/api/admin/orders/[orderId] \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"status": "confirmed"}'

# 4. Get order history
curl -X GET http://localhost:3000/api/admin/orders/[orderId]/history \
  -b cookies.txt
```

## Test Cases

### ✅ Valid Transitions
- `pending -> confirmed`
- `pending -> cancelled`
- `pending -> awaiting_payment`
- `confirmed -> processing`
- `processing -> shipping`
- `shipping -> completed`
- `completed -> refunded`
- `failed -> cancelled`
- `failed -> refunded`

### ❌ Invalid Transitions (Should Return 400)
- `pending -> completed` (skip steps)
- `pending -> shipping` (skip steps)
- `shipping -> pending` (cannot go back)
- `completed -> pending` (cannot go back)
- `cancelled -> processing` (terminal state)
- `refunded -> processing` (terminal state)

## Expected Results

1. **Valid transitions:** Return 200 với updated order
2. **Invalid transitions:** Return 400 với error message
3. **Order history:** Mỗi status change tạo một history entry
4. **Payment status change:** Tạo separate history entry

## Verification

Sau mỗi test, verify:
- ✅ Order status được update đúng
- ✅ History entry được tạo với đúng action và description
- ✅ Actor information được lưu đúng (admin name, type)
- ✅ Timestamps được set đúng

