import { browser } from '$app/environment';
import { DEFAULT_REGION, REGION_STORAGE_KEY, REGIONS } from '$lib/constants';

function loadFromLocalStorage(): string {
	if (!browser) return DEFAULT_REGION;
	try {
		const stored = localStorage.getItem(REGION_STORAGE_KEY);
		if (stored) {
			// Validate that the stored value is a valid region
			const isValid = REGIONS.some((r) => r.value === stored);
			if (isValid) {
				return stored;
			}
		}
	} catch (error) {
		console.error('Failed to load region settings from localStorage:', error);
	}
	return DEFAULT_REGION;
}

function saveToLocalStorage(region: string) {
	if (!browser) return;
	try {
		localStorage.setItem(REGION_STORAGE_KEY, region);
	} catch (error) {
		console.error('Failed to save region settings to localStorage:', error);
	}
}

function createRegionStore() {
	let region = $state<string>(loadFromLocalStorage());

	function setRegion(newRegion: string) {
		region = newRegion;
		saveToLocalStorage(region);
	}

	function resetToDefault() {
		region = DEFAULT_REGION;
		saveToLocalStorage(region);
	}

	return {
		get value() {
			return region;
		},
		set value(newRegion: string) {
			setRegion(newRegion);
		},
		setRegion,
		resetToDefault
	};
}

export const regionStore = createRegionStore();
