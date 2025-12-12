# 📋 KẾ HOẠCH XÂY DỰNG MODULE QUẢN LÝ ĐƠN HÀNG (ORDER MANAGEMENT SYSTEM - OMS)

**Ngày tạo:** 2025-01-XX  
**Phiên bản:** 1.0  
**Trạng thái:** Planning  
**Dựa trên:** `Order_Management_System.md`

---

## 🎯 TỔNG QUAN

Xây dựng hệ thống quản lý vòng đời đơn hàng từ lúc khách đặt (Checkout) đến khi hoàn tất giao hàng (Completed) hoặc hủy/hoàn trả. Module này đóng vai trò trung tâm, kết nối Inventory (Kho), Payment (Thanh toán) và Shipping (Vận chuyển).

### Mục tiêu
- ✅ Quản lý Order State Machine nghiêm ngặt
- ✅ Advanced filtering và search
- ✅ Order editing (chỉ khi ở trạng thái Pending/Confirmed)
- ✅ Audit log (Order History) cho traceability
- ✅ Inventory reservation và release
- ✅ Integration với Payment và Shipping

### Tech Stack
- **Database:** MongoDB (collections: `orders`, `orderItems`, `orderHistories`)
- **Backend:** Next.js API Routes (`/api/admin/orders/*`)
- **Frontend:** Next.js App Router (`/app/admin/orders/*`)
- **State Management:** React Query cho data fetching
- **UI Components:** Shadcn UI + Tailwind CSS

---

## 📊 PHÂN TÍCH HIỆN TRẠNG

### ✅ Đã có sẵn
- Basic Order List page (`app/admin/orders/page.tsx`)
- Basic Order Detail page (`app/admin/orders/[id]/page.tsx`)
- Order List API (`GET /api/admin/orders`)
- Order Detail API (`GET /api/admin/orders/[id]`)
- Order Update API (`PUT /api/admin/orders/[id]`)
- Basic status update functionality

### ❌ Chưa có (Cần xây dựng)
- Order State Machine validation
- Order History/Audit Log collection và UI
- Advanced filters (date range, status, channel, payment method)
- Order editing (add/remove items, edit address, apply coupon)
- Inventory reservation/release logic
- Timeline component
- Shipment creation API
- Refund functionality
- Quick actions (bulk approve, bulk print)
- Customer LTV (Lifetime Value) display

---

## 🗂️ DATABASE SCHEMA (MongoDB)

### Collection: `orders`
```typescript
interface MongoOrder {
  _id: ObjectId;
  orderNumber: string;              // Unique: "ORD-2025-001"
  userId?: string;                 // Null nếu Guest
  guestInfo?: {                     // Nếu userId null
    name: string;
    email: string;
    phone: string;
  };
  status: 'pending' | 'awaiting_payment' | 'confirmed' | 'processing' | 
          'shipping' | 'completed' | 'cancelled' | 'refunded' | 'failed';
  subtotal: number;                 // Tổng tiền hàng
  taxTotal: number;                 // Tổng thuế
  shippingTotal: number;            // Phí vận chuyển
  discountTotal: number;            // Tổng giảm giá
  grandTotal: number;               // Tổng thanh toán
  paymentMethod: string;            // 'cod', 'banking', 'vietqr', 'momo', 'stripe'
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentMethodTitle: string;
  transactionId?: string;
  shippingMethod: string;           // ID phương thức vận chuyển
  trackingNumber?: string;          // Mã vận đơn
  carrier?: string;                 // 'ghtk', 'ghn', 'custom'
  billing: {
    firstName: string;
    lastName: string;
    address1: string;
    address2?: string;
    city: string;
    postcode: string;
    country: string;
  };
  shipping: {
    firstName: string;
    lastName: string;
    address1: string;
    address2?: string;
    city: string;
    postcode: string;
    country: string;
    province?: string;              // Tỉnh/Thành phố
    district?: string;              // Quận/Huyện
    ward?: string;                  // Phường/Xã
  };
  notes?: string;                    // Ghi chú của khách hàng
  adminNotes?: string;              // Ghi chú nội bộ (không hiện cho khách)
  channel?: string;                // 'website', 'app', 'pos'
  createdAt: Date;
  updatedAt: Date;
  paidAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  cancelledReason?: string;         // Lý do hủy
}
```

