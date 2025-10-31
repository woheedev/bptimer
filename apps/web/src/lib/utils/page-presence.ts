import { browser } from '$app/environment';
import { PRESENCE_ACTIVE_THRESHOLD, PRESENCE_HEARTBEAT_INTERVAL } from '$lib/constants';
import { pb } from '$lib/pocketbase';
import { presenceSessionIdStore } from '$lib/stores/presence-session-id.svelte';

let heartbeatInterval: ReturnType<typeof setInterval> | null = null;

export async function updatePresence(): Promise<void> {
	if (!browser) return;

	try {
		const user = pb.authStore.record;

		if (user) {
			// Authenticated user: use user ID
			try {
				const existing = await pb
					.collection('page_presence')
					.getFirstListItem(`user = "${user.id}"`, { fields: 'id' });

				await pb.collection('page_presence').update(existing.id, {
					last_seen: new Date().toISOString()
				});
			} catch {
				// Record doesn't exist, create new one
				await pb.collection('page_presence').create({
					user: user.id,
					last_seen: new Date().toISOString()
				});
			}
		} else {
			// Anonymous user: use session ID
			const sessionId = presenceSessionIdStore.sessionId;
			try {
				const existing = await pb
					.collection('page_presence')
					.getFirstListItem(`session_id = "${sessionId}"`, { fields: 'id' });

				await pb.collection('page_presence').update(existing.id, {
					last_seen: new Date().toISOString()
				});
			} catch {
				// Record doesn't exist, create new one
				await pb.collection('page_presence').create({
					session_id: sessionId,
					last_seen: new Date().toISOString()
				});
			}
		}
	} catch (error) {
		// Silently fail - presence is non-critical
		console.debug('Presence update failed:', error);
	}
}

export async function getActiveUsersCount(): Promise<number> {
	if (!browser) return 0;

	try {
		const cutoffTime = new Date(Date.now() - PRESENCE_ACTIVE_THRESHOLD)
			.toISOString()
			.replace('T', ' ')
			.replace(/\.\d{3}Z$/, '');

		const result = await pb.collection('page_presence').getList(1, 1, {
			filter: `last_seen > "${cutoffTime}"`,
			$autoCancel: false
		});

		return result.totalItems;
	} catch (error) {
		console.error('Presence count failed:', error);
		return 0;
	}
}

export function startPresenceTracking(): () => void {
	if (!browser) return () => {};

	// Initial update
	updatePresence();

	// Set up heartbeat
	if (heartbeatInterval) {
		clearInterval(heartbeatInterval);
	}

	heartbeatInterval = setInterval(() => {
		updatePresence();
	}, PRESENCE_HEARTBEAT_INTERVAL);

	// Cleanup on page visibility change
	const handleVisibilityChange = () => {
		if (document.hidden) {
			if (heartbeatInterval) {
				clearInterval(heartbeatInterval);
				heartbeatInterval = null;
			}
		} else {
			if (!heartbeatInterval) {
				updatePresence();
				heartbeatInterval = setInterval(() => {
					updatePresence();
				}, PRESENCE_HEARTBEAT_INTERVAL);
			}
		}
	};

	document.addEventListener('visibilitychange', handleVisibilityChange);

	// Return cleanup function
	return () => {
		if (heartbeatInterval) {
			clearInterval(heartbeatInterval);
			heartbeatInterval = null;
		}
		document.removeEventListener('visibilitychange', handleVisibilityChange);
	};
}
