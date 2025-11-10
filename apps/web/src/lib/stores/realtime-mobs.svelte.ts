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
import { getMobStatus } from '$lib/utils/mob-utils';
import {
	clearChannelNotification,
	clearMobNotifications,
	showMobNotification
} from '$lib/utils/notifications';

type MobUpdateCallback = (events: RealtimeEventData[]) => void;
type RealtimeEventData = {
	record: Record<string, unknown>;
	type: 'hp_update' | 'reset';
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
			// Subscribe to HP updates topic
			// Format: [[mobId, channel, hp, locationImage], ...] (batched)
			pbRealtime.realtime.subscribe('mob_hp_updates', (e) => {
				const batch = typeof e === 'string' ? JSON.parse(e) : e;

				// Process each update in the batch
				for (const data of batch) {
					const [mobId, channel, hp, locationImage] = data;

					const record: Record<string, unknown> = {
						mob: mobId,
						channel_number: channel,
						last_hp: hp,
						last_update: new Date().toISOString()
					};

					if (locationImage) {
						record.location_image = locationImage;
					}

					debouncedCallback({
						record,
						type: 'hp_update'
					});
				}
			});

			// Subscribe to reset events topic
			// Format: array of mobIds
			pbRealtime.realtime.subscribe('mob_resets', (e) => {
				const mobIds = typeof e === 'string' ? JSON.parse(e) : e;

				for (const mobId of mobIds) {
					debouncedCallback({
						record: { mob: mobId },
						type: 'reset'
					});
				}
			});

			isConnected = true;
			connectionAttempts = 0;

			return () => {
				if (debounceTimer) {
					clearTimeout(debounceTimer);
					debounceTimer = null;
				}
				eventQueue = []; // Clear any pending events
				pbRealtime.realtime.unsubscribe('mob_hp_updates');
				pbRealtime.realtime.unsubscribe('mob_resets');
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
		eventData: RealtimeEventData
	): MobWithChannels[] {
		const { record, type } = eventData;

		if (type === 'hp_update') {
			return handleChannelStatusUpdate(mobs, record);
		} else if (type === 'reset') {
			return handleResetEvent(mobs, record);
		}

		return mobs;
	}

	function handleChannelStatusUpdate(
		mobs: MobWithChannels[],
		record: Record<string, unknown>
	): MobWithChannels[] {
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

		const recordLastHp = record.last_hp as number;
		const recordLastUpdate = record.last_update as string;
		const recordLocationImage = record.location_image as number | undefined;
		const lastUpdated = recordLastUpdate || new Date().toISOString();
		const newStatus = getMobStatus(recordLastHp, lastUpdated, mob.name);
		const statusData: ChannelEntry = {
			channel: channelNumber,
			status: newStatus,
			hp_percentage: recordLastHp,
			last_updated: lastUpdated
		};

		if (recordLocationImage) {
			statusData.location_image = recordLocationImage;
		}

		// Check for dead/stale → alive transition to trigger notification
		const oldChannel = channelIndex !== -1 ? mob.latestChannels?.[channelIndex] : null;
		const wasDeadOrStale =
			!oldChannel || oldChannel.status === 'dead' || oldChannel.status === 'unknown';
		const isNowAlive = newStatus === 'alive';

		if (wasDeadOrStale && isNowAlive) {
			showMobNotification(
				mob.id,
				mob.name,
				mob.type,
				channelNumber,
				recordLastHp,
				recordLocationImage,
				false // not a reset event
			);
		} else if (newStatus === 'dead') {
			clearChannelNotification(mob.id, channelNumber);
		}

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
			(channel) => !isDataStale(channel.last_updated, channel.hp_percentage, mob.name)
		);
		updatedChannels = sortChannelsForMobCard(filtered).slice(0, LATEST_CHANNELS_DISPLAY_COUNT);

		const updatedMob = { ...mob, latestChannels: updatedChannels };
		const updatedMobs = [...mobs];
		updatedMobs[mobIndex] = updatedMob;
		return updatedMobs;
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
		record: Record<string, unknown>
	): MobWithChannels[] {
		const mobId = record.mob as string;
		const mobIndex = mobs.findIndex((m) => m.id === mobId);
		if (mobIndex === -1) return mobs;

		const mob = mobs[mobIndex];

		clearMobNotifications(mobId);

		const resetMob = autoResetMob(mob);
		const updatedMobs = [...mobs];
		updatedMobs[mobIndex] = resetMob;
		return updatedMobs;
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
				(channel) => !isDataStale(channel.last_updated, channel.hp_percentage, mob.name)
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
