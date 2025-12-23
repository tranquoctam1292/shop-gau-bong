# Deep Review: Backend-Frontend Integration Patterns

**Ngày:** 2025-01-XX  
**Mục đích:** Review patterns kết nối backend-frontend để chuẩn bị cho Dashboard KiotViet  
**Scope:** Admin Panel modules

---

## 1. TỔNG QUAN PATTERNS

### **1.1. Data Fetching Patterns**

#### **Pattern A: Direct Fetch với useState/useEffect (Phổ biến nhất)**
**Sử dụng trong:**
- `app/admin/orders/page.tsx`
- `app/admin/products/page.tsx`
- `app/admin/posts/page.tsx`
- `app/admin/categories/page.tsx`
- `app/admin/page.tsx` (Dashboard hiện tại)

**Code Pattern:**
```typescript
const [data, setData] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

const fetchData = useCallback(async () => {
  setLoading(true);
  try {
    const response = await fetch(`/api/admin/...`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    setData(data.items || []);
  } catch (error) {
    console.error('Error:', error);
    setError(error);
  } finally {
    setLoading(false);
  }
}, [dependencies]);

useEffect(() => {
  fetchData();
}, [fetchData]);
```

**Ưu điểm:**
- ✅ Đơn giản, dễ hiểu
- ✅ Không cần thêm dependencies
- ✅ Full control over loading/error states

**Nhược điểm:**
- ❌ Không có caching tự động
- ❌ Không có request deduplication
- ❌ Phải tự quản lý loading/error states
- ❌ Không có background refetch

---

#### **Pattern B: React Query Hooks (Được khuyến nghị)**
**Sử dụng trong:**
- `lib/hooks/useAdminUsers.ts`
- `lib/hooks/useCategories.ts`
- `lib/hooks/useMedia.ts`
- `lib/hooks/useProductVariations.ts`
- `app/admin/settings/*` components

**Code Pattern:**
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Fetch hook
export function useAdminUsers(params = {}) {
  return useQuery({
    queryKey: ['admin-users', params],
    queryFn: () => fetchAdminUsers(params),
    staleTime: 30 * 1000, // 30 seconds
    retry: 1,
  });
}

