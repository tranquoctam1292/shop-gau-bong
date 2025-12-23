# Báo Cáo Đánh Giá: Dashboard KiotViet Style

**Ngày:** 2025-01-XX  
**Mục tiêu:** Tạo Dashboard giống KiotViet với charts và analytics  
**File hiện tại:** `app/admin/page.tsx`

---

## 1. PHÂN TÍCH YÊU CẦU TỪ HÌNH ẢNH

### 1.1. Các thành phần cần có:

#### **A. Header Section: "Kết quả bán hàng hôm nay"**
- **Doanh thu card:**
  - Giá trị: 350,000 đ
  - Số hóa đơn: 1 hóa đơn
  - Icon: Dollar sign
  
- **Trả hàng card:**
  - Giá trị: 0
  - Icon: Return/refund icon

#### **B. Net Revenue Section: "Doanh thu thuần"**
- **Large vertical bar chart:**
  - Y-axis: Revenue (0-400k, increments 40k)
  - X-axis: Time (label "23" - có thể là giờ hoặc ngày)
  - Single bar at 350k
  
- **Tabs:**
  - "Theo ngày" (By day) - selected
  - "Theo giờ" (By hour)
  - "Theo thứ" (By week)
  
- **Date picker dropdown:**
  - "Tháng này" (This month)

#### **C. Bottom Sections (Side-by-Side):**

**Left: "Top 10 hàng bán chạy"**
- Horizontal bar chart
- Dropdowns:
  - "Theo doanh thu thuần" (By net revenue)
  - "Tháng này" (This month)
- Chart shows: "Gấu bông cáo, sói mặc đồ - Sói Xám" = 350k

**Right: "Top 10 khách mua nhiều nhất"**
- Empty state: "Chưa có dữ liệu"
- Dropdown: "Tháng này" (This month)

---

## 2. TÍNH KHẢ THI

### ✅ **KHẢ THI CAO**

#### **2.1. Dữ liệu có sẵn:**
- ✅ Orders collection với đầy đủ fields:
  - `grandTotal` (revenue)
  - `status`, `paymentStatus`
  - `createdAt` (date/time)
  - `items[]` (product info)
  - `customerEmail`, `customerName`
- ✅ Products collection với:
  - `name`, `sku`
  - `productDataMetaBox.variations[]`
- ✅ Refunds collection (nếu có) cho "Trả hàng"

#### **2.2. Tech Stack phù hợp:**
- ✅ MongoDB aggregation pipeline - Có thể tính toán stats hiệu quả
- ✅ Next.js API routes - Có thể tạo dedicated stats API
- ✅ React + TypeScript - UI components
- ✅ Tailwind CSS - Styling
- ✅ Radix UI - Tabs, Select components có sẵn
- ✅ date-fns - Date manipulation

#### **2.3. Cần thêm:**
- ⚠️ Chart library (chưa có):
  - **Đề xuất:** `recharts` (React-friendly, lightweight, TypeScript support)
  - **Alternative:** `chart.js` với `react-chartjs-2`
  - **Bundle size:** ~50-100KB (acceptable)

---

## 3. RỦI RO

### 🔴 **CRITICAL RISKS:**

#### **3.1. Performance với large dataset:**
- **Rủi ro:** Nếu có hàng nghìn orders, aggregation có thể chậm
- **Giải pháp:**
  - Tạo MongoDB indexes trên `createdAt`, `status`, `paymentStatus`
  - Cache aggregation results (Redis hoặc in-memory cache)
  - Limit date range queries (max 1 year)
  - Use MongoDB aggregation pipeline thay vì fetch all orders

#### **3.2. Bundle size:**
- **Rủi ro:** Chart library có thể tăng bundle size
- **Giải pháp:**
  - Use dynamic import cho chart components
  - Tree-shake unused chart types
  - Code splitting với Next.js

#### **3.3. Real-time data:**
- **Rủi ro:** Dashboard không auto-refresh, data có thể stale
- **Giải pháp:**
  - Polling mỗi 30-60 giây (optional)
  - Manual refresh button
  - WebSocket (nếu cần real-time)

