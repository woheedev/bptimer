import { STALE_DATA_TIMEOUT } from '$lib/constants';

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
 * @returns Human-readable time ago string
 */
export function formatTimeAgo(dateString: string): string {
	const date = new Date(dateString);
	const now = new Date();
	const diffMs = now.getTime() - date.getTime();
	const diffMins = Math.floor(diffMs / (1000 * 60));
	const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
	const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

	if (diffMins < 1) return 'Just now';
	if (diffMins < 60) return `${diffMins}m ago`;
	if (diffHours < 24) return `${diffHours}h ago`;
	return `${diffDays}d ago`;
}

/**
 * Determines if data is stale (older than STALE_DATA_TIMEOUT)
 * Can be used for any timestamp-based data freshness check
 *
 * @param last_updated - The timestamp string to check
 * @returns True if the data is older than the timeout, false otherwise
 */
export function isDataStale(last_updated: string): boolean {
	const timeoutAgo = new Date(Date.now() - STALE_DATA_TIMEOUT);
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
