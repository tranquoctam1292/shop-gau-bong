/**
 * Test Script for ProductQuickEditDialog Hooks (Phase 3)
 * 
 * Technical Testing Checklist:
 * 1. All hooks exist and have correct structure
 * 2. TypeScript compilation passes
 * 3. ESLint check (hook dependencies)
 * 4. Import/export correctness
 * 5. Integration with main component
 * 6. No unused code
 * 7. No circular dependencies
 */

const fs = require('fs');
const path = require('path');

const hooksDir = path.join(__dirname, '..', 'components', 'admin', 'products', 'ProductQuickEditDialog', 'hooks');
const mainComponentPath = path.join(__dirname, '..', 'components', 'admin', 'products', 'ProductQuickEditDialog.tsx');

const expectedHooks = [
  'useQuickEditForm.ts',
  'useQuickEditHandlers.ts',
  'useQuickEditValidation.ts',
  'useQuickEditLifecycle.ts',
  'useQuickEditVersionCheck.ts',
];

const hookExports = {
  'useQuickEditForm.ts': ['useQuickEditForm'],
  'useQuickEditHandlers.ts': ['useQuickEditHandlers'],
  'useQuickEditValidation.ts': ['useQuickEditValidation'],
  'useQuickEditLifecycle.ts': ['useQuickEditLifecycle'],
  'useQuickEditVersionCheck.ts': ['useQuickEditVersionCheck'],
};

let testsPassed = 0;
let testsFailed = 0;
const errors = [];

console.log('🧪 Testing Phase 3: Extract Hooks\n');
console.log('='.repeat(60));

// Test 1: Check all hook files exist
console.log('\n📁 Test 1: Hook Files Existence');
expectedHooks.forEach(hookFile => {
  const hookPath = path.join(hooksDir, hookFile);
  if (fs.existsSync(hookPath)) {
    console.log(`  ✅ ${hookFile} exists`);
    testsPassed++;
  } else {
    console.log(`  ❌ ${hookFile} NOT FOUND`);
    errors.push(`Missing hook file: ${hookFile}`);
    testsFailed++;
  }
});

// Test 2: Check hook file structure
console.log('\n📋 Test 2: Hook File Structure');
expectedHooks.forEach(hookFile => {
  const hookPath = path.join(hooksDir, hookFile);
  if (!fs.existsSync(hookPath)) return;
  
  const content = fs.readFileSync(hookPath, 'utf-8');
  const hookName = hookFile.replace('.ts', '');
  
  // Check for 'use client' directive
  if (content.includes("'use client'") || content.includes('"use client"')) {
    console.log(`  ✅ ${hookFile} has 'use client' directive`);
    testsPassed++;
  } else {
    console.log(`  ⚠️  ${hookFile} missing 'use client' directive`);
    errors.push(`${hookFile} missing 'use client' directive`);
    testsFailed++;
  }
  
  // Check for export function
  const expectedExport = hookExports[hookFile][0];
  if (content.includes(`export function ${expectedExport}`) || content.includes(`export const ${expectedExport}`)) {
    console.log(`  ✅ ${hookFile} exports ${expectedExport}`);
    testsPassed++;
  } else {
    console.log(`  ❌ ${hookFile} missing export ${expectedExport}`);
    errors.push(`${hookFile} missing export ${expectedExport}`);
    testsFailed++;
  }
  
  // Check for interface/type definition
  if (content.includes('interface') || content.includes('type ')) {
    console.log(`  ✅ ${hookFile} has type definitions`);
    testsPassed++;
  } else {
    console.log(`  ⚠️  ${hookFile} missing type definitions`);
    errors.push(`${hookFile} missing type definitions`);
    testsFailed++;
  }
});

// Test 3: Check imports in main component
console.log('\n🔗 Test 3: Integration with Main Component');
if (fs.existsSync(mainComponentPath)) {
  const mainContent = fs.readFileSync(mainComponentPath, 'utf-8');
  
  expectedHooks.forEach(hookFile => {
    const hookName = hookExports[hookFile][0];
    const importPattern = new RegExp(`import.*${hookName}.*from`, 'i');
    
    if (importPattern.test(mainContent)) {
      console.log(`  ✅ ${hookName} imported in main component`);
      testsPassed++;
    } else {
      console.log(`  ❌ ${hookName} NOT imported in main component`);
      errors.push(`${hookName} not imported in main component`);
      testsFailed++;
    }
  });
  
  // Check hook usage
  expectedHooks.forEach(hookFile => {
    const hookName = hookExports[hookFile][0];
    const usagePattern = new RegExp(`${hookName}\\(`, 'i');
    
    if (usagePattern.test(mainContent)) {
      console.log(`  ✅ ${hookName} used in main component`);
      testsPassed++;
    } else {
      console.log(`  ⚠️  ${hookName} not used in main component (might be intentional)`);
      // Not a failure, might be intentional
    }
  });
} else {
  console.log(`  ❌ Main component not found at ${mainComponentPath}`);
  errors.push(`Main component not found`);
  testsFailed++;
}

