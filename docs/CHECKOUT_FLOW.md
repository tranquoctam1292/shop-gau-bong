# Checkout Flow - Tóm tắt

## ✅ Đã hoàn thành

### 1. Checkout Page (`app/(shop)/checkout/page.tsx`)
- ✅ Multi-step form (3 steps):
  - Step 1: Customer Information
  - Step 2: Shipping Address
  - Step 3: Payment Method & Review
- ✅ Order Summary sidebar với cart items
- ✅ Shipping weight calculation
- ✅ Form validation
- ✅ Error handling

### 2. Checkout Hook (`lib/hooks/useCheckout.ts`)
- ✅ Form data management
- ✅ Order submission logic
- ✅ Integration với `createOrder` mutation
- ✅ Cart clearing sau khi order thành công
- ✅ Redirect to confirmation page

### 3. Order Confirmation Page
- ✅ Success message
- ✅ Order number display
- ✅ Next steps information
- ✅ Navigation buttons

### 4. GraphQL Integration
- ✅ `CreateOrder` mutation
- ✅ Order data structure
- ✅ Error handling

## 📋 Checkout Flow Steps

### Step 1: Customer Information
- First Name *
- Last Name *
- Email *
- Phone *

### Step 2: Shipping Address
- Address 1 *
- Address 2 (optional)
- City *
- Postcode *
- Country * (default: VN)
- Option: Same as billing address

### Step 3: Payment & Review
- Payment Method:
  - Chuyển khoản ngân hàng (bacs) - VietQR
  - Thanh toán khi nhận hàng (cod)
  - Ví MoMo (momo)
- Customer Note (optional)
- Order Review
- Submit Order

## 🔄 Order Creation Flow

1. User fills checkout form
2. Submit order → `useCheckout.submitOrder()`
3. Build `CreateOrderInput` from form data + cart items
4. Call `createOrder` GraphQL mutation
5. On success:
   - Clear cart
   - Redirect to `/order-confirmation?orderId={orderId}`
6. On error:
   - Display error message
   - Keep form data

## 📝 Order Input Structure

```typescript
{
  customerId?: number, // If user is logged in
  billing: {
    firstName, lastName, email, phone,
    address1, address2, city, postcode, country
  },
  shipping: {
    firstName, lastName,
    address1, address2, city, postcode, country
  },
  lineItems: [
    { productId: number, quantity: number }
  ],
  paymentMethod: 'bacs' | 'cod' | 'momo',
  shippingLines?: [...],
  customerNote?: string
}
```

## 🚧 Cần hoàn thiện

- [ ] Form validation với Zod
- [ ] Auto-fill customer info nếu đã login
- [ ] Shipping cost calculation (tích hợp API vận chuyển)
- [ ] Payment gateway integration (VietQR, MoMo)
- [ ] Order tracking
- [ ] Email notification (tự động từ WooCommerce)

## 🧪 Testing Checklist

- [ ] Test checkout flow với empty cart (redirect)
- [ ] Test form validation
- [ ] Test order creation
- [ ] Test error handling
- [ ] Test với logged in user
- [ ] Test với guest user
- [ ] Test different payment methods
- [ ] Test order confirmation page

