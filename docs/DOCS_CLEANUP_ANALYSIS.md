# Phân Tích và Đề Xuất Dọn Dẹp Thư Mục docs/

**Ngày phân tích:** 2025-01-XX  
**Tổng số files:** 72 files

---

## 📊 PHÂN LOẠI FILES

### 1. ✅ FILES CẦN GIỮ LẠI (Core Documentation)

#### A. Setup & Configuration Guides
- ✅ `MONGODB_SETUP_GUIDE.md` - Hướng dẫn setup MongoDB
- ✅ `VERCEL_ENV_SETUP.md` - Hướng dẫn setup env trên Vercel
- ✅ `SCHEMA_CONTEXT.md` - Schema reference (được reference trong .cursorrules)
- ✅ `DESIGN_SYSTEM.md` - Design system (được reference trong .cursorrules)
- ✅ `WORDPRESS_SETUP_GUIDE.md` - Hướng dẫn setup WordPress (nếu vẫn dùng)
- ✅ `SETUP_WOOCOMMERCE_REST_API.md` - Hướng dẫn setup WooCommerce API
- ✅ `SETUP_WORDPRESS_APP_PASSWORD.md` - Hướng dẫn setup WordPress app password

#### B. Migration & CMS Documentation
- ✅ `MIGRATION_TO_CUSTOM_CMS_PLAN.md` - Kế hoạch migration sang custom CMS (đã hoàn thành)
- ✅ `CMS_INTEGRATION_ANALYSIS.md` - Phân tích tích hợp CMS
- ✅ `CMS_SYNC_PLAN.md` - Kế hoạch đồng bộ CMS features

#### C. Product Features Documentation (Phase 1-6)
- ✅ `PRODUCT_FEATURES_SYNC_ANALYSIS.md` - Phân tích tính năng sản phẩm
- ✅ `PHASE1_PRODUCT_FEATURES_COMPLETE.md` - Phase 1 hoàn thành
- ✅ `PHASE2_PRODUCT_FEATURES_COMPLETE.md` - Phase 2 hoàn thành
- ✅ `PHASE3_PRODUCT_FEATURES_COMPLETE.md` - Phase 3 hoàn thành
- ✅ `PHASE4_PRODUCT_FEATURES_COMPLETE.md` - Phase 4 hoàn thành
- ✅ `PHASE5_PRODUCT_FEATURES_COMPLETE.md` - Phase 5 hoàn thành
- ✅ `PHASE6_PRODUCT_FEATURES_COMPLETE.md` - Phase 6 hoàn thành
- ✅ `PRODUCT_MANAGEMENT_TEST_REPORT.md` - Test report mới nhất

#### D. CMS Sync Documentation
- ✅ `PHASE1_CMS_SYNC_COMPLETE.md` - CMS sync phase 1
- ✅ `PHASE2_BLOG_SYSTEM_COMPLETE.md` - Blog system
- ✅ `PHASE5_ADMIN_PANEL_COMPLETE.md` - Admin panel

#### E. Migration Documentation
- ✅ `PHASE1_SETUP_COMPLETE.md` - MongoDB setup
- ✅ `PHASE2_MIGRATION_COMPLETE.md` - API routes migration
- ✅ `PHASE3_COMPLETE.md` - Data migration
- ✅ `PHASE3_DATA_MIGRATION_GUIDE.md` - Data migration guide
- ✅ `PHASE4_FRONTEND_UPDATE_COMPLETE.md` - Frontend update
- ✅ `PHASE_REVIEW_FIXES.md` - Review và fixes

---

### 2. ⚠️ FILES CẦN GỘP HOẶC XÓA (Trùng lặp/Lỗi thời)

