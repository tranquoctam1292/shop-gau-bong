/**
 * Phase 1 Performance Optimizations - Code Verification Script
 * 
 * This script verifies that all Phase 1 optimizations are properly implemented
 * by checking code patterns and configurations.
 * 
 * Usage: node scripts/test-phase1-optimizations.js
 */

const fs = require('fs');
const path = require('path');

const results = {
  passed: [],
  failed: [],
  warnings: [],
};

function checkFileExists(filePath, description) {
  const fullPath = path.join(process.cwd(), filePath);
  if (fs.existsSync(fullPath)) {
    results.passed.push(`✅ ${description}: File exists`);
    return true;
  } else {
    results.failed.push(`❌ ${description}: File not found at ${filePath}`);
    return false;
  }
}

function checkFileContains(filePath, pattern, description) {
  const fullPath = path.join(process.cwd(), filePath);
  if (!fs.existsSync(fullPath)) {
    results.failed.push(`❌ ${description}: File not found`);
    return false;
  }

  const content = fs.readFileSync(fullPath, 'utf-8');
  if (content.includes(pattern)) {
    results.passed.push(`✅ ${description}: Pattern found`);
    return true;
  } else {
    results.failed.push(`❌ ${description}: Pattern not found - "${pattern}"`);
    return false;
  }
}

function checkRegexPattern(filePath, regex, description) {
  const fullPath = path.join(process.cwd(), filePath);
  if (!fs.existsSync(fullPath)) {
    results.failed.push(`❌ ${description}: File not found`);
    return false;
  }

  const content = fs.readFileSync(fullPath, 'utf-8');
  if (regex.test(content)) {
    results.passed.push(`✅ ${description}: Pattern found`);
    return true;
  } else {
    results.failed.push(`❌ ${description}: Pattern not found`);
    return false;
  }
}

console.log('🔍 Phase 1 Performance Optimizations - Code Verification\n');
console.log('='.repeat(60));

// Task 1.1.1: CSRF Token Pre-fetching
console.log('\n📋 Task 1.1.1: CSRF Token Pre-fetching');
console.log('-'.repeat(60));

checkFileExists('lib/hooks/usePrefetchCsrfToken.ts', 'usePrefetchCsrfToken hook');
checkFileContains('lib/hooks/usePrefetchCsrfToken.ts', 'prefetchCsrfToken', 'Hook calls prefetchCsrfToken');
checkFileContains('lib/hooks/usePrefetchCsrfToken.ts', 'debounceMs', 'Hook has debounce configuration');
checkFileContains('lib/hooks/usePrefetchCsrfToken.ts', 'handleMouseEnter', 'Hook provides handleMouseEnter');
checkFileContains('lib/hooks/usePrefetchCsrfToken.ts', 'handleMouseLeave', 'Hook provides handleMouseLeave');

checkFileContains('lib/utils/csrfClient.ts', 'prefetchCsrfToken', 'prefetchCsrfToken function exists');
checkFileContains('lib/utils/csrfClient.ts', 'PERFORMANCE OPTIMIZATION (1.1.1)', 'Pre-fetch optimization documented');

checkFileContains('components/admin/products/ProductCell.tsx', 'usePrefetchCsrfToken', 'ProductCell uses pre-fetch hook');
checkRegexPattern('components/admin/products/ProductCell.tsx', /onMouseEnter.*handleMouseEnter/, 'ProductCell has onMouseEnter handler');
checkFileContains('components/admin/products/ProductActionMenu.tsx', 'usePrefetchCsrfToken', 'ProductActionMenu uses pre-fetch hook');
checkRegexPattern('components/admin/products/ProductActionMenu.tsx', /onMouseEnter.*handleMouseEnter/, 'ProductActionMenu has onMouseEnter handler');

// Task 1.1.2: CSRF Token Cache Improvement
console.log('\n📋 Task 1.1.2: CSRF Token Cache Improvement (sessionStorage)');
console.log('-'.repeat(60));

checkFileContains('lib/utils/csrfClient.ts', 'sessionStorage', 'Uses sessionStorage for cache');
checkFileContains('lib/utils/csrfClient.ts', 'getCachedToken', 'getCachedToken function exists');
checkFileContains('lib/utils/csrfClient.ts', 'setCachedToken', 'setCachedToken function exists');
checkFileContains('lib/utils/csrfClient.ts', 'CSRF_TOKEN_STORAGE_KEY', 'Storage key constant defined');
checkFileContains('lib/utils/csrfClient.ts', 'PERFORMANCE OPTIMIZATION (1.1.2)', 'SessionStorage optimization documented');
checkRegexPattern('lib/utils/csrfClient.ts', /expiresAt.*number/, 'Cache entry has expiresAt field');
checkFileContains('lib/utils/csrfClient.ts', 'clearCsrfTokenCache', 'clearCsrfTokenCache function exists');

// Task 1.2.1: Categories Lazy Loading
console.log('\n📋 Task 1.2.1: Categories Lazy Loading');
console.log('-'.repeat(60));

checkRegexPattern('components/admin/products/ProductQuickEditDialog.tsx', /enabled.*categoriesPopoverOpen/, 'Categories fetch enabled by categoriesPopoverOpen');
checkFileContains('components/admin/products/ProductQuickEditDialog.tsx', 'isLoadingCategories', 'Loading state tracked');
checkFileContains('components/admin/products/ProductQuickEditDialog.tsx', 'Loader2', 'Loading spinner component used');
checkFileContains('components/admin/products/ProductQuickEditDialog.tsx', 'Đang tải danh mục', 'Loading placeholder text');
checkFileContains('components/admin/products/ProductQuickEditDialog.tsx', 'PERFORMANCE OPTIMIZATION (1.2.1)', 'Lazy loading optimization documented');

// Task 1.2.2: Categories Cache Improvement
console.log('\n📋 Task 1.2.2: Categories Cache Improvement');
console.log('-'.repeat(60));

checkRegexPattern('lib/hooks/useCategories.ts', /staleTime.*30.*60.*1000/, 'staleTime set to 30 minutes');
checkRegexPattern('lib/hooks/useCategories.ts', /gcTime.*60.*60.*1000/, 'gcTime set to 1 hour');
checkFileContains('lib/hooks/useCategories.ts', 'PERFORMANCE OPTIMIZATION (1.2.2)', 'Cache improvement documented');

// Summary
console.log('\n' + '='.repeat(60));
console.log('📊 Verification Summary');
console.log('='.repeat(60));
console.log(`✅ Passed: ${results.passed.length}`);
console.log(`❌ Failed: ${results.failed.length}`);
console.log(`⚠️  Warnings: ${results.warnings.length}`);

if (results.failed.length > 0) {
  console.log('\n❌ Failed Checks:');
  results.failed.forEach((msg) => console.log(`   ${msg}`));
}

if (results.warnings.length > 0) {
  console.log('\n⚠️  Warnings:');
  results.warnings.forEach((msg) => console.log(`   ${msg}`));
}

console.log('\n✅ Passed Checks:');
results.passed.forEach((msg) => console.log(`   ${msg}`));

// Exit code
const exitCode = results.failed.length > 0 ? 1 : 0;
process.exit(exitCode);

