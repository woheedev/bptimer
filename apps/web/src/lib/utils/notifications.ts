import { browser } from '$app/environment';
import { SPECIAL_MAGICAL_CREATURES } from '$lib/constants';
import { mobNotificationsStore } from '$lib/stores/mob-notifications.svelte';
import { getLocationImagePath } from '$lib/utils/mob-utils';

// Track which channels have been notified (per session)
// Key format: "mobId:channel"
const notifiedChannels = new Set<string>();

/**
 * Request notification permission from the browser
 */
export async function requestNotificationPermission(): Promise<boolean> {
	if (!browser || !('Notification' in window)) {
		return false;
	}

	if (Notification.permission === 'granted') {
		return true;
	}

	if (Notification.permission === 'denied') {
		return false;
	}

	try {
		const permission = await Notification.requestPermission();
		return permission === 'granted';
	} catch (error) {
		console.error('Error requesting notification permission:', error);
		return false;
	}
}

/**
 * Check if notifications are supported and permitted
 */
export function canShowNotifications(): boolean {
	if (!browser || !('Notification' in window)) {
		return false;
	}
	return Notification.permission === 'granted';
}

/**
 * Show a browser notification for a mob HP update
 * Only triggers once per channel until it dies again
 */
export function showMobNotification(
	mobId: string,
	mobName: string,
	mobType: 'boss' | 'magical_creature' | string,
	channelNumber: number,
	hpPercentage: number,
	locationImage?: number,
	isResetEvent = false
): void {
	// Don't notify on reset events (would spam thousands)
	if (isResetEvent) {
		return;
	}

	if (!mobNotificationsStore.isEnabled(mobId)) {
		return;
	}

	if (!canShowNotifications()) {
		return;
	}

	// Check if we've already notified for this channel
	const channelKey = `${mobId}:${channelNumber}`;
	if (notifiedChannels.has(channelKey)) {
		return;
	}

	// Mark this channel as notified
	notifiedChannels.add(channelKey);

	const title = `${mobName} - Line ${channelNumber} - ${hpPercentage}%`;
	const options: NotificationOptions = {
		tag: `mob-${mobId}-${channelNumber}`, // Replaces existing notification for same channel
		requireInteraction: false,
		badge: '/favicon.ico',
		silent: false
	};

	// For special magical creatures, include location image if available
	const isSpecialCreature = mobName in SPECIAL_MAGICAL_CREATURES;
	if (isSpecialCreature && locationImage) {
		const imagePath = getLocationImagePath(mobName, mobType, locationImage);
		options.icon = imagePath;
		// image: supported in Chrome/Edge, not Safari/Firefox
		(options as Record<string, unknown>).image = imagePath;
	}

	try {
		const notification = new Notification(title, options);

		// Auto-close after 5 seconds
		setTimeout(() => {
			notification.close();
		}, 5000);

		// Handle click to focus window
		notification.onclick = () => {
			window.focus();
			notification.close();
		};
	} catch (error) {
		console.error('Error showing notification:', error);
	}
}

/**
 * Clear notification tracking for a specific channel (when it dies)
 * This allows re-notification when it comes back alive
 */
export function clearChannelNotification(mobId: string, channelNumber: number): void {
	const channelKey = `${mobId}:${channelNumber}`;
	notifiedChannels.delete(channelKey);
}

/**
 * Clear all notifications for a mob (used for reset events)
 */
export function clearMobNotifications(mobId: string): void {
	for (const key of notifiedChannels) {
		if (key.startsWith(`${mobId}:`)) {
			notifiedChannels.delete(key);
		}
	}
}
