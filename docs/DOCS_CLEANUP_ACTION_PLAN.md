# Kế Hoạch Dọn Dẹp Thư Mục docs/ - Action Plan

**Ngày tạo:** 2025-01-XX  
**Status:** 📋 Ready for Execution

---

## 📊 TỔNG QUAN

**Trước cleanup:** 72 files  
**Sau cleanup:** ~50-55 files  
**Giảm:** ~17-22 files (24-31% reduction)

---

## 🗑️ NHÓM 1: XÓA NGAY (10 files)

### Files lỗi thời - Migration cũ (đã migrate sang custom CMS)

```bash
# Xóa migration plans cũ (không dùng REST API nữa)
rm docs/MIGRATION_TO_REST_API_PLAN.md
rm docs/MIGRATION_TO_REST_API_SUMMARY.md
```

**Lý do:** Đã migrate sang custom CMS, không dùng WooCommerce REST API nữa.

---

### Files lỗi thời - WordPress/WooCommerce specific

```bash
# Xóa WordPress-specific guides (không dùng WordPress nữa)
rm docs/ADD_PRODUCTS_WORDPRESS.md
rm docs/ACF_SETUP_GUIDE.md
rm docs/REMOVE_AUTHENTICATION.md
```

**Lý do:** Đã migrate sang custom CMS, không dùng WordPress/WooCommerce/ACF nữa.

---

### Files lỗi thời - Báo cáo lỗi cũ

```bash
# Xóa báo cáo lỗi đã fix
rm docs/BAO_CAO_GO_LOI.md
rm docs/BAO_CAO_LOI_HIEN_THI_2_KET_QUA_BO_LOC.md
```

**Lý do:** Lỗi đã được fix, không cần thiết giữ lại.

---

### Files cleanup cũ

```bash
# Xóa cleanup proposals cũ
rm docs/DOCS_CLEANUP_PROPOSAL.md
rm docs/DOCS_REORGANIZATION_SUMMARY.md
```

**Lý do:** Đây là các file proposal cũ, đã có file phân tích mới.

---

### Files quick test cũ

```bash
# Xóa quick tests cũ
rm docs/PHASE2_QUICK_TEST.md
rm docs/PHASE3_QUICK_TEST.md
```

**Lý do:** Quick tests đã lỗi thời, có test results files mới hơn.

---

## 🔄 NHÓM 2: GỘP VÀO FILE TỔNG HỢP (11 files → 5 files)

### 1. Gộp Troubleshooting (4 files → 1 file)

**Files cần gộp:**
- `FIX_403_FORBIDDEN_ERROR.md`
- `FIX_WEBPACK_CHUNK_ERROR.md`
- `TROUBLESHOOTING_WEBPACK_CHUNK.md`
- `TROUBLESHOOTING_500_ERROR.md`

**Gộp vào:** `TROUBLESHOOTING.md`

**Hành động:**
1. Đọc nội dung 4 files
2. Gộp vào `TROUBLESHOOTING.md` với sections riêng
3. Xóa 4 files cũ

```bash
# Sau khi gộp xong, xóa:
rm docs/FIX_403_FORBIDDEN_ERROR.md
rm docs/FIX_WEBPACK_CHUNK_ERROR.md
rm docs/TROUBLESHOOTING_WEBPACK_CHUNK.md
rm docs/TROUBLESHOOTING_500_ERROR.md
```

---

### 2. Gộp Deployment (2 files → 1 file)

**Files cần gộp:**
- `DEPLOYMENT_STRATEGY.md`
- `DEPLOYMENT_SUMMARY.md`

**Gộp vào:** `DEPLOYMENT_GUIDE.md`

**Hành động:**
1. Đọc nội dung 2 files
2. Gộp vào `DEPLOYMENT_GUIDE.md` với sections riêng
3. Xóa 2 files cũ

