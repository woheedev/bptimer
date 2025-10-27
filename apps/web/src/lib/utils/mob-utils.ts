import { DEAD_HP_VALUE, LATEST_CHANNELS_DISPLAY_COUNT } from '$lib/constants';
import type { ChannelEntry } from '$lib/types/mobs';
import { isDataStale, toSnakeCase } from '$lib/utils/general-utils';

/**
 * Determines mob status based on HP percentage and data freshness
 *
 * @param hp_percentage - The HP percentage (0-100)
 * @param last_updated - The timestamp string of the last update
 * @returns 'alive' if HP > 0 and data is fresh, 'dead' if HP = 0, 'unknown' if data is stale
 *
 * Note: Dead mobs (HP = 0) stay 'dead' even when data is stale, until the pockerbase cronjob
 * resets them to 100% HP at their respawn time. This prevents dead bosses from showing as
 * 'unknown' before they respawn.
 */
export function getMobStatus(
	hp_percentage: number,
	last_updated: string
): 'alive' | 'dead' | 'unknown' {
	if (hp_percentage === DEAD_HP_VALUE) {
		return 'dead';
	}

	if (isDataStale(last_updated)) {
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
 * Updates the latest channels list with a new channel report.
 * This function maintains the list sorted by HP percentage (lowest first) and then by channel number.
 * It also filters out stale data and keeps only the latest 25 entries.
 */
export function updateLatestChannels(
	latest_channels: ChannelEntry[],
	channel: number,
	hp_percentage: number
): ChannelEntry[] {
	// Early return if no channels exist
	if (!latest_channels || latest_channels.length === 0) {
		return [
			{
				channel,
				hp_percentage: hp_percentage,
				status: hp_percentage === DEAD_HP_VALUE ? 'dead' : 'alive',
				last_updated: new Date().toISOString()
			}
		];
	}

	const status = hp_percentage === DEAD_HP_VALUE ? 'dead' : 'alive';
	const newEntry: ChannelEntry = {
		channel,
		hp_percentage: hp_percentage,
		status,
		last_updated: new Date().toISOString()
	};

	// Remove existing entry for this channel and create new array
	const filtered = latest_channels.filter((c) => c.channel !== channel);

	// Find insertion point (maintain sort: HP asc, then channel asc for ties)
	const insertIndex = filtered.findIndex(
		(ch) =>
			ch.hp_percentage > hp_percentage ||
			(ch.hp_percentage === hp_percentage && ch.channel > channel)
	);

	// Insert at correct position
	const targetIndex = insertIndex === -1 ? filtered.length : insertIndex;
	filtered.splice(targetIndex, 0, newEntry);

	// Keep only the latest channels (or less if we have fewer)
	return filtered.slice(0, LATEST_CHANNELS_DISPLAY_COUNT);
}