### ⚠️ **MEDIUM RISKS:**

#### **3.4. Date/timezone handling:**
- **Rủi ro:** MongoDB dates có thể khác timezone của user
- **Giải pháp:**
  - Store dates in UTC
  - Convert to Vietnam timezone (UTC+7) khi hiển thị
  - Use `date-fns-tz` for timezone conversion

#### **3.5. Refunds data:**
- **Rủi ro:** "Trả hàng" cần refunds collection hoặc refund status trong orders
- **Giải pháp:**
  - Check xem có `refunds` collection không
  - Hoặc query orders với `paymentStatus = 'refunded'`
  - Hoặc tạo refunds collection nếu chưa có

---

## 4. LỖI TIỀM ẨN

### 🔴 **CRITICAL:**

#### **4.1. Null/undefined handling:**
- **Lỗi:** `order.grandTotal` có thể null/undefined
- **Giải pháp:** Always use `order.grandTotal || 0` hoặc `Number(order.grandTotal) || 0`

#### **4.2. Date aggregation:**
- **Lỗi:** Grouping by day/hour/week có thể sai nếu timezone không đúng
- **Giải pháp:** 
  - Use MongoDB `$dateToString` với timezone
  - Hoặc convert dates server-side trước khi group

#### **4.3. Product name trong order items:**
- **Lỗi:** `order.items[].productName` có thể không có hoặc outdated
- **Giải pháp:**
  - Snapshot product name khi tạo order (đã có trong schema)
  - Fallback to product lookup nếu không có

### ⚠️ **WARNING:**

#### **4.4. Empty states:**
- **Lỗi:** Charts có thể crash nếu không có data
- **Giải pháp:** Always check `data.length > 0` trước khi render chart

#### **4.5. Large date ranges:**
- **Lỗi:** Querying 1 year of data có thể slow
- **Giải pháp:** Limit default range to 30 days, allow user to select range

---

## 5. XUNG ĐỘT

### ✅ **KHÔNG CÓ XUNG ĐỘT:**

#### **5.1. File structure:**
- ✅ Dashboard hiện tại (`app/admin/page.tsx`) có thể refactor
- ✅ Không conflict với các routes khác
- ✅ Có thể tạo components riêng trong `components/admin/dashboard/`

#### **5.2. API routes:**
- ✅ Có thể tạo `/api/admin/dashboard/stats` mới
- ✅ Không conflict với existing APIs
- ✅ Có thể reuse existing order/product APIs

#### **5.3. Dependencies:**
- ✅ Chart library (recharts) không conflict với existing deps
- ✅ Radix UI Tabs đã có sẵn
- ✅ date-fns đã có sẵn

---

## 6. KẾ HOẠCH HÀNH ĐỘNG

### **Phase 1: Setup & Infrastructure (1-2 ngày)**

#### **1.1. Install dependencies:**
```bash
npm install recharts
npm install --save-dev @types/recharts  # Nếu cần
```

#### **1.2. Create API endpoint:**
- `app/api/admin/dashboard/stats/route.ts`
  - GET endpoint với query params:
    - `dateRange`: 'today' | 'thisMonth' | 'custom'
    - `startDate`, `endDate`: ISO date strings
    - `groupBy`: 'day' | 'hour' | 'week'
  - MongoDB aggregation pipeline:
    - Filter orders by date range
    - Group by date/hour/week
    - Calculate revenue, order count, refunds
    - Return formatted data

#### **1.3. Create API endpoint for top products:**
- `app/api/admin/dashboard/top-products/route.ts`
  - GET endpoint với query params:
    - `dateRange`: 'today' | 'thisMonth' | 'custom'
    - `startDate`, `endDate`
    - `sortBy`: 'revenue' | 'quantity'
    - `limit`: 10
  - MongoDB aggregation:
    - Group by productId
    - Sum revenue, quantity
    - Join with products collection
    - Sort and limit

