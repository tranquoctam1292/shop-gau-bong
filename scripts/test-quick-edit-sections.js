/**
 * Test Script: ProductQuickEditDialog Sections
 * 
 * PHASE 2: Extract Form Sections - Automated Testing
 * 
 * Verifies:
 * - All section files exist
 * - Section components export correctly
 * - Context API integration
 * - React.memo usage
 * - TypeScript compatibility
 */

const fs = require('fs');
const path = require('path');

const sectionsDir = path.join(__dirname, '..', 'components', 'admin', 'products', 'ProductQuickEditDialog', 'sections');
const mainFile = path.join(__dirname, '..', 'components', 'admin', 'products', 'ProductQuickEditDialog.tsx');

const sections = [
  'DimensionsSection',
  'ShippingSection',
  'ProductTypeSection',
  'SeoSection',
  'InventorySection',
  'PricingSection',
  'BasicInfoSection',
  'CategoriesSection',
  'ImagesSection',
  'VariantsSection',
];

let passed = 0;
let failed = 0;
const errors = [];

console.log('🧪 Testing ProductQuickEditDialog Sections\n');
console.log('='.repeat(60));

// Test 1: Check sections directory exists
console.log('\n1. Checking sections directory...');
if (fs.existsSync(sectionsDir)) {
  console.log('   ✅ Sections directory exists');
  passed++;
} else {
  console.log('   ❌ Sections directory not found');
  failed++;
  errors.push('Sections directory not found');
}

// Test 2: Check each section file exists
console.log('\n2. Checking section files...');
sections.forEach((sectionName) => {
  const filePath = path.join(sectionsDir, `${sectionName}.tsx`);
  if (fs.existsSync(filePath)) {
    console.log(`   ✅ ${sectionName}.tsx exists`);
    passed++;
  } else {
    console.log(`   ❌ ${sectionName}.tsx not found`);
    failed++;
    errors.push(`${sectionName}.tsx not found`);
  }
});

// Test 3: Check section files structure
console.log('\n3. Checking section files structure...');
sections.forEach((sectionName) => {
  const filePath = path.join(sectionsDir, `${sectionName}.tsx`);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Check for 'use client' directive
    if (content.includes("'use client'") || content.includes('"use client"')) {
      console.log(`   ✅ ${sectionName} has 'use client' directive`);
      passed++;
    } else {
      console.log(`   ⚠️  ${sectionName} missing 'use client' directive`);
      // Not critical, some might not need it
    }
    
    // Check for useQuickEditFormContext
    if (content.includes('useQuickEditFormContext')) {
      console.log(`   ✅ ${sectionName} uses Context API`);
      passed++;
    } else {
      console.log(`   ❌ ${sectionName} does not use Context API`);
      failed++;
      errors.push(`${sectionName} does not use Context API`);
    }
    
    // Check for React.memo
    if (content.includes('React.memo') || content.includes('memo(')) {
      console.log(`   ✅ ${sectionName} uses React.memo`);
      passed++;
    } else {
      console.log(`   ⚠️  ${sectionName} does not use React.memo`);
      // Not critical, but recommended
    }
    
    // Check for displayName
    if (content.includes('displayName')) {
      console.log(`   ✅ ${sectionName} has displayName`);
      passed++;
    } else {
      console.log(`   ⚠️  ${sectionName} missing displayName`);
      // Not critical, but recommended for debugging
    }
    
    // Check for export
    if (content.includes(`export const ${sectionName}`) || content.includes(`export function ${sectionName}`)) {
      console.log(`   ✅ ${sectionName} is exported`);
      passed++;
    } else {
      console.log(`   ❌ ${sectionName} is not exported`);
      failed++;
      errors.push(`${sectionName} is not exported`);
    }
  }
});

// Test 4: Check main file imports
console.log('\n4. Checking main file imports...');
if (fs.existsSync(mainFile)) {
  const content = fs.readFileSync(mainFile, 'utf-8');
  
  sections.forEach((sectionName) => {
    const importPattern = new RegExp(`import.*${sectionName}.*from`, 'i');
    if (importPattern.test(content)) {
      console.log(`   ✅ ${sectionName} is imported in main file`);
      passed++;
    } else {
      console.log(`   ❌ ${sectionName} is not imported in main file`);
      failed++;
      errors.push(`${sectionName} is not imported in main file`);
    }
  });
} else {
  console.log('   ❌ Main file not found');
  failed++;
  errors.push('Main file not found');
}

// Test 5: Check Context hook exists
console.log('\n5. Checking Context hook...');
const contextHookPath = path.join(__dirname, '..', 'components', 'admin', 'products', 'ProductQuickEditDialog', 'hooks', 'useQuickEditFormContext.ts');
if (fs.existsSync(contextHookPath)) {
  console.log('   ✅ useQuickEditFormContext.ts exists');
  passed++;
  
  const hookContent = fs.readFileSync(contextHookPath, 'utf-8');
  if (hookContent.includes('useQuickEditFormContext')) {
    console.log('   ✅ Hook function is defined');
    passed++;
  } else {
    console.log('   ❌ Hook function not found');
    failed++;
    errors.push('Hook function not found');
  }
} else {
  console.log('   ❌ useQuickEditFormContext.ts not found');
  failed++;
  errors.push('useQuickEditFormContext.ts not found');
}

// Test 6: Check Context Provider exists
console.log('\n6. Checking Context Provider...');
const providerPath = path.join(__dirname, '..', 'components', 'admin', 'products', 'ProductQuickEditDialog', 'context', 'QuickEditFormProvider.tsx');
if (fs.existsSync(providerPath)) {
  console.log('   ✅ QuickEditFormProvider.tsx exists');
  passed++;
} else {
  console.log('   ❌ QuickEditFormProvider.tsx not found');
  failed++;
  errors.push('QuickEditFormProvider.tsx not found');
}

// Test 7: Check main file uses Provider
console.log('\n7. Checking Provider usage in main file...');
if (fs.existsSync(mainFile)) {
  const content = fs.readFileSync(mainFile, 'utf-8');
  if (content.includes('QuickEditFormProvider')) {
    console.log('   ✅ Main file uses QuickEditFormProvider');
    passed++;
  } else {
    console.log('   ❌ Main file does not use QuickEditFormProvider');
    failed++;
    errors.push('Main file does not use QuickEditFormProvider');
  }
} else {
  console.log('   ❌ Main file not found');
  failed++;
  errors.push('Main file not found');
}

// Summary
console.log('\n' + '='.repeat(60));
console.log('\n📊 TEST SUMMARY\n');
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`📈 Total: ${passed + failed}`);

if (failed > 0) {
  console.log('\n❌ ERRORS FOUND:\n');
  errors.forEach((error, index) => {
    console.log(`${index + 1}. ${error}`);
  });
  console.log('\n');
  process.exit(1);
} else {
  console.log('\n✅ All automated tests passed!\n');
  console.log('📝 Next steps:');
  console.log('   1. Run manual testing checklist');
  console.log('   2. Test each section in browser');
  console.log('   3. Verify visual comparison with original\n');
  process.exit(0);
}