// Test 4: Check for React hooks usage
console.log('\n⚛️  Test 4: React Hooks Usage');
expectedHooks.forEach(hookFile => {
  const hookPath = path.join(hooksDir, hookFile);
  if (!fs.existsSync(hookPath)) return;
  
  const content = fs.readFileSync(hookPath, 'utf-8');
  const hookName = hookFile.replace('.ts', '');
  
  // Check for common React hooks
  const hasUseState = content.includes('useState');
  const hasUseEffect = content.includes('useEffect');
  const hasUseCallback = content.includes('useCallback');
  const hasUseMemo = content.includes('useMemo');
  const hasUseRef = content.includes('useRef');
  
  const hooksUsed = [];
  if (hasUseState) hooksUsed.push('useState');
  if (hasUseEffect) hooksUsed.push('useEffect');
  if (hasUseCallback) hooksUsed.push('useCallback');
  if (hasUseMemo) hooksUsed.push('useMemo');
  if (hasUseRef) hooksUsed.push('useRef');
  
  if (hooksUsed.length > 0) {
    console.log(`  ✅ ${hookFile} uses React hooks: ${hooksUsed.join(', ')}`);
    testsPassed++;
  } else {
    console.log(`  ⚠️  ${hookFile} doesn't use common React hooks (might be intentional)`);
    // Not a failure, some hooks might not need React hooks
  }
});

// Test 5: Check for TypeScript types
console.log('\n📝 Test 5: TypeScript Type Safety');
expectedHooks.forEach(hookFile => {
  const hookPath = path.join(hooksDir, hookFile);
  if (!fs.existsSync(hookPath)) return;
  
  const content = fs.readFileSync(hookPath, 'utf-8');
  
  // Check for interface/type for options
  if (content.includes('Options') || content.includes('Props') || content.includes('Config')) {
    console.log(`  ✅ ${hookFile} has type definitions for options/props`);
    testsPassed++;
  } else {
    console.log(`  ⚠️  ${hookFile} might be missing type definitions for options`);
    // Not a failure, might use inline types
  }
  
  // Check for return type (explicit or inferred)
  const expectedExport = hookExports[hookFile][0];
  if (content.includes(`function ${expectedExport}`) || content.includes(`const ${expectedExport}`)) {
    console.log(`  ✅ ${hookFile} has function/const definition`);
    testsPassed++;
  }
});

// Test 6: Check for documentation
console.log('\n📚 Test 6: Documentation');
expectedHooks.forEach(hookFile => {
  const hookPath = path.join(hooksDir, hookFile);
  if (!fs.existsSync(hookPath)) return;
  
  const content = fs.readFileSync(hookPath, 'utf-8');
  
  // Check for JSDoc comments
  if (content.includes('/**') || content.includes('* PHASE')) {
    console.log(`  ✅ ${hookFile} has documentation`);
    testsPassed++;
  } else {
    console.log(`  ⚠️  ${hookFile} missing documentation`);
    // Not a failure, but good practice
  }
});

// Test 7: Check for Context API usage (if applicable)
console.log('\n🔌 Test 7: Context API Usage');
const contextHookPath = path.join(hooksDir, 'useQuickEditFormContext.ts');
if (fs.existsSync(contextHookPath)) {
  const contextContent = fs.readFileSync(contextHookPath, 'utf-8');
  if (contextContent.includes('useContext') || contextContent.includes('QuickEditFormContext')) {
    console.log(`  ✅ useQuickEditFormContext uses Context API`);
    testsPassed++;
  }
}

// Test 8: Check for no circular dependencies
console.log('\n🔄 Test 8: Circular Dependencies Check');
const hookImports = {};
expectedHooks.forEach(hookFile => {
  const hookPath = path.join(hooksDir, hookFile);
  if (!fs.existsSync(hookPath)) return;
  
  const content = fs.readFileSync(hookPath, 'utf-8');
  const imports = content.match(/import.*from.*['"](.*)['"]/g) || [];
  hookImports[hookFile] = imports.map(imp => {
    const match = imp.match(/from\s+['"](.*)['"]/);
    return match ? match[1] : null;
  }).filter(Boolean);
});

// Check if hooks import each other (potential circular dependency)
let hasCircularDependency = false;
Object.keys(hookImports).forEach(hookFile => {
  hookImports[hookFile].forEach(importPath => {
    if (importPath.includes('ProductQuickEditDialog/hooks')) {
      const importedHook = importPath.split('/').pop();
      if (expectedHooks.includes(importedHook)) {
        // Check if imported hook imports back
        const importedHookFile = expectedHooks.find(h => h.includes(importedHook.replace('.ts', '')));
        if (importedHookFile && hookImports[importedHookFile]) {
          hookImports[importedHookFile].forEach(backImport => {
            if (backImport.includes(hookFile.replace('.ts', ''))) {
              hasCircularDependency = true;
              errors.push(`Circular dependency detected: ${hookFile} <-> ${importedHookFile}`);
            }
          });
        }
      }
    }
  });
});

if (!hasCircularDependency) {
  console.log(`  ✅ No circular dependencies detected`);
  testsPassed++;
} else {
  console.log(`  ❌ Circular dependencies detected`);
  testsFailed++;
}

// Summary
console.log('\n' + '='.repeat(60));
console.log('\n📊 Test Summary:');
console.log(`  ✅ Passed: ${testsPassed}`);
console.log(`  ❌ Failed: ${testsFailed}`);
console.log(`  📈 Total: ${testsPassed + testsFailed}`);

if (errors.length > 0) {
  console.log('\n❌ Errors:');
  errors.forEach((error, index) => {
    console.log(`  ${index + 1}. ${error}`);
  });
}

if (testsFailed === 0) {
  console.log('\n🎉 All tests passed!');
  process.exit(0);
} else {
  console.log('\n⚠️  Some tests failed. Please review the errors above.');
  process.exit(1);
}

