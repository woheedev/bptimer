import { LATEST_CHANNELS_DISPLAY_COUNT } from '$lib/constants';
import { pb } from '$lib/pocketbase';
import { mobChannelStatusSchema, mobSchema } from '$lib/schemas';
import type { ChannelEntry, MobWithChannels } from '$lib/types/mobs';
import { isDataStale, sortChannelsForMobCard } from '$lib/utils/general-utils';
import { getMobStatus } from '$lib/utils/mob-utils';
import { validateWithSchema } from '$lib/utils/validation';

async function getMobsByType(
	type: string,
	region: string
): Promise<{ data: MobWithChannels[] } | { error: string }> {
	try {
		// Fetch all mobs of the specified type from PocketBase with map expansion
		// Mobs are global (not region-specific), so requestKey only needs type
		const records = await pb.collection('mobs').getFullList({
			filter: pb.filter('type = {:type}', { type }),
			sort: 'uid',
			expand: 'map',
			requestKey: `mobs-${type}` // Unique request key to prevent auto-cancellation
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
		const orConditions = `(${mob_ids.map((_, i) => `mob = {:id${i}}`).join(' || ')}) && region = {:region}`;
		const params: Record<string, unknown> = {
			...Object.fromEntries(mob_ids.map((id, i) => [`id${i}`, id])),
			region
		};

		const all_channel_statuses = await pb.collection('mob_channel_status').getFullList({
			filter: pb.filter(orConditions, params),
			skipTotal: true,
			requestKey: `all-channel-statuses-${type}-${region}` // Unique request key
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
			const location_image = status.location_image as number | undefined;

			if (!statuses_by_mob.has(mob_id)) {
				statuses_by_mob.set(mob_id, new Map());
			}

			const channel_map = statuses_by_mob.get(mob_id)!;

			// Store the channel status
			const channel_entry: ChannelEntry = {
				channel: channel_number,
				status: getMobStatus(status.last_hp || 0, last_update),
				hp_percentage: status.last_hp || 0,
				last_updated: last_update
			};

			if (location_image) {
				channel_entry.location_image = location_image;
			}

			channel_map.set(channel_number, channel_entry);
		}

		// Process each mob with its pre-fetched channel statuses
		const mobs_with_channels = records.map((mob) => {
			const channel_statuses = statuses_by_mob.get(mob.id);
			const channel_reports: ChannelEntry[] = channel_statuses
				? Array.from(channel_statuses.values())
				: [];

			// Filter stale data, sort, and take top channels
			const filtered_channels = channel_reports.filter(
				(channel) => !isDataStale(channel.last_updated, channel.hp_percentage, mob.name)
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
				total_channels: mob.expand?.map?.region_data?.[region] || 0,
				respawn_time: mob.respawn_time,
				latestChannels: sorted_channels
			};
		});

		return { data: mobs_with_channels };
	} catch (error) {
		console.error(`Error fetching ${type}:`, error);
		return { error: `Failed to fetch ${type}` };
	}
}

export async function getBosses(
	region: string
): Promise<{ data: MobWithChannels[] } | { error: string }> {
	return getMobsByType('boss', region);
}

export async function getMagicalCreatures(
	region: string
): Promise<{ data: MobWithChannels[] } | { error: string }> {
	return getMobsByType('magical_creature', region);
}

export async function getMobsByIds(
	ids: string[],
	region: string
): Promise<{ data: MobWithChannels[] } | { error: string }> {
	if (ids.length === 0) {
		return { data: [] };
	}
	try {
		// Fetch mobs by ids
		// Mobs are global (not region-specific), so requestKey only needs ids
		const mobOrConditions = ids.map((_, i) => `id = {:id${i}}`).join(' || ');
		const mobParams = Object.fromEntries(ids.map((id, i) => [`id${i}`, id]));
		const records = await pb.collection('mobs').getFullList({
			filter: pb.filter(mobOrConditions, mobParams),
			sort: 'uid',
			expand: 'map',
			requestKey: `mobs-by-ids-${[...ids].sort().join('-')}` // Unique request key to prevent auto-cancellation
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
		const statusOrConditions = `(${mob_ids.map((_, i) => `mob = {:id${i}}`).join(' || ')}) && region = {:region}`;
		const statusParams: Record<string, unknown> = {
			...Object.fromEntries(mob_ids.map((id, i) => [`id${i}`, id])),
			region
		};

		const all_channel_statuses = await pb.collection('mob_channel_status').getFullList({
			filter: pb.filter(statusOrConditions, statusParams),
			skipTotal: true,
			requestKey: `all-channel-statuses-by-ids-${[...ids].sort().join('-')}-${region}` // Unique request key (sorted for consistency, non-mutating)
		});

		// Validate channel status records
		for (const status of all_channel_statuses) {
			validateWithSchema(mobChannelStatusSchema, status, 'Channel status');
		}

		// Create a map of mob_id to mob_name for quick lookup
		const mob_names = new Map(records.map((m) => [m.id, m.name]));

		// Group channel statuses by mob
		const statuses_by_mob = new Map<string, Map<number, ChannelEntry>>();

		for (const status of all_channel_statuses) {
			const mob_id = status.mob;
			const mob_name = mob_names.get(mob_id);
			const channel_number = status.channel_number || 0;
			const last_update = status.last_update || status.updated;
			const location_image = status.location_image as number | undefined;

			if (!statuses_by_mob.has(mob_id)) {
				statuses_by_mob.set(mob_id, new Map());
			}

			const channel_map = statuses_by_mob.get(mob_id)!;

			// Store the channel status
			const channel_entry: ChannelEntry = {
				channel: channel_number,
				status: getMobStatus(status.last_hp || 0, last_update, mob_name),
				hp_percentage: status.last_hp || 0,
				last_updated: last_update
			};

			if (location_image) {
				channel_entry.location_image = location_image;
			}

			channel_map.set(channel_number, channel_entry);
		}

		// Process each mob with its pre-fetched channel statuses
		const mobs_with_channels = records.map((mob) => {
			const channel_statuses = statuses_by_mob.get(mob.id);
			const channel_reports: ChannelEntry[] = channel_statuses
				? Array.from(channel_statuses.values())
				: [];

			// Filter stale data, sort, and take top channels
			const filtered_channels = channel_reports.filter(
				(channel) => !isDataStale(channel.last_updated, channel.hp_percentage, mob.name)
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
				total_channels: mob.expand?.map?.region_data?.[region] || 0,
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
