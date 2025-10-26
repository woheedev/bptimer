import adapter from '@sveltejs/adapter-cloudflare';
import type { Config } from '@sveltejs/kit';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const config: Config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter(),
		prerender: {
			handleHttpError: ({ path, message }) => {
				// Ignore Chrome DevTools request
				if (path === '/.well-known/appspecific/com.chrome.devtools.json') {
					return;
				}
				throw new Error(message);
			}
		}
	}
};

export default config;
