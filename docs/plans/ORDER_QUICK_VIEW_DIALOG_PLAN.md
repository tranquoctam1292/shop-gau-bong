# 📋 KẾ HOẠCH TRIỂN KHAI: TÍNH NĂNG XEM NHANH ĐƠN HÀNG (Order Quick View Dialog)

**Ngày tạo:** 2025-01-XX  
**Ngày review:** 2025-01-XX  
**Ngày bắt đầu:** 2025-01-XX  
**Trạng thái:** 🚧 In Progress (Phase 1-4 Completed)  
**Độ ưu tiên:** Medium  
**Ước tính thời gian:** 2-3 ngày  
**Thời gian thực tế:** ~4 giờ (nhanh hơn dự kiến)

**Review Status:** ✅ Dependencies verified, Patterns identified, Ready for implementation  
**Implementation Status:** ✅ Phase 1-4 Completed, Phase 5 (Testing & Polish) In Progress

---

## 🎯 MỤC TIÊU

Tạo tính năng **Xem nhanh đơn hàng** sử dụng Dialog component để:
- Cho phép admin xem thông tin đơn hàng nhanh chóng mà không cần navigate sang trang chi tiết
- Cải thiện UX khi làm việc với danh sách đơn hàng
- Giảm số lần navigate và tăng tốc độ xử lý đơn hàng

---

## 📊 ĐÁNH GIÁ KHẢ THI

### ✅ Khả thi - HIGH

**Lý do:**
1. **API sẵn có:** Endpoint `/api/admin/orders/[id]` đã tồn tại và hoạt động tốt
2. **Component sẵn có:** Dialog component (`components/ui/dialog.tsx`) từ Shadcn UI đã được sử dụng rộng rãi trong project
3. **Data structure rõ ràng:** Order schema và OrderDetail component đã định nghĩa rõ cấu trúc dữ liệu
4. **Pattern tương tự:** Project đã có nhiều modal/dialog components (ProductQuickEditDialog, CancelOrderModal, etc.) làm reference
5. **Không cần thay đổi backend:** Chỉ cần tạo frontend component mới

**Độ phức tạp:** ⭐⭐☆☆☆ (Low-Medium)

---

## ⚠️ RỦI RO VÀ XUNG ĐỘT TIỀM ẨN

### 🔴 HIGH RISK

#### 1. **Xung đột với Navigation hiện tại**
- **Vấn đề:** Button "Xem" hiện tại sử dụng `Link` component để navigate đến detail page
- **Rủi ro:** Nếu thay đổi trực tiếp, có thể phá vỡ workflow của admin muốn mở full page
- **Giải pháp:** 
  - Thêm button mới "Xem nhanh" với icon khác (Eye icon với badge hoặc QuickView icon)
  - Hoặc thay đổi button "Xem" thành dropdown menu với 2 options: "Xem nhanh" và "Xem chi tiết"
  - **Khuyến nghị:** Giữ nguyên button "Xem" (navigate), thêm button "Xem nhanh" riêng

#### 2. **Mobile UX - Dialog không phù hợp**
- **Vấn đề:** Dialog trên mobile có thể chiếm quá nhiều không gian, khó scroll
- **Rủi ro:** UX kém trên mobile (90% traffic là mobile theo project rules)
- **Giải pháp:**
  - Sử dụng Sheet component (drawer) trên mobile thay vì Dialog
  - Hoặc responsive: Dialog trên desktop, Sheet trên mobile
  - **Khuyến nghị:** Sử dụng Sheet component cho mobile, Dialog cho desktop

#### 3. **Performance - Load quá nhiều data**
- **Vấn đề:** Order detail API có thể trả về nhiều data (items, history, etc.)
- **Rủi ro:** Dialog mở chậm, ảnh hưởng UX
- **Giải pháp:**
  - Tạo API endpoint mới `/api/admin/orders/[id]/quick-view` chỉ trả về data cần thiết
  - Hoặc sử dụng query parameters để filter data: `?fields=basic,items,shipping`
  - **Khuyến nghị:** Tạo lightweight endpoint mới cho quick view

