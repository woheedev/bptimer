import { pb } from '$lib/pocketbase';
import type { HpReport } from '$lib/schemas';
import { hpReportInputSchema, hpReportSchema } from '$lib/schemas';
import { validateWithSchema } from '$lib/utils/validation';

export async function createReport(
	boss_id: string,
	channel: number,
	hp_percentage: number,
	reporter_id: string,
	region: string,
	locationImage?: number | null
): Promise<HpReport> {
	try {
		// Validate input with Zod
		hpReportInputSchema.parse({
			mobId: boss_id,
			channel,
			hp_percentage
		});

		if (!reporter_id) {
			throw new Error('Missing reporter ID');
		}

		// Get the boss to validate channel range and get map
		const boss = await pb.collection('mobs').getOne(boss_id, {
			expand: 'map'
		});
		if (!boss) {
			throw new Error('Boss not found');
		}

		const regionData = boss.expand?.map?.region_data;
		const totalChannels = regionData?.[region] || 0;

		if (!totalChannels) {
			throw new Error(`No channel data found for region ${region}`);
		}

		if (channel < 1 || channel > totalChannels) {
			throw new Error(
				`Channel must be between 1 and ${totalChannels} for this boss in region ${region}`
			);
		}

		// Create the HP report
		const reportData: Record<string, unknown> = {
			mob: boss_id,
			channel_number: channel,
			hp_percentage: hp_percentage,
			reporter: reporter_id,
			region: region
		};

		// Add location image number if provided and valid
		if (locationImage !== null && locationImage !== undefined && locationImage >= 1) {
			reportData.location_image = locationImage;
		}

		const report = await pb.collection('hp_reports').create(reportData);

		return validateWithSchema(hpReportSchema, report, 'HP report');
	} catch (error) {
		console.error('Error creating HP report:', error);
		throw error;
	}
}
