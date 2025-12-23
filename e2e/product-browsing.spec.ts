/**
 * E2E Tests: Product Browsing Flow
 * Tests product listing, filtering, search, and product detail pages
 */

import { test, expect } from '@playwright/test';

test.describe('Product Browsing', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to products page
    await page.goto('/products');
  });

  test('should display products list', async ({ page }) => {
    // Wait for products to load or empty state
    await page.waitForLoadState('networkidle');
    
    // Check for products or empty state
    const hasProducts = await page.locator('[data-testid="product-card"], .product-card, article, [data-testid="no-products"]').count() > 0;
    expect(hasProducts).toBe(true);

    // Check if products are displayed
    const productCards = page.locator('[data-testid="product-card"], .product-card, article').first();
    await expect(productCards).toBeVisible();
  });

  test('should navigate to product detail page', async ({ page }) => {
    // Wait for products to load
    await page.waitForSelector('[data-testid="product-card"], .product-card, article', {
      timeout: 10000,
    });

    // Click on first product
    const firstProduct = page.locator('[data-testid="product-card"], .product-card, article').first();
    const productLink = firstProduct.locator('a').first();
    
    // Get product name or slug for verification
    const productName = await firstProduct.textContent();
    
    await productLink.click();

    // Wait for product detail page to load
    await page.waitForLoadState('networkidle');

    // Verify we're on product detail page
    expect(page.url()).toContain('/products/');
    
    // Check if product name is displayed
    if (productName) {
      await expect(page.locator('h1')).toContainText(productName.trim().substring(0, 20));
    }
  });

  test('should filter products by category', async ({ page }) => {
    // Wait for filters to load
    await page.waitForSelector('select, [role="combobox"], button', {
      timeout: 10000,
    });

    // Try to find category filter
    const categoryFilter = page.locator('select, [role="combobox"]').first();
    
    if (await categoryFilter.count() > 0) {
      await categoryFilter.selectOption({ index: 1 });
      
      // Wait for products to update
      await page.waitForTimeout(1000);
      
      // Verify products are filtered
      const productCards = page.locator('[data-testid="product-card"], .product-card, article');
      await expect(productCards.first()).toBeVisible();
    }
  });

  test('should search for products', async ({ page }) => {
    // Find search input
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i], input[placeholder*="tìm" i]').first();
    
    if (await searchInput.count() > 0) {
      await searchInput.fill('gấu bông');
      await searchInput.press('Enter');

      // Wait for search results
      await page.waitForLoadState('networkidle');

      // Verify we're on search page or products are filtered
      const productCards = page.locator('[data-testid="product-card"], .product-card, article');
      await expect(productCards.first()).toBeVisible({ timeout: 10000 });
    }
  });

  test('should paginate products', async ({ page }) => {
    // Wait for products to load
    await page.waitForSelector('[data-testid="product-card"], .product-card, article', {
      timeout: 10000,
    });

    // Try to find "Load More" or pagination button
    const loadMoreButton = page.locator('button:has-text("Load More"), button:has-text("Xem thêm"), button:has-text("Tải thêm")').first();
    
    if (await loadMoreButton.count() > 0 && await loadMoreButton.isVisible()) {
      const initialProductCount = await page.locator('[data-testid="product-card"], .product-card, article').count();
      
      await loadMoreButton.click();
      
      // Wait for more products to load
      await page.waitForTimeout(2000);
      
      const newProductCount = await page.locator('[data-testid="product-card"], .product-card, article').count();
      
      // Verify more products are loaded
      expect(newProductCount).toBeGreaterThan(initialProductCount);
    }
  });

  test('should display product images', async ({ page }) => {
    // Wait for products to load
    await page.waitForSelector('[data-testid="product-card"], .product-card, article', {
      timeout: 10000,
    });

    // Check if product images are displayed
    const productImage = page.locator('img').first();
    await expect(productImage).toBeVisible();
    
    // Verify image has src
    const src = await productImage.getAttribute('src');
    expect(src).toBeTruthy();
  });

  test('should display product prices', async ({ page }) => {
    // Wait for products to load
    await page.waitForSelector('[data-testid="product-card"], .product-card, article', {
      timeout: 10000,
    });

    // Check if price is displayed (look for VND symbol or price format)
    const priceElement = page.locator('text=/₫|VND|Liên hệ/').first();
    await expect(priceElement).toBeVisible();
  });
});

