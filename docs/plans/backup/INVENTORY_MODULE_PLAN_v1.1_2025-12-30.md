# Ke Hoach Xay Dung Module Quan Ly Kho

**Ngay tao:** 2025-12-30
**Cap nhat:** 2025-12-30
**Trang thai:** Draft - Da review, cho phe duyet
**Phien ban:** 1.1

---

## Muc Luc

1. [Tong Quan He Thong Hien Tai](#1-tong-quan-he-thong-hien-tai)
2. [Phan Tich Xung Dot Logic](#2-phan-tich-xung-dot-logic)
3. [Van De Bo Sung (Review 2025-12-30)](#3-van-de-bo-sung-review-2025-12-30)
4. [Phan Tich Rui Ro Tiem An](#4-phan-tich-rui-ro-tiem-an)
5. [Ke Hoach Trien Khai](#5-ke-hoach-trien-khai)
6. [Cau Truc Code Moi](#6-cau-truc-code-moi)
7. [Schema Database Moi](#7-schema-database-moi)
8. [API Endpoints Moi](#8-api-endpoints-moi)
9. [Checklist Trien Khai](#9-checklist-trien-khai)
10. [Appendix A: Risk Mitigation Matrix](#appendix-a-risk-mitigation-matrix)
11. [Appendix B: Glossary](#appendix-b-glossary)

---

## 1. Tong Quan He Thong Hien Tai

### 1.1 Cac File Inventory Da Co

| File | Chuc nang | Dong code |
|------|-----------|-----------|
| `lib/services/inventory.ts` | Service chinh - reserve, deduct, release, increment stock | ~430 |
| `lib/services/inventory-helpers.ts` | Helper functions - batch fetch, build operations | ~330 |
| `lib/services/inventory-internal.ts` | Internal functions with transaction support | ~195 |
| `lib/utils/transactionHelper.ts` | MongoDB transaction wrapper voi retry logic | ~215 |

### 1.2 Schema Hien Tai

**MongoProduct:**
```typescript
{
  stockStatus: 'instock' | 'outofstock' | 'onbackorder',
  stockQuantity?: number,           // Top-level
  manageStock?: boolean,            // Top-level (legacy)
  reservedQuantity?: number,        // Top-level (simple products)

  productDataMetaBox: {
    manageStock: boolean,           // New location
    stockQuantity?: number,         // New location
    stockStatus: 'instock' | 'outofstock' | 'onbackorder',
    lowStockThreshold?: number,
    backorders: 'no' | 'notify' | 'yes',
  },

  variants?: MongoVariant[],
}
```

**MongoVariant:**
```typescript
{
  id: string,
  size: string,
  color?: string,
  price: number,
  stock?: number,                   // Duplicate field #1
  stockQuantity?: number,           // Duplicate field #2
  reservedQuantity?: number,
  sku?: string,
}
```

### 1.3 Flow Inventory Hien Tai

```
+------------------+     +------------------+     +------------------+
|  Create Order    |---->|  reserveStock    |---->| +reservedQty     |
|   (Pending)      |     |  (Transaction)   |     | (khong tru kho)  |
+------------------+     +------------------+     +------------------+
         |
         v
+------------------+     +------------------+     +------------------+
|  Payment OK      |---->|   deductStock    |---->| -stock           |
|  (Confirmed)     |     |  (Transaction)   |     | -reservedQty     |
+------------------+     +------------------+     +------------------+
         |
         v
+------------------+     +------------------+     +------------------+
|  Cancel/Refund   |---->| releaseStock or  |---->| -reservedQty     |
|                  |     | incrementStock   |     | hoac +stock      |
+------------------+     | (NO Transaction) |     |                  |
                         +------------------+     +------------------+
```

---

## 2. Phan Tich Xung Dot Logic

### 2.1 Xung Dot Nghiem Trong (CRITICAL)

#### XD-01: Truong `stock` vs `stockQuantity` trong Variant

**Van de:**
```typescript
// MongoVariant co 2 truong trung lap
interface MongoVariant {
  stock?: number,          // Dung o mot so noi
  stockQuantity?: number,  // Dung o noi khac
}
```

**Noi bi anh huong:**
- `inventory.ts:373-374` - Doc: `variant.stock || variant.stockQuantity`
- `inventory.ts:174-175` - Ghi ca 2: `$inc: { "variants.$.stock": qty, "variants.$.stockQuantity": qty }`
- `inventory-helpers.ts:91` - Doc: `variant.stock || variant.stockQuantity`

**Rui ro:**
- Khong dong bo giua 2 truong neu cap nhat tu nguon khac
- Logic fallback che giau bug

**Giai phap de xuat:**
```typescript
// Chon 1 field chinh thuc, deprecate field con lai
// De xuat: Dung `stockQuantity` (consistent voi MongoProduct)
// Migration script de merge data
```

---

#### XD-02: `manageStock` o 2 vi tri

**Van de:**
```typescript
// Co the o 2 noi khac nhau
product.manageStock                      // Top-level (legacy)
product.productDataMetaBox.manageStock   // New structure
```

**Noi bi anh huong:**
- `inventory-helpers.ts:47-50` - Fallback logic phuc tap
- `inventory.ts:150,266` - Check inconsistent: `!product.manageStock && product.manageStock !== true`

**Rui ro:**
- Mot san pham co the bi skip vi check sai vi tri
- Bug logic: `!product.manageStock && product.manageStock !== true` luon `false` khi `manageStock = true`

**Giai phap de xuat:**
```typescript
// Utility function thong nhat
function getManageStock(product: any): boolean {
  return product.productDataMetaBox?.manageStock ?? product.manageStock ?? false;
}
```

---

#### XD-03: `stockQuantity` o 2 vi tri (Simple Product)

**Van de:**
```typescript
product.stockQuantity                      // Top-level
product.productDataMetaBox.stockQuantity   // New structure
```

**Noi bi anh huong:**
- `inventory-helpers.ts:51-54` - Fallback logic
- `inventory-helpers.ts:320-322` - Deduct ca 2 noi:
  ```typescript
  $inc: {
    stockQuantity: -item.quantity,
    'productDataMetaBox.stockQuantity': -item.quantity,
  }
  ```

**Rui ro:**
- Deduct 2 lan neu ca 2 field deu co gia tri
- Du lieu khong nhat quan

**Giai phap de xuat:**
- Migration: Merge vao `productDataMetaBox.stockQuantity`
- Utility function cho read/write

---

### 2.2 Xung Dot Trung Binh (MEDIUM)

#### XD-04: `reservedQuantity` khong co trong `productDataMetaBox`

**Van de:**
```typescript
// Simple product - reservedQuantity o top-level
product.reservedQuantity

// Variant - reservedQuantity trong variant object
product.variants[].reservedQuantity

// Nhung productDataMetaBox KHONG co reservedQuantity
product.productDataMetaBox.reservedQuantity // Khong ton tai
```

**Rui ro:**
- Schema khong nhat quan giua simple va variable products
- Kho mo rong de ho tro reservation tai level productDataMetaBox

---

#### XD-05: `incrementStock` va `releaseStock` khong dung Transaction

**Van de:**
```typescript
// reserveStock va deductStock - CO transaction
export async function reserveStock(...) {
  await withTransaction(async (session) => { ... });
}

// incrementStock va releaseStock - KHONG CO transaction
export async function incrementStock(...) {
  const { products, orders } = await getCollections();
  // Chi dung atomic $inc, khong wrap trong transaction
}
```

**Rui ro:**
- Race condition khi nhieu request cung luc
- `isStockRestored` flag co the bi set nhung stock increment fail

---

### 2.3 Xung Dot Nhe (LOW)

#### XD-06: Thieu `sku` validation khi adjust stock

**Van de:**
- Inventory operations dua vao `productId` + `variationId`
- Khong co option adjust by SKU
- Admin co the muon adjust bang SKU (pho bien trong warehouse management)

#### XD-07: Khong co Inventory History/Audit Log

**Van de:**
- Khong ghi lai ai thay doi stock, khi nao, ly do gi
- Khong the trace back khi co discrepancy

---

## 3. Van De Bo Sung (Review 2025-12-30)

> Section nay bo sung cac van de phat hien khi deep review code hien tai

### 3.1 Bug Logic CRITICAL (BUG-01)

**Vi tri:** `inventory.ts:150, 266`

**Code hien tai (SAI):**
```typescript
if (!product.manageStock && product.manageStock !== true) {
  continue;
}
```

**Van de:**
- Logic nay LUON `false` khi `manageStock = true`
- LUON `true` khi `manageStock = false/undefined`
- Dieu kien `&& product.manageStock !== true` la redundant va gay nham lan

**Giai phap:**
```typescript
// Sua thanh:
if (!product.manageStock) {
  continue;
}
```

**Muc do:** CRITICAL - Can sua truoc khi trien khai module moi

---

### 3.2 Type Inconsistency MongoVariant (BUG-02)

**Van de:** 2 dinh nghia MongoVariant khac nhau trong codebase

**Vi tri 1:** `types/mongodb.ts:83-95`
```typescript
export interface MongoVariant {
  stock?: number;          // Optional
  stockQuantity?: number;  // Optional
}
```

**Vi tri 2:** `lib/utils/productMapper.ts:295-304`
```typescript
variants?: Array<{
  stock: number;           // Required, KHONG co stockQuantity
}>;
```

**Rui ro:**
- Type checking khong chinh xac
- Developer bi nham lan khi lam viec

**Giai phap:**
- Thong nhat thanh 1 dinh nghia duy nhat
- Chon `stockQuantity` lam field chinh thuc (consistent voi MongoProduct)
- Deprecate `stock` field

---

### 3.3 Thieu Negative Stock Validation (BUG-03)

**Van de:** Khong co check ngan stock thanh so am

**Vi tri:** `inventory-helpers.ts:320-322`
```typescript
$inc: {
  stockQuantity: -item.quantity,  // Co the am!
  'productDataMetaBox.stockQuantity': -item.quantity,
}
```

**Rui ro:**
- Stock co the thanh so am
- Anh huong den bao cao va logic business

**Giai phap:**
```typescript
// Them validation truoc khi deduct
if (currentStock < item.quantity) {
  throw new Error(`Insufficient stock for product ${item.productId}`);
}

// Hoac dung MongoDB $max operator
$set: {
  stockQuantity: { $max: [{ $subtract: ['$stockQuantity', item.quantity] }, 0] }
}
```

---

### 3.4 incrementStock/releaseStock Thieu Transaction (BUG-04)

**Van de:** Chi reserveStock va deductStock dung transaction

**Vi tri:**
- `inventory.ts:113-216` - incrementStock: KHONG CO transaction
- `inventory.ts:227-334` - releaseStock: KHONG CO transaction

**Rui ro thuc te:**
- Neu `isStockRestored` set thanh cong nhung `$inc` fail → **mat stock vinh vien**
- Race condition giua nhieu request refund/cancel dong thoi

**Giai phap:**
```typescript
export async function incrementStock(orderId: string, items: InventoryItem[]): Promise<void> {
  await withTransaction(async (session) => {
    const collections = await getCollectionsWithSession(session);

    // Atomic check-and-set trong transaction
    const orderResult = await collections.orders.findOneAndUpdate(
      { _id: new ObjectId(orderId), isStockRestored: { $ne: true } },
      { $set: { isStockRestored: true, updatedAt: new Date() } },
      { session, returnDocument: 'after' }
    );

    if (!orderResult) return;

    // Increment stock trong cung transaction
    await incrementStockInternal(collections.products, items, session);
  });
}
```

---

## 4. Phan Tich Rui Ro Tiem An

### 4.1 Rui Ro Bao Mat

| ID | Rui ro | Muc do | Giai phap |
|----|--------|--------|-----------|
| RR-SEC-01 | Stock manipulation qua API | HIGH | Rate limiting, validation, audit log |
| RR-SEC-02 | Double stock restoration bypass | MEDIUM | Da co `isStockRestored` flag |
| RR-SEC-03 | Negative stock values | LOW | Validation + database constraint |

### 4.2 Rui Ro Data Integrity

| ID | Rui ro | Muc do | Giai phap |
|----|--------|--------|-----------|
| RR-DATA-01 | `stock` va `stockQuantity` khong dong bo | HIGH | Migration + single source of truth |
| RR-DATA-02 | `manageStock` location inconsistency | HIGH | Utility function + migration |
| RR-DATA-03 | Orphan reservations (order deleted, reservation stuck) | MEDIUM | Cleanup cron job |
| RR-DATA-04 | Phantom stock (negative available) | MEDIUM | Validation before operations |

### 4.3 Rui Ro Performance

| ID | Rui ro | Muc do | Giai phap |
|----|--------|--------|-----------|
| RR-PERF-01 | N+1 queries khi list nhieu products | LOW | Da co batch fetch |
| RR-PERF-02 | Transaction timeout voi nhieu items | MEDIUM | Chunk large orders |
| RR-PERF-03 | Lock contention khi high traffic | MEDIUM | Optimistic locking + retry |

### 4.4 Rui Ro Business Logic

| ID | Rui ro | Muc do | Giai phap |
|----|--------|--------|-----------|
| RR-BIZ-01 | Khong co canh bao low stock | HIGH | Implement alert system |
| RR-BIZ-02 | Khong co inventory forecast | MEDIUM | Phase 2 feature |
| RR-BIZ-03 | Khong ho tro multi-warehouse | LOW | Future consideration |
| RR-BIZ-04 | Khong co batch import/export | MEDIUM | Add to Phase 1 |

---

## 5. Ke Hoach Trien Khai

### Phase 0: Schema Consolidation (Bat buoc truoc khi bat dau)

**Muc tieu:** Giai quyet cac xung dot schema truoc khi xay dung module moi

**Tasks:**
- [ ] Tao migration script de merge `stock` -> `stockQuantity` trong variants
- [ ] Tao migration script de merge `manageStock` top-level -> `productDataMetaBox`
- [ ] Tao migration script de merge `stockQuantity` top-level -> `productDataMetaBox`
- [ ] Tao utility functions cho consistent read/write
- [ ] Update tat ca code su dung cac field cu
- [ ] Test migration tren staging

---

### Phase 1: Core Inventory Module

**Muc tieu:** Xay dung module quan ly kho co ban

#### 5.1.1 Backend

**Files can tao:**

```
lib/
  repositories/
    inventoryRepository.ts      # Data access layer
  services/
    inventory-extended.ts       # Extended inventory operations
  utils/
    inventoryUtils.ts           # Utility functions

app/api/admin/inventory/
  route.ts                      # GET: Overview, POST: Adjust
  movements/route.ts            # GET: Movement history
  low-stock/route.ts            # GET: Low stock alerts
  export/route.ts               # GET: Export to CSV/Excel
  import/route.ts               # POST: Import from CSV

types/
  inventory.ts                  # Inventory types
```

**API Endpoints:**

| Method | Endpoint | Chuc nang |
|--------|----------|-----------|
| GET | `/api/admin/inventory` | Lay overview ton kho |
| GET | `/api/admin/inventory?lowStock=true` | Lay san pham ton kho thap |
| POST | `/api/admin/inventory/adjust` | Dieu chinh ton kho |
| GET | `/api/admin/inventory/movements` | Lich su nhap/xuat |
| GET | `/api/admin/inventory/export` | Export bao cao |
| POST | `/api/admin/inventory/import` | Import tu file |

#### 5.1.2 Frontend

**Files can tao:**

```
app/admin/inventory/
  page.tsx                      # Trang chinh inventory
  movements/page.tsx            # Lich su movements
  import/page.tsx               # Import inventory

components/admin/inventory/
  InventoryOverview.tsx         # Dashboard overview
  InventoryTable.tsx            # Bang ton kho
  StockAdjustmentDialog.tsx     # Dialog dieu chinh
  LowStockAlerts.tsx            # Canh bao ton thap
  InventoryMovementHistory.tsx  # Lich su
  InventoryFilters.tsx          # Bo loc
  InventoryExportDialog.tsx     # Export dialog

lib/hooks/
  useInventory.ts               # Hook cho inventory data
  useInventoryMovements.ts      # Hook cho movements
  useAdjustStock.ts             # Hook cho adjust
```

---

### Phase 2: Advanced Features

**Muc tieu:** Them cac tinh nang nang cao

**Features:**
- [ ] Canh bao ton kho thap (Email/Telegram)
- [ ] Bao cao ton kho theo thoi gian
- [ ] Du bao ton kho (basic)
- [ ] Bulk adjustment voi Excel import
- [ ] Inventory valuation (FIFO/LIFO/Average)

---

### Phase 3: Integration & Optimization

**Muc tieu:** Tich hop va toi uu

**Tasks:**
- [ ] Dashboard widget cho admin homepage
- [ ] Real-time stock updates (WebSocket/SSE)
- [ ] Performance optimization
- [ ] Mobile-responsive UI improvements

---

## 6. Cau Truc Code Moi

### 6.1 Repository Pattern

```typescript
// lib/repositories/inventoryRepository.ts

export interface InventoryAdjustment {
  productId: string;
  variationId?: string;
  quantity: number;           // Positive = add, Negative = subtract
  type: 'manual' | 'order' | 'return' | 'damage' | 'correction';
  reason?: string;
  referenceId?: string;       // Order ID, Return ID, etc.
  adjustedBy: string;         // Admin user ID
}

// Note: InventoryMovement full schema is defined in Section 7.1
// This is simplified interface for repository return type
export interface InventoryMovementResult {
  _id: string;
  productId: string;
  variationId?: string;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  previousStock: number;
  newStock: number;
  createdAt: Date;
}

export const inventoryRepository = {
  async getOverview(filters?: InventoryFilters): Promise<InventoryOverview>;
  async getLowStockItems(threshold?: number): Promise<LowStockItem[]>;
  async adjustStock(adjustment: InventoryAdjustment): Promise<InventoryMovementResult>;
  async getMovements(filters?: MovementFilters): Promise<PaginatedResult<InventoryMovementResult>>;
  async bulkAdjust(adjustments: InventoryAdjustment[]): Promise<BulkResult>;
};
```

### 6.2 Extended Inventory Service

```typescript
// lib/services/inventory-extended.ts

export interface StockAlert {
  productId: string;
  productName: string;
  sku?: string;
  currentStock: number;
  threshold: number;
  severity: 'warning' | 'critical' | 'out_of_stock';
}

export const inventoryService = {
  async getStockAlerts(): Promise<StockAlert[]>;
  async sendLowStockNotifications(): Promise<void>;
  async getInventoryValuation(method: 'fifo' | 'lifo' | 'average'): Promise<Valuation>;
  async getStockForecast(productId: string, days: number): Promise<Forecast>;
};
```

---

## 7. Schema Database Moi

### 7.1 Collection: `inventoryMovements`

```typescript
interface InventoryMovement {
  _id: ObjectId;

  // Reference
  productId: ObjectId;
  variationId?: string;
  sku?: string;
  productName: string;          // Snapshot at time of movement

  // Movement details
  type: 'in' | 'out' | 'adjustment' | 'reservation' | 'release';
  quantity: number;             // Always positive
  direction: 1 | -1;            // 1 = increase, -1 = decrease

  // Stock levels
  previousStock: number;
  newStock: number;
  previousReserved?: number;
  newReserved?: number;

  // Reference
  referenceType?: 'order' | 'return' | 'manual' | 'import' | 'damage' | 'correction';
  referenceId?: string;

  // Metadata
  reason?: string;
  notes?: string;

  // Audit
  createdBy?: ObjectId;         // Admin user ID
  createdByName?: string;       // Snapshot
  createdAt: Date;
}
```

**Indexes:**
```javascript
db.inventoryMovements.createIndex({ productId: 1, createdAt: -1 });
db.inventoryMovements.createIndex({ sku: 1, createdAt: -1 });
db.inventoryMovements.createIndex({ referenceType: 1, referenceId: 1 });
db.inventoryMovements.createIndex({ createdAt: -1 });
db.inventoryMovements.createIndex({ type: 1 });
```

### 7.2 Collection: `inventoryAlerts` (Optional)

```typescript
interface InventoryAlert {
  _id: ObjectId;
  productId: ObjectId;
  variationId?: string;
  alertType: 'low_stock' | 'out_of_stock' | 'overstock';
  threshold: number;
  currentStock: number;
  status: 'active' | 'acknowledged' | 'resolved';
  acknowledgedBy?: ObjectId;
  acknowledgedAt?: Date;
  createdAt: Date;
  resolvedAt?: Date;
}
```

---

## 8. API Endpoints Moi

### 8.1 Inventory Overview

```
GET /api/admin/inventory

Query params:
- page: number (default: 1)
- per_page: number (default: 20)
- search: string (search by name, SKU)
- category: string (category ID)
- stockStatus: 'all' | 'low' | 'out' | 'in' (default: 'all')
- sortBy: 'stock' | 'name' | 'sku' | 'updatedAt' (default: 'stock')
- sortOrder: 'asc' | 'desc' (default: 'asc')

Response:
{
  items: [...],
  pagination: {...},
  summary: {
    totalProducts: number,
    lowStockCount: number,
    outOfStockCount: number,
    totalValue: number,
  }
}
```

### 8.2 Stock Adjustment

```
POST /api/admin/inventory/adjust

Request body:
{
  productId: string,
  variationId?: string,
  quantity: number,           // Positive = add, Negative = subtract
  type: 'manual' | 'damage' | 'correction' | 'return',
  reason: string,             // Required for audit
  referenceId?: string,
}

Response:
{
  success: true,
  movement: InventoryMovement,
  newStock: number,
}
```

### 8.3 Movement History

```
GET /api/admin/inventory/movements

Query params:
- productId?: string
- variationId?: string
- sku?: string
- type?: 'in' | 'out' | 'adjustment' | 'reservation' | 'release'
- referenceType?: 'order' | 'return' | 'manual' | 'import'
- startDate?: ISO date
- endDate?: ISO date
- page: number
- per_page: number
```

### 8.4 Low Stock Alerts

```
GET /api/admin/inventory/low-stock

Query params:
- threshold?: number (override default)
- includeOutOfStock: boolean (default: true)
```

---

## 9. Checklist Trien Khai

### Pre-Implementation

- [ ] Review va approve ke hoach nay
- [ ] Backup database truoc migration
- [ ] Setup staging environment

### Phase 0: Schema Consolidation

- [ ] Tao script analyze current data state
- [ ] Tao migration script
- [ ] Test migration on staging
- [ ] Run migration on production
- [ ] Verify data integrity
- [ ] Update utility functions

### Phase 1: Core Module

**Backend:**
- [ ] Types (`types/inventory.ts`)
- [ ] Repository (`lib/repositories/inventoryRepository.ts`)
- [ ] Extended service (`lib/services/inventory-extended.ts`)
- [ ] API: Overview (`/api/admin/inventory`)
- [ ] API: Adjust (`/api/admin/inventory/adjust`)
- [ ] API: Movements (`/api/admin/inventory/movements`)
- [ ] API: Low Stock (`/api/admin/inventory/low-stock`)
- [ ] API: Export (`/api/admin/inventory/export`)
- [ ] Unit tests

**Frontend:**
- [ ] Hooks (`useInventory`, `useInventoryMovements`, `useAdjustStock`)
- [ ] Page: Inventory Overview (`app/admin/inventory/page.tsx`)
- [ ] Component: InventoryTable
- [ ] Component: StockAdjustmentDialog
- [ ] Component: LowStockAlerts
- [ ] Component: InventoryFilters
- [ ] Page: Movements (`app/admin/inventory/movements/page.tsx`)
- [ ] Component: MovementHistory
- [ ] E2E tests

**Integration:**
- [ ] Add to admin sidebar menu
- [ ] Permission check (RBAC)
- [ ] Responsive design verification

### Phase 2: Advanced Features

- [ ] Low stock email notifications
- [ ] Low stock Telegram notifications
- [ ] Stock history charts
- [ ] Bulk import from CSV/Excel
- [ ] Export reports

### Phase 3: Optimization

- [ ] Performance audit
- [ ] Add indexes if needed
- [ ] Implement caching
- [ ] Mobile UI improvements

### Post-Implementation

- [ ] Documentation update
- [ ] User training/guide
- [ ] Monitor for issues
- [ ] Gather feedback

---

## Appendix A: Risk Mitigation Matrix

| Risk ID | Mitigation Strategy | Owner | Status |
|---------|---------------------|-------|--------|
| XD-01 | Migration script + single field | Dev | Pending |
| XD-02 | Utility function | Dev | Pending |
| XD-03 | Migration + utility | Dev | Pending |
| XD-04 | Add reservedQuantity to productDataMetaBox | Dev | Pending |
| XD-05 | Wrap incrementStock/releaseStock in transaction | Dev | Pending |
| XD-06 | Add SKU-based stock adjustment | Dev | Phase 2 |
| XD-07 | Implement inventoryMovements collection | Dev | Pending |
| RR-SEC-01 | Rate limiting + audit | Dev | Pending |
| RR-SEC-02 | isStockRestored flag (existing) | Dev | Done |
| RR-SEC-03 | Validation + database constraint | Dev | Pending |
| RR-DATA-01 | Migration | Dev | Pending |
| RR-DATA-02 | Utility function + migration | Dev | Pending |
| RR-DATA-03 | Cleanup cron job | Dev | Phase 2 |
| RR-DATA-04 | Validation before operations | Dev | Pending |
| RR-PERF-01 | Batch fetch (existing) | Dev | Done |
| RR-PERF-02 | Chunk large orders | Dev | Pending |
| RR-PERF-03 | Optimistic locking + retry | Dev | Pending |
| RR-BIZ-01 | Alert system | Dev | Pending |
| RR-BIZ-02 | Inventory forecast | Dev | Phase 2 |
| RR-BIZ-03 | Multi-warehouse support | Dev | Future |
| RR-BIZ-04 | Batch import/export | Dev | Phase 1 |

---

## Appendix B: Glossary

| Term | Definition |
|------|------------|
| Stock Quantity | Tong so luong trong kho |
| Reserved Quantity | So luong da dat (pending orders) |
| Available Quantity | Stock - Reserved (co the ban) |
| Movement | Mot lan thay doi ton kho |
| Low Stock Threshold | Nguong canh bao ton kho thap |
| Backorder | Cho phep dat hang khi het kho |

---

**Document Control:**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-12-30 | Claude | Initial draft |
| 1.1 | 2025-12-30 | Claude | Fixed heading numbering, added Appendix to TOC |

---

*Ke hoach nay can duoc review va approve truoc khi bat dau trien khai.*
