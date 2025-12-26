/**
 * Test Script: Quick Edit Context API Verification
 * 
 * PHASE 0: Context API Setup - Verify Context is properly configured
 * 
 * This script checks:
 * 1. Context files exist and are properly structured
 * 2. Context exports are correct
 * 3. Provider component structure
 * 4. Hook structure
 * 5. Integration in main file
 * 
 * Run: node scripts/test-quick-edit-context.js
 */

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

let errors = [];
let warnings = [];
let passed = [];

function log(message, type = 'info') {
  const color = type === 'error' ? COLORS.red : type === 'warning' ? COLORS.yellow : type === 'success' ? COLORS.green : COLORS.cyan;
  console.log(`${color}${message}${COLORS.reset}`);
}

function checkFile(filePath, description) {
  const fullPath = path.join(PROJECT_ROOT, filePath);
  if (fs.existsSync(fullPath)) {
    passed.push(`✅ ${description}: ${filePath}`);
    return true;
  } else {
    errors.push(`❌ ${description}: ${filePath} NOT FOUND`);
    return false;
  }
}

function checkFileContent(filePath, patterns, description) {
  const fullPath = path.join(PROJECT_ROOT, filePath);
  if (!fs.existsSync(fullPath)) {
    errors.push(`❌ File not found: ${filePath}`);
    return false;
  }

  const content = fs.readFileSync(fullPath, 'utf-8');
  const missing = [];

  patterns.forEach(({ pattern, message }) => {
    if (typeof pattern === 'string') {
      if (!content.includes(pattern)) {
        missing.push(message);
      }
    } else if (pattern instanceof RegExp) {
      if (!pattern.test(content)) {
        missing.push(message);
      }
    }
  });

  if (missing.length === 0) {
    passed.push(`✅ ${description}: All patterns found`);
    return true;
  } else {
    missing.forEach(msg => errors.push(`❌ ${description}: ${msg}`));
    return false;
  }
}

function checkExports(filePath, expectedExports, description) {
  const fullPath = path.join(PROJECT_ROOT, filePath);
  if (!fs.existsSync(fullPath)) {
    errors.push(`❌ File not found: ${filePath}`);
    return false;
  }

  const content = fs.readFileSync(fullPath, 'utf-8');
  const missing = [];

  expectedExports.forEach(exportName => {
    // Check for export const, export function, export interface, export type, export class
    const patterns = [
      new RegExp(`export\\s+(const|function|interface|type|class)\\s+${exportName}`),
      new RegExp(`export\\s*{\\s*[^}]*${exportName}[^}]*}`),
    ];

    const found = patterns.some(pattern => pattern.test(content));
    if (!found) {
      missing.push(`Missing export: ${exportName}`);
    }
  });

  if (missing.length === 0) {
    passed.push(`✅ ${description}: All exports found`);
    return true;
  } else {
    missing.forEach(msg => errors.push(`❌ ${description}: ${msg}`));
    return false;
  }
}

console.log('\n' + '='.repeat(80));
log('Quick Edit Context API Verification', 'info');
console.log('='.repeat(80) + '\n');

// Test 1: Check Context files exist
log('Test 1: Checking Context files exist...', 'info');
checkFile(
  'components/admin/products/ProductQuickEditDialog/context/QuickEditFormContext.tsx',
  'Context definition file'
);
checkFile(
  'components/admin/products/ProductQuickEditDialog/context/QuickEditFormProvider.tsx',
  'Provider component file'
);
checkFile(
  'components/admin/products/ProductQuickEditDialog/hooks/useQuickEditFormContext.ts',
  'Context hook file'
);
checkFile(
  'components/admin/products/ProductQuickEditDialog/types.ts',
  'Types file'
);
checkFile(
  'components/admin/products/ProductQuickEditDialog/schema.ts',
  'Schema file'
);

console.log('');

// Test 2: Check Context structure
log('Test 2: Checking Context structure...', 'info');
checkFileContent(
  'components/admin/products/ProductQuickEditDialog/context/QuickEditFormContext.tsx',
  [
    { pattern: 'createContext', message: 'Must use createContext' },
    { pattern: 'QuickEditFormContextValue', message: 'Must define QuickEditFormContextValue interface' },
    { pattern: 'QuickEditFormContext', message: 'Must export QuickEditFormContext' },
    { pattern: 'register', message: 'Context must include register' },
    { pattern: 'setValue', message: 'Context must include setValue' },
    { pattern: 'watch', message: 'Context must include watch' },
    { pattern: 'errors', message: 'Context must include errors' },
    { pattern: 'handleFieldFocus', message: 'Context must include handleFieldFocus' },
    { pattern: 'savedFields', message: 'Context must include savedFields' },
  ],
  'Context definition'
);

console.log('');

// Test 3: Check Provider structure
log('Test 3: Checking Provider structure...', 'info');
checkFileContent(
  'components/admin/products/ProductQuickEditDialog/context/QuickEditFormProvider.tsx',
  [
    { pattern: 'QuickEditFormProvider', message: 'Must export QuickEditFormProvider component' },
    { pattern: 'useMemo', message: 'Must use useMemo for context value' },
    { pattern: 'QuickEditFormContext.Provider', message: 'Must use QuickEditFormContext.Provider' },
    { pattern: 'contextValue', message: 'Must memoize contextValue' },
  ],
  'Provider component'
);