### 🟡 MEDIUM RISK

#### 4. **State Management - Dialog state**
- **Vấn đề:** Cần quản lý state của dialog (open/close, orderId, loading)
- **Rủi ro:** State không sync, dialog không đóng đúng cách
- **Giải pháp:** Sử dụng controlled component pattern với `open` và `onOpenChange` props

#### 5. **Error Handling - Order not found**
- **Vấn đề:** Order có thể bị xóa hoặc không tồn tại khi click
- **Rủi ro:** Dialog hiển thị lỗi, UX kém
- **Giải pháp:** 
  - Check `response.ok` trước khi parse JSON
  - Hiển thị error state trong dialog với message rõ ràng
  - Auto-close dialog sau 3s nếu lỗi

#### 6. **Accessibility - Keyboard navigation**
- **Vấn đề:** Dialog cần hỗ trợ keyboard navigation (ESC to close, Tab navigation)
- **Rủi ro:** Không accessible cho users dùng keyboard
- **Giải pháp:** Shadcn Dialog đã hỗ trợ sẵn, chỉ cần đảm bảo không override behavior

### 🟢 LOW RISK

#### 7. **Type Safety - Order interface**
- **Vấn đề:** Order interface có thể khác nhau giữa list và detail
- **Rủi ro:** TypeScript errors, runtime errors
- **Giải pháp:** Tạo interface riêng cho QuickView hoặc reuse Order interface từ OrderDetail

#### 8. **Styling - Responsive design**
- **Vấn đề:** Dialog cần responsive, không bị overflow trên mobile
- **Rủi ro:** UI bị vỡ trên mobile
- **Giải pháp:** Sử dụng Tailwind responsive classes, test trên mobile viewport

---

## 🏗️ KIẾN TRÚC VÀ THIẾT KẾ

### Component Structure

```
components/admin/orders/
├── OrderQuickViewDialog.tsx    (NEW) - Main dialog component
└── OrderQuickViewContent.tsx   (NEW) - Content component (optional, for separation)
```

### API Endpoint

**Option 1: Tạo endpoint mới (Khuyến nghị)**
```
GET /api/admin/orders/[id]/quick-view
Response: {
  order: {
    _id, orderNumber, status, paymentStatus, paymentMethod,
    customerName, customerEmail, customerPhone,
    grandTotal, subtotal, shippingTotal, discountTotal, taxTotal,
    shippingAddress, shipping, // Support both structures
    createdAt, updatedAt,
    items: [{ _id, productName, quantity, price, total, variant }]
  }
}
```

**Note:** Endpoint hiện tại `/api/admin/orders/[id]` đã support query by ObjectId hoặc orderNumber. Quick-view endpoint nên follow pattern này.

**Option 2: Sử dụng endpoint hiện tại với query params**
```
GET /api/admin/orders/[id]?view=quick
Response: Same as current, but filter on frontend
```

**Khuyến nghị:** Option 1 - Tạo endpoint mới để optimize performance

### UI/UX Design

**Desktop (Dialog):**
- Width: `max-w-2xl` hoặc `max-w-3xl`
- Scrollable content với max-height
- Header: Order number + Status badge
- Sections:
  1. Order Info (Status, Payment, Dates)
  2. Customer Info (Name, Email, Phone)
  3. Shipping Address
  4. Order Items (Table với product name, quantity, price, total)
  5. Order Totals (Subtotal, Shipping, Discount, Grand Total)
- Footer: Button "Xem chi tiết" (link to full page) + "Đóng"

**Mobile (Sheet):**
- Full width drawer từ bottom
- Same content structure
- Sticky header với close button
- Footer buttons fixed at bottom

---

## 📅 CÁC PHASE TRIỂN KHAI

### Phase 1: Setup & API (Day 1 - Morning) ✅ COMPLETED

