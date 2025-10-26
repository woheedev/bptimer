import { debounce } from '$lib/utils/debounce.svelte';

export type SearchableMob = {
	id: string;
	name: string;
	[key: string]: unknown;
};

/**
 * Filter mobs by name (case-insensitive)
 * @param mobs - Array of mob objects
 * @param query - Search query string
 * @returns Filtered array of mobs matching the query
 */
export function filterMobsByName<T extends SearchableMob>(mobs: T[], query: string): T[] {
	if (!query || query.trim() === '') {
		return mobs;
	}

	const normalizedQuery = query.toLowerCase().trim();

	return mobs.filter((mob) => mob.name.toLowerCase().includes(normalizedQuery));
}

/**
 * Create a debounced search function
 * @param callback - Callback function to execute after debounce
 * @param delay - Debounce delay in milliseconds (default: 300ms)
 * @returns Object with execute method for triggering the search
 */
export function createDebouncedSearch(
	callback: (query: string) => void,
	delay: number = 300
): { execute: (query: string) => void } {
	return debounce(callback, delay);
}

/**
 * Create a search state with debounced setter
 * Useful for managing search input state with automatic debouncing
 * @param initialQuery - Initial search query (default: '')
 * @param delay - Debounce delay in milliseconds (default: 300ms)
 * @returns Object with query value and setQuery method
 */
export function createSearchState(initialQuery: string = '', delay: number = 300) {
	let query = $state(initialQuery);

	const debouncedSet = debounce((newQuery: string) => {
		query = newQuery;
	}, delay);

	return {
		get query() {
			return query;
		},
		setQuery: debouncedSet.execute
	};
}
