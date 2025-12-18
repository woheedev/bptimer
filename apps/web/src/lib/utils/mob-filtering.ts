import type { ChannelEntry } from '$lib/types/mobs';
import type { HideStaleChannels, HpRange, SortDirection, SortField } from '$lib/types/ui';

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
 * Filters and sorts channels based on user preferences
 * @param channels - Array of channel objects to filter and sort
 * @param sortField - Field to sort by ('channel' or 'hp')
 * @param sortDirection - Sort direction ('ascending' or 'descending')
 * @param hpRange - HP percentage range [min, max] to filter by
 * @param hideStaleChannels - Whether to hide unknown/stale channels
 * @returns Filtered and sorted array of channels
 */
export function filterAndSortChannels<T extends ChannelEntry>(
	channels: T[],
	sortField: SortField = 'channel',
	sortDirection: SortDirection = 'ascending',
	hpRange: HpRange = [0, 100],
	hideStaleChannels: HideStaleChannels = false
): T[] {
	// Filter out stale/unknown channels
	let filtered = channels;
	if (hideStaleChannels) {
		filtered = channels.filter((channel) => channel.status !== 'unknown');
	}

	// Filter by HP range
	filtered = filtered.filter((channel) => {
		// Unknown channels are not affected by HP range filter
		if (channel.status === 'unknown') {
			return true;
		}
		return channel.hp_percentage >= hpRange[0] && channel.hp_percentage <= hpRange[1];
	});

	// Sort by the specified field and direction
	return [...filtered].sort((a, b) => {
		let comparison = 0;

		if (sortField === 'channel') {
			comparison = a.channel - b.channel;
		} else if (sortField === 'hp') {
			// For HP sorting, treat unknown channels as having HP slightly above 0 but below alive
			const aHp = a.status === 'unknown' ? 0.0001 : a.hp_percentage;
			const bHp = b.status === 'unknown' ? 0.0001 : b.hp_percentage;
			comparison = aHp - bHp;
		} else if (sortField === 'report_time') {
			// Sort by last_updated time
			const aTime = a.last_updated ? new Date(a.last_updated).getTime() : 0;
			const bTime = b.last_updated ? new Date(b.last_updated).getTime() : 0;
			comparison = aTime - bTime;
		}

		return sortDirection === 'ascending' ? comparison : -comparison;
	});
}

/**
 * Loads mobs data based on type and favorites filter
 * @param type - Mob type to load
 * @param mobIds - Optional favorites filter
 * @returns Promise resolving to mob data with channel lookup
 */
export async function loadMobsData(
	type: 'boss' | 'magical_creature',
	region: string,
	mobIds?: string[]
) {
	try {
		let response;
		if (mobIds !== undefined) {
			const { getMobsByIds } = await import('$lib/db/get-mobs');
			response = await getMobsByIds(mobIds, region);
		} else if (type === 'boss') {
			const { getBosses } = await import('$lib/db/get-mobs');
			response = await getBosses(region);
		} else {
			const { getMagicalCreatures } = await import('$lib/db/get-mobs');
			response = await getMagicalCreatures(region);
		}

		if ('data' in response) {
			return { data: response.data };
		} else {
			console.error(`Failed to fetch ${type}:`, response.error);
			return { data: [] };
		}
	} catch (error) {
		console.error(`Error fetching ${type}:`, error);
		return { data: [] };
	}
}