**Mục tiêu:** Tạo API endpoint và component structure

#### Tasks:
1. ✅ **Tạo API endpoint `/api/admin/orders/[id]/quick-view`** - COMPLETED
   - File: `app/api/admin/orders/[id]/quick-view/route.ts` ✅
   - Logic: Query order + items, return only necessary fields ✅
   - Authentication: Sử dụng `withAuthAdmin` middleware ✅
   - Error handling: 404 if order not found, 500 for server errors ✅
   - **Thời gian thực tế:** ~1 giờ

2. ✅ **Tạo TypeScript interfaces** - COMPLETED
   - File: `types/order.ts` ✅
   - Interface: `OrderQuickView` với các fields cần thiết ✅
   - **Thời gian thực tế:** ~15 phút

3. ✅ **Tạo component structure** - COMPLETED
   - File: `components/admin/orders/OrderQuickViewDialog.tsx` ✅
   - Props: `orderId: string`, `open: boolean`, `onOpenChange: (open: boolean) => void` ✅
   - State: `order`, `loading`, `error` ✅
   - **Thời gian thực tế:** ~30 phút (bao gồm cả UI implementation)

**Deliverables:**
- ✅ API endpoint hoạt động
- ✅ Component structure sẵn sàng
- ✅ Types defined

---

### Phase 2: UI Implementation - Desktop (Day 1 - Afternoon) ✅ COMPLETED

**Mục tiêu:** Implement Dialog UI cho desktop

#### Tasks:
4. ✅ **Implement Dialog component (Desktop)** - COMPLETED
   - Sử dụng `Dialog` từ `@/components/ui/dialog` ✅
   - Header: Order number + Status badge ✅
   - Sections layout với Card components ✅
   - Order items table ✅
   - Footer với buttons ✅
   - **Thời gian thực tế:** Đã bao gồm trong Task 3

5. ✅ **Implement Order Info Section** - COMPLETED
   - Status badge với color coding ✅
   - Payment status + method ✅
   - Created/Updated dates ✅
   - **Thời gian thực tế:** Đã bao gồm trong component

6. ✅ **Implement Customer Info Section** - COMPLETED
   - Customer name, email, phone ✅
   - Compact layout ✅
   - **Thời gian thực tế:** Đã bao gồm trong component

7. ✅ **Implement Shipping Address Section** - COMPLETED
   - Format address đầy đủ ✅
   - Handle null/undefined cases ✅
   - **Thời gian thực tế:** Đã bao gồm trong component

8. ✅ **Implement Order Items Table** - COMPLETED
   - Table với columns: Product, Variant, Quantity, Price, Total ✅
   - Responsive table (scrollable on mobile) ✅
   - **Thời gian thực tế:** Đã bao gồm trong component

9. ✅ **Implement Order Totals Section** - COMPLETED
   - Subtotal, Shipping, Discount, Grand Total ✅
   - Format currency VND ✅
   - **Thời gian thực tế:** Đã bao gồm trong component

**Deliverables:**
- ✅ Dialog component hoàn chỉnh cho desktop
- ✅ All sections implemented
- ✅ Styling theo design system

---

### Phase 3: Mobile Optimization (Day 2 - Morning) ✅ COMPLETED

**Mục tiêu:** Optimize cho mobile với Sheet component

#### Tasks:
10. ✅ **Add Sheet component import** - COMPLETED
    - Import `Sheet` từ `@/components/ui/sheet` ✅
    - **Thời gian thực tế:** Đã bao gồm trong component

11. ✅ **Implement responsive logic** - COMPLETED
    - **Pattern từ ProductQuickEditDialog:** Sử dụng Tailwind responsive classes ✅
    - Mobile: `<div className="md:hidden">` với `Sheet` (side="bottom") ✅
    - Desktop: `<div className="hidden md:block">` với `Dialog` ✅
    - **Không cần useMediaQuery hook** - dùng Tailwind classes như pattern hiện có ✅
    - **Thời gian thực tế:** Đã bao gồm trong component

