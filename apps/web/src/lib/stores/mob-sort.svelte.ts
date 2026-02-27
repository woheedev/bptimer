import { browser } from '$app/environment';
import { MOB_SORT_STORAGE_KEY } from '$lib/constants';
import type { MobSortDirection, MobSortField } from '$lib/types/ui';

interface MobSortState {
	field: MobSortField;
	direction: MobSortDirection;
}

const DEFAULTS: MobSortState = { field: 'level', direction: 'asc' };

function loadFromLocalStorage(): MobSortState {
	if (!browser) return DEFAULTS;
	try {
		const stored = localStorage.getItem(MOB_SORT_STORAGE_KEY);
		if (stored) {
			const parsed = JSON.parse(stored);
			if (['level', 'name'].includes(parsed.field) && ['asc', 'desc'].includes(parsed.direction)) {
				return parsed;
			}
		}
	} catch (error) {
		console.error('Failed to load mob sort settings from localStorage:', error);
	}
	return DEFAULTS;
}

function saveToLocalStorage(state: MobSortState) {
	if (!browser) return;
	try {
		localStorage.setItem(MOB_SORT_STORAGE_KEY, JSON.stringify(state));
	} catch (error) {
		console.error('Failed to save mob sort settings to localStorage:', error);
	}
}

function createMobSortStore() {
	const initial = loadFromLocalStorage();
	let field = $state<MobSortField>(initial.field);
	let direction = $state<MobSortDirection>(initial.direction);

	function persist() {
		saveToLocalStorage({ field, direction });
	}

	return {
		get field() {
			return field;
		},
		set field(v: MobSortField) {
			field = v;
			persist();
		},
		get direction() {
			return direction;
		},
		set direction(v: MobSortDirection) {
			direction = v;
			persist();
		},
		toggleDirection() {
			direction = direction === 'asc' ? 'desc' : 'asc';
			persist();
		}
	};
}

export const mobSortStore = createMobSortStore();
