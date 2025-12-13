/**
 * Script to export RBAC module source code to a text file
 * 
 * Usage: npm run export:rbac-source
 * 
 * This will create a file containing all RBAC-related source code
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
};

// RBAC-related files to export
const rbacFiles = [
  // Types & Constants
  'types/admin.ts',
  'types/next-auth.d.ts',
  'lib/constants/adminRoles.ts',
  
  // Core Utilities
  'lib/utils/passwordUtils.ts',
  'lib/utils/rateLimiter.ts',
  'lib/utils/auditLogger.ts',
  'lib/utils/permissions.ts',
  'lib/utils/tokenRevocation.ts',
  
  // Middleware & Auth
  'lib/middleware/authMiddleware.ts',
  'lib/auth.ts',
  'lib/authOptions.ts',
  
  // Database
  'lib/db.ts',
  
  // API Routes - Auth
  'app/api/admin/auth/login/route.ts',
  'app/api/admin/auth/logout/route.ts',
  'app/api/admin/auth/me/route.ts',
  'app/api/admin/auth/change-password/route.ts',
  'app/api/admin/auth/logout-all/route.ts',
  
  // API Routes - User Management
  'app/api/admin/users/route.ts',
  'app/api/admin/users/[id]/route.ts',
  'app/api/admin/users/[id]/reset-password/route.ts',
  'app/api/admin/users/[id]/force-logout/route.ts',
  
  // Frontend Components
  'components/admin/PermissionGuard.tsx',
  'components/admin/users/UserForm.tsx',
  'lib/hooks/useAdminUsers.ts',
  
  // Frontend Pages
  'app/admin/users/page.tsx',
  'app/admin/users/new/page.tsx',
  'app/admin/users/[id]/edit/page.tsx',
  'app/admin/users/[id]/reset-password/page.tsx',
  'app/admin/change-password/page.tsx',
  'app/admin/settings/security/page.tsx',
  'app/admin/login/page.tsx',
  'app/admin/layout.tsx',
  
  // Scripts
  'scripts/create-admin-user.ts',
  'scripts/seed-admin-users.ts',
  'scripts/migrate-users-to-admin-users.ts',
  'scripts/test-admin-rbac.ts',
  'scripts/setup-database-indexes.ts',
];

// Documentation files
const docFiles = [
  'docs/ADMIN_ACCOUNT_RBAC_PLAN.md',
  'docs/ADMIN_ACCOUNT_RBAC_PROGRESS.md',
  'docs/ADMIN_ACCOUNT_RBAC_API.md',
  'docs/ADMIN_ACCOUNT_RBAC_USER_GUIDE.md',
];

async function readFile(filePath: string): Promise<string | null> {
  try {
    const fullPath = path.join(projectRoot, filePath);
    if (!fs.existsSync(fullPath)) {
      return `[FILE NOT FOUND: ${filePath}]`;
    }
    return fs.readFileSync(fullPath, 'utf-8');
  } catch (error: any) {
    return `[ERROR READING FILE: ${filePath} - ${error.message}]`;
  }
}

function formatFileContent(filePath: string, content: string): string {
  const separator = '='.repeat(80);
  return `\n${separator}\nFILE: ${filePath}\n${separator}\n\n${content}\n`;
}

async function exportRBACSource() {
  console.log(`${colors.cyan}=== Export RBAC Module Source Code ===${colors.reset}\n`);

  const output: string[] = [];
  
  // Header
  output.push('='.repeat(80));
  output.push('RBAC MODULE SOURCE CODE EXPORT');
  output.push('='.repeat(80));
  output.push(`Generated: ${new Date().toISOString()}`);
  output.push(`Project: Shop Gấu Bông - Admin Account Management (RBAC)`);
  output.push(`Version: 1.2 (Security Enhancements)`);
  output.push('='.repeat(80));
  output.push('');

  // Add table of contents
  output.push('\n## TABLE OF CONTENTS\n');
  output.push('### Source Code Files:');
  rbacFiles.forEach((file, index) => {
    output.push(`${index + 1}. ${file}`);
  });
  output.push('\n### Documentation Files:');
  docFiles.forEach((file, index) => {
    output.push(`${rbacFiles.length + index + 1}. ${file}`);
  });
  output.push('\n');

  // Export source code files
  output.push('\n' + '='.repeat(80));
  output.push('SOURCE CODE FILES');
  output.push('='.repeat(80) + '\n');

  for (const file of rbacFiles) {
    console.log(`${colors.yellow}Reading: ${file}${colors.reset}`);
    const content = await readFile(file);
    if (content) {
      output.push(formatFileContent(file, content));
    }
  }

  // Export documentation files
  output.push('\n' + '='.repeat(80));
  output.push('DOCUMENTATION FILES');
  output.push('='.repeat(80) + '\n');

  for (const file of docFiles) {
    console.log(`${colors.yellow}Reading: ${file}${colors.reset}`);
    const content = await readFile(file);
    if (content) {
      output.push(formatFileContent(file, content));
    }
  }

  // Write to file
  const outputPath = path.join(projectRoot, 'docs/RBAC_MODULE_SOURCE_CODE.txt');
  const outputContent = output.join('\n');
  
  try {
    fs.writeFileSync(outputPath, outputContent, 'utf-8');
    console.log(`\n${colors.green}✓ Export completed successfully!${colors.reset}`);
    console.log(`${colors.cyan}Output file: ${outputPath}${colors.reset}`);
    console.log(`${colors.blue}Total files: ${rbacFiles.length + docFiles.length}${colors.reset}`);
    console.log(`${colors.blue}File size: ${(outputContent.length / 1024).toFixed(2)} KB${colors.reset}\n`);
  } catch (error: any) {
    console.error(`${colors.red}Error writing output file:${colors.reset}`, error.message);
    process.exit(1);
  }
}

exportRBACSource();