12. ✅ **Optimize mobile layout** - COMPLETED
    - Adjust spacing, font sizes ✅
    - Ensure touch targets >= 44px ✅
    - Test scroll behavior ✅
    - **Thời gian thực tế:** Đã bao gồm trong component

13. ⏳ **Test mobile UX** - PENDING
    - Test trên mobile viewport (375px, 414px)
    - Test scroll, close button, navigation
    - **Status:** Cần test thực tế

**Deliverables:**
- ✅ Responsive component (Dialog/Sheet)
- ✅ Mobile-optimized layout
- ⏳ Tested on mobile viewports (Pending)

---

### Phase 4: Integration & Testing (Day 2 - Afternoon) ✅ COMPLETED (Partial)

**Mục tiêu:** Tích hợp vào order list page và test

#### Tasks:
14. ✅ **Integrate vào Order List Page** - COMPLETED
    - File: `app/admin/orders/page.tsx` ✅
    - Add button "Xem nhanh" với icon (Eye icon, ghost variant) ✅
    - State management cho dialog ✅
    - **Thời gian thực tế:** ~20 phút

15. ✅ **Handle button placement** - COMPLETED
    - Option A: Thêm button mới bên cạnh "Xem" ✅
    - Icon-only button với title attribute ✅
    - Touch target >= 44px ✅
    - **Thời gian thực tế:** Đã bao gồm trong Task 14

16. ✅ **Error handling & Loading states** - COMPLETED
    - Loading spinner (Loader2) ✅
    - Error message display với retry button ✅
    - Empty state handling ✅
    - **Thời gian thực tế:** Đã bao gồm trong component

17. ⏳ **Accessibility testing** - PENDING
    - Keyboard navigation (Tab, ESC) - Cần test
    - Screen reader compatibility - Cần test
    - Focus management - Cần test
    - **Status:** Shadcn components có built-in accessibility, cần verify

18. ⏳ **Cross-browser testing** - PENDING
    - Chrome, Firefox, Safari, Edge - Cần test
    - Mobile browsers (iOS Safari, Chrome Mobile) - Cần test
    - **Status:** Cần test thực tế

**Deliverables:**
- ✅ Integrated vào order list page
- ✅ Error handling complete
- ⏳ Accessibility tested (Pending)
- ⏳ Cross-browser tested (Pending)

---

### Phase 5: Polish & Documentation (Day 3) 🚧 IN PROGRESS

**Mục tiêu:** Hoàn thiện và tài liệu hóa

#### Tasks:
19. ⏳ **Performance optimization** - PENDING
    - Memoize expensive computations - Cần review
    - Lazy load dialog content nếu cần - Có thể không cần (lightweight)
    - Check bundle size impact - Cần verify
    - **Status:** Cần review và optimize

20. ✅ **Code review & refactoring** - COMPLETED
    - Review code quality ✅
    - Extract reusable components nếu cần ✅ (formatCurrency, formatDate, formatAddress)
    - Remove console.logs ✅ (không có console.logs)
    - **Thời gian thực tế:** Đã làm trong quá trình code

21. ⏳ **Update documentation** - IN PROGRESS
    - Update component documentation - Đang làm (file này)
    - Add usage examples - Cần thêm
    - Update API documentation nếu cần - Cần thêm
    - **Status:** Đang cập nhật

22. ⏳ **Final testing** - PENDING
    - End-to-end testing - Cần test
    - Edge cases testing - Cần test
    - Performance testing - Cần test
    - **Status:** Cần test thực tế

**Deliverables:**
- ⏳ Optimized code (Pending review)
- 🚧 Documentation updated (In progress)
- ⏳ All tests passed (Pending)

---

## 📝 CHI TIẾT TASKS

### Task 1: Tạo API Endpoint `/api/admin/orders/[id]/quick-view`

**File:** `app/api/admin/orders/[id]/quick-view/route.ts`