console.log('');

// Test 4: Check Hook structure
log('Test 4: Checking Hook structure...', 'info');
checkFileContent(
  'components/admin/products/ProductQuickEditDialog/hooks/useQuickEditFormContext.ts',
  [
    { pattern: 'useQuickEditFormContext', message: 'Must export useQuickEditFormContext hook' },
    { pattern: 'useContext', message: 'Must use useContext' },
    { pattern: 'QuickEditFormContext', message: 'Must use QuickEditFormContext' },
    { pattern: /throw new Error/, message: 'Must throw error if used outside Provider' },
    { pattern: 'QuickEditFormProvider', message: 'Error message must mention QuickEditFormProvider' },
  ],
  'Context hook'
);

console.log('');

// Test 5: Check Types and Schema
log('Test 5: Checking Types and Schema...', 'info');
checkFileContent(
  'components/admin/products/ProductQuickEditDialog/types.ts',
  [
    { pattern: 'QuickEditFormData', message: 'Must export QuickEditFormData type' },
    { pattern: 'ProductQuickEditDialogProps', message: 'Must export ProductQuickEditDialogProps interface' },
  ],
  'Types file'
);

checkFileContent(
  'components/admin/products/ProductQuickEditDialog/schema.ts',
  [
    { pattern: 'quickEditSchema', message: 'Must export quickEditSchema' },
    { pattern: 'nanToUndefined', message: 'Must export nanToUndefined helper' },
  ],
  'Schema file'
);

console.log('');

// Test 6: Check Integration in main file
log('Test 6: Checking Integration in main file...', 'info');
checkFileContent(
  'components/admin/products/ProductQuickEditDialog.tsx',
  [
    { pattern: 'QuickEditFormProvider', message: 'Must import QuickEditFormProvider' },
    { pattern: /<QuickEditFormProvider/, message: 'Must use QuickEditFormProvider component' },
    { pattern: 'register={register}', message: 'Must pass register prop' },
    { pattern: 'setValue={setValue}', message: 'Must pass setValue prop' },
    { pattern: 'watch={watch}', message: 'Must pass watch prop' },
    { pattern: 'errors={errors}', message: 'Must pass errors prop' },
    { pattern: 'formState=', message: 'Must pass formState prop' },
    { pattern: 'handleFieldFocus={handleFieldFocus}', message: 'Must pass handleFieldFocus prop' },
    { pattern: 'savedFields={savedFields}', message: 'Must pass savedFields prop' },
    { pattern: 'expandedSections={expandedSections}', message: 'Must pass expandedSections prop' },
    { pattern: '</QuickEditFormProvider>', message: 'Must close QuickEditFormProvider tag' },
  ],
  'Main file integration'
);

console.log('');

// Test 7: Check Exports
log('Test 7: Checking Exports...', 'info');
checkExports(
  'components/admin/products/ProductQuickEditDialog/context/QuickEditFormContext.tsx',
  ['QuickEditFormContext', 'QuickEditFormContextValue'],
  'Context exports'
);

checkExports(
  'components/admin/products/ProductQuickEditDialog/context/QuickEditFormProvider.tsx',
  ['QuickEditFormProvider'],
  'Provider exports'
);

checkExports(
  'components/admin/products/ProductQuickEditDialog/hooks/useQuickEditFormContext.ts',
  ['useQuickEditFormContext'],
  'Hook exports'
);

console.log('');

// Test 8: Check SkuValidationResult export
log('Test 8: Checking SkuValidationResult export...', 'info');
checkFileContent(
  'lib/hooks/useSkuValidation.ts',
  [
    { pattern: 'export interface SkuValidationResult', message: 'Must export SkuValidationResult interface' },
  ],
  'SkuValidationResult export'
);

console.log('');

// Test 9: Check TypeScript compatibility
log('Test 9: Checking TypeScript compatibility...', 'info');
const tsConfigPath = path.join(PROJECT_ROOT, 'tsconfig.json');
if (fs.existsSync(tsConfigPath)) {
  passed.push('✅ TypeScript config exists');
} else {
  warnings.push('⚠️  TypeScript config not found (may be in parent directory)');
}

console.log('');

// Summary
console.log('='.repeat(80));
log('Test Summary', 'info');
console.log('='.repeat(80) + '\n');

if (passed.length > 0) {
  log(`✅ Passed: ${passed.length}`, 'success');
  passed.forEach(msg => console.log(`  ${msg}`));
  console.log('');
}

if (warnings.length > 0) {
  log(`⚠️  Warnings: ${warnings.length}`, 'warning');
  warnings.forEach(msg => console.log(`  ${msg}`));
  console.log('');
}

if (errors.length > 0) {
  log(`❌ Errors: ${errors.length}`, 'error');
  errors.forEach(msg => console.log(`  ${msg}`));
  console.log('');
  process.exit(1);
} else {
  log('✅ All tests passed! Context API is properly configured.', 'success');
  console.log('');
  process.exit(0);
}