```bash
# Sau khi gộp xong, xóa:
rm docs/DEPLOYMENT_STRATEGY.md
rm docs/DEPLOYMENT_SUMMARY.md
```

---

### 3. Gộp Testing Checklists (2 files → 1 file)

**Files cần gộp:**
- `PHASE2_TESTING_CHECKLIST.md`
- `PHASE3_TESTING_CHECKLIST.md`

**Tạo mới:** `TESTING_CHECKLIST.md`

**Hành động:**
1. Đọc nội dung 2 files
2. Tạo `TESTING_CHECKLIST.md` mới với sections cho từng phase
3. Xóa 2 files cũ

```bash
# Sau khi gộp xong, xóa:
rm docs/PHASE2_TESTING_CHECKLIST.md
rm docs/PHASE3_TESTING_CHECKLIST.md
```

---

### 4. Gộp Performance (1 file → 1 file)

**Files cần gộp:**
- `PERFORMANCE_OPTIMIZATION_FILTERING.md`

**Gộp vào:** `PERFORMANCE_OPTIMIZATION.md`

**Hành động:**
1. Đọc nội dung `PERFORMANCE_OPTIMIZATION_FILTERING.md`
2. Gộp vào `PERFORMANCE_OPTIMIZATION.md` với section "Filtering Optimization"
3. Xóa file cũ

```bash
# Sau khi gộp xong, xóa:
rm docs/PERFORMANCE_OPTIMIZATION_FILTERING.md
```

---

### 5. Gộp MoMo Testing (1 file → 1 file)

**Files cần gộp:**
- `QUICK_START_MOMO_TEST.md`

**Gộp vào:** `TEST_MOMO_PAYMENT.md`

**Hành động:**
1. Đọc nội dung `QUICK_START_MOMO_TEST.md`
2. Gộp vào `TEST_MOMO_PAYMENT.md` với section "Quick Start"
3. Xóa file cũ

```bash
# Sau khi gộp xong, xóa:
rm docs/QUICK_START_MOMO_TEST.md
```

---

## ⚠️ NHÓM 3: CẦN REVIEW (13 files)

### Files cần kiểm tra nội dung trước khi quyết định:

1. **Phase Summaries:**
   - `PHASE_SUMMARIES.md` - Kiểm tra xem có tổng hợp đầy đủ không

2. **Documentation:**
   - `DOC_001_TECHNICAL_DOCUMENTATION.md` - Kiểm tra xem có còn cần thiết không
   - `DOC_002_USER_DOCUMENTATION.md` - Kiểm tra xem có còn cần thiết không

3. **Plans:**
   - `HOMEPAGE_PLAN.md` - Kiểm tra xem có còn cần thiết không
   - `HOMEPAGE_PLAN_GOMI_STYLE.md` - Kiểm tra xem có còn cần thiết không
   - `MENU_UPGRADE_PLAN.md` - Kiểm tra xem có còn cần thiết không
   - `HERO_BANNER_GUIDE.md` - Kiểm tra xem có còn cần thiết không

4. **Features:**
   - `CART_SYNC.md` - Kiểm tra xem có còn cần thiết không
   - `CHECKOUT_FLOW.md` - Kiểm tra xem có còn cần thiết không
   - `ADMIN_PRODUCT_MANAGEMENT.md` - Kiểm tra xem có trùng với phase docs không
   - `WOOCOMMERCE_VARIATIONS_GUIDE.md` - Kiểm tra xem có còn cần thiết không (đã migrate sang custom CMS)

5. **Status:**
   - `PROJECT_STATUS_SUMMARY.md` - Cập nhật hoặc xóa nếu đã lỗi thời
   - `DEVELOPMENT_STRATEGY.md` - Kiểm tra xem có còn cần thiết không

**Hành động:** Đọc từng file và quyết định giữ/xóa/cập nhật.

---

## 📋 SCRIPT CLEANUP (PowerShell)

Tạo file `scripts/cleanup-docs.ps1`:

