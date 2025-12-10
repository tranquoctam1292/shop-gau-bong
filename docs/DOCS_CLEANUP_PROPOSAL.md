# 📋 Đề Xuất Dọn Dẹp Thư Mục Docs

**Ngày:** 2025-01-XX  
**Mục tiêu:** Xóa hoặc gộp các file trùng lặp, lỗi thời để giảm số lượng file và dễ quản lý hơn.

---

## 📊 Phân Tích Hiện Trạng

**Tổng số file:** 38 files  
**Các vấn đề phát hiện:**
- File trùng lặp về cùng một chủ đề
- File lỗi thời (GraphQL, Auth đã bị remove)
- File summary/plan có thể gộp lại
- File quick test có thể gộp vào checklist

---

## 🗑️ ĐỀ XUẤT XÓA (10 files)

### 1. **DEPLOYMENT_STRATEGY.md** ❌
**Lý do:** 
- Trùng lặp với `DEPLOYMENT_GUIDE.md`
- Còn đề cập đến WPGraphQL (đã migrate sang REST API)
- `DEPLOYMENT_GUIDE.md` là file mới hơn, đã hợp nhất từ nhiều file

**Hành động:** Xóa, tham khảo `DEPLOYMENT_GUIDE.md` nếu cần

---

### 2. **HOMEPAGE_PLAN.md** ❌
**Lý do:**
- Trùng lặp với `HOMEPAGE_PLAN_GOMI_STYLE.md`
- `HOMEPAGE_PLAN_GOMI_STYLE.md` là version mới hơn, chi tiết hơn
- Còn đề cập đến GraphQL queries (đã migrate sang REST API)

**Hành động:** Xóa, sử dụng `HOMEPAGE_PLAN_GOMI_STYLE.md`

---

### 3. **QUICK_START_MOMO_TEST.md** ❌
**Lý do:**
- Trùng lặp với `TEST_MOMO_PAYMENT.md`
- `TEST_MOMO_PAYMENT.md` chi tiết và đầy đủ hơn
- Quick test có thể là phần đầu của `TEST_MOMO_PAYMENT.md`

**Hành động:** Xóa, sử dụng `TEST_MOMO_PAYMENT.md`

---

### 4. **PHASE2_QUICK_TEST.md** ❌
**Lý do:**
- Trùng lặp với `PHASE2_TESTING_CHECKLIST.md`
- Quick test có thể là phần đầu của checklist
- Checklist đầy đủ và chi tiết hơn

**Hành động:** Gộp nội dung vào đầu `PHASE2_TESTING_CHECKLIST.md` (nếu cần), sau đó xóa

---

### 5. **PHASE3_QUICK_TEST.md** ❌
**Lý do:**
- Trùng lặp với `PHASE3_TESTING_CHECKLIST.md`
- Quick test có thể là phần đầu của checklist
- Checklist đầy đủ và chi tiết hơn

**Hành động:** Gộp nội dung vào đầu `PHASE3_TESTING_CHECKLIST.md` (nếu cần), sau đó xóa

---

### 6. **PROJECT_STATUS_SUMMARY.md** ❌
**Lý do:**
- Trùng lặp với `PHASE_SUMMARIES.md`
- `PHASE_SUMMARIES.md` là file mới hơn, đã hợp nhất từ nhiều phase summaries
- Còn đề cập đến User Authentication (đã remove)
- Còn đề cập đến WPGraphQL (đã migrate sang REST API)

**Hành động:** Xóa, sử dụng `PHASE_SUMMARIES.md`

---

### 7. **DOC_001_TECHNICAL_DOCUMENTATION.md** ❌
**Lý do:**
- **Lỗi thời nghiêm trọng:** Toàn bộ file dựa trên GraphQL
- Project đã migrate sang REST API hoàn toàn
- Nội dung không còn chính xác (GraphQL endpoints, Apollo Client, etc.)
- Có thể tạo lại file mới dựa trên REST API nếu cần

**Hành động:** Xóa hoàn toàn (hoặc tạo lại với nội dung REST API)

---

### 8. **LOCAL_DEVELOPMENT_CHECKLIST.md** ❌
**Lý do:**
- Trùng lặp với `QUICK_SETUP_CHECKLIST.md`
- Cả hai đều về setup local development
- `QUICK_SETUP_CHECKLIST.md` có vẻ ngắn gọn và dễ follow hơn
- Cả hai đều còn đề cập đến GraphQL (cần update)

**Hành động:** Gộp nội dung quan trọng vào `QUICK_SETUP_CHECKLIST.md`, sau đó xóa

---

### 9. **CART_SYNC.md** ❌
**Lý do:**
- **Lỗi thời:** File này về "WPGraphQL Cart Integration"
- Project đã migrate sang REST API
- Còn đề cập đến server cart sync với authentication (đã remove)
- Nội dung không còn phù hợp (guest checkout only)

**Hành động:** Xóa hoàn toàn

---

