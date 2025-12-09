/**
 * Comprehensive Performance Testing Script
 * Tests page load speed, Lighthouse scores, and Core Web Vitals
 * 
 * Usage:
 *   npm run test:performance
 *   npm run test:performance -- --url=http://localhost:3000/products
 *   npm run test:performance -- --all (test all key pages)
 */

const { default: lighthouse } = require('lighthouse');
const chromeLauncher = require('chrome-launcher');
const fs = require('fs');
const path = require('path');

const DEFAULT_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';
const OUTPUT_DIR = path.join(process.cwd(), 'performance-reports');

// Key pages to test
const KEY_PAGES = [
  { name: 'Homepage', url: '/', priority: 'high' },
  { name: 'Products', url: '/products', priority: 'high' },
  { name: 'Product Detail', url: '/products/gau-bong-teddy', priority: 'high' },
  { name: 'Cart', url: '/cart', priority: 'medium' },
  { name: 'Checkout', url: '/checkout', priority: 'high' },
  { name: 'Blog', url: '/blog', priority: 'low' },
];

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Extract Core Web Vitals from Lighthouse results
 */
function extractCoreWebVitals(lhr) {
  const metrics = lhr.audits;
  
  return {
    // Largest Contentful Paint (LCP) - Target: < 2.5s
    lcp: {
      value: metrics['largest-contentful-paint']?.numericValue || 0,
      score: metrics['largest-contentful-paint']?.score || 0,
      target: 2500, // 2.5 seconds
      status: metrics['largest-contentful-paint']?.numericValue <= 2500 ? 'good' : 'needs-improvement',
    },
    // First Input Delay (FID) - Target: < 100ms
    fid: {
      value: metrics['max-potential-fid']?.numericValue || 0,
      score: metrics['max-potential-fid']?.score || 0,
      target: 100, // 100 milliseconds
      status: metrics['max-potential-fid']?.numericValue <= 100 ? 'good' : 'needs-improvement',
    },
    // Cumulative Layout Shift (CLS) - Target: < 0.1
    cls: {
      value: metrics['cumulative-layout-shift']?.numericValue || 0,
      score: metrics['cumulative-layout-shift']?.score || 0,
      target: 0.1,
      status: metrics['cumulative-layout-shift']?.numericValue <= 0.1 ? 'good' : 'needs-improvement',
    },
    // First Contentful Paint (FCP) - Target: < 1.8s
    fcp: {
      value: metrics['first-contentful-paint']?.numericValue || 0,
      score: metrics['first-contentful-paint']?.score || 0,
      target: 1800, // 1.8 seconds
      status: metrics['first-contentful-paint']?.numericValue <= 1800 ? 'good' : 'needs-improvement',
    },
    // Time to Interactive (TTI) - Target: < 3.8s
    tti: {
      value: metrics['interactive']?.numericValue || 0,
      score: metrics['interactive']?.score || 0,
      target: 3800, // 3.8 seconds
      status: metrics['interactive']?.numericValue <= 3800 ? 'good' : 'needs-improvement',
    },
    // Total Blocking Time (TBT) - Target: < 200ms
    tbt: {
      value: metrics['total-blocking-time']?.numericValue || 0,
      score: metrics['total-blocking-time']?.score || 0,
      target: 200, // 200 milliseconds
      status: metrics['total-blocking-time']?.numericValue <= 200 ? 'good' : 'needs-improvement',
    },
    // Speed Index - Target: < 3.4s
    speedIndex: {
      value: metrics['speed-index']?.numericValue || 0,
      score: metrics['speed-index']?.score || 0,
      target: 3400, // 3.4 seconds
      status: metrics['speed-index']?.numericValue <= 3400 ? 'good' : 'needs-improvement',
    },
  };
}

/**
 * Format metric value for display
 */
function formatMetric(value, unit) {
  if (unit === 'ms') {
    return `${value.toFixed(0)}ms`;
  } else if (unit === 's') {
    return `${(value / 1000).toFixed(2)}s`;
  }
  return value.toFixed(2);
}

/**
 * Get status emoji
 */
function getStatusEmoji(status) {
  if (status === 'good') return '✅';
  if (status === 'needs-improvement') return '⚠️';
  return '❌';
}

/**
 * Run Lighthouse audit on a URL
 */
async function runLighthouse(url, options = {}) {
  // Launch Chrome
  const chrome = await chromeLauncher.launch({
    chromeFlags: ['--headless', '--no-sandbox', '--disable-gpu'],
  });

  const opts = {
    logLevel: 'info',
    output: 'html',
    onlyCategories: ['performance'],
    port: chrome.port,
    ...options,
  };

  try {
    // Run Lighthouse
    const runnerResult = await lighthouse(url, opts);
    return runnerResult;
  } finally {
    await chrome.kill();
  }
}

/**
 * Test a single page
 */