### Collection: `orderItems` (SNAPSHOT DATA)
```typescript
interface MongoOrderItem {
  _id: ObjectId;
  orderId: string;                   // FK -> orders._id
  productId: string;                 // FK -> products._id
  variationId?: string;             // FK -> product_variants._id
  productName: string;               // SNAPSHOT: Tên tại thời điểm mua
  sku?: string;                      // SNAPSHOT: SKU tại thời điểm mua
  quantity: number;
  unitPrice: number;                 // SNAPSHOT: Giá 1 sản phẩm tại thời điểm mua
  totalPrice: number;                // quantity * unitPrice
  attributes?: {                     // Variant attributes snapshot
    size?: string;
    color?: string;
    [key: string]: string | undefined;
  };
  image?: string;                    // Product image URL snapshot
  createdAt: Date;
}
```

### Collection: `orderHistories` (Audit Log)
```typescript
interface MongoOrderHistory {
  _id: ObjectId;
  orderId: string;                   // FK -> orders._id
  action: 'create' | 'update_status' | 'update_payment_status' | 
         'payment_received' | 'add_item' | 'remove_item' | 
         'update_address' | 'apply_coupon' | 'cancel' | 'refund';
  description: string;               // "Admin A đổi trạng thái từ Pending sang Processing"
  oldValue?: any;                     // Giá trị cũ (cho status changes)
  newValue?: any;                     // Giá trị mới
  actorId?: string;                   // ID người thực hiện (Admin hoặc Customer hoặc System)
  actorType: 'admin' | 'customer' | 'system';
  actorName?: string;                 // Tên người thực hiện
  metadata?: Record<string, any>;    // Additional metadata
  createdAt: Date;
}
```

---

## 🚀 PHASES & TASKS

### **PHASE 1: Database Schema & Order State Machine** (Tuần 1)
**Mục tiêu:** Setup database schema và implement Order State Machine validation

#### Task 1.1: Update Order Schema
- [ ] **OMS-001** Update MongoDB order schema để match spec:
  - [ ] Thêm fields: `awaiting_payment`, `failed` status
  - [ ] Thêm `channel` field (website, app, pos)
  - [ ] Thêm `cancelledReason` field
  - [ ] Thêm `trackingNumber`, `carrier` fields
  - [ ] Update `shipping` object với `province`, `district`, `ward`
- [ ] **OMS-002** Create migration script để update existing orders
- [ ] **OMS-003** Create database indexes:
  - [ ] `orders.createIndex({ orderNumber: 1 }, { unique: true })`
  - [ ] `orders.createIndex({ status: 1 })`
  - [ ] `orders.createIndex({ userId: 1 })`
  - [ ] `orders.createIndex({ createdAt: -1 })`
  - [ ] `orders.createIndex({ paymentStatus: 1 })`
  - [ ] `orders.createIndex({ channel: 1 })`
  - [ ] `orderHistories.createIndex({ orderId: 1, createdAt: -1 })`
  - [ ] `orderHistories.createIndex({ actorId: 1 })`

#### Task 1.2: Order State Machine
- [ ] **OMS-004** Create Order State Machine utility (`lib/utils/orderStateMachine.ts`):
  - [ ] Define valid transitions
  - [ ] Function: `canTransition(fromStatus, toStatus)`
  - [ ] Function: `getValidNextStatuses(currentStatus)`
  - [ ] Function: `validateTransition(order, newStatus)`
- [ ] **OMS-005** Create Order History service (`lib/services/orderHistory.ts`):
  - [ ] Function: `createHistoryEntry(orderId, action, description, actor)`
  - [ ] Function: `getOrderHistory(orderId)`
- [ ] **OMS-006** Update Order Update API để validate state machine:
  - [ ] Check valid transition trước khi update
  - [ ] Auto-create history entry khi status change
  - [ ] Return error nếu transition không hợp lệ

**Deliverables:**
- ✅ Updated order schema
- ✅ Order State Machine validation
- ✅ Order History service
- ✅ Database indexes

---

### **PHASE 2: Advanced Filters & Search** (Tuần 1-2)
**Mục tiêu:** Nâng cấp Order List với advanced filters và search

