#!/usr/bin/env node

/**
 * Pre-Deploy Check Script
 * 
 * Chạy các kiểm tra cần thiết trước khi deploy lên Vercel
 * Sử dụng: npm run pre-deploy
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

let hasErrors = false;
const errors = [];
const warnings = [];

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkStep(name, command, description) {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(`🔍 ${name}`, 'blue');
  if (description) {
    log(`   ${description}`, 'reset');
  }
  log(`${'='.repeat(60)}`, 'cyan');

  try {
    execSync(command, { stdio: 'inherit', cwd: process.cwd() });
    log(`✅ ${name}: PASSED`, 'green');
    return true;
  } catch (error) {
    log(`❌ ${name}: FAILED`, 'red');
    errors.push({ step: name, error: error.message });
    hasErrors = true;
    return false;
  }
}

function checkFile(filePath, description) {
  const fullPath = path.join(process.cwd(), filePath);
  if (fs.existsSync(fullPath)) {
    log(`✅ ${description}: File exists`, 'green');
    return true;
  } else {
    log(`⚠️  ${description}: File not found`, 'yellow');
    warnings.push({ file: filePath, description });
    return false;
  }
}

function checkCronJobs() {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(`🔍 Checking Vercel Cron Jobs Configuration`, 'blue');
  log(`${'='.repeat(60)}`, 'cyan');

  const vercelJsonPath = path.join(process.cwd(), 'vercel.json');
  if (!fs.existsSync(vercelJsonPath)) {
    log(`⚠️  vercel.json not found`, 'yellow');
    warnings.push({ file: 'vercel.json', description: 'File not found' });
    return true;
  }

  try {
    const vercelJson = JSON.parse(fs.readFileSync(vercelJsonPath, 'utf8'));
    const cronJobs = vercelJson.crons || [];

    if (cronJobs.length > 2) {
      log(`❌ Cron Jobs: ${cronJobs.length} cron jobs found (Vercel limit: 2)`, 'red');
      log(`   Consider using external cron service or combining tasks`, 'yellow');
      errors.push({
        step: 'Cron Jobs Check',
        error: `Too many cron jobs: ${cronJobs.length} (limit: 2)`,
      });
      hasErrors = true;
      return false;
    } else if (cronJobs.length > 0) {
      log(`✅ Cron Jobs: ${cronJobs.length} cron job(s) configured`, 'green');
      cronJobs.forEach((cron, index) => {
        log(`   ${index + 1}. ${cron.path} (${cron.schedule})`, 'reset');
      });
    } else {
      log(`ℹ️  Cron Jobs: No cron jobs configured (using external service?)`, 'cyan');
    }
    return true;
  } catch (error) {
    log(`❌ Failed to parse vercel.json: ${error.message}`, 'red');
    errors.push({ step: 'Cron Jobs Check', error: error.message });
    hasErrors = true;
    return false;
  }
}

function checkEnvFiles() {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(`🔍 Checking Environment Files`, 'blue');
  log(`${'='.repeat(60)}`, 'cyan');

  const envLocalPath = path.join(process.cwd(), '.env.local');
  const envExamplePath = path.join(process.cwd(), '.env.example');

  if (fs.existsSync(envLocalPath)) {
    log(`✅ .env.local: Found (not checking contents for security)`, 'green');
  } else {
    log(`⚠️  .env.local: Not found (may be needed for local development)`, 'yellow');
    warnings.push({ file: '.env.local', description: 'Not found' });
  }

  if (fs.existsSync(envExamplePath)) {
    log(`✅ .env.example: Found`, 'green');
  } else {
    log(`⚠️  .env.example: Not found (recommended for documentation)`, 'yellow');
    warnings.push({ file: '.env.example', description: 'Not found' });
  }

  return true;
}

function checkRequiredFiles() {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(`🔍 Checking Required Files`, 'blue');
  log(`${'='.repeat(60)}`, 'cyan');

  const requiredFiles = [
    { path: 'package.json', description: 'Package configuration' },
    { path: 'next.config.js', description: 'Next.js configuration' },
    { path: 'tsconfig.json', description: 'TypeScript configuration' },
    { path: 'vercel.json', description: 'Vercel configuration' },
  ];

  let allExist = true;
  requiredFiles.forEach(({ path: filePath, description }) => {
    if (!checkFile(filePath, description)) {
      allExist = false;
    }
  });

  return allExist;
}

// Main execution
log(`\n${'='.repeat(60)}`, 'cyan');
log(`🚀 PRE-DEPLOY CHECK`, 'blue');
log(`   Running checks before deployment to Vercel`, 'reset');
log(`${'='.repeat(60)}`, 'cyan');

// Step 1: Check required files
checkRequiredFiles();

// Step 2: Check environment files
checkEnvFiles();

// Step 3: TypeScript type check
checkStep(
  'TypeScript Type Check',
  'npm run type-check',
  'Checking for TypeScript errors'
);

// Step 4: Check cron jobs configuration
checkCronJobs();

// Step 5: Build check (only if type-check passed)
if (!hasErrors) {
  checkStep(
    'Next.js Build',
    'npm run build',
    'Building Next.js application (this may take a while)'
  );
} else {
  log(`\n⚠️  Skipping build check due to previous errors`, 'yellow');
  warnings.push({ step: 'Build Check', description: 'Skipped due to type errors' });
}

// Step 6: Lint check (if available) - warnings only, don't fail on warnings
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  if (packageJson.scripts && packageJson.scripts.lint) {
    log(`\n${'='.repeat(60)}`, 'cyan');
    log(`🔍 ESLint Check`, 'blue');
    log(`   Checking code style and linting errors (warnings are non-blocking)`, 'reset');
    log(`${'='.repeat(60)}`, 'cyan');

    try {
      const lintOutput = execSync('npm run lint', { 
        encoding: 'utf8', 
        cwd: process.cwd(),
        stdio: 'pipe'
      });
      
      // Check if there are actual errors (not just warnings)
      const hasLintErrors = lintOutput.includes('Error:') || lintOutput.match(/\d+ error/);
      
      if (hasLintErrors) {
        log(`❌ ESLint Check: FAILED (errors found)`, 'red');
        log(lintOutput, 'red');
        errors.push({ step: 'ESLint Check', error: 'Linting errors found' });
        hasErrors = true;
      } else {
        log(`✅ ESLint Check: PASSED (warnings are acceptable)`, 'green');
        if (lintOutput.includes('Warning:')) {
          log(`   Note: Some warnings found but they are non-blocking`, 'yellow');
        }
      }
    } catch (error) {
      // ESLint may exit with code 1 even for warnings, so check output
      const lintOutput = error.stdout || error.stderr || error.message;
      const hasLintErrors = lintOutput.includes('Error:') || lintOutput.match(/\d+ error/);
      
      if (hasLintErrors) {
        log(`❌ ESLint Check: FAILED (errors found)`, 'red');
        log(lintOutput, 'red');
        errors.push({ step: 'ESLint Check', error: 'Linting errors found' });
        hasErrors = true;
      } else {
        log(`✅ ESLint Check: PASSED (only warnings, which are acceptable)`, 'green');
        if (lintOutput.includes('Warning:')) {
          log(`   Note: Some warnings found but they are non-blocking`, 'yellow');
        }
      }
    }
  } else {
    log(`\nℹ️  Lint check: Not configured (skipping)`, 'cyan');
  }
} catch (error) {
  log(`\n⚠️  Could not check lint configuration: ${error.message}`, 'yellow');
}

// Summary
log(`\n${'='.repeat(60)}`, 'cyan');
log(`📊 SUMMARY`, 'blue');
log(`${'='.repeat(60)}`, 'cyan');

if (hasErrors) {
  log(`\n❌ PRE-DEPLOY CHECK FAILED`, 'red');
  log(`\nErrors found:`, 'red');
  errors.forEach(({ step, error }) => {
    log(`  • ${step}: ${error}`, 'red');
  });

  if (warnings.length > 0) {
    log(`\n⚠️  Warnings:`, 'yellow');
    warnings.forEach(({ file, description, step }) => {
      const message = step ? `${step}: ${description}` : `${file}: ${description}`;
      log(`  • ${message}`, 'yellow');
    });
  }

  log(`\n💡 Please fix the errors above before deploying.`, 'yellow');
  log(`   Run: npm run pre-deploy`, 'reset');
  process.exit(1);
} else {
  log(`\n✅ PRE-DEPLOY CHECK PASSED`, 'green');

  if (warnings.length > 0) {
    log(`\n⚠️  Warnings (non-blocking):`, 'yellow');
    warnings.forEach(({ file, description, step }) => {
      const message = step ? `${step}: ${description}` : `${file}: ${description}`;
      log(`  • ${message}`, 'yellow');
    });
  }

  log(`\n🚀 Ready to deploy!`, 'green');
  log(`   You can now push to GitHub and deploy to Vercel.`, 'reset');
  process.exit(0);
}