#### **1.4. Create API endpoint for top customers:**
- `app/api/admin/dashboard/top-customers/route.ts`
  - GET endpoint với query params:
    - `dateRange`: 'today' | 'thisMonth' | 'custom'
    - `startDate`, `endDate`
    - `limit`: 10
  - MongoDB aggregation:
    - Group by customerEmail
    - Sum revenue, order count
    - Sort by revenue desc
    - Limit 10

---

### **Phase 2: UI Components (2-3 ngày)**

#### **2.1. Create dashboard components:**
- `components/admin/dashboard/TodayStatsCards.tsx`
  - Doanh thu card
  - Trả hàng card
  
- `components/admin/dashboard/RevenueChart.tsx`
  - Vertical bar chart với recharts
  - Tabs: Theo ngày, Theo giờ, Theo thứ
  - Date picker dropdown
  
- `components/admin/dashboard/TopProductsChart.tsx`
  - Horizontal bar chart
  - Dropdowns: Sort by, Date range
  
- `components/admin/dashboard/TopCustomersList.tsx`
  - Table/list view
  - Empty state: "Chưa có dữ liệu"
  - Date range dropdown

#### **2.2. Create hooks:**
- `lib/hooks/useDashboardStats.ts`
  - Fetch today stats
  - Fetch revenue chart data
  - Fetch top products
  - Fetch top customers
  - Use React Query for caching

---

### **Phase 3: Integration (1-2 ngày)**

#### **3.1. Refactor `app/admin/page.tsx`:**
- Replace simple stat cards với new dashboard layout
- Integrate all new components
- Add loading states
- Add error handling

#### **3.2. Add date range utilities:**
- `lib/utils/dateRange.ts`
  - Functions: `getTodayRange()`, `getThisMonthRange()`, `getCustomRange()`
  - Timezone conversion (UTC+7)

#### **3.3. Add MongoDB indexes:**
- Create script: `scripts/setup-dashboard-indexes.ts`
  - Index on `orders.createdAt`
  - Index on `orders.status`
  - Index on `orders.paymentStatus`
  - Index on `orders.customerEmail`

---

### **Phase 4: Testing & Optimization (1-2 ngày)**

#### **4.1. Performance testing:**
- Test với 1000+ orders
- Test với date range 1 year
- Optimize aggregation pipelines
- Add caching nếu cần

#### **4.2. Error handling:**
- Test empty states
- Test error states
- Test loading states
- Test date range edge cases

#### **4.3. Mobile responsiveness:**
- Test trên mobile devices
- Ensure charts responsive
- Test touch interactions

---

## 7. FILES CẦN TẠO/SỬA

### **API Routes:**
1. `app/api/admin/dashboard/stats/route.ts` - Main stats endpoint
2. `app/api/admin/dashboard/top-products/route.ts` - Top products
3. `app/api/admin/dashboard/top-customers/route.ts` - Top customers

### **Components:**
1. `components/admin/dashboard/TodayStatsCards.tsx`
2. `components/admin/dashboard/RevenueChart.tsx`
3. `components/admin/dashboard/TopProductsChart.tsx`
4. `components/admin/dashboard/TopCustomersList.tsx`

### **Hooks:**
1. `lib/hooks/useDashboardStats.ts`

### **Utils:**
1. `lib/utils/dateRange.ts`

### **Scripts:**
1. `scripts/setup-dashboard-indexes.ts`

### **Modified:**
1. `app/admin/page.tsx` - Refactor to new dashboard
2. `package.json` - Add recharts dependency

---

## 8. MONGODB AGGREGATION PIPELINES

### **8.1. Today Stats:**
```javascript
[
  {
    $match: {
      createdAt: { $gte: todayStart, $lt: todayEnd },
      status: { $ne: 'cancelled' }
    }
  },
  {
    $group: {
      _id: null,
      revenue: { $sum: { $toDouble: '$grandTotal' } },
      orderCount: { $sum: 1 },
      refunds: {
        $sum: {
          $cond: [{ $eq: ['$paymentStatus', 'refunded'] }, 1, 0]
        }
      }
    }
  }
]
```

