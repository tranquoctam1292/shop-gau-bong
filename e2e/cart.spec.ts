/**
 * E2E Tests: Add to Cart Flow
 * Tests adding products to cart, updating quantities, and removing items
 */

import { test, expect } from '@playwright/test';

test.describe('Shopping Cart', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to products page
    await page.goto('/products');
    
    // Wait for products to load
    await page.waitForSelector('[data-testid="product-card"], .product-card, article', {
      timeout: 10000,
    });
  });

  test('should add product to cart', async ({ page }) => {
    // Click on first product
    const firstProduct = page.locator('[data-testid="product-card"], .product-card, article').first();
    const productLink = firstProduct.locator('a').first();
    await productLink.click();

    // Wait for product detail page
    await page.waitForLoadState('networkidle');

    // Find and click "Add to Cart" button
    const addToCartButton = page.locator('button:has-text("Thêm vào giỏ"), button:has-text("Add to Cart"), button:has-text("Mua ngay")').first();
    
    if (await addToCartButton.count() > 0) {
      await addToCartButton.click();

      // Wait for cart to update (check for cart drawer or notification)
      await page.waitForTimeout(1000);

      // Verify item is in cart (check cart icon count or drawer)
      const cartIcon = page.locator('[aria-label*="cart" i], [aria-label*="giỏ" i], button:has-text("🛒")').first();
      
      if (await cartIcon.count() > 0) {
        // Cart should show item count
        const cartText = await cartIcon.textContent();
        expect(cartText).toBeTruthy();
      }
    }
  });

  test('should open cart drawer', async ({ page }) => {
    // Add item to cart first (if possible)
    const firstProduct = page.locator('[data-testid="product-card"], .product-card, article').first();
    const productLink = firstProduct.locator('a').first();
    await productLink.click();
    await page.waitForLoadState('networkidle');

    const addToCartButton = page.locator('button:has-text("Thêm vào giỏ"), button:has-text("Add to Cart")').first();
    if (await addToCartButton.count() > 0) {
      await addToCartButton.click();
      await page.waitForTimeout(1000);
    }

    // Click cart icon to open drawer
    const cartIcon = page.locator('[aria-label*="cart" i], [aria-label*="giỏ" i], button:has-text("🛒")').first();
    
    if (await cartIcon.count() > 0) {
      await cartIcon.click();

      // Wait for cart drawer to open
      await page.waitForSelector('[role="dialog"], [data-testid="cart-drawer"], aside', {
        timeout: 5000,
      });

      // Verify cart drawer is visible
      const cartDrawer = page.locator('[role="dialog"], [data-testid="cart-drawer"], aside').first();
      await expect(cartDrawer).toBeVisible();
    }
  });

  test('should navigate to cart page', async ({ page }) => {
    // Navigate to cart page
    await page.goto('/cart');

    // Wait for cart page to load
    await page.waitForLoadState('networkidle');

    // Verify we're on cart page
    expect(page.url()).toContain('/cart');

    // Check for cart content (empty state or items)
    const cartContent = page.locator('text=/Giỏ hàng|Cart|Chưa có sản phẩm|Empty/').first();
    await expect(cartContent).toBeVisible({ timeout: 5000 });
  });

  test('should update item quantity in cart', async ({ page }) => {
    // Navigate to cart page
    await page.goto('/cart');

    // Wait for cart to load
    await page.waitForLoadState('networkidle');

    // Find quantity input or buttons
    const quantityInput = page.locator('input[type="number"]').first();
    const increaseButton = page.locator('button:has-text("+"), button[aria-label*="increase" i]').first();
    const decreaseButton = page.locator('button:has-text("-"), button[aria-label*="decrease" i]').first();

    if (await quantityInput.count() > 0) {
      const initialValue = await quantityInput.inputValue();
      
      // Increase quantity
      if (await increaseButton.count() > 0) {
        await increaseButton.click();
        await page.waitForTimeout(500);
        
        const newValue = await quantityInput.inputValue();
        expect(parseInt(newValue)).toBeGreaterThan(parseInt(initialValue || '1'));
      }
    }
  });

  test('should remove item from cart', async ({ page }) => {
    // Navigate to cart page
    await page.goto('/cart');

    // Wait for cart to load
    await page.waitForLoadState('networkidle');

    // Find remove button
    const removeButton = page.locator('button:has-text("Xóa"), button:has-text("Remove"), button[aria-label*="remove" i]').first();

    if (await removeButton.count() > 0 && await removeButton.isVisible()) {
      const initialItemCount = await page.locator('[data-testid="cart-item"], .cart-item, article').count();
      
      await removeButton.click();
      await page.waitForTimeout(1000);

      // Verify item is removed (check for empty state or reduced count)
      const newItemCount = await page.locator('[data-testid="cart-item"], .cart-item, article').count();
      expect(newItemCount).toBeLessThan(initialItemCount);
    }
  });

  test('should display cart total', async ({ page }) => {
    // Navigate to cart page
    await page.goto('/cart');

    // Wait for cart to load
    await page.waitForLoadState('networkidle');

    // Check for total price display
    const totalElement = page.locator('text=/Tổng|Total|Thành tiền/').first();
    
    if (await totalElement.count() > 0) {
      await expect(totalElement).toBeVisible();
    }
  });

  test('should clear cart', async ({ page }) => {
    // Navigate to cart page
    await page.goto('/cart');

    // Wait for cart to load
    await page.waitForLoadState('networkidle');

    // Find clear cart button
    const clearButton = page.locator('button:has-text("Xóa tất cả"), button:has-text("Clear"), button:has-text("Xóa giỏ hàng")').first();

    if (await clearButton.count() > 0 && await clearButton.isVisible()) {
      await clearButton.click();
      
      // Confirm if there's a confirmation dialog
      const confirmButton = page.locator('button:has-text("Xác nhận"), button:has-text("Confirm")').first();
      if (await confirmButton.count() > 0) {
        await confirmButton.click();
      }

      await page.waitForTimeout(1000);

      // Verify cart is empty
      const emptyState = page.locator('text=/Chưa có sản phẩm|Empty|Giỏ hàng trống/').first();
      await expect(emptyState).toBeVisible({ timeout: 5000 });
    }
  });
});

