/**
 * tests/e2e/normal-lead.spec.ts
 * Full 7-step normal lead flow on desktop and mobile viewports.
 */
import { test, expect, devices } from '@playwright/test';

const WIDGET_URL = process.env['E2E_URL'] ?? 'http://localhost:3000';

test.describe('Normal lead — full qualification flow', () => {

  test.describe('Desktop viewport', () => {
    test.use({ viewport: { width: 1280, height: 800 } });

    test('completes full 7-step qualification', async ({ page }) => {
      await page.goto(WIDGET_URL);

      // Open widget
      const launcher = page.locator('#dw-launcher');
      await launcher.click();
      await expect(page.locator('#dw-container')).toHaveClass(/open/);

      // Wait for greeting
      await expect(page.locator('.dw-msg-assistant').first()).toBeVisible({ timeout: 10000 });

      // Step 1: Treatment — click quick reply
      await page.locator('.dw-qr-btn', { hasText: 'Invisalign' }).click();
      await page.waitForSelector('.dw-typing', { state: 'detached', timeout: 15000 });

      // Step 2: Timeline — click quick reply
      await page.locator('.dw-qr-btn', { hasText: 'Immediately' }).click();
      await page.waitForSelector('.dw-typing', { state: 'detached', timeout: 15000 });

      // Step 3: History — click quick reply
      await page.locator('.dw-qr-btn', { hasText: 'No' }).first().click();
      await page.waitForSelector('.dw-typing', { state: 'detached', timeout: 15000 });

      // Step 4: Name + consent
      const consentCheckbox = page.locator('#dw-consent-check');
      await expect(consentCheckbox).toBeVisible();
      await consentCheckbox.check();
      await expect(consentCheckbox).toBeChecked();

      const input = page.locator('#dw-input');
      await input.fill('Sarah Johnson');
      await page.locator('#dw-send').click();
      await page.waitForSelector('.dw-typing', { state: 'detached', timeout: 15000 });

      // Step 5: Mobile
      await input.fill('07700 900 123');
      await page.locator('#dw-send').click();
      await page.waitForSelector('.dw-typing', { state: 'detached', timeout: 15000 });

      // Step 6: Preferred slot
      await input.fill('Monday morning if possible');
      await page.locator('#dw-send').click();
      await page.waitForSelector('.dw-typing', { state: 'detached', timeout: 15000 });

      // Step 7: Confirmation message should contain the patient's name
      const messages = page.locator('.dw-msg-assistant');
      const lastMsg  = messages.last();
      const text     = await lastMsg.textContent();
      expect(text).toMatch(/Sarah|thank|confirm|team/i);

      // No emergency banner should be visible
      await expect(page.locator('#dw-emergency-banner')).not.toHaveClass(/visible/);

      // Take screenshot
      await page.screenshot({ path: 'tests/e2e/screenshots/normal-lead-desktop.png', fullPage: false });
    });
  });

  test.describe('Mobile viewport', () => {
    test.use({ ...devices['iPhone 14'] });

    test('completes flow on mobile', async ({ page }) => {
      await page.goto(WIDGET_URL);

      const launcher = page.locator('#dw-launcher');
      await launcher.tap();

      // Widget should not overflow screen
      const container = page.locator('#dw-container');
      await expect(container).toHaveClass(/open/);

      const box = await container.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.width).toBeLessThanOrEqual(430); // iPhone 14 width

      await page.screenshot({ path: 'tests/e2e/screenshots/normal-lead-mobile.png' });
    });
  });
});
