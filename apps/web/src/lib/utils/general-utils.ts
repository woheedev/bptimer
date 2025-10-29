import {
	DAY,
	HOUR,
	HP_HIGH_THRESHOLD,
	JUST_NOW_THRESHOLD,
	MAGICAL_CREATURE_RESET_HOURS,
	MAX_HP_VALUE,
	MINUTE,
	SECOND,
	STALE_DATA_TIMEOUT,
	STALE_DATA_TIMEOUT_FULL_HP,
	STALE_DATA_TIMEOUT_HIGH_HP
} from '$lib/constants';

/**
 * Gets initials from any name string
 * Can be used for user avatars, mob avatars, or any other display purpose
 * Example: "Golden Juggernaut" -> "GJ", "Wohee Dev" -> "WD"
 *
 * @param name - The name to extract initials from
 * @returns The initials in uppercase, or empty string if name is falsy
 */
export function getInitials(name?: string): string {
	if (!name) return '';

	return name
		.split(' ')
		.map((word) => word[0])
		.join('')
		.toUpperCase();
}

/**
 * Formats a date string to a human-readable "time ago" format
 * Example: formatTimeAgo("2023-10-25T10:00:00Z") -> "2h ago" (if current time is 12:00)
 *
 * @param dateString - The date string to format
 * @param now - Optional current time for reactive updates
 * @returns Human-readable time ago string
 */
export function formatTimeAgo(dateString: string, now?: Date): string {
	const date = new Date(dateString);
	const currentNow = now || new Date();
	const diffMs = currentNow.getTime() - date.getTime();
	const diffSeconds = Math.floor(diffMs / SECOND);
	const diffMins = Math.floor(diffMs / MINUTE);
	const diffHours = Math.floor(diffMs / HOUR);
	const diffDays = Math.floor(diffMs / DAY);

	if (diffSeconds < JUST_NOW_THRESHOLD) return 'Just now';
	if (diffSeconds < 60) return `${diffSeconds}s ago`;
	if (diffMins < 60) return `${diffMins}m ago`;
	if (diffHours < 24) return `${diffHours}h ago`;
	return `${diffDays}d ago`;
}

/**
 * Determines if data is stale based on HP percentage
 * - Dead mobs (0% HP) are never considered stale
 * - 100% HP: 10 minute timeout
 * - 80-99% HP: 7 minute timeout
 * - < 80% HP: 5 minute timeout
 *
 * @param last_updated - The timestamp string to check
 * @param hp_percentage - The HP percentage to determine timeout
 * @returns True if the data is older than the timeout, false otherwise
 */
export function isDataStale(last_updated: string, hp_percentage?: number): boolean {
	// Dead mobs are never considered stale
	if (hp_percentage === 0) {
		return false;
	}

	let timeout = STALE_DATA_TIMEOUT; // Default 5 minutes

	if (hp_percentage !== undefined) {
		if (hp_percentage === MAX_HP_VALUE) {
			// 100%
			timeout = STALE_DATA_TIMEOUT_FULL_HP; // 10 minutes
		} else if (hp_percentage >= HP_HIGH_THRESHOLD) {
			// 80-99%
			timeout = STALE_DATA_TIMEOUT_HIGH_HP; // 7 minutes
		}
		// < 80% uses default 5 minutes
	}

	const timeoutAgo = new Date(Date.now() - timeout);
	const updateTime = new Date(last_updated);
	return updateTime < timeoutAgo;
}

/**
 * Converts a string to snake_case format
 * Useful for filenames, URL slugs, etc.
 * Example: "Golden Juggernaut" -> "golden_juggernaut"
 *
 * @param str - The string to convert
 * @returns The snake_case version of the string
 */
export function toSnakeCase(str: string): string {
	return str
		.toLowerCase()
		.replace(/\s+/g, '_') // Replace spaces with underscores
		.replace(/[^a-z0-9_]/g, ''); // Remove any non-alphanumeric characters except underscores
}

/**
 * Calculates the next respawn time for a mob based on its type and respawn_time
 * @param mob - The mob object
 * @returns Date object for next respawn, or null if no specific respawn schedule is found such as the nappos and gold boarlet
 */
