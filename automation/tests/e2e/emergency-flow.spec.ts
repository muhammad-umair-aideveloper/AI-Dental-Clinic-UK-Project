/**
 * tests/e2e/emergency-flow.spec.ts
 * Emergency detected mid-conversation — stops qualification, shows fixed text.
 */
import { test, expect, devices } from '@playwright/test';

const WIDGET_URL = process.env['E2E_URL'] ?? 'http://localhost:3000';

test.describe('Emergency flow', () => {

  test.describe('Desktop', () => {
    test.use({ viewport: { width: 1280, height: 800 } });

    test('emergency detected mid-conversation shows red-flag response', async ({ page }) => {
      await page.goto(WIDGET_URL);
      await page.locator('#dw-launcher').click();

      // Wait for greeting
      await expect(page.locator('.dw-msg-assistant').first()).toBeVisible({ timeout: 10000 });

      // Select treatment first (normal step)
      await page.locator('.dw-qr-btn', { hasText: 'Implants' }).click();
      await page.waitForSelector('.dw-typing', { state: 'detached', timeout: 15000 });

      // Now type an emergency message mid-conversation
      const input = page.locator('#dw-input');
      await input.fill("Actually I have severe pain and my face is swollen, can't swallow");
      await page.locator('#dw-send').click();
      await page.waitForSelector('.dw-typing', { state: 'detached', timeout: 15000 });

      // Emergency banner should appear
      await expect(page.locator('#dw-emergency-banner')).toHaveClass(/visible/);

      // Response should contain emergency keywords — NOT LLM content
      const lastMsg = page.locator('.dw-msg-assistant').last();
      const text    = await lastMsg.textContent();
      expect(text).toMatch(/999|A&E|emergency|swallow|NHS 111/i);

      // Should NOT contain prices, Invisalign marketing, etc.
      expect(text).not.toMatch(/£\d+|consultation fee|invisalign/i);

      // Screenshot
      await page.screenshot({ path: 'tests/e2e/screenshots/emergency-mid-conversation-desktop.png' });
    });

    test('emergency on first message', async ({ page }) => {
      await page.goto(WIDGET_URL);
      await page.locator('#dw-launcher').click();
      await page.waitForSelector('.dw-msg-assistant', { timeout: 10000 });

      const input = page.locator('#dw-input');
      await input.fill('I have a knocked-out tooth and uncontrolled bleeding');
      await page.locator('#dw-send').click();
      await page.waitForSelector('.dw-typing', { state: 'detached', timeout: 15000 });

      // Should show emergency info
      const text = await page.locator('.dw-msg-assistant').last().textContent();
      expect(text).toMatch(/emergency|999|A&E|bleeding/i);
    });
  });

  test.describe('Mobile', () => {
    test.use({ ...devices['iPhone 14'] });

    test('emergency response visible on mobile', async ({ page }) => {
      await page.goto(WIDGET_URL);
      await page.locator('#dw-launcher').tap();
      await page.waitForSelector('.dw-msg-assistant', { timeout: 10000 });

      await page.locator('#dw-input').fill("I can't open my mouth and my face is extremely swollen");
      await page.locator('#dw-send').tap();
      await page.waitForSelector('.dw-typing', { state: 'detached', timeout: 15000 });

      const text = await page.locator('.dw-msg-assistant').last().textContent();
      expect(text).toMatch(/emergency|999|A&E/i);

      await page.screenshot({ path: 'tests/e2e/screenshots/emergency-mobile.png' });
    });
  });
});