async function testPage(pageUrl, pageName) {
  console.log(`\n🔍 Testing: ${pageName} (${pageUrl})`);
  
  try {
    const result = await runLighthouse(pageUrl);
    const lhr = result.lhr;
    
    // Extract scores
    const performanceScore = Math.round(lhr.categories.performance.score * 100);
    
    // Extract Core Web Vitals
    const vitals = extractCoreWebVitals(lhr);
    
    // Generate report filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const urlSlug = pageUrl.replace(/[^a-z0-9]/gi, '-').toLowerCase();
    const filename = `lighthouse-${urlSlug}-${timestamp}.html`;
    const filepath = path.join(OUTPUT_DIR, filename);
    
    // Save HTML report
    fs.writeFileSync(filepath, result.report);
    
    // Print results
    console.log(`  📊 Performance Score: ${performanceScore}/100`);
    console.log(`  📄 Report saved: ${filepath}`);
    console.log(`  \n  Core Web Vitals:`);
    console.log(`    ${getStatusEmoji(vitals.lcp.status)} LCP: ${formatMetric(vitals.lcp.value, 'ms')} (target: < ${formatMetric(vitals.lcp.target, 'ms')})`);
    console.log(`    ${getStatusEmoji(vitals.fid.status)} FID: ${formatMetric(vitals.fid.value, 'ms')} (target: < ${formatMetric(vitals.fid.target, 'ms')})`);
    console.log(`    ${getStatusEmoji(vitals.cls.status)} CLS: ${vitals.cls.value.toFixed(3)} (target: < ${vitals.cls.target})`);
    console.log(`    ${getStatusEmoji(vitals.fcp.status)} FCP: ${formatMetric(vitals.fcp.value, 'ms')} (target: < ${formatMetric(vitals.fcp.target, 'ms')})`);
    console.log(`    ${getStatusEmoji(vitals.tti.status)} TTI: ${formatMetric(vitals.tti.value, 'ms')} (target: < ${formatMetric(vitals.tti.target, 'ms')})`);
    console.log(`    ${getStatusEmoji(vitals.tbt.status)} TBT: ${formatMetric(vitals.tbt.value, 'ms')} (target: < ${formatMetric(vitals.tbt.target, 'ms')})`);
    console.log(`    ${getStatusEmoji(vitals.speedIndex.status)} Speed Index: ${formatMetric(vitals.speedIndex.value, 'ms')} (target: < ${formatMetric(vitals.speedIndex.target, 'ms')})`);
    
    return {
      pageName,
      pageUrl,
      performanceScore,
      vitals,
      reportPath: filepath,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error(`  ❌ Error testing ${pageName}:`, error.message);
    return {
      pageName,
      pageUrl,
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Generate summary report
 */
function generateSummaryReport(results) {
  const summary = {
    timestamp: new Date().toISOString(),
    totalPages: results.length,
    successful: results.filter(r => !r.error).length,
    failed: results.filter(r => r.error).length,
    pages: results.map(r => ({
      name: r.pageName,
      url: r.pageUrl,
      performanceScore: r.performanceScore || null,
      vitals: r.vitals || null,
      error: r.error || null,
    })),
    averages: {
      performanceScore: results
        .filter(r => r.performanceScore)
        .reduce((sum, r) => sum + r.performanceScore, 0) / results.filter(r => r.performanceScore).length || 0,
      lcp: results
        .filter(r => r.vitals?.lcp)
        .reduce((sum, r) => sum + r.vitals.lcp.value, 0) / results.filter(r => r.vitals?.lcp).length || 0,
      cls: results
        .filter(r => r.vitals?.cls)
        .reduce((sum, r) => sum + r.vitals.cls.value, 0) / results.filter(r => r.vitals?.cls).length || 0,
      fcp: results
        .filter(r => r.vitals?.fcp)
        .reduce((sum, r) => sum + r.vitals.fcp.value, 0) / results.filter(r => r.vitals?.fcp).length || 0,
    },
  };
  
  const summaryPath = path.join(OUTPUT_DIR, `performance-summary-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
  
  console.log(`\n📊 Summary Report saved: ${summaryPath}`);
  console.log(`\n📈 Overall Averages:`);
  console.log(`  Performance Score: ${summary.averages.performanceScore.toFixed(0)}/100`);
  console.log(`  LCP: ${formatMetric(summary.averages.lcp, 'ms')}`);
  console.log(`  CLS: ${summary.averages.cls.toFixed(3)}`);
  console.log(`  FCP: ${formatMetric(summary.averages.fcp, 'ms')}`);
  
  return summary;
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);
  const testAll = args.includes('--all');
  const urlArg = args.find(arg => arg.startsWith('--url='));
  const customUrl = urlArg?.split('=')[1];
  
  if (customUrl) {
    // Test single custom URL
    const result = await testPage(customUrl, 'Custom Page');
    generateSummaryReport([result]);
  } else if (testAll) {
    // Test all key pages
    console.log('🚀 Testing all key pages...\n');
    const results = [];
    
    for (const page of KEY_PAGES) {
      const fullUrl = `${DEFAULT_URL}${page.url}`;
      const result = await testPage(fullUrl, page.name);
      results.push(result);
      
      // Wait a bit between tests
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    generateSummaryReport(results);
  } else {
    // Test default URL (homepage)
    const result = await testPage(DEFAULT_URL, 'Homepage');
    generateSummaryReport([result]);
  }
  
  console.log('\n✅ Performance testing completed!');
}

main().catch((error) => {
  console.error('❌ Performance testing failed:', error);
  process.exit(1);
});