**Requirements:**
- GET method only
- Authentication: `withAuthAdmin` middleware với permission `order:read`
- Query order by ObjectId hoặc orderNumber (follow pattern từ `/api/admin/orders/[id]/route.ts`)
- Return only necessary fields (lightweight response):
  ```typescript
  {
    _id, orderNumber, status, paymentStatus, paymentMethod,
    customerName, customerEmail, customerPhone,
    grandTotal, subtotal, shippingTotal, discountTotal, taxTotal,
    shippingAddress, shipping, // Support both structures for backward compatibility
    createdAt, updatedAt,
    items: [{ _id, productName, quantity, price, total, variant }]
  }
  ```
- **Không include:** orderHistories, refunds, shipments (quá nặng cho quick view)
- Error handling: 404, 500 (follow pattern từ existing endpoint)
- Response format: JSON
- **Performance:** Chỉ query order + items, không join với collections khác

**Dependencies:**
- `lib/db.ts` - getCollections
- `lib/middleware/authMiddleware.ts` - withAuthAdmin

**Reference:**
- `app/api/admin/orders/[id]/route.ts` - Pattern cho query by ObjectId/orderNumber

**Estimated time:** 1-2 giờ

---

### Task 2: Tạo OrderQuickViewDialog Component

**File:** `components/admin/orders/OrderQuickViewDialog.tsx`

**Props:**
```typescript
interface OrderQuickViewDialogProps {
  orderId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
```

**State:**
```typescript
const [order, setOrder] = useState<OrderQuickView | null>(null);
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
```

**Features:**
- Fetch order data khi dialog mở (sử dụng `useEffect` với `orderId` dependency)
- Loading state với skeleton hoặc spinner
- Error state với retry button
- Responsive: Dialog on desktop, Sheet on mobile (pattern từ ProductQuickEditDialog)
- Close on ESC key (built-in từ Shadcn)
- Close on overlay click (built-in từ Shadcn)

**Dependencies:**
- `@/components/ui/dialog` - Dialog component
- `@/components/ui/sheet` - Sheet component (✅ đã có)
- `@/components/ui/card` - Card components
- `@/components/ui/button` - Button component
- `@/components/ui/table` - Table component
- `@/lib/utils/orderStateMachine` - getStatusLabel, getStatusColor
- `@/components/providers/ToastProvider` - useToastContext (cho error messages)

**Pattern Reference:**
- `components/admin/products/ProductQuickEditDialog.tsx` - Responsive pattern (Sheet/Dialog)
- `components/admin/orders/CancelOrderModal.tsx` - Simple dialog pattern

**Estimated time:** 3-4 giờ

---

### Task 3: Integrate vào Order List Page

**File:** `app/admin/orders/page.tsx`

**Changes:**
1. Import `OrderQuickViewDialog` component
2. Add state: `const [quickViewOrderId, setQuickViewOrderId] = useState<string | null>(null);`
3. **Button placement:** Thêm button "Xem nhanh" bên cạnh button "Xem" hiện tại
   - Option A (Khuyến nghị): Icon-only button với tooltip
   ```tsx
   <TableCell>
     <div className="flex items-center gap-2">
       <Link href={`/admin/orders/${order._id}`}>
         <Button variant="outline" size="sm">
           <Eye className="w-4 h-4 mr-2" />
           Xem
         </Button>
       </Link>
       <Button 
         variant="ghost" 
         size="sm"
         onClick={() => setQuickViewOrderId(order._id)}
         title="Xem nhanh"
         className="min-h-[44px] min-w-[44px]" // Mobile touch target
       >
         <Eye className="w-4 h-4" />
       </Button>
     </div>
   </TableCell>
   ```
   - Option B: Dropdown menu (phức tạp hơn, không khuyến nghị)
4. Add dialog component (outside table, at component root):
   ```tsx
   {quickViewOrderId && (
     <OrderQuickViewDialog
       orderId={quickViewOrderId}
       open={!!quickViewOrderId}
       onOpenChange={(open) => !open && setQuickViewOrderId(null)}
     />
   )}
   ```

