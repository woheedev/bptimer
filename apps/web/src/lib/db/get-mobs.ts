import { LATEST_CHANNELS_DISPLAY_COUNT } from '$lib/constants';
import { pb } from '$lib/pocketbase';
import { mobChannelStatusSchema, mobSchema } from '$lib/schemas';
import type { ChannelEntry, MobWithChannels } from '$lib/types/mobs';
import { isDataStale, sortChannelsForMobCard } from '$lib/utils/general-utils';
import { getMobStatus } from '$lib/utils/mob-utils';
import { validateWithSchema } from '$lib/utils/validation';

async function getMobsByType(
	type: string
): Promise<{ data: MobWithChannels[] } | { error: string }> {
	try {
		// Fetch all mobs of the specified type from PocketBase with map expansion
		const records = await pb.collection('mobs').getFullList({
			filter: `type = "${type}"`,
			sort: 'uid',
			expand: 'map'
		});

		// Validate mob records
		for (const record of records) {
			validateWithSchema(mobSchema, record, 'Mob');
		}

		if (records.length === 0) {
			return { data: [] };
		}

		// Fetch all mob_channel_status for all mobs in a single query
		const mob_ids = records.map((m) => m.id);
		const all_channel_statuses = await pb.collection('mob_channel_status').getFullList({
			filter: mob_ids.map((id) => `mob = "${id}"`).join(' || '),
			requestKey: `all-channel-statuses-${type}` // Unique request key
		});

		// Validate channel status records
		for (const status of all_channel_statuses) {
			validateWithSchema(mobChannelStatusSchema, status, 'Channel status');
		}

		// Group channel statuses by mob
		const statuses_by_mob = new Map<string, Map<number, ChannelEntry>>();

		for (const status of all_channel_statuses) {
			const mob_id = status.mob;
			const channel_number = status.channel_number || 0;
			const last_update = status.last_update || status.updated;

			if (!statuses_by_mob.has(mob_id)) {
				statuses_by_mob.set(mob_id, new Map());
			}

			const channel_map = statuses_by_mob.get(mob_id)!;

			// Store the channel status
			channel_map.set(channel_number, {
				channel: channel_number,
				status: getMobStatus(status.last_hp || 0, last_update),
				hp_percentage: status.last_hp || 0,
				last_updated: last_update
			});
		}

		// Process each mob with its pre-fetched channel statuses
		const mobs_with_channels = records.map((mob) => {
			const channel_statuses = statuses_by_mob.get(mob.id);
			const channel_reports: ChannelEntry[] = channel_statuses
				? Array.from(channel_statuses.values())
				: [];

			// Filter stale data, sort, and take top channels
			const filtered_channels = channel_reports.filter(
				(channel) => !isDataStale(channel.last_updated, channel.hp_percentage)
			);
			const sorted_channels = sortChannelsForMobCard(filtered_channels).slice(
				0,
				LATEST_CHANNELS_DISPLAY_COUNT
			);

			return {
				id: mob.id,
				uid: mob.uid,
				name: mob.name,
				type: mob.type,
				total_channels: mob.expand?.map?.total_channels || 0,
				respawn_time: mob.respawn_time,
				latestChannels: sorted_channels
			};
		});

		return { data: mobs_with_channels };
	} catch (error) {
		console.error(`Error fetching ${type}s:`, error);
		return { error: `Failed to fetch ${type}s` };
	}
}

export async function getBosses(): Promise<{ data: MobWithChannels[] } | { error: string }> {
	return getMobsByType('boss');
}

export async function getMagicalCreatures(): Promise<
	{ data: MobWithChannels[] } | { error: string }
> {
	return getMobsByType('magical_creature');
}

export async function getMobsByIds(
	ids: string[]
): Promise<{ data: MobWithChannels[] } | { error: string }> {
	if (ids.length === 0) {
		return { data: [] };
	}
	try {
		// Fetch mobs by ids
		const filter = ids.map((id) => `id = "${id}"`).join(' || ');
		const records = await pb.collection('mobs').getFullList({
			filter,
			sort: 'uid',
			expand: 'map'
		});

		// Validate mob records
		for (const record of records) {
			validateWithSchema(mobSchema, record, 'Mob');
		}

		if (records.length === 0) {
			return { data: [] };
		}

		// Fetch all mob_channel_status for all mobs in a single query
		const mob_ids = records.map((m) => m.id);
		const all_channel_statuses = await pb.collection('mob_channel_status').getFullList({
			filter: mob_ids.map((id) => `mob = "${id}"`).join(' || '),
			requestKey: `all-channel-statuses-by-ids-${ids.join('-')}` // Unique request key
		});

		// Validate channel status records
		for (const status of all_channel_statuses) {
			validateWithSchema(mobChannelStatusSchema, status, 'Channel status');
		}

		// Group channel statuses by mob
		const statuses_by_mob = new Map<string, Map<number, ChannelEntry>>();

		for (const status of all_channel_statuses) {
			const mob_id = status.mob;
			const channel_number = status.channel_number || 0;
			const last_update = status.last_update || status.updated;

			if (!statuses_by_mob.has(mob_id)) {
				statuses_by_mob.set(mob_id, new Map());
			}

			const channel_map = statuses_by_mob.get(mob_id)!;

			// Store the channel status
			channel_map.set(channel_number, {
				channel: channel_number,
				status: getMobStatus(status.last_hp || 0, last_update),
				hp_percentage: status.last_hp || 0,
				last_updated: last_update
			});
		}

		// Process each mob with its pre-fetched channel statuses
		const mobs_with_channels = records.map((mob) => {
			const channel_statuses = statuses_by_mob.get(mob.id);
			const channel_reports: ChannelEntry[] = channel_statuses
				? Array.from(channel_statuses.values())
				: [];

			// Filter stale data, sort, and take top channels
			const filtered_channels = channel_reports.filter(
				(channel) => !isDataStale(channel.last_updated, channel.hp_percentage)
			);
			const sorted_channels = sortChannelsForMobCard(filtered_channels).slice(
				0,
				LATEST_CHANNELS_DISPLAY_COUNT
			);

			return {
				id: mob.id,
				uid: mob.uid,
				name: mob.name,
				type: mob.type,
				total_channels: mob.expand?.map?.total_channels || 0,
				respawn_time: mob.respawn_time,
				latestChannels: sorted_channels
			};
		});

		return { data: mobs_with_channels };
	} catch (error) {
		console.error(`Error fetching mobs by ids:`, error);
		return { error: `Failed to fetch mobs by ids` };
	}
}
