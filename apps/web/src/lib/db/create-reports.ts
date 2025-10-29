import { pb } from '$lib/pocketbase';
import { hpReportInputSchema } from '$lib/schemas';
import type { HpReport } from '$lib/types/db';

export async function createReport(
	boss_id: string,
	channel: number,
	hp_percentage: number,
	reporter_id: string
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

		if (channel < 1 || channel > boss.expand?.map?.total_channels) {
			throw new Error(
				`Channel must be between 1 and ${boss.expand?.map?.total_channels} for this boss`
			);
		}

		// Create the HP report
		const report = await pb.collection('hp_reports').create({
			mob: boss_id,
			channel_number: channel,
			hp_percentage: hp_percentage,
			reporter: reporter_id
		});

		return report as unknown as HpReport;
	} catch (error) {
		console.error('Error creating HP report:', error);
		throw error;
	}
}