// Mutation hook
export function useUpdateMedia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      const response = await fetch(`/api/admin/media/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media'] });
    },
  });
}
```

**Ưu điểm:**
- ✅ Automatic caching
- ✅ Request deduplication
- ✅ Background refetch
- ✅ Optimistic updates
- ✅ Error retry logic
- ✅ Loading states tự động

**Nhược điểm:**
- ⚠️ Cần setup QueryProvider
- ⚠️ Bundle size tăng nhẹ (~10KB)

---

### **1.2. Authentication Patterns**

#### **Backend: `withAuthAdmin` Middleware**
**Location:** `lib/middleware/authMiddleware.ts`

**Pattern:**
```typescript
export async function GET(request: NextRequest) {
  return withAuthAdmin(request, async (req: AuthenticatedRequest) => {
    // req.adminUser is guaranteed to be available here
    // Permission check is done by middleware
    return NextResponse.json({ data: ... });
  }, 'order:read'); // Optional permission check
}
```

**Checks:**
1. ✅ User is authenticated (session)
2. ✅ User exists in database
3. ✅ User is active
4. ✅ Token version matches (token revocation)
5. ✅ Rate limiting (GET: 60/min, Others: 20/min)
6. ✅ Password change required check
7. ✅ Permission check (if specified)

---

#### **Frontend: `credentials: 'include'`**
**Pattern:**
```typescript
const response = await fetch('/api/admin/...', {
  method: 'GET',
  credentials: 'include', // CRITICAL: Required for admin APIs
  headers: { 'Content-Type': 'application/json' },
});
```

**Status:**
- ✅ **Dashboard (`app/admin/page.tsx`):** Đã có `credentials: 'include'`
- ✅ **Settings pages:** Đã có `credentials: 'include'`
- ✅ **OrderStatusSelect:** Đã có `credentials: 'include'`
- ⚠️ **Orders page (`app/admin/orders/page.tsx`):** THIẾU `credentials: 'include'`
- ⚠️ **Products page (`app/admin/products/page.tsx`):** THIẾU `credentials: 'include'`
- ⚠️ **Posts page:** THIẾU `credentials: 'include'`
- ⚠️ **Categories page:** THIẾU `credentials: 'include'`

**🔴 CRITICAL ISSUE:** Nhiều pages thiếu `credentials: 'include'`, có thể gây 401 errors trên Vercel.

---

### **1.3. Error Handling Patterns**

#### **Pattern A: Try-Catch với Console Error (Phổ biến)**
```typescript
try {
  const response = await fetch('/api/admin/...');
  const data = await response.json();
  setData(data);
} catch (error) {
  console.error('Error:', error);
  // No user feedback
}
```

**Vấn đề:**
- ❌ User không biết có lỗi
- ❌ Không có retry mechanism
- ❌ Error chỉ log ra console

**Sử dụng trong:**
- `app/admin/orders/page.tsx` (line 158-160)
- `app/admin/posts/page.tsx` (line 54-56)
- `app/admin/categories/page.tsx` (line 104-106)

---

#### **Pattern B: Error State với User Feedback (Tốt hơn)**
```typescript
const [error, setError] = useState<string | null>(null);

try {
  const response = await fetch('/api/admin/...');
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const data = await response.json();
  setData(data);
  setError(null); // Clear error on success
} catch (error) {
  console.error('Error:', error);
  setError(error instanceof Error ? error.message : 'Có lỗi xảy ra');
}
```

**Sử dụng trong:**
- `app/admin/page.tsx` (Dashboard)
- `app/admin/products/page.tsx`

---

#### **Pattern C: Toast Notifications (Tốt nhất)**
```typescript
import { useToastContext } from '@/components/providers/ToastProvider';

const { showToast } = useToastContext();

try {
  const response = await fetch('/api/admin/...');
  if (!response.ok) {
    const error = await response.json();
    showToast(error.error || 'Có lỗi xảy ra', 'error');
    return;
  }
  showToast('Thành công', 'success');
} catch (error) {
  showToast('Có lỗi xảy ra', 'error');
}
```

**Sử dụng trong:**
- `components/admin/orders/OrderStatusSelect.tsx`
- `app/admin/settings/*` pages
- `app/admin/attributes/page.tsx`

---

### **1.4. Response Status Checking**

#### **Pattern A: Không check `response.ok` (NGUY HIỂM)**
```typescript
const response = await fetch('/api/admin/...');
const data = await response.json(); // ❌ Có thể parse error response
setData(data);
```

**Vấn đề:**
- ❌ Parse error response như success data
- ❌ Không biết có lỗi xảy ra
- ❌ Có thể crash nếu response không phải JSON

**Sử dụng trong:**
- `app/admin/orders/page.tsx` (line 152-153) - ⚠️ **CRITICAL**
- `app/admin/posts/page.tsx` (line 49-50) - ⚠️ **CRITICAL**
- `app/admin/categories/page.tsx` (line 85-88) - ⚠️ **CRITICAL**

---

#### **Pattern B: Check `response.ok` (ĐÚNG)**
```typescript
const response = await fetch('/api/admin/...');
if (!response.ok) {
  throw new Error(`HTTP error! status: ${response.status}`);
}
const data = await response.json();
setData(data);
```

**Sử dụng trong:**
- `app/admin/page.tsx` (Dashboard) - ✅
- `app/admin/products/page.tsx` (line 148-152) - ✅

---

### **1.5. Loading States**

#### **Pattern A: Simple Loading State**
```typescript
const [loading, setLoading] = useState(true);

if (loading) {
  return <div>Đang tải...</div>;
}
```

**Sử dụng trong:**
- `app/admin/posts/page.tsx`
- `app/admin/categories/page.tsx`

---

#### **Pattern B: Skeleton Loader (Tốt hơn)**
```typescript
if (loading) {
  return (
    <div className="space-y-6">
      <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
      <div className="grid grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader>
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

**Sử dụng trong:**
- `app/admin/page.tsx` (Dashboard) - ✅

---

### **1.6. Type Safety**

#### **Pattern A: Implicit `any` (NGUY HIỂM)**
```typescript
const data = await response.json();
setData(data.items || []); // ❌ data có type any
```

**Vấn đề:**
- ❌ Không có type checking
- ❌ Dễ gây runtime errors
- ❌ IDE không có autocomplete

---

#### **Pattern B: Type Assertions (Tốt hơn)**
```typescript
interface Order {
  _id: string;
  orderNumber: string;
  // ...
}

const data = await response.json() as { orders: Order[] };
setOrders(data.orders || []);
```

**Sử dụng trong:**
- `app/admin/orders/page.tsx` - ✅

---

#### **Pattern C: Zod Validation (Tốt nhất)**
```typescript
import { z } from 'zod';

const OrderSchema = z.object({
  _id: z.string(),
  orderNumber: z.string(),
  // ...
});

const data = await response.json();
const validated = OrderSchema.array().parse(data.orders);
setOrders(validated);
```

**Sử dụng trong:**
- Backend API routes (validation)
- Frontend: Chưa có (nên thêm)

---

## 2. API RESPONSE FORMATS

### **2.1. Standard Response Format**

#### **Success Response:**
```typescript
{
  orders: Order[],
  pagination: {
    total: number,
    totalPages: number,
    currentPage: number,
    perPage: number,
    hasNextPage: boolean,
    hasPrevPage: boolean,
  },
  filters?: {
    // Applied filters
  }
}
```

**Sử dụng trong:**
- `/api/admin/orders` - ✅
- `/api/admin/products` - ✅
- `/api/admin/posts` - ✅

---

#### **Error Response:**
```typescript
{
  error: string,
  message?: string,
  code?: string,
  details?: {
    stack?: string, // Only in development
  }
}
```

**Sử dụng trong:**
- Tất cả admin API routes - ✅

---

### **2.2. Query Parameters**

#### **Common Parameters:**
- `page`: number (default: 1)
- `per_page`: number (default: 10-20)
- `search`: string
- `status`: string | string[] (comma-separated)
- `sortBy`: string
- `sortOrder`: 'asc' | 'desc'
- `fromDate`, `toDate`: ISO date strings

---

## 3. CÁC VẤN ĐỀ TIỀM ẨN

### **🔴 CRITICAL ISSUES:**

#### **3.1. Thiếu `credentials: 'include'` trong nhiều pages**
**Files bị ảnh hưởng:**
- `app/admin/orders/page.tsx` - Line 152
- `app/admin/products/page.tsx` - Line 148
- `app/admin/posts/page.tsx` - Line 49
- `app/admin/categories/page.tsx` - Line 85
- `app/admin/attributes/page.tsx` - Line 36
- `app/admin/authors/page.tsx` - Line 34
- `app/admin/comments/page.tsx` - Line 45

**Hệ quả:**
- ❌ 401 Unauthorized errors trên Vercel
- ❌ Authentication cookies không được gửi
- ❌ API calls fail silently

**Giải pháp:**
- Thêm `credentials: 'include'` vào tất cả fetch calls

---

#### **3.2. Không check `response.ok` trước khi parse JSON**
**Files bị ảnh hưởng:**
- `app/admin/orders/page.tsx` - Line 152-153
- `app/admin/posts/page.tsx` - Line 49-50
- `app/admin/categories/page.tsx` - Line 85-88
- `app/admin/attributes/page.tsx` - Line 36-38

**Hệ quả:**
- ❌ Parse error response như success data
- ❌ Không biết có lỗi xảy ra
- ❌ Có thể crash nếu response không phải JSON

**Giải pháp:**
- Always check `response.ok` trước khi parse JSON

---

#### **3.3. Error chỉ log ra console, không hiển thị cho user**
**Files bị ảnh hưởng:**
- `app/admin/orders/page.tsx` - Line 158-160
- `app/admin/posts/page.tsx` - Line 54-56
- `app/admin/categories/page.tsx` - Line 104-106

**Hệ quả:**
- ❌ User không biết có lỗi
- ❌ Không có retry mechanism
- ❌ Poor UX

**Giải pháp:**
- Thêm error state hoặc toast notifications

---

### **⚠️ WARNING ISSUES:**

#### **3.4. Không sử dụng React Query cho data fetching**
**Files bị ảnh hưởng:**
- Hầu hết admin pages sử dụng direct fetch

**Hệ quả:**
- ❌ Không có caching
- ❌ Không có request deduplication
- ❌ Phải tự quản lý loading/error states
- ❌ Performance kém hơn

**Giải pháp:**
- Migrate sang React Query hooks (optional, nhưng recommended)

---

#### **3.5. Type safety không đầy đủ**
**Vấn đề:**
- Nhiều nơi sử dụng `any` type
- Không có runtime validation với Zod

**Giải pháp:**
- Thêm type definitions
- Sử dụng Zod validation ở frontend (optional)

---

## 4. BEST PRACTICES CHO DASHBOARD MỚI

### **4.1. Data Fetching**

#### **✅ NÊN:**
1. **Sử dụng React Query hooks:**
   ```typescript
   export function useDashboardStats(dateRange: DateRange) {
     return useQuery({
       queryKey: ['dashboard-stats', dateRange],
       queryFn: () => fetchDashboardStats(dateRange),
       staleTime: 30 * 1000, // 30 seconds
       retry: 1,
     });
   }
   ```

2. **Always include `credentials: 'include'`:**
   ```typescript
   const response = await fetch('/api/admin/dashboard/stats', {
     credentials: 'include',
   });
   ```

3. **Check `response.ok` trước khi parse:**
   ```typescript
   if (!response.ok) {
     throw new Error(`HTTP error! status: ${response.status}`);
   }
   const data = await response.json();
   ```

4. **Use TypeScript interfaces:**
   ```typescript
   interface DashboardStats {
     revenue: number;
     orderCount: number;
     refunds: number;
   }
   ```

---

#### **❌ KHÔNG NÊN:**
1. ❌ Direct fetch trong component (use hooks instead)
2. ❌ Thiếu `credentials: 'include'`
3. ❌ Parse JSON trước khi check `response.ok`
4. ❌ Sử dụng `any` type
5. ❌ Error chỉ log ra console

---

### **4.2. Error Handling**

#### **✅ NÊN:**
1. **Use ToastProvider:**
   ```typescript
   const { showToast } = useToastContext();
   showToast('Có lỗi xảy ra', 'error');
   ```

2. **Error state với retry button:**
   ```typescript
   if (error) {
     return (
       <Card>
         <CardContent>
           <p className="text-red-600">{error}</p>
           <Button onClick={refetch}>Thử lại</Button>
         </CardContent>
       </Card>
     );
   }
   ```

3. **Handle specific error codes:**
   ```typescript
   if (response.status === 401) {
     showToast('Phiên đăng nhập đã hết hạn', 'error');
     router.push('/admin/login');
   }
   ```

---

### **4.3. Loading States**

#### **✅ NÊN:**
1. **Skeleton loaders:**
   ```typescript
   if (isLoading) {
     return <DashboardSkeleton />;
   }
   ```

2. **Loading indicators trong components:**
   ```typescript
   {isLoading && <Loader2 className="animate-spin" />}
   ```

---

### **4.4. API Design**

#### **✅ NÊN:**
1. **Dedicated stats endpoint:**
   ```
   GET /api/admin/dashboard/stats?dateRange=today&groupBy=day
   ```

2. **MongoDB aggregation:**
   ```typescript
   const stats = await orders.aggregate([
     { $match: { ... } },
     { $group: { ... } },
     { $sort: { ... } },
   ]).toArray();
   ```

3. **Consistent response format:**
   ```typescript
   {
     success: true,
     data: { ... },
     pagination?: { ... },
   }
   ```

---

## 5. RECOMMENDED ARCHITECTURE CHO DASHBOARD

### **5.1. File Structure:**
```
app/admin/page.tsx                    # Main dashboard page
components/admin/dashboard/
  ├── TodayStatsCards.tsx            # Header cards
  ├── RevenueChart.tsx               # Revenue chart
  ├── TopProductsChart.tsx           # Top products
  ├── TopCustomersList.tsx           # Top customers
  └── DashboardSkeleton.tsx         # Loading skeleton

lib/hooks/
  └── useDashboardStats.ts          # React Query hook

app/api/admin/dashboard/
  ├── stats/route.ts                 # Main stats endpoint
  ├── top-products/route.ts          # Top products
  └── top-customers/route.ts        # Top customers
```

---

### **5.2. Hook Pattern:**
```typescript
// lib/hooks/useDashboardStats.ts
export function useDashboardStats(options: DashboardStatsOptions) {
  return useQuery({
    queryKey: ['dashboard-stats', options],
    queryFn: () => fetchDashboardStats(options),
    staleTime: 30 * 1000,
    retry: 1,
  });
}

async function fetchDashboardStats(options: DashboardStatsOptions) {
  const params = new URLSearchParams({
    dateRange: options.dateRange,
    groupBy: options.groupBy,
  });
  
  const response = await fetch(`/api/admin/dashboard/stats?${params}`, {
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch stats: ${response.status}`);
  }
  
  return response.json();
}
```

---

### **5.3. Component Pattern:**
```typescript
// components/admin/dashboard/RevenueChart.tsx
'use client';

import { useDashboardStats } from '@/lib/hooks/useDashboardStats';
import { useToastContext } from '@/components/providers/ToastProvider';

export function RevenueChart({ dateRange, groupBy }: Props) {
  const { showToast } = useToastContext();
  const { data, isLoading, error } = useDashboardStats({ dateRange, groupBy });
  
  if (isLoading) {
    return <ChartSkeleton />;
  }
  
  if (error) {
    showToast('Có lỗi xảy ra khi tải dữ liệu', 'error');
    return <ErrorState onRetry={() => refetch()} />;
  }
  
  return <Chart data={data} />;
}
```

---

## 6. CHECKLIST CHO DASHBOARD IMPLEMENTATION

### **✅ Data Fetching:**
- [ ] Sử dụng React Query hooks
- [ ] Always include `credentials: 'include'`
- [ ] Check `response.ok` trước khi parse JSON
- [ ] TypeScript interfaces cho all data types
- [ ] Error handling với toast notifications

### **✅ API Design:**
- [ ] Dedicated `/api/admin/dashboard/stats` endpoint
- [ ] MongoDB aggregation pipelines
- [ ] Consistent response format
- [ ] Query parameters cho date range, groupBy
- [ ] Authentication với `withAuthAdmin`

### **✅ UI/UX:**
- [ ] Skeleton loaders cho loading states
- [ ] Error states với retry button
- [ ] Toast notifications cho errors/success
- [ ] Mobile-responsive charts
- [ ] Empty states cho no data

### **✅ Performance:**
- [ ] MongoDB indexes trên `createdAt`, `status`, `paymentStatus`
- [ ] React Query caching (30s staleTime)
- [ ] Code splitting cho chart library
- [ ] Limit date range queries (max 1 year)

---

## 7. KẾT LUẬN

### **✅ Patterns tốt cần follow:**
1. React Query hooks cho data fetching
2. `credentials: 'include'` cho tất cả admin API calls
3. Check `response.ok` trước khi parse JSON
4. Toast notifications cho error handling
5. Skeleton loaders cho loading states
6. TypeScript interfaces cho type safety

### **🔴 Issues cần fix trước khi implement Dashboard:**
1. Thêm `credentials: 'include'` vào các pages thiếu
2. Check `response.ok` trong các pages thiếu
3. Thêm error handling với user feedback

### **⚠️ Recommendations:**
1. Migrate existing pages sang React Query (optional)
2. Thêm Zod validation ở frontend (optional)
3. Create reusable hooks cho common patterns

---

**END OF REPORT**

