import { pb } from '$lib/pocketbase';
import { mobChannelStatusSchema } from '$lib/schemas';
import { isDataStale } from '$lib/utils/general-utils';
import { getMobStatus } from '$lib/utils/mob-utils';
import { validateWithSchema } from '$lib/utils/validation';

export async function getChannels(bossId: string): Promise<
	Array<{
		channel: number;
		status: 'alive' | 'dead' | 'unknown';
		hp_percentage: number;
		last_update: string;
	}>
> {
	try {
		// Fetch all mob_channel_status for this mob
		const channels = await pb.collection('mob_channel_status').getFullList({
			filter: pb.filter('mob = {:bossId}', { bossId }),
			skipTotal: true
		});

		// Validate channel status records
		for (const channel of channels) {
			validateWithSchema(mobChannelStatusSchema, channel, 'Channel status');
		}

		// Process and filter channels
		const processed_channels = channels
			.map((channel) => {
				const last_update = channel.last_update || channel.updated;
				const last_hp = channel.last_hp || 0;

				return {
					channel: channel.channel_number || 0,
					status: getMobStatus(last_hp, last_update),
					hp_percentage: last_hp,
					last_update: last_update
				};
			})
			.filter((channel) => !isDataStale(channel.last_update, channel.hp_percentage)); // Exclude stale data

		return processed_channels;
	} catch (error) {
		console.error('Error fetching boss channels:', error);
		return [];
	}
}