### **8.2. Revenue Chart (by day/hour/week):**
```javascript
[
  {
    $match: {
      createdAt: { $gte: startDate, $lte: endDate },
      status: 'completed',
      paymentStatus: 'paid'
    }
  },
  {
    $group: {
      _id: {
        $dateToString: {
          format: groupBy === 'day' ? '%Y-%m-%d' : groupBy === 'hour' ? '%Y-%m-%d-%H' : '%Y-%W',
          date: '$createdAt',
          timezone: 'Asia/Ho_Chi_Minh'
        }
      },
      revenue: { $sum: { $toDouble: '$grandTotal' } },
      orderCount: { $sum: 1 }
    }
  },
  { $sort: { _id: 1 } }
]
```

### **8.3. Top Products:**
```javascript
[
  {
    $match: {
      createdAt: { $gte: startDate, $lte: endDate },
      status: 'completed',
      paymentStatus: 'paid'
    }
  },
  { $unwind: '$items' },
  {
    $group: {
      _id: '$items.productId',
      productName: { $first: '$items.productName' },
      revenue: {
        $sum: {
          $multiply: [
            { $toDouble: '$items.price' },
            { $toInt: '$items.quantity' }
          ]
        }
      },
      quantity: { $sum: { $toInt: '$items.quantity' } }
    }
  },
  { $sort: { revenue: -1 } },
  { $limit: 10 }
]
```

### **8.4. Top Customers:**
```javascript
[
  {
    $match: {
      createdAt: { $gte: startDate, $lte: endDate },
      status: 'completed',
      paymentStatus: 'paid'
    }
  },
  {
    $group: {
      _id: '$customerEmail',
      customerName: { $first: '$customerName' },
      revenue: { $sum: { $toDouble: '$grandTotal' } },
      orderCount: { $sum: 1 }
    }
  },
  { $sort: { revenue: -1 } },
  { $limit: 10 }
]
```

---

## 9. ESTIMATED TIMELINE

| Phase | Tasks | Time | Priority |
|-------|-------|------|----------|
| Phase 1 | Setup & Infrastructure | 1-2 ngày | HIGH |
| Phase 2 | UI Components | 2-3 ngày | HIGH |
| Phase 3 | Integration | 1-2 ngày | HIGH |
| Phase 4 | Testing & Optimization | 1-2 ngày | MEDIUM |
| **Total** | | **5-9 ngày** | |

---

## 10. DEPENDENCIES

### **New Dependencies:**
- `recharts` - Chart library (~50KB gzipped)
- `date-fns-tz` (optional) - Timezone support

### **Existing Dependencies (reuse):**
- `@radix-ui/react-tabs` - Tabs component
- `@radix-ui/react-select` - Dropdown/Select
- `@tanstack/react-query` - Data fetching & caching
- `date-fns` - Date manipulation
- `lucide-react` - Icons

---

## 11. KẾT LUẬN

### ✅ **TÍNH KHẢ THI: CAO**

**Lý do:**
1. ✅ Dữ liệu đầy đủ trong MongoDB
2. ✅ Tech stack phù hợp
3. ✅ Không có xung đột
4. ✅ Có thể implement trong 5-9 ngày

### ⚠️ **RỦI RO: TRUNG BÌNH**

**Cần chú ý:**
1. ⚠️ Performance với large dataset
2. ⚠️ Bundle size (chart library)
3. ⚠️ Date/timezone handling

### 🔴 **LỖI TIỀM ẨN: CÓ THỂ XỬ LÝ**

**Cần fix:**
1. 🔴 Null/undefined handling
2. 🔴 Date aggregation accuracy
3. 🔴 Empty states

---

## 12. RECOMMENDATION

### **✅ NÊN THỰC HIỆN**

**Lý do:**
- Dashboard hiện tại quá đơn giản
- KiotViet style sẽ cải thiện UX đáng kể
- Có thể implement an toàn với proper error handling
- Performance có thể optimize với MongoDB aggregation

### **📋 NEXT STEPS:**

1. **Chờ chỉ thị từ user**
2. **Nếu approve:**
   - Bắt đầu Phase 1: Install dependencies và tạo API endpoints
   - Implement từng component một
   - Test kỹ trước khi merge

---

**END OF REPORT**