### 10. **DOCS_REORGANIZATION_SUMMARY.md** ⚠️
**Lý do:**
- File này là summary của một lần tổ chức lại docs trước đó
- Đã hoàn thành, không còn cần thiết cho development
- Có thể giữ lại như "historical record" hoặc xóa

**Hành động:** Xóa (hoặc giữ lại nếu muốn lưu lịch sử)

---

## 🔄 ĐỀ XUẤT GỘP (3 nhóm)

### Nhóm 1: Migration Files
**Files:**
- `MIGRATION_TO_REST_API_PLAN.md` (chi tiết, 825 dòng)
- `MIGRATION_TO_REST_API_SUMMARY.md` (tóm tắt, 92 dòng)

**Đề xuất:**
- Giữ `MIGRATION_TO_REST_API_PLAN.md` (chi tiết hơn)
- Gộp nội dung tóm tắt từ `MIGRATION_TO_REST_API_SUMMARY.md` vào đầu `MIGRATION_TO_REST_API_PLAN.md`
- Xóa `MIGRATION_TO_REST_API_SUMMARY.md`

---

### Nhóm 2: Setup Checklists
**Files:**
- `QUICK_SETUP_CHECKLIST.md`
- `LOCAL_DEVELOPMENT_CHECKLIST.md` (sẽ xóa)
- `MANUAL_TASKS_CHECKLIST.md`

**Đề xuất:**
- Gộp nội dung quan trọng từ `LOCAL_DEVELOPMENT_CHECKLIST.md` vào `QUICK_SETUP_CHECKLIST.md`
- Giữ `MANUAL_TASKS_CHECKLIST.md` riêng (vì là manual tasks cho deployment)
- **Cần update:** Loại bỏ các phần về GraphQL, thay bằng REST API

---

### Nhóm 3: User Documentation
**Files:**
- `DOC_001_TECHNICAL_DOCUMENTATION.md` (sẽ xóa - lỗi thời)
- `DOC_002_USER_DOCUMENTATION.md`

**Đề xuất:**
- Xóa `DOC_001_TECHNICAL_DOCUMENTATION.md` (lỗi thời)
- Giữ `DOC_002_USER_DOCUMENTATION.md`
- Tạo lại `DOC_001_TECHNICAL_DOCUMENTATION.md` mới dựa trên REST API (nếu cần)

---

## ⚠️ CẦN CẬP NHẬT (8 files)

Các file này vẫn còn giá trị nhưng cần update để loại bỏ references đến GraphQL/Auth:

1. **MANUAL_TASKS_CHECKLIST.md**
   - Còn đề cập đến WPGraphQL, JWT Authentication
   - Cần update sang REST API và remove auth

2. **QUICK_SETUP_CHECKLIST.md**
   - Còn đề cập đến GraphQL endpoint, GraphQL types
   - Cần update sang REST API

3. **WORDPRESS_SETUP_GUIDE.md**
   - Còn đề cập đến WPGraphQL, JWT Authentication
   - Cần update sang REST API và remove auth

4. **ADD_PRODUCTS_WORDPRESS.md**
   - Còn đề cập đến GraphQL verification
   - Cần update sang REST API

5. **ACF_SETUP_GUIDE.md**
   - Còn đề cập đến GraphQL tab (nhưng ACF vẫn cần expose fields)
   - Cần update: ACF fields giờ qua `meta_data` trong REST API

6. **SCHEMA_CONTEXT.md**
   - Còn đề cập đến GraphQL (nhưng có note đã migrate)
   - Cần update: Loại bỏ hoàn toàn GraphQL references

7. **TROUBLESHOOTING.md**
   - Còn đề cập đến GraphQL errors (nhưng có note đã migrate)
   - Cần update: Loại bỏ hoàn toàn GraphQL troubleshooting

8. **PERFORMANCE_OPTIMIZATION.md**
   - Còn đề cập đến GraphQL query optimization
   - Cần update: Thay bằng REST API optimization

---

## ✅ GIỮ LẠI (20 files)

Các file này vẫn còn giá trị và không trùng lặp:

### Setup & Configuration
- ✅ `WORDPRESS_SETUP_GUIDE.md` (cần update)
- ✅ `ACF_SETUP_GUIDE.md` (cần update)
- ✅ `SETUP_WOOCOMMERCE_REST_API.md`
- ✅ `SETUP_WORDPRESS_APP_PASSWORD.md`
- ✅ `QUICK_SETUP_CHECKLIST.md` (cần update)

### Development
- ✅ `DESIGN_SYSTEM.md`
- ✅ `DEVELOPMENT_STRATEGY.md`
- ✅ `SCHEMA_CONTEXT.md` (cần update)
- ✅ `HOMEPAGE_PLAN_GOMI_STYLE.md`
- ✅ `MENU_UPGRADE_PLAN.md`