**Note:** 
- Giữ nguyên button "Xem" (Link) để không phá vỡ workflow hiện tại
- Button "Xem nhanh" chỉ mở dialog, không navigate
- Đảm bảo touch target >= 44px cho mobile

**Estimated time:** 1 giờ

---

## 🧪 TESTING CHECKLIST

### Unit Tests
- [ ] API endpoint returns correct data structure
- [ ] API endpoint handles 404 correctly
- [ ] API endpoint handles authentication errors
- [ ] Component renders correctly with order data
- [ ] Component handles loading state
- [ ] Component handles error state
- [ ] Component closes on ESC key
- [ ] Component closes on overlay click

### Integration Tests
- [ ] Dialog opens when clicking "Xem nhanh" button
- [ ] Dialog displays correct order information
- [ ] Dialog closes correctly
- [ ] Navigation to full page still works
- [ ] Multiple dialogs don't conflict

### E2E Tests
- [ ] User can view order quick view from list
- [ ] User can navigate to full page from quick view
- [ ] User can close dialog and return to list
- [ ] Mobile: Sheet opens from bottom
- [ ] Mobile: Sheet closes correctly

### Performance Tests
- [ ] Dialog opens in < 500ms
- [ ] API response time < 200ms
- [ ] No memory leaks when opening/closing multiple times
- [ ] Bundle size impact < 10KB

### Accessibility Tests
- [ ] Keyboard navigation works (Tab, ESC)
- [ ] Screen reader announces dialog correctly
- [ ] Focus management correct (focus trap)
- [ ] ARIA labels present

### Cross-browser Tests
- [ ] Chrome (desktop & mobile)
- [ ] Firefox (desktop & mobile)
- [ ] Safari (desktop & mobile)
- [ ] Edge (desktop)

---

## 📚 DEPENDENCIES & PREREQUISITES

### Required Components
- ✅ `Dialog` - `components/ui/dialog.tsx` (sẵn có)
- ✅ `Sheet` - `components/ui/sheet.tsx` (✅ đã có sẵn, verified)
- ✅ `Card` - `components/ui/card.tsx` (sẵn có)
- ✅ `Button` - `components/ui/button.tsx` (sẵn có)
- ✅ `Table` - `components/ui/table.tsx` (sẵn có)

### Required Utilities
- ✅ `orderStateMachine` - `lib/utils/orderStateMachine.ts` (sẵn có)
- ✅ `withAuthAdmin` - `lib/middleware/authMiddleware.ts` (sẵn có)
- ✅ `getCollections` - `lib/db.ts` (sẵn có)

### Required Icons
- ✅ `Eye` - `lucide-react` (sẵn có)
- ✅ `X` - `lucide-react` (sẵn có)
- ✅ `User`, `Mail`, `Phone` - `lucide-react` (sẵn có)

---

## 🎨 UI/UX SPECIFICATIONS

### Dialog Size
- **Desktop:** `max-w-2xl` hoặc `max-w-3xl` (768px - 896px)
- **Mobile:** Full width Sheet

### Colors
- Follow design system từ `docs/DESIGN_SYSTEM.md`
- Status badges: Use `getStatusColor()` từ `orderStateMachine`
- Text colors: Use theme colors (foreground, muted-foreground)

### Typography
- Header: `text-lg font-semibold`
- Section titles: `text-sm font-medium`
- Body text: `text-sm`
- Currency: `font-mono` for numbers

### Spacing
- Section spacing: `space-y-4` hoặc `space-y-6`
- Card padding: `p-6`
- Button spacing: `gap-2`

### Mobile Considerations
- Touch targets: Minimum 44px height
- Scrollable content: `max-h-[80vh]` với `overflow-y-auto`
- Sticky header/footer nếu cần
- Bottom sheet animation: Slide up from bottom

---

## 🔄 ALTERNATIVE APPROACHES