#### A. Trùng lặp về Migration
- ❌ `MIGRATION_TO_REST_API_PLAN.md` - **XÓA** (đã migrate sang custom CMS, không dùng REST API nữa)
- ❌ `MIGRATION_TO_REST_API_SUMMARY.md` - **XÓA** (đã migrate sang custom CMS)
- ⚠️ `PHASE2_MIGRATION_COMPLETE.md` - **GỘP** vào `PHASE2_API_ROUTES_TEST_RESULTS.md` hoặc tạo summary

#### B. Trùng lặp về Troubleshooting
- ❌ `FIX_403_FORBIDDEN_ERROR.md` - **GỘP** vào `TROUBLESHOOTING.md`
- ❌ `FIX_WEBPACK_CHUNK_ERROR.md` - **GỘP** vào `TROUBLESHOOTING.md`
- ❌ `TROUBLESHOOTING_WEBPACK_CHUNK.md` - **GỘP** vào `TROUBLESHOOTING.md` (trùng với FIX_WEBPACK_CHUNK_ERROR.md)
- ❌ `TROUBLESHOOTING_500_ERROR.md` - **GỘP** vào `TROUBLESHOOTING.md`

#### C. Trùng lặp về Deployment
- ⚠️ `DEPLOYMENT_GUIDE.md` - **GIỮ** (nếu có nội dung chi tiết)
- ⚠️ `DEPLOYMENT_STRATEGY.md` - **GỘP** vào `DEPLOYMENT_GUIDE.md` hoặc xóa nếu trùng
- ⚠️ `DEPLOYMENT_SUMMARY.md` - **GỘP** vào `DEPLOYMENT_GUIDE.md` hoặc xóa nếu trùng
- ⚠️ `PRE_DEPLOYMENT_CHECKLIST.md` - **GIỮ** (nếu có checklist riêng)

#### D. Trùng lặp về Phase Summaries
- ⚠️ `PHASE_SUMMARIES.md` - **KIỂM TRA** xem có tổng hợp các phase không, nếu có thì giữ, nếu không thì xóa
- ⚠️ `PHASE2_API_ROUTES_TEST_RESULTS.md` - **GIỮ** (test results riêng)
- ⚠️ `PHASE4_HOOKS_TEST_RESULTS.md` - **GIỮ** (test results riêng)

#### E. Trùng lặp về Testing
- ⚠️ `PHASE2_QUICK_TEST.md` - **XÓA** (quick test, có thể đã lỗi thời)
- ⚠️ `PHASE3_QUICK_TEST.md` - **XÓA** (quick test, có thể đã lỗi thời)
- ⚠️ `PHASE2_TESTING_CHECKLIST.md` - **GỘP** vào một file `TESTING_CHECKLIST.md` tổng hợp
- ⚠️ `PHASE3_TESTING_CHECKLIST.md` - **GỘP** vào một file `TESTING_CHECKLIST.md` tổng hợp

#### F. Trùng lặp về Documentation
- ⚠️ `DOC_001_TECHNICAL_DOCUMENTATION.md` - **KIỂM TRA** xem có còn cần thiết không
- ⚠️ `DOC_002_USER_DOCUMENTATION.md` - **KIỂM TRA** xem có còn cần thiết không
- ❌ `DOCS_CLEANUP_PROPOSAL.md` - **XÓA** (file này chính là proposal, có thể xóa sau khi thực hiện)
- ❌ `DOCS_REORGANIZATION_SUMMARY.md` - **XÓA** (summary cũ, không cần thiết)

#### G. Lỗi thời (WordPress/WooCommerce specific)
- ❌ `ADD_PRODUCTS_WORDPRESS.md` - **XÓA** (đã migrate sang custom CMS)
- ❌ `ACF_SETUP_GUIDE.md` - **XÓA** (không dùng ACF nữa)
- ❌ `WOOCOMMERCE_VARIATIONS_GUIDE.md` - **XÓA** hoặc **CẬP NHẬT** (nếu vẫn cần reference)
- ❌ `REMOVE_AUTHENTICATION.md` - **XÓA** (task đã hoàn thành, không cần thiết)

