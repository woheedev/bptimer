import {
	DEAD_HP_VALUE,
	LATEST_CHANNELS_DISPLAY_COUNT,
	SPECIAL_MAGICAL_CREATURES
} from '$lib/constants';
import type { ChannelEntry } from '$lib/types/mobs';
import { isDataStale, sortChannelsForMobCard, toSnakeCase } from '$lib/utils/general-utils';

/**
 * Determines mob status based on HP percentage and data freshness
 *
 * @param hp_percentage - The HP percentage (0-100)
 * @param last_updated - The timestamp string of the last update
 * @param mobName - Optional mob name for special handling
 * @returns 'alive' if HP > 0 and data is fresh, 'dead' if HP = 0, 'unknown' if data is stale
 *
 * Note: Dead mobs (HP = 0) stay 'dead' even when data is stale, until the pocketbase cronjob
 * resets them to 100% HP at their respawn time. This prevents dead bosses from showing as
 * 'unknown' before they respawn.
 */
export function getMobStatus(
	hp_percentage: number,
	last_updated: string,
	mobName?: string
): 'alive' | 'dead' | 'unknown' {
	if (hp_percentage === DEAD_HP_VALUE) {
		// Check if dead data is stale for special magical creatures
		if (isDataStale(last_updated, hp_percentage, mobName)) {
			return 'unknown';
		}
		return 'dead';
	}

	if (isDataStale(last_updated, hp_percentage, mobName)) {
		return 'unknown';
	}

	return 'alive';
}

/**
 * Gets the full image path for a mob based on its type and name
 *
 * @param type - The type of mob ('boss' or 'magical_creature')
 * @param mobName - The name of the mob (will be converted to snake_case)
 * @returns The image path, or empty string if invalid
 */
export function getMobImagePath(
	type: 'boss' | 'magical_creature' | string,
	mobName?: string
): string {
	if (!mobName) {
		return '';
	}

	const imageName = toSnakeCase(mobName);
	const folder = type === 'boss' ? 'bosses' : 'magical-creatures';

	return `/images/${folder}/${imageName}.webp`;
}

/**
 * Gets the location count for a magical creature
 *
 * @param mobName - The name of the mob
 * @returns Number of locations for this magical creature otherwise 0
 */
export function getLocationCount(mobName: string): number {
	const locations = SPECIAL_MAGICAL_CREATURES[mobName as keyof typeof SPECIAL_MAGICAL_CREATURES];
	return locations ? Object.keys(locations).length : 0;
}

/**
 * Gets the display name for a location of a magical creature
 *
 * @param mobName - The name of the mob
 * @param locationNumber - The location number (1-based)
 * @returns The display name for the location, or fallback to "Location {number}" if not found
 */
export function getLocationName(mobName: string, locationNumber: number): string {
	const locations = SPECIAL_MAGICAL_CREATURES[mobName as keyof typeof SPECIAL_MAGICAL_CREATURES];
	return locations?.[locationNumber] ?? `Location ${locationNumber}`;
}

/**
 * Gets the location image path for a specific location number
 *
 * @param mobName - The name of the mob
 * @param mobType - The type of mob ('boss' or 'magical_creature')
 * @param locationNumber - The location number (1-based)
 * @returns The image path for the location
 */
export function getLocationImagePath(
	mobName: string,
	mobType: 'boss' | 'magical_creature' | string,
	locationNumber: number
): string {
	const imageName = toSnakeCase(mobName);
	const folder = mobType === 'boss' ? 'bosses' : 'magical-creatures';
	return `/images/${folder}/locations/${imageName}_${locationNumber}.webp`;
}

/**
 * Gets all location image paths for a magical creature
 * Returns array of predetermined location image paths
 *
 * @param mobName - The name of the mob
 * @param mobType - The type of mob ('boss' or 'magical_creature')
 * @returns Array of image paths for location options
 */
export function getLocationImagePaths(
	mobName: string,
	mobType: 'boss' | 'magical_creature' | string
): string[] {
	const locationCount = getLocationCount(mobName);
	if (locationCount === 0) return [];

	const paths: string[] = [];
	for (let i = 1; i <= locationCount; i++) {
		paths.push(getLocationImagePath(mobName, mobType, i));
	}
	return paths;
}

/**
 * Gets the full map image path for a mob based on its type and name
 *
 * @param type - The type of mob ('boss' or 'magical_creature')
 * @param mobName - The name of the mob (will be converted to snake_case)
 * @returns The map image path, or empty string if invalid
 */
export function getMobMapPath(
	type: 'boss' | 'magical_creature' | string,
	mobName?: string
): string {
	if (!mobName) {
		return '';
	}

	const imageName = toSnakeCase(mobName);
	const folder = type === 'boss' ? 'bosses' : 'magical-creatures';

	return `/images/${folder}/maps/${imageName}.webp`;
}

/**
 * Updates the latest channels list with a new channel report.
 * Maintains the same sort order as get-mobs.ts:
 * - Alive channels first: sorted by HP ascending, then most recent first
 * - Dead channels last: sorted by most recent first
 */
export function updateLatestChannels(
	latest_channels: ChannelEntry[],
	channel: number,
	hp_percentage: number
): ChannelEntry[] {
	const status = hp_percentage === DEAD_HP_VALUE ? 'dead' : 'alive';
	const newEntry: ChannelEntry = {
		channel,
		hp_percentage: hp_percentage,
		status,
		last_updated: new Date().toISOString()
	};

	// Remove existing entry for this channel
	const filtered = latest_channels.filter((c) => c.channel !== channel);

	// Add new entry and re-sort to match get-mobs.ts logic
	const updated = [...filtered, newEntry];

	// Sort and take top channels
	return sortChannelsForMobCard(updated).slice(0, LATEST_CHANNELS_DISPLAY_COUNT);
}