#### Task 2.1: Advanced Filters API
- [ ] **OMS-007** Update `GET /api/admin/orders` API:
  - [ ] Filter by date range (`fromDate`, `toDate`)
  - [ ] Filter by multiple statuses (`status[]`)
  - [ ] Filter by channel (`channel`)
  - [ ] Filter by payment method (`paymentMethod`)
  - [ ] Filter by payment status (`paymentStatus`)
  - [ ] Search by order number, customer email, customer phone
  - [ ] Sort options: `createdAt`, `total`, `status`
- [ ] **OMS-008** Add pagination metadata:
  - [ ] Total count
  - [ ] Current page
  - [ ] Total pages
  - [ ] Has next/prev page

#### Task 2.2: Advanced Filters UI
- [ ] **OMS-009** Create `OrderFilters` component (`components/admin/orders/OrderFilters.tsx`):
  - [ ] Date range picker (From - To)
  - [ ] Status multi-select (Checkbox list)
  - [ ] Channel select (Website, App, POS)
  - [ ] Payment method select
  - [ ] Payment status select
  - [ ] Search input (order number, email, phone)
  - [ ] Sort dropdown
  - [ ] Clear all filters button
- [ ] **OMS-010** Update Order List page:
  - [ ] Integrate `OrderFilters` component
  - [ ] URL query params sync với filters
  - [ ] Mobile-responsive filter layout
  - [ ] Sticky filter bar (mobile)

**Deliverables:**
- ✅ Advanced filters API
- ✅ OrderFilters component
- ✅ Updated Order List page

---

### **PHASE 3: Order Detail Enhancement** (Tuần 2)
**Mục tiêu:** Nâng cấp Order Detail page với Timeline, Action Bar, và Customer Info

#### Task 3.1: Order Timeline Component
- [ ] **OMS-011** Create `OrderTimeline` component (`components/admin/orders/OrderTimeline.tsx`):
  - [ ] Fetch order history từ API
  - [ ] Display timeline với icons và colors
  - [ ] Show actor name và timestamp
  - [ ] Group by date (Today, Yesterday, Last week, etc.)
  - [ ] Mobile-responsive layout
- [ ] **OMS-012** Create API route `GET /api/admin/orders/[id]/history`:
  - [ ] Fetch order histories từ `orderHistories` collection
  - [ ] Sort by `createdAt` desc
  - [ ] Return formatted history entries

#### Task 3.2: Action Bar Component
- [ ] **OMS-013** Create `OrderActionBar` component (`components/admin/orders/OrderActionBar.tsx`):
  - [ ] Dynamic buttons based on current status (State Machine)
  - [ ] "Xác nhận đơn" button (Pending -> Confirmed)
  - [ ] "Chuyển sang xử lý" button (Confirmed -> Processing)
  - [ ] "Tạo vận đơn" button (Processing -> Shipping)
  - [ ] "Hoàn thành" button (Shipping -> Completed)
  - [ ] "Hủy đơn" button (với modal nhập lý do)
  - [ ] "Hoàn tiền" button (với modal nhập số tiền)
  - [ ] Disable buttons nếu transition không hợp lệ
- [ ] **OMS-014** Create status change modals:
  - [ ] Cancel Order Modal (yêu cầu nhập lý do)
  - [ ] Refund Modal (partial/full refund, nhập số tiền)

#### Task 3.3: Customer Info Enhancement
- [ ] **OMS-015** Create `CustomerInfoCard` component:
  - [ ] Display customer name, email, phone
  - [ ] Calculate và display LTV (Lifetime Value)
  - [ ] Link to customer order history (nếu có)
  - [ ] Display customer type (VIP, Regular, New)
- [ ] **OMS-016** Create API route `GET /api/admin/customers/[email]/stats`:
  - [ ] Calculate total orders count
  - [ ] Calculate total spent (LTV)
  - [ ] Get last order date
  - [ ] Return customer stats

#### Task 3.4: Layout Update
- [ ] **OMS-017** Update Order Detail page layout (3-column):
  - [ ] Left column (large): Order items, Payment info, Action bar
  - [ ] Right column (small): Customer info, Order status, Admin notes
  - [ ] Bottom section: Timeline
  - [ ] Mobile: Stack layout

