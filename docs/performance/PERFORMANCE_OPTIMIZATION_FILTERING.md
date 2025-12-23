# 🚀 Performance Optimization - Product Filtering

## ⚠️ Vấn đề Hiện tại

Khi sử dụng custom filters (Material, Size, Color, Price range), API route phải:
1. Fetch **TẤT CẢ** products từ WooCommerce (có thể hàng nghìn products)
2. Filter trên server-side
3. Apply pagination

**Hậu quả:**
- ⏱️ Chậm: Mỗi lần filter có thể mất 10-30 giây
- 💰 Tốn tài nguyên: Nhiều API calls đến WooCommerce
- ⚡ Risk timeout: Serverless functions có giới hạn thời gian (Vercel: 30s, AWS Lambda: 15-30s)

## ✅ Giải pháp Hiện tại (Tạm thời)

### 1. Giới hạn số lượng fetch
- **maxPages**: 50 pages (5000 products max)
- **maxProductsToFetch**: 2000 products hard limit
- **Timeout**: 25 seconds (tránh serverless timeout)

### 2. Performance Monitoring
- Log số lượng products fetched
- Log thời gian filter
- Warning nếu hit limits

### 3. Early Exit
- Dừng khi đạt maxProductsToFetch
- Dừng khi timeout

## 🎯 Giải pháp Tối ưu Lâu dài (Đề xuất)

### Option 1: Database-Level Filtering (Tốt nhất)

**Cách làm:**
- Tạo custom WordPress plugin để expose ACF fields qua WooCommerce REST API
- Sử dụng WooCommerce native filtering với custom fields
- Không cần fetch tất cả products

**Ưu điểm:**
- ⚡ Nhanh: Database filter nhanh hơn JavaScript filter
- 💰 Tiết kiệm: Chỉ fetch products cần thiết
- ✅ Chính xác: Pagination chính xác 100%

**Nhược điểm:**
- Cần quyền truy cập WordPress backend
- Cần custom plugin development

### Option 2: Caching Strategy

**Cách làm:**
- Cache filtered results trong Redis hoặc Next.js cache
- Cache key: `filter-${JSON.stringify(filters)}`
- TTL: 5-10 phút

**Ưu điểm:**
- ⚡ Nhanh: Lần request thứ 2 trả về ngay từ cache
- 💰 Giảm API calls đến WooCommerce

**Nhược điểm:**
- Vẫn phải fetch tất cả products lần đầu
- Cache có thể stale nếu products thay đổi

### Option 3: Progressive Loading (Hybrid)

**Cách làm:**
- Fetch và filter từng batch (100 products)
- Trả về kết quả ngay khi có đủ cho trang hiện tại
- Fetch thêm ở background cho các trang sau

**Ưu điểm:**
- ⚡ UX tốt: Hiển thị kết quả nhanh
- 💰 Tiết kiệm: Chỉ fetch đủ cho trang hiện tại

**Nhược điểm:**
- Logic phức tạp hơn
- Pagination không chính xác ngay lập tức

### Option 4: Indexed Search (Advanced)

**Cách làm:**
- Sử dụng Elasticsearch hoặc Algolia để index products
- Filter và search trên indexed data
- Sync với WooCommerce khi có thay đổi

**Ưu điểm:**
- ⚡ Rất nhanh: Search engine optimized
- ✅ Chính xác: Full-text search + filters
- 📊 Analytics: Có thể track search behavior

**Nhược điểm:**
- Cần setup infrastructure riêng
- Chi phí hosting/search service
- Cần sync mechanism

## 📊 So sánh Performance

| Solution | First Request | Cached Request | Accuracy | Complexity |
|----------|--------------|----------------|----------|------------|
| **Current (Brute-force)** | 10-30s | 10-30s | 100%* | Low |
| **Database Filtering** | 1-3s | 1-3s | 100% | Medium |
| **Caching** | 10-30s | <1s | 100%* | Low |
| **Progressive Loading** | 2-5s | 2-5s | ~95% | High |
| **Indexed Search** | <1s | <1s | 100% | Very High |

*100% nếu không hit limits

## 🔧 Implementation Priority

### Phase 1: Immediate (Đã làm)
- ✅ Giới hạn số lượng fetch
- ✅ Timeout protection
- ✅ Performance logging
- ✅ Warning messages

### Phase 2: Short-term (1-2 tuần)
- [ ] Implement caching (Next.js cache hoặc Redis)
- [ ] Optimize filter logic (reduce iterations)
- [ ] Add request deduplication

### Phase 3: Long-term (1-2 tháng)
- [ ] Database-level filtering (custom WordPress plugin)
- [ ] Consider indexed search (nếu scale lớn)

## 📝 Notes

- **Current approach works** nhưng không scale tốt với >1000 products
- **Recommendation**: Implement caching trước, sau đó chuyển sang database-level filtering
- **Monitor**: Theo dõi API response times và error rates
- **User feedback**: Nếu users phàn nàn về tốc độ, ưu tiên Phase 2

