/**
 * Clean Next.js Build Cache Script
 * 
 * Removes .next/cache directory to free up disk space
 * Cache files can be large (400+ MB) but are regenerated on next build
 * 
 * Usage:
 *   node scripts/clean-cache.js
 *   npm run clean:cache
 */

const fs = require('fs');
const path = require('path');

const CACHE_DIR = path.join(process.cwd(), '.next', 'cache');

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
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

function removeDirectory(dir) {
  try {
    if (fs.existsSync(dir)) {
      const items = fs.readdirSync(dir, { withFileTypes: true });
      items.forEach((item) => {
        const itemPath = path.join(dir, item.name);
        if (item.isDirectory()) {
          removeDirectory(itemPath);
        } else {
          fs.unlinkSync(itemPath);
        }
      });
      fs.rmdirSync(dir);
    }
  } catch (error) {
    console.error(`Error removing ${dir}:`, error.message);
    throw error;
  }
}

function cleanCache() {
  console.log('🧹 Cleaning Next.js build cache...\n');

  if (!fs.existsSync(CACHE_DIR)) {
    console.log('✅ Cache directory does not exist. Nothing to clean.');
    return;
  }

  // Calculate size before deletion
  const sizeBefore = getDirectorySize(CACHE_DIR);
  console.log(`📊 Cache size before cleanup: ${formatBytes(sizeBefore)}\n`);

  try {
    // Remove cache directory
    removeDirectory(CACHE_DIR);
    console.log('✅ Cache directory removed successfully!');
    console.log(`💾 Freed up: ${formatBytes(sizeBefore)}\n`);
    console.log('ℹ️  Cache will be regenerated on next build.');
  } catch (error) {
    console.error('❌ Failed to clean cache:', error.message);
    process.exit(1);
  }
}

// Run cleanup
try {
  cleanCache();
  console.log('✅ Cache cleanup completed!');
} catch (error) {
  console.error('❌ Cache cleanup failed:', error);
  process.exit(1);
}

