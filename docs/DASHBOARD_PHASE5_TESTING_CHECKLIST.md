# Dashboard Phase 5 - Date Range Selector Testing Checklist

**Date:** 2025-01-XX  
**Status:** 📋 **TESTING CHECKLIST**

---

## Prerequisites

- ✅ Next.js dev server running (`npm run dev`)
- ✅ MongoDB connection configured
- ✅ Admin user logged in (`/admin/login`)
- ✅ Some test orders in database (optional but recommended)

---

## 1. Functional Testing - Date Range Options

### 1.1. Today (Hôm nay)
- [ ] Select "Hôm nay" from dropdown
- [ ] Verify RevenueChart shows hourly data (24 data points max)
- [ ] Verify TopProductsChart updates with today's data
- [ ] Verify TopCustomersList updates with today's data
- [ ] Check date range in chart: should show today's date range

**Expected:**
- RevenueChart `groupBy` should be `'hour'`
- Data points: up to 24 (one per hour)
- Date range: start and end of today (Vietnam timezone)

### 1.2. Yesterday (Hôm qua)
- [ ] Select "Hôm qua" from dropdown
- [ ] Verify RevenueChart shows hourly data (24 data points max)
- [ ] Verify TopProductsChart updates with yesterday's data
- [ ] Verify TopCustomersList updates with yesterday's data
- [ ] Check date range: should show yesterday's date range

**Expected:**
- RevenueChart `groupBy` should be `'hour'`
- Data points: up to 24 (one per hour)
- Date range: start and end of yesterday (Vietnam timezone)

### 1.3. Last 7 Days (7 ngày qua)
- [ ] Select "7 ngày qua" from dropdown
- [ ] Verify RevenueChart shows daily data (7 data points max)
- [ ] Verify TopProductsChart updates with last 7 days' data
- [ ] Verify TopCustomersList updates with last 7 days' data
- [ ] Check date range: should show last 7 days (from 7 days ago to today)

**Expected:**
- RevenueChart `groupBy` should be `'day'`
- Data points: up to 7 (one per day)
- Date range: from 7 days ago to today (Vietnam timezone)

### 1.4. This Month (Tháng này)
- [ ] Select "Tháng này" from dropdown
- [ ] Verify RevenueChart shows daily data
- [ ] Verify TopProductsChart updates with this month's data
- [ ] Verify TopCustomersList updates with this month's data
- [ ] Check date range: should show current month (from 1st to today)

**Expected:**
- RevenueChart `groupBy` should be `'day'`
- Data points: number of days in current month so far
- Date range: from start of month to today (Vietnam timezone)

### 1.5. Last Month (Tháng trước)
- [ ] Select "Tháng trước" from dropdown
- [ ] Verify RevenueChart shows daily data
- [ ] Verify TopProductsChart updates with last month's data
- [ ] Verify TopCustomersList updates with last month's data
- [ ] Check date range: should show last month (full month range)

**Expected:**
- RevenueChart `groupBy` should be `'day'`
- Data points: number of days in last month
- Date range: from start of last month to end of last month (Vietnam timezone)

---

## 2. Auto GroupBy Logic Testing

### 2.1. Single Day Ranges (Should use 'hour')
- [ ] Select "Hôm nay" → Check RevenueChart `groupBy` = `'hour'`
- [ ] Select "Hôm qua" → Check RevenueChart `groupBy` = `'hour'`

**Expected:**
- Both should automatically use `groupBy: 'hour'`
- Chart should show hourly breakdown (more granular)

### 2.2. Multi-Day Ranges (Should use 'day')
- [ ] Select "7 ngày qua" → Check RevenueChart `groupBy` = `'day'`
- [ ] Select "Tháng này" → Check RevenueChart `groupBy` = `'day'`
- [ ] Select "Tháng trước" → Check RevenueChart `groupBy` = `'day'`

**Expected:**
- All should automatically use `groupBy: 'day'`
- Chart should show daily breakdown (readable for longer ranges)

---

## 3. Component Sync Testing

### 3.1. Dashboard Components Update
- [ ] Change date range from "Tháng này" to "Hôm nay"
- [ ] Verify all components update:
  - [ ] RevenueChart refreshes with new data
  - [ ] TopProductsChart refreshes with new data
  - [ ] TopCustomersList refreshes with new data
- [ ] Verify TodayStatsCards remain unchanged (always shows today)

**Expected:**
- All chart/list components should update when date range changes
- TodayStatsCards should remain static (not affected by date range)

### 3.2. Loading States
- [ ] Change date range quickly multiple times
- [ ] Verify loading states appear during data fetch
- [ ] Verify no flickering or duplicate data

**Expected:**
- Smooth transitions between date ranges
- Loading skeletons shown during fetch
- No data flash or flicker

---

## 4. UI/UX Testing

### 4.1. Dropdown Interaction
- [ ] Click on DateRangeSelector dropdown
- [ ] Verify dropdown opens with all options:
  - [ ] "Hôm nay"
  - [ ] "Hôm qua"
  - [ ] "7 ngày qua"
  - [ ] "Tháng này"
  - [ ] "Tháng trước"
