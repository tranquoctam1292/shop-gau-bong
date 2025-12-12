# 📦 Order Management System Schema

**Last Updated:** 2025-01-XX  
**Status:** ✅ Complete

---

## 🗄️ Order Collections

### 1. Orders Collection

```typescript
interface MongoOrder {
  _id: ObjectId;
  orderNumber: string;              // Unique order number (e.g., "ORD-2025-001")
  userId?: string;                  // User ID (if logged in, null for guest)
  
  // Customer Info
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  
  // Status
  status: 'pending' | 'awaiting_payment' | 'confirmed' | 'processing' | 'shipping' | 'completed' | 'cancelled' | 'refunded' | 'failed';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentMethod: 'cod' | 'vietqr' | 'momo' | 'bank_transfer';
  channel?: 'website' | 'phone' | 'facebook' | 'zalo';
  
  // Addresses
  shippingAddress?: {
    firstName?: string;
    lastName?: string;
    address1: string;
    address2?: string;
    ward?: string;
    district?: string;
    province?: string;
    postcode?: string;
    country?: string;
    phone?: string;
  };
  shipping?: {                      // Alternative structure (backward compatibility)
    address1: string;
    ward?: string;
    district?: string;
    province?: string;
    phone?: string;
  };
  
  // Totals
  subtotal: number;                 // Sum of items
  shippingTotal: number;            // Shipping cost
  taxTotal: number;                 // Tax amount
  discountTotal: number;            // Discount from coupon
  grandTotal: number;                // Final total (subtotal + shipping + tax - discount)
  total: number;                     // Alias for grandTotal (backward compatibility)
  currency: string;                 // Default: 'VND'
  
  // Coupon
  couponCode?: string;
  
  // Notes
  customerNote?: string;
  adminNote?: string;
  
  // Cancellation
  cancelledReason?: string;
  
  // Tracking
  trackingNumber?: string;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  paidAt?: Date;
  completedAt?: Date;
}
```

**Indexes:**
- `orderNumber` (unique)
- `status`
- `userId`
- `customerEmail`
- `createdAt`
- `paymentStatus`
- `channel`

---

### 2. Order Items Collection

**Important:** Order items store **snapshot data** at the time of order creation. Do not reference current product data.

```typescript
interface MongoOrderItem {
  _id: ObjectId;
  orderId: string;                  // Order ID (ObjectId as string)
  productId: string;                // Product ID (ObjectId as string)
  variationId?: string;             // Variation ID (if variable product)
  
  // Snapshot Data (at time of order)
  productName: string;             // Product name snapshot
  productSku?: string;              // SKU snapshot
  productImage?: string;            // Product image URL snapshot
  price: number;                    // Unit price at time of order
  quantity: number;                 // Quantity ordered
  subtotal: number;                 // price * quantity
  total: number;                     // Same as subtotal (for compatibility)
  
  // Attributes snapshot
  attributes?: {
    size?: string;
    color?: string;
    [key: string]: string | undefined;
  };
  
  // Dimensions (for shipping calculation)
  length?: number;
  width?: number;
  height?: number;
  weight?: number;
  
  createdAt: Date;
}
```

**Indexes:**
- `orderId`
- `productId`

---

### 3. Order Histories Collection (Audit Log)

```typescript
interface MongoOrderHistory {
  _id: ObjectId;
  orderId: string;                  // Order ID (ObjectId as string)
  action: 'created' | 'status_changed' | 'payment_status_changed' | 'item_added' | 'item_updated' | 'item_removed' | 'address_updated' | 'coupon_applied' | 'coupon_removed' | 'cancelled' | 'refund_processed' | 'shipment_created';
  actorType: 'admin' | 'customer' | 'system';
  actorId?: string;                 // Admin user ID or customer email
  actorName?: string;                // Admin name or customer name
  message: string;                   // Human-readable message
  metadata?: {
    // Status change
    oldStatus?: string;
    newStatus?: string;
    oldValue?: any;
    newValue?: any;
    
    // Item changes
    itemId?: string;
    productId?: string;
    quantity?: number;
    
    // Refund
    refundId?: string;
    amount?: number;
    type?: 'full' | 'partial';
    
    // Shipment
    trackingNumber?: string;
    carrier?: string;
    
    // Other metadata
    [key: string]: any;
  };
  createdAt: Date;
}
```