```powershell
# Script cleanup docs folder
# Usage: .\scripts\cleanup-docs.ps1

Write-Host "🧹 Starting docs cleanup..." -ForegroundColor Cyan

# Nhóm 1: Xóa files lỗi thời
Write-Host "`n📦 Group 1: Deleting obsolete files..." -ForegroundColor Yellow

$filesToDelete = @(
    "docs\MIGRATION_TO_REST_API_PLAN.md",
    "docs\MIGRATION_TO_REST_API_SUMMARY.md",
    "docs\ADD_PRODUCTS_WORDPRESS.md",
    "docs\ACF_SETUP_GUIDE.md",
    "docs\REMOVE_AUTHENTICATION.md",
    "docs\BAO_CAO_GO_LOI.md",
    "docs\BAO_CAO_LOI_HIEN_THI_2_KET_QUA_BO_LOC.md",
    "docs\DOCS_CLEANUP_PROPOSAL.md",
    "docs\DOCS_REORGANIZATION_SUMMARY.md",
    "docs\PHASE2_QUICK_TEST.md",
    "docs\PHASE3_QUICK_TEST.md"
)

foreach ($file in $filesToDelete) {
    if (Test-Path $file) {
        Remove-Item $file -Force
        Write-Host "  ✅ Deleted: $file" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  Not found: $file" -ForegroundColor Yellow
    }
}

Write-Host "`n✅ Group 1 cleanup completed!" -ForegroundColor Green
Write-Host "`n⚠️  Group 2: Manual merge required (see DOCS_CLEANUP_ANALYSIS.md)" -ForegroundColor Yellow
Write-Host "⚠️  Group 3: Manual review required (see DOCS_CLEANUP_ANALYSIS.md)" -ForegroundColor Yellow

Write-Host "`n🎉 Cleanup script completed!" -ForegroundColor Cyan
```

---

## ✅ CHECKLIST THỰC HIỆN

### Bước 1: Backup (Optional)
- [ ] Backup thư mục `docs/` trước khi cleanup

### Bước 2: Xóa files lỗi thời (Nhóm 1)
- [ ] Chạy script cleanup hoặc xóa thủ công 10 files
- [ ] Verify không có file nào còn được reference

### Bước 3: Gộp files trùng lặp (Nhóm 2)
- [ ] Gộp 4 troubleshooting files vào `TROUBLESHOOTING.md`
- [ ] Gộp 2 deployment files vào `DEPLOYMENT_GUIDE.md`
- [ ] Gộp 2 testing checklist files vào `TESTING_CHECKLIST.md` mới
- [ ] Gộp performance filtering vào `PERFORMANCE_OPTIMIZATION.md`
- [ ] Gộp MoMo quick test vào `TEST_MOMO_PAYMENT.md`
- [ ] Xóa 11 files cũ sau khi gộp

### Bước 4: Review files (Nhóm 3)
- [ ] Đọc và review 13 files
- [ ] Quyết định giữ/xóa/cập nhật từng file
- [ ] Cập nhật hoặc xóa files không cần thiết

### Bước 5: Verify
- [ ] Kiểm tra không có broken links
- [ ] Verify các file quan trọng vẫn còn
- [ ] Update README.md nếu cần

---

## 📊 KẾT QUẢ DỰ KIẾN

**Trước:** 72 files  
**Sau khi xóa (Nhóm 1):** 62 files (-10)  
**Sau khi gộp (Nhóm 2):** 57 files (-5)  
**Sau khi review (Nhóm 3):** ~50-55 files (-2 đến -7)

**Tổng giảm:** ~17-22 files (24-31% reduction)

---

## 🎯 FILES CẦN GIỮ LẠI (Core - ~35 files)

Xem chi tiết trong `DOCS_CLEANUP_ANALYSIS.md` section "✅ FILES CẦN GIỮ LẠI"

---

**Status:** 📋 Ready for Execution