**Deliverables:**
- ✅ OrderTimeline component
- ✅ OrderActionBar component
- ✅ CustomerInfoCard component
- ✅ Updated Order Detail page layout

---

### **PHASE 4: Order Editing** (Tuần 3)
**Mục tiêu:** Implement order editing (chỉ khi ở trạng thái Pending/Confirmed)

#### Task 4.1: Edit Order Items
- [ ] **OMS-018** Create `EditOrderItems` component:
  - [ ] Display current order items với edit/remove buttons
  - [ ] "Thêm sản phẩm" button (mở product selector modal)
  - [ ] "Xóa sản phẩm" button (với confirmation)
  - [ ] Update quantity (với validation)
  - [ ] Auto-recalculate totals khi items change
- [ ] **OMS-019** Create Product Selector Modal:
  - [ ] Search products
  - [ ] Select product và variant
  - [ ] Select quantity
  - [ ] Add to order
- [ ] **OMS-020** Create API route `PATCH /api/admin/orders/[id]/items`:
  - [ ] Validate order status (chỉ cho phép Pending/Confirmed)
  - [ ] Add item: Validate product exists, check stock
  - [ ] Remove item: Validate item exists
  - [ ] Update quantity: Validate quantity > 0
  - [ ] Recalculate totals (subtotal, tax, shipping, grandTotal)
  - [ ] Create history entry
  - [ ] Update order `updatedAt`

#### Task 4.2: Edit Shipping Address
- [ ] **OMS-021** Create `EditShippingAddress` component:
  - [ ] Form với Province/District/Ward selectors
  - [ ] Address input fields
  - [ ] Save button
- [ ] **OMS-022** Create API route `PATCH /api/admin/orders/[id]/shipping`:
  - [ ] Validate order status
  - [ ] Update shipping address
  - [ ] Recalculate shipping fee (nếu cần)
  - [ ] Create history entry

#### Task 4.3: Apply Coupon
- [ ] **OMS-023** Create `ApplyCoupon` component:
  - [ ] Input coupon code
  - [ ] Apply button
  - [ ] Display current discount
  - [ ] Remove coupon button
- [ ] **OMS-024** Create API route `PATCH /api/admin/orders/[id]/coupon`:
  - [ ] Validate coupon code
  - [ ] Check coupon validity (expiry, usage limit)
  - [ ] Calculate discount
  - [ ] Update `discountTotal` và `grandTotal`
  - [ ] Create history entry

#### Task 4.4: Recalculate Totals
- [ ] **OMS-025** Create `recalculateOrderTotals` utility:
  - [ ] Calculate subtotal từ order items
  - [ ] Calculate tax (nếu có)
  - [ ] Calculate shipping (dựa trên address và items)
  - [ ] Apply discount
  - [ ] Calculate grandTotal = max(0, subtotal + tax + shipping - discount)
- [ ] **OMS-026** Auto-recalculate khi:
  - [ ] Items change
  - [ ] Shipping address change
  - [ ] Coupon applied/removed

**Deliverables:**
- ✅ Edit Order Items functionality
- ✅ Edit Shipping Address functionality
- ✅ Apply Coupon functionality
- ✅ Auto-recalculate totals

---

### **PHASE 5: Inventory Management** (Tuần 3-4)
**Mục tiêu:** Implement inventory reservation và release logic

#### Task 5.1: Inventory Reservation Service
- [ ] **OMS-027** Create `InventoryService` (`lib/services/inventory.ts`):
  - [ ] Function: `reserveStock(orderId, items)` - Hold stock khi order Pending
  - [ ] Function: `deductStock(orderId)` - Trừ kho khi order Confirmed/Paid
  - [ ] Function: `releaseStock(orderId)` - Trả lại kho khi order Cancelled
  - [ ] Function: `checkStockAvailability(productId, variationId, quantity)`
- [ ] **OMS-028** Update Product schema để support reserved stock:
  - [ ] Add `reservedQuantity` field (hoặc separate `reservations` array)
  - [ ] Available stock = `stockQuantity - reservedQuantity`
