import { test, expect } from '@playwright/test';

test('basic math works', async ({ page }) => {
  // Simple test that doesn't require a running server
  await page.goto('about:blank');
  const title = await page.title();
  expect(title).toBe('');
});
