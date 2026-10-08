/**
 * tests/e2e/abandoned-chat.spec.ts
 * Abandoned chat — widget closed mid-flow, session state handled.
 */
import { test, expect } from '@playwright/test';

const WIDGET_URL = process.env['E2E_URL'] ?? 'http://localhost:3000';

test.describe('Abandoned chat scenarios', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('close button closes widget without error', async ({ page }) => {
    await page.goto(WIDGET_URL);
    await page.locator('#dw-launcher').click();
    await expect(page.locator('#dw-container')).toHaveClass(/open/);

    // Close mid-greeting
    await page.locator('#dw-close').click();
    await expect(page.locator('#dw-container')).not.toHaveClass(/open/);

    // Launcher should still be focusable
    await expect(page.locator('#dw-launcher')).toBeFocused();
  });

  test('Escape key closes the widget', async ({ page }) => {
    await page.goto(WIDGET_URL);
    await page.locator('#dw-launcher').click();
    await expect(page.locator('#dw-container')).toHaveClass(/open/);

    await page.keyboard.press('Escape');
    await expect(page.locator('#dw-container')).not.toHaveClass(/open/);
  });

  test('re-opening widget after abandonment resumes with history', async ({ page }) => {
    await page.goto(WIDGET_URL);
    await page.locator('#dw-launcher').click();
    await page.waitForSelector('.dw-msg-assistant', { timeout: 10000 });

    // Select treatment then close
    await page.locator('.dw-qr-btn', { hasText: 'Invisalign' }).click();
    await page.waitForSelector('.dw-typing', { state: 'detached', timeout: 15000 });
    await page.locator('#dw-close').click();

    // Re-open
    await page.locator('#dw-launcher').click();
    await expect(page.locator('#dw-container')).toHaveClass(/open/);

    // Previous messages should still be visible (in-memory session)
    const messages = page.locator('.dw-msg');
    const count    = await messages.count();
    expect(count).toBeGreaterThan(1); // At least greeting + treatment step
  });

  test('widget is keyboard navigable (Tab through elements)', async ({ page }) => {
    await page.goto(WIDGET_URL);
    await page.locator('#dw-launcher').click();
    await expect(page.locator('#dw-container')).toHaveClass(/open/);

    // Tab to close button
    await page.keyboard.press('Tab');
    const focused = await page.evaluate(() => document.activeElement?.id);
    expect(['dw-close', 'dw-input', 'dw-send']).toContain(focused);
  });

  test('widget has correct ARIA attributes', async ({ page }) => {
    await page.goto(WIDGET_URL);

    const container = page.locator('#dw-container');
    await expect(container).toHaveAttribute('role', 'dialog');
    await expect(container).toHaveAttribute('aria-modal', 'true');

    const messages = page.locator('#dw-messages');
    await expect(messages).toHaveAttribute('role', 'log');
    await expect(messages).toHaveAttribute('aria-live', 'polite');
  });

  test('screenshot: abandoned mid-flow', async ({ page }) => {
    await page.goto(WIDGET_URL);
    await page.locator('#dw-launcher').click();
    await page.waitForSelector('.dw-msg-assistant', { timeout: 10000 });
    await page.locator('.dw-qr-btn', { hasText: 'Implants' }).click();
    await page.waitForSelector('.dw-typing', { state: 'detached', timeout: 15000 });

    // Screenshot mid-flow before abandonment
    await page.screenshot({ path: 'tests/e2e/screenshots/abandoned-mid-flow.png' });

    await page.locator('#dw-close').click();
    await page.screenshot({ path: 'tests/e2e/screenshots/abandoned-closed.png' });
  });
});
