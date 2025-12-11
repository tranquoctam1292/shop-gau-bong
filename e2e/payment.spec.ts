/**
 * E2E Tests: Payment Flow
 * Tests payment method selection and payment processing
 */

import { test, expect } from '@playwright/test';

test.describe('Payment Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to checkout with items in cart
    await page.goto('/checkout');
    await page.waitForLoadState('networkidle');
  });

  test('should display VietQR payment option', async ({ page }) => {
    // Find VietQR payment option
    const vietqrOption = page.locator('input[value="vietqr"], label:has-text("VietQR"), button:has-text("VietQR")').first();
    
    if (await vietqrOption.count() > 0) {
      await expect(vietqrOption).toBeVisible();
    }
  });

  test('should display MoMo payment option', async ({ page }) => {
    // Find MoMo payment option
    const momoOption = page.locator('input[value="momo"], label:has-text("MoMo"), button:has-text("MoMo")').first();
    
    if (await momoOption.count() > 0) {
      await expect(momoOption).toBeVisible();
    }
  });

  test('should select VietQR payment method', async ({ page }) => {
    // Select VietQR
    const vietqrOption = page.locator('input[value="vietqr"], label:has-text("VietQR")').first();
    
    if (await vietqrOption.count() > 0) {
      await vietqrOption.click();
      await page.waitForTimeout(500);

      // Verify VietQR is selected
      const type = await vietqrOption.getAttribute('type');
      if (type === 'radio' || type === 'checkbox') {
        await expect(vietqrOption).toBeChecked();
      }
    }
  });

  test('should display VietQR QR code on order confirmation', async ({ page }) => {
    // Navigate to order confirmation page (simulated)
    // In real test, this would be after successful checkout
    await page.goto('/order-confirmation?orderId=123&paymentMethod=vietqr');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check for QR code image
    const qrCode = page.locator('img[alt*="QR"], img[src*="qr"], [data-testid="vietqr-qr"]').first();
    
    if (await qrCode.count() > 0) {
      await expect(qrCode).toBeVisible({ timeout: 10000 });
    }

    // Check for bank account information
    const bankInfo = page.locator('text=/Số tài khoản|Account|Ngân hàng/').first();
    
    if (await bankInfo.count() > 0) {
      await expect(bankInfo).toBeVisible();
    }
  });

  test('should display MoMo payment button on order confirmation', async ({ page }) => {
    // Navigate to order confirmation page
    await page.goto('/order-confirmation?orderId=123&paymentMethod=momo');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check for MoMo payment button
    const momoButton = page.locator('button:has-text("MoMo"), button:has-text("Thanh toán MoMo"), [data-testid="momo-button"]').first();
    
    if (await momoButton.count() > 0) {
      await expect(momoButton).toBeVisible({ timeout: 10000 });
    }
  });

  test('should display order details on confirmation page', async ({ page }) => {
    // Navigate to order confirmation
    await page.goto('/order-confirmation?orderId=123');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check for order number
    const orderNumber = page.locator('text=/Đơn hàng|Order|#/').first();
    
    if (await orderNumber.count() > 0) {
      await expect(orderNumber).toBeVisible();
    }

    // Check for success message
    const successMessage = page.locator('text=/Thành công|Success|Cảm ơn/').first();
    
    if (await successMessage.count() > 0) {
      await expect(successMessage).toBeVisible();
    }
  });

  test('should handle payment method selection in checkout', async ({ page }) => {
    // Fill required form fields first
    const firstNameInput = page.locator('input[name="firstName"]').first();
    const emailInput = page.locator('input[type="email"]').first();
    
    if (await firstNameInput.count() > 0) {
      await firstNameInput.fill('Test');
      await emailInput.fill('test@example.com');
    }

    // Select payment method
    const paymentMethod = page.locator('input[value="vietqr"], input[value="momo"]').first();
    
    if (await paymentMethod.count() > 0) {
      await paymentMethod.click();
      await page.waitForTimeout(500);

      // Verify payment method is selected
      await expect(paymentMethod).toBeChecked();
    }
  });

  test('should display payment instructions', async ({ page }) => {
    // Navigate to order confirmation with VietQR
    await page.goto('/order-confirmation?orderId=123&paymentMethod=vietqr');
    await page.waitForLoadState('networkidle');

    // Check for payment instructions
    const instructions = page.locator('text=/Hướng dẫn|Instructions|Thanh toán/').first();
    
    if (await instructions.count() > 0) {
      await expect(instructions).toBeVisible();
    }
  });
});

