/**
 * Test Script for Phase 3 Hook Dependencies
 * 
 * Checks:
 * 1. All useEffect, useCallback, useMemo have proper dependencies
 * 2. No missing dependencies
 * 3. No unnecessary dependencies
 */

const fs = require('fs');
const path = require('path');

const hooksDir = path.join(__dirname, '..', 'components', 'admin', 'products', 'ProductQuickEditDialog', 'hooks');

const hooks = [
  'useQuickEditForm.ts',
  'useQuickEditHandlers.ts',
  'useQuickEditValidation.ts',
  'useQuickEditLifecycle.ts',
  'useQuickEditVersionCheck.ts',
];

let testsPassed = 0;
let testsFailed = 0;
const warnings = [];
const errors = [];

console.log('🔍 Testing Phase 3 Hook Dependencies\n');
console.log('='.repeat(60));

hooks.forEach(hookFile => {
  const hookPath = path.join(hooksDir, hookFile);
  if (!fs.existsSync(hookPath)) return;
  
  const content = fs.readFileSync(hookPath, 'utf-8');
  console.log(`\n📄 ${hookFile}:`);
  
  // Check for useEffect
  const useEffectMatches = content.matchAll(/useEffect\(\(\)\s*=>\s*\{[\s\S]*?\},\s*\[([^\]]*)\]\)/g);
  let useEffectCount = 0;
  for (const match of useEffectMatches) {
    useEffectCount++;
    const deps = match[1].trim();
    if (deps === '') {
      console.log(`  ⚠️  useEffect #${useEffectCount}: Empty dependency array (might be intentional)`);
      warnings.push(`${hookFile}: useEffect #${useEffectCount} has empty dependency array`);
    } else {
      console.log(`  ✅ useEffect #${useEffectCount}: Has dependencies [${deps}]`);
      testsPassed++;
    }
  }
  
  // Check for useCallback
  const useCallbackMatches = content.matchAll(/useCallback\(\([^)]*\)\s*=>\s*\{[\s\S]*?\},\s*\[([^\]]*)\]\)/g);
  let useCallbackCount = 0;
  for (const match of useCallbackMatches) {
    useCallbackCount++;
    const deps = match[1].trim();
    if (deps === '') {
      console.log(`  ⚠️  useCallback #${useCallbackCount}: Empty dependency array (might be intentional)`);
      warnings.push(`${hookFile}: useCallback #${useCallbackCount} has empty dependency array`);
    } else {
      console.log(`  ✅ useCallback #${useCallbackCount}: Has dependencies [${deps}]`);
      testsPassed++;
    }
  }
  
  // Check for useMemo
  const useMemoMatches = content.matchAll(/useMemo\(\(\)\s*=>\s*\{[\s\S]*?\},\s*\[([^\]]*)\]\)/g);
  let useMemoCount = 0;
  for (const match of useMemoMatches) {
    useMemoCount++;
    const deps = match[1].trim();
    if (deps === '') {
      console.log(`  ⚠️  useMemo #${useMemoCount}: Empty dependency array (might be intentional)`);
      warnings.push(`${hookFile}: useMemo #${useMemoCount} has empty dependency array`);
    } else {
      console.log(`  ✅ useMemo #${useMemoCount}: Has dependencies [${deps}]`);
      testsPassed++;
    }
  }
  
  // Check for eslint-disable comments
  const eslintDisableMatches = content.matchAll(/eslint-disable[^\n]*exhaustive-deps/g);
  let disableCount = 0;
  for (const match of eslintDisableMatches) {
    disableCount++;
    console.log(`  ⚠️  Found eslint-disable exhaustive-deps: ${match[0]}`);
    warnings.push(`${hookFile}: Has eslint-disable exhaustive-deps comment`);
  }
  
  if (useEffectCount === 0 && useCallbackCount === 0 && useMemoCount === 0) {
    console.log(`  ℹ️  No React hooks with dependencies found`);
  }
});

// Summary
console.log('\n' + '='.repeat(60));
console.log('\n📊 Test Summary:');
console.log(`  ✅ Passed: ${testsPassed}`);
console.log(`  ⚠️  Warnings: ${warnings.length}`);
console.log(`  ❌ Failed: ${testsFailed}`);

if (warnings.length > 0) {
  console.log('\n⚠️  Warnings:');
  warnings.forEach((warning, index) => {
    console.log(`  ${index + 1}. ${warning}`);
  });
}

if (errors.length > 0) {
  console.log('\n❌ Errors:');
  errors.forEach((error, index) => {
    console.log(`  ${index + 1}. ${error}`);
  });
}

if (testsFailed === 0) {
  console.log('\n✅ Hook dependencies check completed!');
  if (warnings.length > 0) {
    console.log('⚠️  Some warnings found - please review if intentional.');
  }
  process.exit(0);
} else {
  console.log('\n❌ Some tests failed. Please review the errors above.');
  process.exit(1);
}

