import { browser } from '$app/environment';
import { FAVORITE_MOBS_STORAGE_KEY } from '$lib/constants';

function loadFromLocalStorage(): Set<string> {
	if (!browser) return new Set();
	try {
		const stored = localStorage.getItem(FAVORITE_MOBS_STORAGE_KEY);
		if (stored) {
			const parsed = JSON.parse(stored);
			return new Set(parsed);
		}
	} catch (error) {
		console.error('Failed to load favorites from localStorage:', error);
	}
	return new Set();
}

function saveToLocalStorage(favorites: Set<string>) {
	if (!browser) return;
	try {
		localStorage.setItem(FAVORITE_MOBS_STORAGE_KEY, JSON.stringify(Array.from(favorites)));
	} catch (error) {
		console.error('Failed to save favorites to localStorage:', error);
	}
}

function createFavoriteMobsStore() {
	let favorites = $state<Set<string>>(loadFromLocalStorage());

	function toggleFavoriteMob(mobId: string) {
		if (favorites.has(mobId)) {
			favorites.delete(mobId);
		} else {
			favorites.add(mobId);
		}
		// eslint-disable-next-line svelte/prefer-svelte-reactivity
		favorites = new Set(favorites);
		saveToLocalStorage(favorites);
	}

	return {
		get favoriteMobs() {
			return favorites;
		},
		toggleFavoriteMob
	};
}

export const favoriteMobsStore = createFavoriteMobsStore();
