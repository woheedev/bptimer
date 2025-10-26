import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
	testDir: 'tests',
	testMatch: /(.+\.)?(test|spec)\.[jt]s/,
	fullyParallel: true,

	use: {
		baseURL: 'http://localhost:5173',
		trace: 'on-first-retry',
		screenshot: 'only-on-failure',
		video: 'retain-on-failure'
	},

	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] }
		},

		{
			name: 'firefox',
			use: { ...devices['Desktop Firefox'] }
		},

		{
			name: 'webkit',
			use: { ...devices['Desktop Safari'] }
		},

		{
			name: 'Mobile Chrome',
			use: { ...devices['Pixel 5'] }
		},
		{
			name: 'Mobile Safari',
			use: { ...devices['iPhone 12'] }
		}
	],

	webServer: {
		command: 'bun run dev',
		url: 'http://localhost:5173',
		reuseExistingServer: true
	}
});
