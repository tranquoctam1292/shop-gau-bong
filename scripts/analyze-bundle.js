/**
 * Bundle Size Analysis Script
 * Analyze Next.js bundle size
 * 
 * Usage:
 *   npm run build
 *   npm run test:bundle-size
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const OUTPUT_DIR = path.join(process.cwd(), '.next');
const ANALYSIS_DIR = path.join(process.cwd(), 'bundle-analysis');

// Ensure analysis directory exists
if (!fs.existsSync(ANALYSIS_DIR)) {
  fs.mkdirSync(ANALYSIS_DIR, { recursive: true });
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function analyzeBundle() {
  console.log('📦 Analyzing bundle size...\n');

  // Check if .next directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    console.error('❌ .next directory not found. Please run "npm run build" first.');
    process.exit(1);
  }

  // Analyze static files
  const staticDir = path.join(OUTPUT_DIR, 'static');
  if (fs.existsSync(staticDir)) {
    console.log('📊 Static Files:');
    analyzeDirectory(staticDir, '  ');
  }

  // Analyze server files
  const serverDir = path.join(OUTPUT_DIR, 'server');
  if (fs.existsSync(serverDir)) {
    console.log('\n📊 Server Files:');
    analyzeDirectory(serverDir, '  ');
  }

  // Check for large files
  console.log('\n🔍 Large Files (>100KB):');
  findLargeFiles(OUTPUT_DIR, 100 * 1024, '  ');

  // Generate summary
  const summary = {
    timestamp: new Date().toISOString(),
    buildDir: OUTPUT_DIR,
    totalSize: getDirectorySize(OUTPUT_DIR),
  };

  const summaryPath = path.join(ANALYSIS_DIR, 'bundle-summary.json');
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
  console.log(`\n✅ Bundle analysis summary saved to: ${summaryPath}`);
}

function analyzeDirectory(dir, indent = '') {
  const items = fs.readdirSync(dir, { withFileTypes: true });
  let totalSize = 0;

  items.forEach((item) => {
    const itemPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      const size = getDirectorySize(itemPath);
      totalSize += size;
      if (size > 1024) { // Only show directories > 1KB
        console.log(`${indent}📁 ${item.name}/: ${formatBytes(size)}`);
      }
    } else {
      const stats = fs.statSync(itemPath);
      totalSize += stats.size;
      if (stats.size > 1024) { // Only show files > 1KB
        console.log(`${indent}📄 ${item.name}: ${formatBytes(stats.size)}`);
      }
    }
  });

  if (totalSize > 0) {
    console.log(`${indent}Total: ${formatBytes(totalSize)}`);
  }
}

function getDirectorySize(dir) {
  let totalSize = 0;
  try {
    const items = fs.readdirSync(dir, { withFileTypes: true });
    items.forEach((item) => {
      const itemPath = path.join(dir, item.name);
      if (item.isDirectory()) {
        totalSize += getDirectorySize(itemPath);
      } else {
        const stats = fs.statSync(itemPath);
        totalSize += stats.size;
      }
    });
  } catch (error) {
    // Ignore errors
  }
  return totalSize;
}

function findLargeFiles(dir, minSize, indent = '') {
  try {
    const items = fs.readdirSync(dir, { withFileTypes: true });
    items.forEach((item) => {
      const itemPath = path.join(dir, item.name);
      if (item.isDirectory()) {
        findLargeFiles(itemPath, minSize, indent);
      } else {
        const stats = fs.statSync(itemPath);
        if (stats.size > minSize) {
          const relativePath = path.relative(process.cwd(), itemPath);
          console.log(`${indent}⚠️  ${relativePath}: ${formatBytes(stats.size)}`);
        }
      }
    });
  } catch (error) {
    // Ignore errors
  }
}

// Run analysis
try {
  analyzeBundle();
  console.log('\n✅ Bundle analysis completed!');
} catch (error) {
  console.error('❌ Bundle analysis failed:', error);
  process.exit(1);
}