#### H. Lỗi thời (Old features/plans)
- ⚠️ `HOMEPAGE_PLAN.md` - **KIỂM TRA** xem có còn cần thiết không
- ⚠️ `HOMEPAGE_PLAN_GOMI_STYLE.md` - **KIỂM TRA** xem có còn cần thiết không
- ⚠️ `MENU_UPGRADE_PLAN.md` - **KIỂM TRA** xem có còn cần thiết không
- ⚠️ `HERO_BANNER_GUIDE.md` - **KIỂM TRA** xem có còn cần thiết không
- ⚠️ `CART_SYNC.md` - **KIỂM TRA** xem có còn cần thiết không
- ⚠️ `CHECKOUT_FLOW.md` - **KIỂM TRA** xem có còn cần thiết không
- ⚠️ `ADMIN_PRODUCT_MANAGEMENT.md` - **KIỂM TRA** xem có trùng với phase docs không

#### I. Performance & Optimization
- ⚠️ `PERFORMANCE_OPTIMIZATION.md` - **GIỮ** (nếu có nội dung hữu ích)
- ⚠️ `PERFORMANCE_OPTIMIZATION_FILTERING.md` - **GỘP** vào `PERFORMANCE_OPTIMIZATION.md`

#### J. Báo cáo lỗi cũ
- ❌ `BAO_CAO_GO_LOI.md` - **XÓA** (báo cáo lỗi cũ, đã fix)
- ❌ `BAO_CAO_LOI_HIEN_THI_2_KET_QUA_BO_LOC.md` - **XÓA** (báo cáo lỗi cũ, đã fix)

#### K. Testing & Checklists
- ⚠️ `QUICK_SETUP_CHECKLIST.md` - **GIỮ** (nếu có checklist hữu ích)
- ⚠️ `LOCAL_DEVELOPMENT_CHECKLIST.md` - **GIỮ** (nếu có checklist hữu ích)
- ⚠️ `MANUAL_TASKS_CHECKLIST.md` - **GIỮ** (nếu có checklist hữu ích)
- ⚠️ `TEST_MOMO_PAYMENT.md` - **GIỮ** (nếu vẫn test MoMo)
- ⚠️ `QUICK_START_MOMO_TEST.md` - **GỘP** vào `TEST_MOMO_PAYMENT.md`

#### L. Strategy & Status
- ⚠️ `DEVELOPMENT_STRATEGY.md` - **KIỂM TRA** xem có còn cần thiết không
- ⚠️ `PROJECT_STATUS_SUMMARY.md` - **CẬP NHẬT** hoặc **XÓA** nếu đã lỗi thời

---

## 🎯 ĐỀ XUẤT HÀNH ĐỘNG

### Nhóm 1: XÓA NGAY (Lỗi thời/Trùng lặp rõ ràng)

1. **Migration cũ (đã migrate sang custom CMS):**
   - `MIGRATION_TO_REST_API_PLAN.md`
   - `MIGRATION_TO_REST_API_SUMMARY.md`

2. **WordPress/WooCommerce specific (không dùng nữa):**
   - `ADD_PRODUCTS_WORDPRESS.md`
   - `ACF_SETUP_GUIDE.md`
   - `REMOVE_AUTHENTICATION.md`

3. **Báo cáo lỗi cũ (đã fix):**
   - `BAO_CAO_GO_LOI.md`
   - `BAO_CAO_LOI_HIEN_THI_2_KET_QUA_BO_LOC.md`

4. **Documentation cleanup files:**
   - `DOCS_CLEANUP_PROPOSAL.md`
   - `DOCS_REORGANIZATION_SUMMARY.md`

5. **Quick tests cũ:**
   - `PHASE2_QUICK_TEST.md`
   - `PHASE3_QUICK_TEST.md`

**Tổng: 10 files**

---

### Nhóm 2: GỘP VÀO FILE TỔNG HỢP

