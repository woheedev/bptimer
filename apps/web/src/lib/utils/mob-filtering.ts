/**
 * Filters mobs based on current type and favorites filter
 * @param mob - The mob record to check
 * @param type - Current container type ('boss' or 'magical_creature')
 * @param mobIds - Favorites filter (if defined, only include these mob IDs)
 * @returns true if mob should be included, false otherwise
 */
export function shouldIncludeMob(
	mob: { id: string; type: string },
	type: 'boss' | 'magical_creature',
	mobIds?: string[]
): boolean {
	// Check if mob matches current type filter
	if (type === 'boss' && mob.type !== 'boss') return false;
	if (type === 'magical_creature' && mob.type !== 'magical_creature') return false;

	// Check if mob is in favorites filter (if applicable)
	if (mobIds !== undefined && !mobIds.includes(mob.id)) return false;

	return true;
}

/**
 * Loads mobs data based on type and favorites filter
 * @param type - Mob type to load
 * @param mobIds - Optional favorites filter
 * @returns Promise resolving to mob data with channel lookup
 */
export async function loadMobsData(type: 'boss' | 'magical_creature', mobIds?: string[]) {
	try {
		let response;
		if (mobIds !== undefined) {
			const { getMobsByIds } = await import('$lib/db/get-mobs');
			response = await getMobsByIds(mobIds);
		} else if (type === 'boss') {
			const { getBosses } = await import('$lib/db/get-mobs');
			response = await getBosses();
		} else {
			const { getMagicalCreatures } = await import('$lib/db/get-mobs');
			response = await getMagicalCreatures();
		}

		if ('data' in response) {
			return { data: response.data };
		} else {
			console.error(`Failed to fetch ${type}s:`, response.error);
			return { data: [] };
		}
	} catch (error) {
		console.error(`Error fetching ${type}s:`, error);
		return { data: [] };
	}
}