- [ ] Select an option
- [ ] Verify dropdown closes after selection
- [ ] Verify selected value displays correctly in trigger

**Expected:**
- Dropdown opens on click
- All options visible and clickable
- Dropdown closes after selection
- Selected value updates immediately

### 4.2. Responsive Behavior

#### Desktop (≥1024px)
- [ ] Verify DateRangeSelector is right-aligned
- [ ] Verify dropdown width is appropriate (not too wide)
- [ ] Verify label "Khoảng thời gian" is visible above selector

#### Mobile (<1024px)
- [ ] Verify DateRangeSelector is full-width or properly sized
- [ ] Verify touch targets are at least 44x44px
- [ ] Verify dropdown is readable on small screens
- [ ] Verify label "Khoảng thời gian" is visible

**Expected:**
- Desktop: Right-aligned, compact layout
- Mobile: Full-width or properly sized, large touch targets
- Label visible on all screen sizes

### 4.3. Accessibility
- [ ] Tab to DateRangeSelector
- [ ] Verify focus indicator is visible
- [ ] Verify `aria-label` is set correctly
- [ ] Verify keyboard navigation works (Arrow keys, Enter)
- [ ] Test with screen reader (if available)

**Expected:**
- Keyboard navigation fully functional
- Focus indicators visible
- ARIA labels properly set
- Screen reader compatible

---

## 5. Edge Cases Testing

### 5.1. Empty Data Scenarios
- [ ] Test with date range that has no orders (e.g., future date)
- [ ] Verify charts show "Chưa có dữ liệu" message
- [ ] Verify no errors or crashes

**Expected:**
- Graceful handling of empty data
- Clear "no data" messages
- No errors or crashes

### 5.2. Large Data Sets
- [ ] Test "Tháng này" with many orders (if available)
- [ ] Verify chart renders correctly
- [ ] Verify performance is acceptable (< 1s load time)

**Expected:**
- Charts handle large datasets
- Acceptable performance
- No UI freezing

### 5.3. Timezone Handling
- [ ] Verify date ranges use Vietnam timezone (UTC+7)
- [ ] Test at midnight (timezone boundary)
- [ ] Test at end of month (timezone boundary)

**Expected:**
- All dates in Vietnam timezone (UTC+7)
- Correct boundaries at midnight and month transitions
- No timezone-related bugs

### 5.4. Month Transition
- [ ] Test "Tháng trước" when currently at beginning of new month (e.g., Jan 1st → should show December)
- [ ] Verify correct month is selected
- [ ] Verify date range is correct

**Expected:**
- Correctly identifies last month
- Correct date range boundaries
- No off-by-one errors

---

## 6. API Validation Testing

### 6.1. Invalid Date Range Values
Run API tests manually or use test script:

```bash
npm run test:dashboard-phase5
```

**Expected:**
- Invalid `dateRange` values return 400 error
- Error message is clear and helpful
- No server crashes

### 6.2. Valid Date Range Values
Test via API or UI:

- [ ] `dateRange=today` → Returns 200, `groupBy: 'hour'`
- [ ] `dateRange=yesterday` → Returns 200, `groupBy: 'hour'`
- [ ] `dateRange=last7Days` → Returns 200, `groupBy: 'day'`
- [ ] `dateRange=thisMonth` → Returns 200, `groupBy: 'day'`
- [ ] `dateRange=lastMonth` → Returns 200, `groupBy: 'day'`
- [ ] `dateRange=thisWeek` → Returns 200, `groupBy: 'day'`

**Expected:**
- All valid values return 200
- Correct `groupBy` for each date range
- Data structure matches expected format

---

## 7. Browser Compatibility Testing

Test on different browsers:
- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest, if available)
- [ ] Mobile Chrome (Android)
- [ ] Mobile Safari (iOS)

**Expected:**
- Consistent behavior across browsers
- No browser-specific bugs
- Dropdown works on all browsers

---

## 8. Performance Testing

### 8.1. Response Times
- [ ] Measure time to switch between date ranges
- [ ] Verify response time < 1s for typical datasets
- [ ] Verify no significant performance degradation

**Expected:**
- Fast date range switching (< 500ms)
- Acceptable API response times
- Smooth UI updates

### 8.2. Caching Behavior
- [ ] Change date range to "Hôm nay"
- [ ] Switch to another range
- [ ] Switch back to "Hôm nay"
- [ ] Verify cached data is used (faster response)

**Expected:**
- React Query caching works correctly
- Cached data used when available
- Cache invalidation works on data updates

---

## Test Results Summary

**Date:** _________________  
**Tester:** _________________

### Pass/Fail Count
- ✅ Passed: ___ / ___
- ❌ Failed: ___ / ___

### Issues Found
1. ________________________________
2. ________________________________
3. ________________________________

### Notes
________________________________
________________________________

---

## Quick Test Commands

### Run Automated API Tests
```bash
# Requires: Dev server running + logged in
npm run test:dashboard-phase5
```

### Check TypeScript Errors
```bash
npm run type-check
```

### Check Linting
```bash
npm run lint
```

---

**END OF CHECKLIST**