export function getNextRespawnTime(mob: {
	name: string;
	type: string;
	respawn_time?: number;
}): Date | null {
	const now = new Date();
	const currentHour = now.getUTCHours();
	const currentMinute = now.getUTCMinutes();

	if (mob.type === 'boss') {
		// Bosses respawn at :00 or :30 based on respawn_time
		if (mob.respawn_time === undefined) {
			throw new Error(`${mob.name} is missing a respawn_time`);
		}
		const targetMinute = mob.respawn_time;
		const nextRespawn = new Date(now);

		if (currentMinute < targetMinute) {
			// Same hour
			nextRespawn.setUTCMinutes(targetMinute, 0, 0);
		} else {
			// Next hour
			nextRespawn.setUTCHours(currentHour + 1, targetMinute, 0, 0);
		}

		return nextRespawn;
	} else if (mob.type === 'magical_creature') {
		// Magical creatures have specific reset hours
		const hours =
			MAGICAL_CREATURE_RESET_HOURS[mob.name as keyof typeof MAGICAL_CREATURE_RESET_HOURS];
		if (!hours) return null;

		// Find next reset hour
		let nextHour = hours.find((hour) => hour > currentHour);
		if (!nextHour) {
			// Wrap to next day
			nextHour = hours[0];
		}

		const nextRespawn = new Date(now);
		if (nextHour > currentHour) {
			// Same day
			nextRespawn.setUTCHours(nextHour, 0, 0, 0);
		} else {
			// Next day
			nextRespawn.setUTCDate(nextRespawn.getUTCDate() + 1);
			nextRespawn.setUTCHours(nextHour, 0, 0, 0);
		}

		return nextRespawn;
	}

	return null;
}

/**
 * Gets the respawn cycle length in milliseconds for a mob
 * @param type - The mob type
 * @param mobName - The mob name (needed for magical creatures)
 * @returns Cycle length in milliseconds
 */
function getRespawnCycleLength(type: 'boss' | 'magical_creature', mobName?: string): number {
	if (type === 'boss') {
		return HOUR;
	}

	// For magical creatures, calculate the actual cycle length
	const hours = MAGICAL_CREATURE_RESET_HOURS[mobName as keyof typeof MAGICAL_CREATURE_RESET_HOURS];
	if (!hours) return 0;

	const currentHour = new Date().getUTCHours();
	const nextHourIndex = hours.findIndex((hour) => hour > currentHour);
	const nextHour = nextHourIndex >= 0 ? hours[nextHourIndex] : hours[0];

	let prevHour: number;
	let isNextDay = false;

	if (nextHourIndex > 0) {
		prevHour = hours[nextHourIndex - 1];
	} else {
		prevHour = hours[hours.length - 1];
		isNextDay = true;
	}

	const cycleHours = isNextDay ? 24 - prevHour + nextHour : nextHour - prevHour;
	return cycleHours * HOUR;
}

/**
 * Calculates the progress percentage for a countdown timer
 * @param nextRespawnTime - The next respawn time
 * @param type - The mob type
 * @param mobName - The mob name (needed for magical creatures)
 * @returns Progress percentage (0-100, 100 = just respawned, 0 = about to respawn)
 */
export function calculateRespawnProgress(
	nextRespawnTime: Date,
	type: 'boss' | 'magical_creature',
	mobName?: string
): number {
	const now = Date.now();
	const timeLeft = nextRespawnTime.getTime() - now;

	if (timeLeft <= 0) return 0;

	const totalTime = getRespawnCycleLength(type, mobName);
	if (totalTime === 0) return 0;

	return Math.max(0, Math.min(100, (timeLeft / totalTime) * 100));
}

/**
 * Sorts channels for mob card display
 * Priority: alive > dead, then by HP (low to high), then by channel number, dead by most recent
 *
 * @param channels - Array of channels to sort
 * @returns Sorted array (does not mutate original)
 */
export function sortChannelsForMobCard<
	T extends {
		channel: number;
		hp_percentage: number;
		status: 'alive' | 'dead' | 'unknown';
		last_updated: string;
	}
>(channels: T[]): T[] {
	return [...channels].sort((a, b) => {
		const aIsDead = a.hp_percentage === 0;
		const bIsDead = b.hp_percentage === 0;

		// Prioritize alive over dead
		if (!aIsDead && bIsDead) return -1;
		if (aIsDead && !bIsDead) return 1;

		// For alive channels: sort by HP ascending, then by channel number
		if (!aIsDead && !bIsDead) {
			const hp_diff = a.hp_percentage - b.hp_percentage;
			if (hp_diff !== 0) return hp_diff;
			return a.channel - b.channel;
		}

		// For dead channels: sort by most recent first
		return new Date(b.last_updated).getTime() - new Date(a.last_updated).getTime();
	});
}
