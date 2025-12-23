/**
 * Lighthouse Audit Script
 * Run Lighthouse audit on the application
 * 
 * Usage:
 *   npm run test:lighthouse
 *   npm run test:lighthouse -- --url=http://localhost:3000/products
 */

const { default: lighthouse } = require('lighthouse');
const chromeLauncher = require('chrome-launcher');
const fs = require('fs');
const path = require('path');

const DEFAULT_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';
const OUTPUT_DIR = path.join(process.cwd(), 'lighthouse-reports');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function runLighthouse(url, options = {}) {
  // Launch Chrome
  const chrome = await chromeLauncher.launch({
    chromeFlags: ['--headless', '--no-sandbox', '--disable-gpu'],
  });

  const opts = {
    logLevel: 'info',
    output: 'html',
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
    port: chrome.port,
    ...options,
  };

  try {
    // Run Lighthouse
    const runnerResult = await lighthouse(url, opts);

    // Generate report filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const urlSlug = url.replace(/[^a-z0-9]/gi, '-').toLowerCase();
    const filename = `lighthouse-${urlSlug}-${timestamp}.html`;
    const filepath = path.join(OUTPUT_DIR, filename);

    // Save report
    fs.writeFileSync(filepath, runnerResult.report);
    console.log(`✅ Lighthouse report saved to: ${filepath}`);

    // Print scores
    const scores = runnerResult.lhr.categories;
    console.log('\n📊 Lighthouse Scores:');
    console.log(`  Performance: ${Math.round(scores.performance.score * 100)}`);
    console.log(`  Accessibility: ${Math.round(scores.accessibility.score * 100)}`);
    console.log(`  Best Practices: ${Math.round(scores['best-practices'].score * 100)}`);
    console.log(`  SEO: ${Math.round(scores.seo.score * 100)}`);

    return runnerResult;
  } finally {
    await chrome.kill();
  }
}

// Main execution
const url = process.argv.find(arg => arg.startsWith('--url='))?.split('=')[1] || DEFAULT_URL;

console.log(`🔍 Running Lighthouse audit on: ${url}`);
runLighthouse(url)
  .then(() => {
    console.log('\n✅ Lighthouse audit completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Lighthouse audit failed:', error);
    process.exit(1);
  });