- [ ] **OMS-029** Integrate với Order creation:
  - [ ] Auto-reserve stock khi order created (status: Pending)
  - [ ] Auto-deduct stock khi order confirmed/paid
  - [ ] Auto-release stock khi order cancelled

#### Task 5.2: Stock Validation
- [ ] **OMS-030** Create stock validation trong Order editing:
  - [ ] Check stock availability trước khi add item
  - [ ] Show warning nếu stock không đủ
  - [ ] Prevent adding items nếu stock = 0
- [ ] **OMS-031** Create stock check API:
  - [ ] `GET /api/admin/products/[id]/stock` - Check stock availability
  - [ ] Return available quantity, reserved quantity

#### Task 5.3: Auto-cancel Pending Orders
- [ ] **OMS-032** Create cron job/API route để auto-cancel pending orders:
  - [ ] Check orders với status "Pending" quá hạn (30 phút cho QR, 24h cho COD)
  - [ ] Auto-cancel orders
  - [ ] Release reserved stock
  - [ ] Create history entry (actor: system)
- [ ] **OMS-033** Create API route `POST /api/admin/orders/auto-cancel`:
  - [ ] Can be called by cron job hoặc scheduled task
  - [ ] Process pending orders timeout

**Deliverables:**
- ✅ Inventory reservation service
- ✅ Stock validation
- ✅ Auto-cancel pending orders

---

### **PHASE 6: Shipment Management** (Tuần 4)
**Mục tiêu:** Tích hợp tạo vận đơn với carriers (GHTK, GHN)

#### Task 6.1: Shipment Service
- [ ] **OMS-034** Create `ShipmentService` (`lib/services/shipment.ts`):
  - [ ] Function: `createShipment(orderId, carrier, weight)`
  - [ ] Support carriers: GHTK, GHN, Custom
  - [ ] Generate tracking number
  - [ ] Update order với tracking number và carrier
- [ ] **OMS-035** Create API route `POST /api/admin/orders/[id]/shipment`:
  - [ ] Validate order status (chỉ Processing)
  - [ ] Call shipment service
  - [ ] Update order status: Processing -> Shipping
  - [ ] Create history entry
  - [ ] Return tracking number

#### Task 6.2: Shipment UI
- [ ] **OMS-036** Create `CreateShipmentModal` component:
  - [ ] Select carrier (GHTK, GHN, Custom)
  - [ ] Input weight (auto-calculate từ order items)
  - [ ] Display shipping address
  - [ ] Create shipment button
  - [ ] Display tracking number sau khi tạo
- [ ] **OMS-037** Update Order Detail page:
  - [ ] Display tracking number (nếu có)
  - [ ] Link to carrier tracking page
  - [ ] "Tạo vận đơn" button trong Action Bar

**Deliverables:**
- ✅ Shipment service
- ✅ Create Shipment API
- ✅ Create Shipment UI

---

### **PHASE 7: Refund Management** (Tuần 4-5)
**Mục tiêu:** Implement refund functionality (partial và full refund)

#### Task 7.1: Refund Service
- [ ] **OMS-038** Create `RefundService` (`lib/services/refund.ts`):
  - [ ] Function: `processRefund(orderId, amount, reason)`
  - [ ] Support partial refund và full refund
  - [ ] Update order `paymentStatus` -> "refunded"
  - [ ] Update order `status` -> "refunded" (nếu full refund)
  - [ ] Create refund record (có thể tạo collection `refunds`)
- [ ] **OMS-039** Create API route `POST /api/admin/orders/[id]/refund`:
  - [ ] Validate order status (chỉ cho phép refund orders đã paid)
  - [ ] Validate refund amount (không vượt quá grandTotal)
  - [ ] Process refund (call payment gateway API nếu cần)
  - [ ] Update order status
  - [ ] Create history entry

#### Task 7.2: Refund UI
- [ ] **OMS-040** Create `RefundModal` component:
  - [ ] Display order total
  - [ ] Input refund amount (default: full refund)
  - [ ] Input refund reason
  - [ ] Radio: Partial refund / Full refund
  - [ ] Process refund button
  - [ ] Display refund confirmation
- [ ] **OMS-041** Update Order Detail page:
  - [ ] "Hoàn tiền" button trong Action Bar
  - [ ] Display refund history (nếu có)

