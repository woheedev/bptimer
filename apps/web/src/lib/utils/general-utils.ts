import {
	DAY,
	HOUR,
	HP_HIGH_THRESHOLD,
	JUST_NOW_THRESHOLD,
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
 * - 100% HP: 10 minute timeout
 * - 80-99% HP: 7 minute timeout
 * - < 80% HP: 5 minute timeout
 *
 * @param last_updated - The timestamp string to check
 * @param hp_percentage - The HP percentage to determine timeout
 * @returns True if the data is older than the timeout, false otherwise
 */
export function isDataStale(last_updated: string, hp_percentage?: number): boolean {
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
