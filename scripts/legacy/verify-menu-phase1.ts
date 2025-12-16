/**
 * Verify Menu Management Phase 1 Implementation
 * 
 * Checks if all required files and structures are in place
 * 
 * Usage: npx tsx scripts/verify-menu-phase1.ts
 */

import { existsSync } from 'fs';
import { resolve } from 'path';

interface CheckResult {
  name: string;
  passed: boolean;
  path: string;
  error?: string;
}

const checks: CheckResult[] = [];

function checkFile(name: string, path: string): void {
  const fullPath = resolve(process.cwd(), path);
  const exists = existsSync(fullPath);
  checks.push({
    name,
    passed: exists,
    path: fullPath,
    error: exists ? undefined : 'File not found',
  });
}

console.log('🔍 Verifying Menu Management Phase 1 Implementation\n');

// Check database files
console.log('📦 Database Files:');
checkFile('lib/db.ts - menus collection', 'lib/db.ts');
checkFile('scripts/setup-database-indexes.ts - menu indexes', 'scripts/setup-database-indexes.ts');

// Check API routes
console.log('\n🔌 API Routes:');
checkFile('GET/POST /api/admin/menus', 'app/api/admin/menus/route.ts');
checkFile('GET/PUT/DELETE /api/admin/menus/{id}', 'app/api/admin/menus/[id]/route.ts');
checkFile('POST /api/admin/menu-items', 'app/api/admin/menu-items/route.ts');
checkFile('GET/PUT/DELETE /api/admin/menu-items/{id}', 'app/api/admin/menu-items/[id]/route.ts');

// Check utilities
console.log('\n🛠️  Utilities:');
checkFile('menuUtils.ts - dynamic link resolution', 'lib/utils/menuUtils.ts');

// Check test scripts
console.log('\n🧪 Test Scripts:');
checkFile('test-menu-api.ts', 'scripts/test-menu-api.ts');

// Print results
console.log('\n📊 Verification Results:');
console.log('─────────────────────────────────────────');

let allPassed = true;
checks.forEach((check) => {
  const icon = check.passed ? '✅' : '❌';
  console.log(`${icon} ${check.name}`);
  if (!check.passed) {
    console.log(`   Path: ${check.path}`);
    console.log(`   Error: ${check.error}`);
    allPassed = false;
  }
});

console.log('\n─────────────────────────────────────────');
if (allPassed) {
  console.log('✅ All checks passed! Phase 1 implementation is complete.');
  console.log('\n📝 Next Steps:');
  console.log('   1. Start dev server: npm run dev');
  console.log('   2. Run test script: npx tsx scripts/test-menu-api.ts');
  console.log('   3. Verify API endpoints in browser/Postman');
} else {
  console.log('❌ Some checks failed. Please review the errors above.');
  process.exit(1);
}

console.log('\n');