### Approach 1: Reuse OrderDetail Component (NOT RECOMMENDED)
- **Pros:** Code reuse, consistency
- **Cons:** Load quá nhiều data, performance kém, không tối ưu cho quick view

### Approach 2: Inline Expand (NOT RECOMMENDED)
- **Pros:** Không cần dialog, simpler
- **Cons:** Làm rối layout, không phù hợp với mobile, UX kém

### Approach 3: Modal thay vì Dialog (NOT RECOMMENDED)
- **Pros:** Full control
- **Cons:** Phải implement từ đầu, không có accessibility built-in

**Khuyến nghị:** Approach trong plan (Dialog/Sheet với API endpoint riêng)

---

## 📊 SUCCESS METRICS

### Performance
- Dialog opens in < 500ms
- API response time < 200ms
- No performance regression on order list page

### UX
- User satisfaction: Positive feedback
- Usage rate: > 30% of order views use quick view
- Error rate: < 1%

### Code Quality
- TypeScript: No `any` types
- ESLint: No errors
- Test coverage: > 80%

---

## 🚀 DEPLOYMENT PLAN

### Pre-deployment
1. Run `npm run pre-deploy` (type-check, build, lint)
2. Run all tests
3. Code review
4. Update documentation

### Deployment
1. Merge to main branch
2. Auto-deploy to Vercel
3. Monitor for errors

### Post-deployment
1. Monitor error logs
2. Collect user feedback
3. Track usage metrics
4. Fix any issues

---

## 📝 NOTES & CONSIDERATIONS

### Implementation Notes
- **Data Fetching:** Không cần React Query hook cho quick view (one-time fetch khi dialog mở)
- **Caching:** Có thể cache trong component state nếu user mở lại cùng order trong session
- **Error Handling:** Follow pattern từ CancelOrderModal (simple error display)
- **Loading State:** Sử dụng Skeleton component hoặc Loader2 spinner
- **Responsive Pattern:** Follow exact pattern từ ProductQuickEditDialog (md:hidden / hidden md:block)

### Future Enhancements
- Quick actions trong dialog (Update status, Print label, etc.)
- Keyboard shortcuts (e.g., `Q` to open quick view)
- Recent orders history trong dialog
- Bulk quick view (multiple orders)
- React Query hook cho order quick view (nếu cần caching/sharing state)

### Technical Debt
- Consider caching order data nếu user mở lại cùng order (use React Query nếu cần)
- Consider prefetching next/previous orders (low priority)
- Consider virtual scrolling cho order items nếu có nhiều items (>20 items)

### Maintenance
- Keep API endpoint lightweight (chỉ return fields cần thiết)
- Monitor performance metrics (API response time, dialog open time)
- Update khi order schema thay đổi (đảm bảo quick-view endpoint sync với schema)

---

## ✅ ACCEPTANCE CRITERIA

Tính năng được coi là hoàn thành khi:

1. ✅ Dialog/Sheet mở khi click "Xem nhanh" button - **COMPLETED**
2. ✅ Hiển thị đầy đủ thông tin order cần thiết - **COMPLETED**
3. ✅ Responsive: Dialog trên desktop, Sheet trên mobile - **COMPLETED**
4. ✅ Loading state hiển thị khi fetch data - **COMPLETED**
5. ✅ Error state hiển thị khi có lỗi - **COMPLETED**
6. ✅ Có thể đóng dialog bằng ESC hoặc close button - **COMPLETED** (built-in từ Shadcn)
7. ✅ Có thể navigate đến full page từ dialog - **COMPLETED**
8. ⏳ Keyboard navigation hoạt động - **PENDING TEST**
9. ⏳ Screen reader compatible - **PENDING TEST**
10. ⏳ Performance: Dialog mở < 500ms - **PENDING TEST**
11. ✅ No TypeScript errors - **COMPLETED**
12. ✅ No ESLint errors - **COMPLETED**
13. ⏳ Tests passed - **PENDING**
14. 🚧 Documentation updated - **IN PROGRESS**