1. **Troubleshooting (gộp vào `TROUBLESHOOTING.md`):**
   - `FIX_403_FORBIDDEN_ERROR.md`
   - `FIX_WEBPACK_CHUNK_ERROR.md`
   - `TROUBLESHOOTING_WEBPACK_CHUNK.md`
   - `TROUBLESHOOTING_500_ERROR.md`

2. **Deployment (gộp vào `DEPLOYMENT_GUIDE.md`):**
   - `DEPLOYMENT_STRATEGY.md`
   - `DEPLOYMENT_SUMMARY.md`

3. **Testing Checklists (gộp vào `TESTING_CHECKLIST.md`):**
   - `PHASE2_TESTING_CHECKLIST.md`
   - `PHASE3_TESTING_CHECKLIST.md`

4. **Performance (gộp vào `PERFORMANCE_OPTIMIZATION.md`):**
   - `PERFORMANCE_OPTIMIZATION_FILTERING.md`

5. **MoMo Testing (gộp vào `TEST_MOMO_PAYMENT.md`):**
   - `QUICK_START_MOMO_TEST.md`

**Tổng: 11 files (sẽ gộp thành 5 files)**

---

### Nhóm 3: CẦN KIỂM TRA NỘI DUNG

1. **Phase Summaries:**
   - `PHASE_SUMMARIES.md` - Kiểm tra xem có tổng hợp đầy đủ không

2. **Documentation:**
   - `DOC_001_TECHNICAL_DOCUMENTATION.md`
   - `DOC_002_USER_DOCUMENTATION.md`

3. **Plans:**
   - `HOMEPAGE_PLAN.md`
   - `HOMEPAGE_PLAN_GOMI_STYLE.md`
   - `MENU_UPGRADE_PLAN.md`
   - `HERO_BANNER_GUIDE.md`

4. **Features:**
   - `CART_SYNC.md`
   - `CHECKOUT_FLOW.md`
   - `ADMIN_PRODUCT_MANAGEMENT.md`
   - `WOOCOMMERCE_VARIATIONS_GUIDE.md`

5. **Status:**
   - `PROJECT_STATUS_SUMMARY.md`
   - `DEVELOPMENT_STRATEGY.md`

**Tổng: 13 files cần review**

---

## 📋 KẾ HOẠCH THỰC HIỆN

### Bước 1: Xóa files lỗi thời (10 files)
```bash
# Migration cũ
rm docs/MIGRATION_TO_REST_API_PLAN.md
rm docs/MIGRATION_TO_REST_API_SUMMARY.md

# WordPress specific
rm docs/ADD_PRODUCTS_WORDPRESS.md
rm docs/ACF_SETUP_GUIDE.md
rm docs/REMOVE_AUTHENTICATION.md

# Báo cáo lỗi cũ
rm docs/BAO_CAO_GO_LOI.md
rm docs/BAO_CAO_LOI_HIEN_THI_2_KET_QUA_BO_LOC.md

# Cleanup files
rm docs/DOCS_CLEANUP_PROPOSAL.md
rm docs/DOCS_REORGANIZATION_SUMMARY.md

# Quick tests cũ
rm docs/PHASE2_QUICK_TEST.md
rm docs/PHASE3_QUICK_TEST.md
```

### Bước 2: Gộp files trùng lặp (11 files → 5 files)

1. **Gộp Troubleshooting:**
   - Đọc nội dung 4 files troubleshooting
   - Gộp vào `TROUBLESHOOTING.md`
   - Xóa 4 files cũ

2. **Gộp Deployment:**
   - Đọc nội dung 2 files deployment
   - Gộp vào `DEPLOYMENT_GUIDE.md`
   - Xóa 2 files cũ

3. **Gộp Testing Checklists:**
   - Đọc nội dung 2 files testing checklist
   - Tạo `TESTING_CHECKLIST.md` mới
   - Xóa 2 files cũ