**Indexes:**
- `orderId`
- `createdAt`
- `actorId`
- `action`

---

### 4. Shipments Collection

```typescript
interface MongoShipment {
  _id: ObjectId;
  orderId: string;                  // Order ID (ObjectId as string)
  carrier: 'ghtk' | 'ghn' | 'custom';
  trackingNumber: string;           // Unique tracking number
  weight?: number;                  // Weight in kg
  estimatedDeliveryDate?: Date;
  carrierService?: string;          // e.g., "Standard", "Express"
  carrierTrackingUrl?: string;      // URL to carrier tracking page
  createdAt: Date;
  updatedAt: Date;
}
```

**Indexes:**
- `orderId` (unique - one shipment per order)
- `trackingNumber` (unique)
- `carrier`
- `createdAt`

---

### 5. Refunds Collection

```typescript
interface MongoRefund {
  _id: ObjectId;
  orderId: string;                  // Order ID (ObjectId as string)
  amount: number;                    // Refund amount
  reason?: string;                   // Refund reason
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  type: 'full' | 'partial';
  transactionId?: string;            // Payment gateway transaction ID
  processedBy?: string;              // Admin user ID or email
  createdAt: Date;
  updatedAt: Date;
}
```

**Indexes:**
- `orderId`
- `status`
- `createdAt`
- Compound: `orderId + status`

---

## 🔄 Order State Machine

**Valid Status Transitions:**

```
pending → confirmed, cancelled, awaiting_payment
awaiting_payment → confirmed, failed, cancelled
confirmed → processing, cancelled
processing → shipping, cancelled
shipping → completed, failed
completed → refunded
cancelled → (terminal)
refunded → (terminal)
failed → cancelled, refunded
```

**Validation:** Use `validateTransition()` from `lib/utils/orderStateMachine.ts`

---

## 📡 Order API Routes

### Public Routes (`/api/cms/orders`)
- `POST /api/cms/orders` - Create order (checkout)

### Admin Routes (`/api/admin/orders`)
- `GET /api/admin/orders` - List orders (filters, pagination, search)
- `GET /api/admin/orders/[id]` - Get single order
- `PUT /api/admin/orders/[id]` - Update order (status, payment status)
- `GET /api/admin/orders/[id]/history` - Get order history
- `PATCH /api/admin/orders/[id]/items` - Edit order items
- `PATCH /api/admin/orders/[id]/shipping` - Update shipping address
- `PATCH /api/admin/orders/[id]/coupon` - Apply/remove coupon
- `POST /api/admin/orders/[id]/shipment` - Create shipment
- `POST /api/admin/orders/[id]/refund` - Process refund
- `GET /api/admin/orders/[id]/refund` - Get refund history
- `POST /api/admin/orders/bulk-approve` - Bulk approve orders
- `POST /api/admin/orders/bulk-update-status` - Bulk update status
- `POST /api/admin/orders/bulk-print` - Generate shipping labels
- `GET /api/admin/orders/export` - Export to CSV
- `POST /api/admin/orders/auto-cancel` - Auto-cancel pending orders

---

## 🔐 Inventory Management

**Stock Fields in Products:**
- `stockQuantity` - Total stock (simple products)
- `reservedQuantity` - Reserved stock (simple products)
- `variants[].stock` - Variant stock (variable products)
- `variants[].reservedQuantity` - Reserved variant stock

**Operations:**
- `reserveStock()` - Reserve stock when order is pending
- `deductStock()` - Deduct stock when order is confirmed
- `releaseStock()` - Release reserved stock when order is cancelled

---

## 📝 Notes

- **Order Items are Snapshot Data:** Always use data from `orderItems` collection, not current product data
- **Order History is Immutable:** Never modify history entries, only create new ones
- **Status Transitions are Strict:** Always validate using `orderStateMachine`
- **Inventory is Real-time:** Stock is updated immediately on order status changes

