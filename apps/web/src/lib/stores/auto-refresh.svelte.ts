import { browser } from '$app/environment';
import { AUTO_REFRESH_STORAGE_KEY } from '$lib/constants';

/**
 * Auto-refresh enabled state for mob cards
 * Persists to localStorage
 */
function createAutoRefreshStore() {
	let enabled = $state(false);

	if (browser) {
		const stored = localStorage.getItem(AUTO_REFRESH_STORAGE_KEY);
		enabled = stored === 'true';
	}

	function setEnabled(value: boolean) {
		enabled = value;
		if (browser) {
			localStorage.setItem(AUTO_REFRESH_STORAGE_KEY, enabled.toString());
		}
	}

	return {
		get enabled() {
			return enabled;
		},
		setEnabled
	};
}

export const autoRefreshStore = createAutoRefreshStore();