**Progress: 8/14 completed (57%), 4 pending tests, 2 in progress**

---

## 📞 CONTACT & SUPPORT

Nếu có vấn đề trong quá trình triển khai:
1. Check existing similar components (ProductQuickEditDialog, CancelOrderModal)
2. Review API documentation
3. Check design system guidelines
4. Review error logs

---

## 🔍 DEEP REVIEW FINDINGS (2025-01-XX)

### ✅ Verified Dependencies
1. **Sheet Component:** ✅ Đã có sẵn tại `components/ui/sheet.tsx`
   - Supports `side="bottom"` cho mobile drawer
   - Full API: Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter, SheetDescription
   - **Action:** Giảm estimate từ 1-2 giờ xuống 5 phút (chỉ cần import)

2. **Dialog Component:** ✅ Đã có sẵn và được sử dụng rộng rãi
3. **Order API Pattern:** ✅ Có pattern sẵn tại `app/api/admin/orders/[id]/route.ts`
   - Support query by ObjectId hoặc orderNumber
   - Authentication pattern với `withAuthAdmin`
   - Error handling pattern

### ✅ Identified Patterns
1. **Responsive Pattern:** ProductQuickEditDialog sử dụng:
   ```tsx
   {/* Mobile: Sheet */}
   <div className="md:hidden">
     <Sheet open={open} onOpenChange={handleOpenChange}>
       <SheetContent side="bottom">...</SheetContent>
     </Sheet>
   </div>
   
   {/* Desktop: Dialog */}
   <div className="hidden md:block">
     <Dialog open={open} onOpenChange={handleOpenChange}>
       <DialogContent>...</DialogContent>
     </Dialog>
   </div>
   ```
   - **Action:** Follow exact pattern này, không cần useMediaQuery hook

2. **Simple Dialog Pattern:** CancelOrderModal là pattern đơn giản:
   - Controlled component với `open` và `onOpenChange`
   - Error handling với toast
   - Loading state với button disabled

3. **Data Fetching Pattern:** 
   - `useOrderREST` hook tồn tại nhưng dùng cho public API (`/api/cms/orders`)
   - Admin API cần fetch trực tiếp với `credentials: 'include'`
   - **Action:** Không cần React Query hook cho quick view (one-time fetch)

### ⚠️ Updated Estimates
- **Task 10:** Giảm từ 30 phút → 5 phút (Sheet đã có sẵn)
- **Task 11:** Giảm từ 1 giờ → 30 phút (có pattern sẵn)
- **Total Phase 3:** Giảm từ 3.5-4.5 giờ → 2.5-3.5 giờ

### 📋 Additional Recommendations
1. **Button Icon:** Có thể dùng `Eye` icon hoặc `Search` icon cho "Xem nhanh"
   - `Eye` icon: Consistent với button "Xem" hiện tại
   - `Search` icon: Phân biệt rõ hơn với "Xem"
   - **Khuyến nghị:** Dùng `Eye` với variant khác (ghost vs outline)

2. **Tooltip:** Thêm tooltip cho icon-only button trên desktop
   - Component: `@/components/ui/tooltip` (nếu có) hoặc title attribute

3. **Error Handling:** Follow pattern từ ProductQuickEditDialog:
   - Check `response.ok` trước khi parse JSON
   - Check `content-type` header
   - Display error với retry button

4. **Loading State:** Sử dụng Skeleton component thay vì spinner nếu có nhiều sections
   - Component: `@/components/ui/skeleton` (nếu có)

5. **Type Safety:** Tạo interface `OrderQuickView` riêng thay vì reuse `Order` interface
   - Đảm bảo type safety và rõ ràng về fields được return từ API

### ✅ Ready for Implementation
Tất cả dependencies đã được verify, patterns đã được identify. Kế hoạch sẵn sàng để bắt đầu triển khai.

---

**END OF PLAN**

