import { expect, test } from '@playwright/test';

test('load homepage', async ({ page }) => {
	await page.goto('/');
	await expect(page).toHaveTitle('Blue Protocol Timer');
});