**Deliverables:**
- ✅ Refund service
- ✅ Refund API
- ✅ Refund UI

---

### **PHASE 8: Quick Actions & Bulk Operations** (Tuần 5)
**Mục tiêu:** Implement quick actions và bulk operations

#### Task 8.1: Quick Actions
- [ ] **OMS-042** Create Quick Actions trong Order List:
  - [ ] Bulk approve orders (Pending -> Confirmed)
  - [ ] Bulk print shipping labels
  - [ ] Bulk export orders (CSV/Excel)
  - [ ] Bulk update status
- [ ] **OMS-043** Create API routes:
  - [ ] `POST /api/admin/orders/bulk-approve` - Bulk approve
  - [ ] `POST /api/admin/orders/bulk-print` - Generate shipping labels
  - [ ] `GET /api/admin/orders/export` - Export orders CSV

#### Task 8.2: Print Functionality
- [ ] **OMS-044** Create Print Shipping Label component:
  - [ ] Generate printable shipping label
  - [ ] Include: Order number, Customer info, Address, Items
  - [ ] Print button
- [ ] **OMS-045** Create Print Invoice component:
  - [ ] Generate printable invoice (PDF)
  - [ ] Include: Order details, Items, Totals, Payment info
  - [ ] Download PDF button

**Deliverables:**
- ✅ Quick Actions UI
- ✅ Bulk operations API
- ✅ Print functionality

---

### **PHASE 9: Testing & Polish** (Tuần 5-6)
**Mục tiêu:** Testing, bug fixes, và UI/UX improvements

#### Task 9.1: Testing
- [ ] **OMS-046** Unit tests:
  - [ ] Order State Machine validation
  - [ ] Inventory reservation/release
  - [ ] Total recalculation
  - [ ] Refund calculation
- [ ] **OMS-047** Integration tests:
  - [ ] Order creation flow
  - [ ] Order status transition flow
  - [ ] Order editing flow
  - [ ] Refund flow
- [ ] **OMS-048** E2E tests (Playwright):
  - [ ] Order list filtering
  - [ ] Order detail actions
  - [ ] Order editing
  - [ ] Refund process

#### Task 9.2: UI/UX Improvements
- [ ] **OMS-049** Mobile responsiveness:
  - [ ] Test trên mobile devices
  - [ ] Fix layout issues
  - [ ] Optimize touch targets
- [ ] **OMS-050** Loading states:
  - [ ] Skeleton loaders cho Order List
  - [ ] Loading states cho actions
- [ ] **OMS-051** Error handling:
  - [ ] User-friendly error messages
  - [ ] Toast notifications
  - [ ] Error boundaries

#### Task 9.3: Performance Optimization
- [ ] **OMS-052** Optimize queries:
  - [ ] Add proper indexes
  - [ ] Optimize aggregation pipelines
  - [ ] Cache frequently accessed data
- [ ] **OMS-053** Code splitting:
  - [ ] Lazy load heavy components
  - [ ] Dynamic imports

**Deliverables:**
- ✅ Test coverage > 80%
- ✅ Mobile-responsive UI
- ✅ Performance optimized

---

## 📋 TASK CHECKLIST SUMMARY

### Phase 1: Database Schema & Order State Machine
- [ ] OMS-001: Update Order Schema
- [ ] OMS-002: Migration Script
- [ ] OMS-003: Database Indexes
- [ ] OMS-004: Order State Machine Utility
- [ ] OMS-005: Order History Service
- [ ] OMS-006: Update Order Update API

### Phase 2: Advanced Filters & Search
- [ ] OMS-007: Advanced Filters API
- [ ] OMS-008: Pagination Metadata
- [ ] OMS-009: OrderFilters Component
- [ ] OMS-010: Update Order List Page

### Phase 3: Order Detail Enhancement
- [ ] OMS-011: OrderTimeline Component
- [ ] OMS-012: Order History API
- [ ] OMS-013: OrderActionBar Component
- [ ] OMS-014: Status Change Modals
- [ ] OMS-015: CustomerInfoCard Component
- [ ] OMS-016: Customer Stats API
- [ ] OMS-017: Layout Update

