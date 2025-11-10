import { browser } from '$app/environment';
import { FAVORITE_MOBS_STORAGE_KEY } from '$lib/constants';
import { SvelteSet } from 'svelte/reactivity';

function loadFromLocalStorage(): string[] {
	if (!browser) return [];
	try {
		const stored = localStorage.getItem(FAVORITE_MOBS_STORAGE_KEY);
		if (stored) {
			return JSON.parse(stored);
		}
	} catch (error) {
		console.error('Failed to load favorites from localStorage:', error);
	}
	return [];
}

function saveToLocalStorage(favorites: SvelteSet<string>) {
	if (!browser) return;
	try {
		localStorage.setItem(FAVORITE_MOBS_STORAGE_KEY, JSON.stringify(Array.from(favorites)));
	} catch (error) {
		console.error('Failed to save favorites to localStorage:', error);
	}
}

function createFavoriteMobsStore() {
	const favorites = new SvelteSet<string>(loadFromLocalStorage());

	function toggleFavoriteMob(mobId: string) {
		if (favorites.has(mobId)) {
			favorites.delete(mobId);
		} else {
			favorites.add(mobId);
		}
		saveToLocalStorage(favorites);
	}

	function isFavorited(mobId: string): boolean {
		return favorites.has(mobId);
	}

	return {
		get favoriteMobs() {
			return favorites;
		},
		toggleFavoriteMob,
		isFavorited
	};
}

export const favoriteMobsStore = createFavoriteMobsStore();
