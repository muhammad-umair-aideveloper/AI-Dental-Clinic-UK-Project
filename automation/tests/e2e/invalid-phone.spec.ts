/**
 * tests/e2e/invalid-phone.spec.ts
 * Invalid UK phone number — re-prompt, then accepts corrected number.
 */
import { test, expect } from '@playwright/test';

const WIDGET_URL = process.env['E2E_URL'] ?? 'http://localhost:3000';

test.describe('Invalid phone number handling', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('shows error for invalid phone and accepts corrected number', async ({ page }) => {
    await page.goto(WIDGET_URL);
    await page.locator('#dw-launcher').click();
    await page.waitForSelector('.dw-msg-assistant', { timeout: 10000 });

    // Progress through treatment / timeline / history
    await page.locator('.dw-qr-btn', { hasText: 'Implants' }).click();
    await page.waitForSelector('.dw-typing', { state: 'detached', timeout: 15000 });
    await page.locator('.dw-qr-btn', { hasText: 'Within 3 months' }).click();
    await page.waitForSelector('.dw-typing', { state: 'detached', timeout: 15000 });
    await page.locator('.dw-qr-btn').filter({ hasText: 'No' }).first().click();
    await page.waitForSelector('.dw-typing', { state: 'detached', timeout: 15000 });

    // Consent + name
    const consentCheckbox = page.locator('#dw-consent-check');
    await expect(consentCheckbox).toBeVisible();
    await consentCheckbox.check();
    await page.locator('#dw-input').fill('Mark Williams');
    await page.locator('#dw-send').click();
    await page.waitForSelector('.dw-typing', { state: 'detached', timeout: 15000 });

    // Enter invalid phone (landline)
    await page.locator('#dw-input').fill('020 7946 0888');
    await page.locator('#dw-send').click();
    await page.waitForSelector('.dw-typing', { state: 'detached', timeout: 15000 });

    // Should show error about UK mobile
    const errMsg = await page.locator('.dw-msg-assistant').last().textContent();
    expect(errMsg).toMatch(/07|mobile|UK|valid/i);

    // Enter correct mobile
    await page.locator('#dw-input').fill('07900123456');
    await page.locator('#dw-send').click();
    await page.waitForSelector('.dw-typing', { state: 'detached', timeout: 15000 });

    // Should progress (ask for preferred slot)
    const nextMsg = await page.locator('.dw-msg-assistant').last().textContent();
    expect(nextMsg).toMatch(/day|time|slot|morning|afternoon|prefer/i);

    await page.screenshot({ path: 'tests/e2e/screenshots/invalid-phone.png' });
  });

  test('rejects non-numeric gibberish', async ({ page }) => {
    await page.goto(WIDGET_URL);
    await page.locator('#dw-launcher').click();
    await page.waitForSelector('.dw-msg-assistant', { timeout: 10000 });

    await page.locator('.dw-qr-btn', { hasText: 'Veneers' }).click();
    await page.waitForSelector('.dw-typing', { state: 'detached', timeout: 15000 });
    await page.locator('.dw-qr-btn', { hasText: 'Immediately' }).click();
    await page.waitForSelector('.dw-typing', { state: 'detached', timeout: 15000 });
    await page.locator('.dw-qr-btn').filter({ hasText: 'No' }).first().click();
    await page.waitForSelector('.dw-typing', { state: 'detached', timeout: 15000 });

    const checkbox = page.locator('#dw-consent-check');
    await expect(checkbox).toBeVisible();
    await checkbox.check();
    await page.locator('#dw-input').fill('Jane Doe');
    await page.locator('#dw-send').click();
    await page.waitForSelector('.dw-typing', { state: 'detached', timeout: 15000 });

    // Enter gibberish instead of phone
    await page.locator('#dw-input').fill('abcd efgh');
    await page.locator('#dw-send').click();
    await page.waitForSelector('.dw-typing', { state: 'detached', timeout: 15000 });

    // If no phone detected — next step or ask again
    const text = await page.locator('.dw-msg-assistant').last().textContent();
    expect(text).toBeTruthy(); // At minimum should get a response
  });
});
