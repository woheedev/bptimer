import { browser } from '$app/environment';
import {
	LATEST_CHANNELS_DISPLAY_COUNT,
	MAX_REALTIME_RETRIES,
	REALTIME_DEBOUNCE_DELAY,
	REALTIME_RETRY_BASE_DELAY
} from '$lib/constants';
import { pbRealtime } from '$lib/pocketbase';
import type { ChannelEntry, MobWithChannels } from '$lib/types/mobs';
import { isDataStale, sortChannelsForMobCard } from '$lib/utils/general-utils';
import { shouldIncludeMob } from '$lib/utils/mob-filtering';

type MobUpdateCallback = (events: RealtimeEventData[]) => void;
type RealtimeEventData = {
	action: string;
	record: Record<string, unknown>;
	collection: string;
};

function createRealtimeMobsStore() {
	let isConnected = $state(false);
	let connectionAttempts = 0;
	let debounceTimer: ReturnType<typeof setTimeout> | null = null;
	let eventQueue: RealtimeEventData[] = []; // Queue to store events during debounce

	function subscribeToMobs(callback: MobUpdateCallback) {
		if (!browser) {
			// No polling fallback - realtime only
			return () => {};
		}

		const debouncedCallback = (eventData: RealtimeEventData) => {
			// Add event to queue instead of dropping it
			eventQueue.push(eventData);

			if (debounceTimer) {
				clearTimeout(debounceTimer);
			}

			debounceTimer = setTimeout(() => {
				// Process ALL queued events in one batch
				const eventsToProcess = [...eventQueue];
				eventQueue = []; // Clear queue

				// Call callback once with all events
				callback(eventsToProcess);

				debounceTimer = null;
			}, REALTIME_DEBOUNCE_DELAY);
		};

		try {
			// Subscribe to mob changes
			pbRealtime.collection('mobs').subscribe('*', (data) => {
				debouncedCallback({
					action: data.action,
					record: data.record,
					collection: 'mobs'
				});
			});

			// Subscribe to channel status changes (always needed for container)
			pbRealtime.collection('mob_channel_status_sse').subscribe('*', (data) => {
				debouncedCallback({
					action: data.action,
					record: data.record,
					collection: 'mob_channel_status_sse'
				});
			});

			// Subscribe to mob reset events
			pbRealtime.collection('mob_reset_events').subscribe('*', (data) => {
				debouncedCallback({
					action: data.action,
					record: data.record,
					collection: 'mob_reset_events'
				});
			});

			isConnected = true;
			connectionAttempts = 0;

			return () => {
				if (debounceTimer) {
					clearTimeout(debounceTimer);
					debounceTimer = null;
				}
				eventQueue = []; // Clear any pending events
				pbRealtime.collection('mobs').unsubscribe();
				pbRealtime.collection('mob_channel_status_sse').unsubscribe();
				pbRealtime.collection('mob_reset_events').unsubscribe();
				isConnected = false;
			};
		} catch (error) {
			console.error('Failed to subscribe to realtime updates:', error);
			isConnected = false;

			// Retry connection with exponential backoff
			if (connectionAttempts < MAX_REALTIME_RETRIES) {
				connectionAttempts++;
				setTimeout(() => {
					subscribeToMobs(callback);
				}, REALTIME_RETRY_BASE_DELAY * connectionAttempts);
			}

			return () => {};
		}
	}

	function handleRealtimeUpdate(
		mobs: MobWithChannels[],
		eventData: RealtimeEventData,
		type: 'boss' | 'magical_creature',
		mobIds?: string[]
	): MobWithChannels[] {
		const { action, record, collection } = eventData;

		if (collection === 'mobs') {
			return handleMobUpdate(mobs, action, record, type, mobIds);
		} else if (collection === 'mob_channel_status_sse') {
			return handleChannelStatusUpdate(mobs, action, record);
		} else if (collection === 'mob_reset_events') {
			return handleResetEvent(mobs, action, record);
		}

		return mobs;
	}

	function handleMobUpdate(
		mobs: MobWithChannels[],
		action: string,
		record: Record<string, unknown>,
		type: 'boss' | 'magical_creature',
		mobIds?: string[]
	): MobWithChannels[] {
		const mobRecord = record as { id: string; type: string };

		if (action === 'create') {
			// Add new mob if it matches current filter
			if (shouldIncludeMob(mobRecord, type, mobIds)) {
				return [...mobs, record as unknown as MobWithChannels];
			}
		} else if (action === 'update') {
			// Update existing mob
			const recordId = record.id as string;
			const index = mobs.findIndex((m) => m.id === recordId);
			if (index !== -1) {
				if (shouldIncludeMob(mobRecord, type, mobIds)) {
					const updatedMobs = [...mobs];
					updatedMobs[index] = { ...updatedMobs[index], ...record } as MobWithChannels;
					return updatedMobs;
				} else {
					// Remove mob if it no longer matches filter
					return mobs.filter((m) => m.id !== recordId);
				}
			} else if (shouldIncludeMob(mobRecord, type, mobIds)) {
				// Add mob if it now matches filter
				return [...mobs, record as unknown as MobWithChannels];
			}
		} else if (action === 'delete') {
			// Remove deleted mob
			const recordId = record.id as string;
			return mobs.filter((m) => m.id !== recordId);
		}

		return mobs;
	}

	function handleChannelStatusUpdate(
		mobs: MobWithChannels[],
		action: string,
		record: Record<string, unknown>
	): MobWithChannels[] {
		// Find the mob this status belongs to
		const recordMob = record.mob as string;
		const mobIndex = mobs.findIndex((m) => m.id === recordMob);
		if (mobIndex === -1) return mobs;

		const mob = mobs[mobIndex];
		const channelNumber = record.channel_number as number;

		if (channelNumber === undefined) {
			return mobs;
		}
		const channelIndex =
			mob.latestChannels?.findIndex((c: ChannelEntry) => c.channel === channelNumber) ?? -1;

		if (action === 'create' || action === 'update') {
			const recordLastHp = record.last_hp as number;
			const recordLastUpdate = record.last_update as string;
			const statusData: ChannelEntry = {
				channel: channelNumber,
				status: recordLastHp > 0 ? 'alive' : 'dead',
				hp_percentage: recordLastHp,
				last_updated: recordLastUpdate || new Date().toISOString()
			};

			let updatedChannels;
			if (channelIndex !== -1) {
				// Update existing channel
				updatedChannels = [...(mob.latestChannels || [])];
				updatedChannels[channelIndex] = statusData;
			} else {
				// Add new channel
				updatedChannels = [...(mob.latestChannels || []), statusData];
			}

			// Filter stale data, sort, and take top channels
			const filtered = updatedChannels.filter(
				(channel) => !isDataStale(channel.last_updated, channel.hp_percentage)
			);
			updatedChannels = sortChannelsForMobCard(filtered).slice(0, LATEST_CHANNELS_DISPLAY_COUNT);

			const updatedMob = { ...mob, latestChannels: updatedChannels };
			const updatedMobs = [...mobs];
			updatedMobs[mobIndex] = updatedMob;
			return updatedMobs;
		} else if (action === 'delete') {
			// Remove channel status
			if (channelIndex !== -1) {
				const updatedChannels = [...(mob.latestChannels || [])];
				updatedChannels.splice(channelIndex, 1);
				const updatedMob = { ...mob, latestChannels: updatedChannels };
				const updatedMobs = [...mobs];
				updatedMobs[mobIndex] = updatedMob;
				return updatedMobs;
			}
		}

		return mobs;
	}

	/**
	 * Auto-resets a mob's channels to 100% HP when triggered by server reset event
	 * Called when client receives SSE event indicating server has reset the mob
	 * @param mob - The mob to reset
	 * @returns Updated mob with all channels set to 100% HP
	 */
	function autoResetMob(mob: MobWithChannels): MobWithChannels {
		const resetTime = new Date().toISOString();

		const resetChannels: ChannelEntry[] = Array.from({ length: mob.total_channels }, (_, i) => ({
			channel: i + 1,
			hp_percentage: 100,
			status: 'alive' as const,
			last_updated: resetTime
		}));

		return {
			...mob,
			latestChannels: resetChannels
		};
	}

	function handleResetEvent(
		mobs: MobWithChannels[],
		action: string,
		record: Record<string, unknown>
	): MobWithChannels[] {
		if (action === 'create' && record.type === 'reset') {
			const mobId = record.mob as string;
			const mobIndex = mobs.findIndex((m) => m.id === mobId);
			if (mobIndex !== -1) {
				const mob = mobs[mobIndex];
				const resetMob = autoResetMob(mob);
				const updatedMobs = [...mobs];
				updatedMobs[mobIndex] = resetMob;
				return updatedMobs;
			}
		}

		return mobs;
	}

	/**
	 * Filters out stale channels from the current mobs array
	 * This should be called periodically to remove channels that have become stale
	 * @param mobs - Current mobs array
	 * @returns Mobs array with stale channels filtered out
	 */
	function filterStaleChannels(mobs: MobWithChannels[]): MobWithChannels[] {
		return mobs.map((mob) => {
			if (!mob.latestChannels || mob.latestChannels.length === 0) {
				return mob;
			}

			const filteredChannels = mob.latestChannels.filter(
				(channel) => !isDataStale(channel.last_updated, channel.hp_percentage)
			);

			// Only update if channels were actually filtered out
			if (filteredChannels.length !== mob.latestChannels.length) {
				return { ...mob, latestChannels: filteredChannels };
			}

			return mob;
		});
	}

	return {
		get isConnected() {
			return isConnected;
		},
		subscribeToMobs,
		handleRealtimeUpdate,
		filterStaleChannels
	};
}

export const realtimeMobsStore = createRealtimeMobsStore();
