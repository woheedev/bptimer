import { browser } from '$app/environment';
import { DEFAULT_FILTER_SORT_SETTINGS, FILTER_SORT_SETTINGS_STORAGE_KEY } from '$lib/constants';
import type { FilterSortSettings } from '$lib/schemas';
import { filterSortSettingsSchema } from '$lib/schemas';
import type {
	HideStaleChannels,
	HpRange,
	ShowTimestamp,
	SortDirection,
	SortField
} from '$lib/types/ui';

function loadFromLocalStorage(): FilterSortSettings {
	if (!browser) return DEFAULT_FILTER_SORT_SETTINGS;
	try {
		const stored = localStorage.getItem(FILTER_SORT_SETTINGS_STORAGE_KEY);
		if (stored) {
			const rawSettings = JSON.parse(stored);
			const mergedSettings = {
				...DEFAULT_FILTER_SORT_SETTINGS,
				...rawSettings
			};
			const parsed = filterSortSettingsSchema.safeParse(mergedSettings);
			if (parsed.success) {
				return parsed.data;
			}
		}
	} catch (error) {
		console.error('Failed to load filter sort settings from localStorage:', error);
	}
	return DEFAULT_FILTER_SORT_SETTINGS;
}

function saveToLocalStorage(settings: FilterSortSettings) {
	if (!browser) return;
	try {
		localStorage.setItem(FILTER_SORT_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
	} catch (error) {
		console.error('Failed to save filter sort settings to localStorage:', error);
	}
}

function createFilterSortSettingsStore() {
	let settings = $state<FilterSortSettings>(loadFromLocalStorage());

	function updateSettings(newSettings: Partial<FilterSortSettings>) {
		settings = { ...settings, ...newSettings };
		saveToLocalStorage(settings);
	}

	function resetToDefaults() {
		settings = { ...DEFAULT_FILTER_SORT_SETTINGS };
		saveToLocalStorage(settings);
	}

	return {
		get sortField() {
			return settings.sortField;
		},
		set sortField(value: SortField) {
			settings = { ...settings, sortField: value };
			saveToLocalStorage(settings);
		},
		get sortDirection() {
			return settings.sortDirection;
		},
		set sortDirection(value: SortDirection) {
			settings = { ...settings, sortDirection: value };
			saveToLocalStorage(settings);
		},
		get hpRange() {
			return settings.hpRange;
		},
		set hpRange(value: HpRange) {
			settings = { ...settings, hpRange: value };
			saveToLocalStorage(settings);
		},
		get hideStaleChannels() {
			return settings.hideStaleChannels;
		},
		set hideStaleChannels(value: HideStaleChannels) {
			settings = { ...settings, hideStaleChannels: value };
			saveToLocalStorage(settings);
		},
		get showTimestamp() {
			return settings.showTimestamp;
		},
		set showTimestamp(value: ShowTimestamp) {
			settings = { ...settings, showTimestamp: value };
			saveToLocalStorage(settings);
		},
		updateSettings,
		resetToDefaults
	};
}

export const filterSortSettingsStore = createFilterSortSettingsStore();