### Phase 4: Order Editing
- [ ] OMS-018: EditOrderItems Component
- [ ] OMS-019: Product Selector Modal
- [ ] OMS-020: Update Order Items API
- [ ] OMS-021: EditShippingAddress Component
- [ ] OMS-022: Update Shipping Address API
- [ ] OMS-023: ApplyCoupon Component
- [ ] OMS-024: Apply Coupon API
- [ ] OMS-025: Recalculate Totals Utility
- [ ] OMS-026: Auto-recalculate

### Phase 5: Inventory Management
- [ ] OMS-027: Inventory Service
- [ ] OMS-028: Update Product Schema
- [ ] OMS-029: Integrate với Order Creation
- [ ] OMS-030: Stock Validation
- [ ] OMS-031: Stock Check API
- [ ] OMS-032: Auto-cancel Pending Orders
- [ ] OMS-033: Auto-cancel API

### Phase 6: Shipment Management
- [ ] OMS-034: Shipment Service
- [ ] OMS-035: Create Shipment API
- [ ] OMS-036: CreateShipmentModal Component
- [ ] OMS-037: Update Order Detail

### Phase 7: Refund Management
- [ ] OMS-038: Refund Service
- [ ] OMS-039: Refund API
- [ ] OMS-040: RefundModal Component
- [ ] OMS-041: Update Order Detail

### Phase 8: Quick Actions & Bulk Operations
- [ ] OMS-042: Quick Actions UI
- [ ] OMS-043: Bulk Operations API
- [ ] OMS-044: Print Shipping Label
- [ ] OMS-045: Print Invoice

### Phase 9: Testing & Polish
- [ ] OMS-046: Unit Tests
- [ ] OMS-047: Integration Tests
- [ ] OMS-048: E2E Tests
- [ ] OMS-049: Mobile Responsiveness
- [ ] OMS-050: Loading States
- [ ] OMS-051: Error Handling
- [ ] OMS-052: Performance Optimization
- [ ] OMS-053: Code Splitting

**Total Tasks:** 53 tasks  
**Estimated Duration:** 5-6 tuần

---

## 🎨 UI/UX GUIDELINES

### Color Coding (Status)
- **Pending:** `bg-yellow-100 text-yellow-800` (Warning)
- **Awaiting Payment:** `bg-orange-100 text-orange-800`
- **Confirmed:** `bg-blue-100 text-blue-800` (Info)
- **Processing:** `bg-blue-100 text-blue-800` (Info)
- **Shipping:** `bg-indigo-100 text-indigo-800`
- **Completed:** `bg-green-100 text-green-800` (Success)
- **Cancelled:** `bg-gray-100 text-gray-800` hoặc `bg-red-100 text-red-800`
- **Refunded:** `bg-gray-100 text-gray-800`
- **Failed:** `bg-red-100 text-red-800` (Error)

### Layout (Order Detail)
- **Desktop:** 3-column layout
  - Left (large): Order items, Payment info, Action bar
  - Right (small): Customer info, Order status, Admin notes
  - Bottom: Timeline
- **Mobile:** Stack layout (vertical)

### Components
- Use Shadcn UI components
- Follow Design System (`docs/DESIGN_SYSTEM.md`)
- Mobile-first approach
- Touch targets: 44x44px minimum

---

## 🔐 SECURITY & PERFORMANCE

### Security
- [ ] All admin routes require authentication (`requireAdmin()`)
- [ ] Validate user permissions cho sensitive actions
- [ ] Sanitize user inputs
- [ ] Rate limiting cho API routes
- [ ] Mask sensitive data trong logs

### Performance
- [ ] API List Orders phải load dưới 500ms
- [ ] Proper database indexes
- [ ] Pagination (20 items per page default)
- [ ] Lazy loading cho heavy components
- [ ] Cache frequently accessed data

---

## 📚 RELATED DOCUMENTATION

- `Order_Management_System.md` - Technical Specification
- `docs/SCHEMA_CONTEXT.md` - MongoDB Schema Reference
- `docs/DESIGN_SYSTEM.md` - UI Design Guidelines
- `.cursorrules` - Coding Rules

---

**Last Updated:** 2025-01-XX  
**Status:** 📋 Planning  
**Next Step:** Start Phase 1 - Database Schema & Order State Machine

