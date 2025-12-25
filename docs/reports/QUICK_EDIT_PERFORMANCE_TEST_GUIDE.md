# Quick Edit Performance Test Guide

## Tổng quan
Hướng dẫn test performance improvement sau khi implement MongoDB indexes cho Quick Edit Dialog.

**Ngày tạo:** 2025-01-XX
**Task:** 3.1.1 & 3.1.2 - Test MongoDB query performance

---

## Prerequisites

1. **MongoDB đang chạy:**
   ```bash
   # Kiểm tra MongoDB connection
   npm run test:mongodb
   ```

2. **Environment variables:**
   - Đảm bảo `.env.local` có `MONGODB_URI`
   - Format: `mongodb://localhost:27017/shop-gau-bong` hoặc MongoDB Atlas URI

3. **Indexes đã được tạo:**
   ```bash
   # Tạo indexes nếu chưa có
   npm run db:setup-indexes
   ```

---

## Test Script

### Chạy Performance Test

```bash
npm run test:quick-edit-performance
```

### Script sẽ:

1. **Check indexes:**
   - Kiểm tra `products.slug` index
   - Kiểm tra `categories.slug` index
   - Hiển thị warning nếu indexes chưa được tạo

2. **Get test data:**
   - Tìm products với slug
   - Tìm products với ObjectId
   - Tìm categories với slug

3. **Test queries:**
   - Product lookup by `_id` (10 iterations)
   - Product lookup by `slug` (10 iterations)
   - Category lookup by `slug` (10 iterations)
   - Warmup iterations (3) để tránh cold start

4. **Calculate statistics:**
   - Average, Min, Max, Median
   - P95, P99 percentiles
   - So sánh với expected performance

---

## Expected Results

### Với Indexes (After Optimization)

| Query | Expected Time | Status |
|-------|--------------|--------|
| Product by `_id` | <10ms | ✅ Should always pass (MongoDB auto-index) |
| Product by `slug` | <10ms | ✅ Should pass with `products.slug` index |
| Category by `slug` | <10ms | ✅ Should pass with `categories.slug` index |

### Không có Indexes (Before Optimization)

| Query | Expected Time | Status |
|-------|--------------|--------|
| Product by `_id` | <10ms | ✅ Should always pass |
| Product by `slug` | 50-500ms | ⚠️ Full collection scan |
| Category by `slug` | 20-200ms | ⚠️ Full collection scan |

---

## Performance Improvement Calculation

### Estimated Improvement per Quick Edit Open

**Before indexes:**
- Product lookup by slug: ~200ms (estimated)
- Category lookup by slug: ~100ms (estimated)
- **Total:** ~300ms

**After indexes:**
- Product lookup by slug: <10ms
- Category lookup by slug: <10ms
- **Total:** <20ms

**Improvement:** ~280ms saved per Quick Edit open

### Real-world Impact

- **10 Quick Edit opens:** ~2.8 seconds saved
- **100 Quick Edit opens:** ~28 seconds saved
- **1000 Quick Edit opens:** ~4.7 minutes saved

---

## Troubleshooting

### Error: MONGODB_URI not found

**Solution:**
1. Kiểm tra `.env.local` file có `MONGODB_URI`
2. Format: `MONGODB_URI=mongodb://localhost:27017/shop-gau-bong`

### Error: Connection refused

**Solution:**
1. Kiểm tra MongoDB đang chạy:
   ```bash
   # Windows
   net start MongoDB
   
   # Linux/Mac
   sudo systemctl start mongod
   ```

2. Kiểm tra MongoDB port (default: 27017)

### Warning: Index not found

**Solution:**
```bash
# Tạo indexes
npm run db:setup-indexes
```

### Performance slower than expected

**Possible causes:**
1. Indexes chưa được tạo
2. Collection size quá lớn (cần rebuild indexes)
3. MongoDB server performance issues
4. Network latency (MongoDB Atlas)

**Solutions:**
1. Verify indexes: `db.products.getIndexes()`
2. Rebuild indexes: `db.products.reIndex()`
3. Check MongoDB server resources
4. Test với local MongoDB để loại trừ network latency

---

## Manual Testing

### Test trong MongoDB Shell

```javascript
// Connect to MongoDB
use shop-gau-bong

// Check indexes
db.products.getIndexes()
db.categories.getIndexes()

// Test query performance
db.products.findOne({ slug: "test-product-slug" }).explain("executionStats")
db.categories.findOne({ slug: "test-category-slug" }).explain("executionStats")
```

### Check Execution Stats

Look for:
- `executionStats.executionTimeMillis` - Query time
- `executionStats.executionStages.stage` - Should be "IXSCAN" (index scan) not "COLLSCAN" (collection scan)
- `executionStats.totalDocsExamined` - Should be 1 with index, many without index

---

## Test Results Documentation

Sau khi chạy test, document kết quả:

### Example Results

```
📦 Product Lookup by slug:
   Average: 2.45ms
   Min: 1.23ms
   Max: 5.67ms
   Median: 2.12ms
   P95: 4.89ms
   P99: 5.45ms
   ✅ PASS: Average 2.45ms < 10ms
```

### Performance Metrics to Track

1. **Average query time:** Primary metric
2. **P95 percentile:** 95% of queries should be below this
3. **P99 percentile:** 99% of queries should be below this
4. **Max query time:** Worst case scenario

---

## Next Steps

1. ✅ Run performance test: `npm run test:quick-edit-performance`
2. ✅ Verify indexes are created: Check output
3. ✅ Compare results với expected performance
4. ✅ Document actual improvements
5. ✅ Update `QUICK_EDIT_PERFORMANCE_OPTIMIZATION_PLAN.md` với actual results

---

## References

- MongoDB Index Documentation: https://docs.mongodb.com/manual/indexes/
- Query Performance: https://docs.mongodb.com/manual/core/query-performance/
- Explain Results: https://docs.mongodb.com/manual/reference/explain-results/