4. **Gộp Performance:**
   - Đọc nội dung `PERFORMANCE_OPTIMIZATION_FILTERING.md`
   - Gộp vào `PERFORMANCE_OPTIMIZATION.md`
   - Xóa file cũ

5. **Gộp MoMo Testing:**
   - Đọc nội dung `QUICK_START_MOMO_TEST.md`
   - Gộp vào `TEST_MOMO_PAYMENT.md`
   - Xóa file cũ

### Bước 3: Review và quyết định (13 files)

- Đọc nội dung từng file
- Quyết định giữ/xóa/cập nhật
- Cập nhật hoặc xóa nếu không cần thiết

---

## 📊 KẾT QUẢ DỰ KIẾN

**Trước:** 72 files  
**Sau khi xóa:** ~62 files (xóa 10 files)  
**Sau khi gộp:** ~57 files (gộp 11 files thành 5 files)  
**Sau khi review:** ~50-55 files (tùy quyết định review)

**Giảm:** ~17-22 files (24-31% reduction)

---

## ✅ FILES CẦN GIỮ LẠI (Core - ~35 files)

### Setup & Config (7 files)
- MONGODB_SETUP_GUIDE.md
- VERCEL_ENV_SETUP.md
- SCHEMA_CONTEXT.md
- DESIGN_SYSTEM.md
- WORDPRESS_SETUP_GUIDE.md (nếu vẫn cần)
- SETUP_WOOCOMMERCE_REST_API.md (nếu vẫn cần)
- SETUP_WORDPRESS_APP_PASSWORD.md (nếu vẫn cần)

### Migration & CMS (3 files)
- MIGRATION_TO_CUSTOM_CMS_PLAN.md
- CMS_INTEGRATION_ANALYSIS.md
- CMS_SYNC_PLAN.md

### Product Features (8 files)
- PRODUCT_FEATURES_SYNC_ANALYSIS.md
- PHASE1_PRODUCT_FEATURES_COMPLETE.md
- PHASE2_PRODUCT_FEATURES_COMPLETE.md
- PHASE3_PRODUCT_FEATURES_COMPLETE.md
- PHASE4_PRODUCT_FEATURES_COMPLETE.md
- PHASE5_PRODUCT_FEATURES_COMPLETE.md
- PHASE6_PRODUCT_FEATURES_COMPLETE.md
- PRODUCT_MANAGEMENT_TEST_REPORT.md

### CMS Sync (3 files)
- PHASE1_CMS_SYNC_COMPLETE.md
- PHASE2_BLOG_SYSTEM_COMPLETE.md
- PHASE5_ADMIN_PANEL_COMPLETE.md

### Migration Phases (5 files)
- PHASE1_SETUP_COMPLETE.md
- PHASE2_MIGRATION_COMPLETE.md
- PHASE3_COMPLETE.md
- PHASE3_DATA_MIGRATION_GUIDE.md
- PHASE4_FRONTEND_UPDATE_COMPLETE.md

### Test Results (2 files)
- PHASE2_API_ROUTES_TEST_RESULTS.md
- PHASE4_HOOKS_TEST_RESULTS.md

### Review & Fixes (1 file)
- PHASE_REVIEW_FIXES.md

### Troubleshooting (1 file sau khi gộp)
- TROUBLESHOOTING.md (sẽ gộp 4 files vào)

### Deployment (1 file sau khi gộp)
- DEPLOYMENT_GUIDE.md (sẽ gộp 2 files vào)
- PRE_DEPLOYMENT_CHECKLIST.md

### Testing (1 file sau khi gộp)
- TESTING_CHECKLIST.md (sẽ gộp 2 files vào)

### Checklists (3 files)
- QUICK_SETUP_CHECKLIST.md
- LOCAL_DEVELOPMENT_CHECKLIST.md
- MANUAL_TASKS_CHECKLIST.md

### Other (1 file)
- README.md

---

**Status:** 📝 Analysis Complete - Ready for Implementation

