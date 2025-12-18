import { pb } from '$lib/pocketbase';
import { mobChannelStatusSchema } from '$lib/schemas';
import type { ChannelEntry } from '$lib/types/mobs';
import { getMobStatus } from '$lib/utils/mob-utils';
import { validateWithSchema } from '$lib/utils/validation';

export async function getChannels(bossId: string, region: string): Promise<ChannelEntry[]> {
	try {
		// Fetch the mob to get its name for special handling
		const mob = await pb.collection('mobs').getOne(bossId);
		const mobName = mob.name;

		const filter = 'mob = {:bossId} && region = {:region}';
		const params = { bossId, region };

		const channels = await pb.collection('mob_channel_status').getFullList({
			filter: pb.filter(filter, params),
			skipTotal: true
		});

		// Validate channel status records
		for (const channel of channels) {
			validateWithSchema(mobChannelStatusSchema, channel, 'Channel status');
		}

		// Process and filter channels
		const processed_channels = channels.map((channel): ChannelEntry => {
			const last_update = channel.last_update || channel.updated;
			const last_hp = channel.last_hp || 0;
			const location_image = channel.location_image as number | undefined;

			const result: ChannelEntry = {
				channel: channel.channel_number || 0,
				status: getMobStatus(last_hp, last_update, mobName),
				hp_percentage: last_hp,
				last_updated: last_update
			};

			if (location_image) {
				result.location_image = location_image;
			}

			return result;
		});

		return processed_channels;
	} catch (error) {
		console.error('Error fetching boss channels:', error);
		return [];
	}
}
