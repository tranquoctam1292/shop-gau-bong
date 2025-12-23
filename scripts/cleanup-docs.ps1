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

$deletedCount = 0
$notFoundCount = 0

foreach ($file in $filesToDelete) {
    if (Test-Path $file) {
        Remove-Item $file -Force
        Write-Host "  ✅ Deleted: $file" -ForegroundColor Green
        $deletedCount++
    } else {
        Write-Host "  ⚠️  Not found: $file" -ForegroundColor Yellow
        $notFoundCount++
    }
}

Write-Host "`n📊 Summary:" -ForegroundColor Cyan
Write-Host "  ✅ Deleted: $deletedCount files" -ForegroundColor Green
Write-Host "  ⚠️  Not found: $notFoundCount files" -ForegroundColor Yellow

Write-Host "`n✅ Group 1 cleanup completed!" -ForegroundColor Green
Write-Host "`n⚠️  Group 2: Manual merge required (see docs/DOCS_CLEANUP_ANALYSIS.md)" -ForegroundColor Yellow
Write-Host "⚠️  Group 3: Manual review required (see docs/DOCS_CLEANUP_ANALYSIS.md)" -ForegroundColor Yellow

Write-Host "`n🎉 Cleanup script completed!" -ForegroundColor Cyan
Write-Host "`n📝 Next steps:" -ForegroundColor Cyan
Write-Host "  1. Review docs/DOCS_CLEANUP_ANALYSIS.md for detailed analysis" -ForegroundColor White
Write-Host "  2. Follow docs/DOCS_CLEANUP_ACTION_PLAN.md for manual merges" -ForegroundColor White
Write-Host "  3. Review Group 3 files and decide keep/delete/update" -ForegroundColor White