### Features
- ✅ `HERO_BANNER_GUIDE.md`
- ✅ `WOOCOMMERCE_VARIATIONS_GUIDE.md`
- ✅ `ADD_PRODUCTS_WORDPRESS.md` (cần update)
- ✅ `ADMIN_PRODUCT_MANAGEMENT.md`
- ✅ `CHECKOUT_FLOW.md`
- ✅ `CART_SYNC.md` (sẽ xóa - lỗi thời)

### Testing
- ✅ `PHASE2_TESTING_CHECKLIST.md`
- ✅ `PHASE3_TESTING_CHECKLIST.md`
- ✅ `TEST_MOMO_PAYMENT.md`

### Deployment & Troubleshooting
- ✅ `DEPLOYMENT_GUIDE.md`
- ✅ `TROUBLESHOOTING.md` (cần update)
- ✅ `PERFORMANCE_OPTIMIZATION.md` (cần update)

### Documentation
- ✅ `README.md`
- ✅ `PHASE_SUMMARIES.md`
- ✅ `MIGRATION_TO_REST_API_PLAN.md`
- ✅ `REMOVE_AUTHENTICATION.md`
- ✅ `DOC_002_USER_DOCUMENTATION.md`
- ✅ `MANUAL_TASKS_CHECKLIST.md` (cần update)

---

## 📈 Kết Quả Dự Kiến

### Trước khi dọn dẹp:
- **Tổng số files:** 38 files
- **Files lỗi thời:** ~10 files
- **Files cần update:** ~8 files

### Sau khi dọn dẹp:
- **Tổng số files:** ~28 files (giảm 26%)
- **Files đã xóa:** 10 files
- **Files đã gộp:** 3 nhóm
- **Files đã update:** 8 files

---

## ✅ Checklist Thực Hiện

### Bước 1: Backup (Optional)
- [ ] Tạo backup của thư mục `docs/` trước khi xóa

### Bước 2: Xóa Files
- [ ] Xóa `DEPLOYMENT_STRATEGY.md`
- [ ] Xóa `HOMEPAGE_PLAN.md`
- [ ] Xóa `QUICK_START_MOMO_TEST.md`
- [ ] Xóa `PHASE2_QUICK_TEST.md`
- [ ] Xóa `PHASE3_QUICK_TEST.md`
- [ ] Xóa `PROJECT_STATUS_SUMMARY.md`
- [ ] Xóa `DOC_001_TECHNICAL_DOCUMENTATION.md`
- [ ] Xóa `LOCAL_DEVELOPMENT_CHECKLIST.md` (sau khi gộp)
- [ ] Xóa `CART_SYNC.md`
- [ ] Xóa `DOCS_REORGANIZATION_SUMMARY.md` (optional)

### Bước 3: Gộp Files
- [ ] Gộp `MIGRATION_TO_REST_API_SUMMARY.md` vào `MIGRATION_TO_REST_API_PLAN.md`
- [ ] Gộp `LOCAL_DEVELOPMENT_CHECKLIST.md` vào `QUICK_SETUP_CHECKLIST.md`
- [ ] Gộp `PHASE2_QUICK_TEST.md` vào `PHASE2_TESTING_CHECKLIST.md` (nếu cần)
- [ ] Gộp `PHASE3_QUICK_TEST.md` vào `PHASE3_TESTING_CHECKLIST.md` (nếu cần)

### Bước 4: Update Files
- [ ] Update `MANUAL_TASKS_CHECKLIST.md` (remove GraphQL, Auth)
- [ ] Update `QUICK_SETUP_CHECKLIST.md` (remove GraphQL)
- [ ] Update `WORDPRESS_SETUP_GUIDE.md` (remove GraphQL, Auth)
- [ ] Update `ADD_PRODUCTS_WORDPRESS.md` (remove GraphQL)
- [ ] Update `ACF_SETUP_GUIDE.md` (update ACF → REST API)
- [ ] Update `SCHEMA_CONTEXT.md` (remove GraphQL)
- [ ] Update `TROUBLESHOOTING.md` (remove GraphQL)
- [ ] Update `PERFORMANCE_OPTIMIZATION.md` (GraphQL → REST API)

### Bước 5: Update README.md
- [ ] Update `README.md` để loại bỏ links đến files đã xóa
- [ ] Update `README.md` để reflect cấu trúc mới

---

## 📝 Notes

### Files Có Thể Giữ Lại (Nếu Cần)
- `DOCS_REORGANIZATION_SUMMARY.md` - Có thể giữ lại như historical record
- `PHASE2_QUICK_TEST.md` / `PHASE3_QUICK_TEST.md` - Có thể giữ lại nếu muốn quick reference riêng

### Files Cần Tạo Mới (Nếu Cần)
- `DOC_001_TECHNICAL_DOCUMENTATION.md` - Tạo lại với nội dung REST API
- `API_REFERENCE.md` - Tạo mới để document REST API endpoints

---

**Last Updated:** 2025-01-XX  
**Status:** 📋 **PROPOSAL - Pending Approval**

