import { browser } from '$app/environment';
import { writable } from 'svelte/store';
import { z } from 'zod';

const booleanSchema = z.boolean();

/**
 * Auto-refresh enabled state for mob cards
 * Persists to localStorage
 */
export const autoRefreshEnabled = writable(false);

// Load from localStorage on init
if (browser) {
	const stored = localStorage.getItem('auto-refresh-enabled');
	try {
		const parsedValue = booleanSchema.parse(stored === 'true');
		autoRefreshEnabled.set(parsedValue);
	} catch (error) {
		console.warn('Invalid stored auto-refresh value, defaulting to false:', error);
		autoRefreshEnabled.set(false);
	}
}

// Subscribe to save to localStorage when changed
autoRefreshEnabled.subscribe((value) => {
	if (browser) {
		try {
			// Validate the value before storing
			booleanSchema.parse(value);
			localStorage.setItem('auto-refresh-enabled', value.toString());
		} catch (error) {
			console.warn('Invalid auto-refresh value:', error);
		}
	}
});
