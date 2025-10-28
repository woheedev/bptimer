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

	if (isDataStale(last_updated, hp_percentage)) {
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

	updated.sort((a, b) => {
		const aIsDead = a.hp_percentage === 0;
		const bIsDead = b.hp_percentage === 0;

		// Prioritize alive over dead
		if (!aIsDead && bIsDead) return -1;
		if (aIsDead && !bIsDead) return 1;

		// For alive channels: sort by HP ascending, then most recent first
		if (!aIsDead && !bIsDead) {
			const hp_diff = a.hp_percentage - b.hp_percentage;
			if (hp_diff !== 0) return hp_diff;
			return new Date(b.last_updated).getTime() - new Date(a.last_updated).getTime();
		}

		// For dead channels: sort by most recent first
		return new Date(b.last_updated).getTime() - new Date(a.last_updated).getTime();
	});

	return updated.slice(0, LATEST_CHANNELS_DISPLAY_COUNT);
}
