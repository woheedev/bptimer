import { pb } from '$lib/pocketbase';
import { hpReportSchema } from '$lib/schemas';
import type { UserRecordModel } from '$lib/types/auth';
import { mapUserRecord } from '$lib/utils/user-utils';
import { validateWithSchema } from '$lib/utils/validation';

// Validate HP report records
function validateHpReports(reports: Record<string, unknown>[]): void {
	for (const report of reports) {
		validateWithSchema(hpReportSchema, report, 'HP report');
	}
}

export async function getReports(bossId: string): Promise<
	Array<{
		id: string;
		channel: string;
		hp_percentage: number;
		user: { id: string; name: string; avatar: string };
		create_time: string;
	}>
> {
	try {
		// Fetch recent reports for this boss
		const reports = await pb.collection('hp_reports').getList(1, 10, {
			filter: `mob = "${bossId}"`,
			sort: '-created',
			expand: 'reporter'
		});

		return reports.items.map((report) => ({
			id: report.id,
			channel: report.channel,
			hp_percentage: report.hp_percentage,
			user: mapUserRecord(report.expand?.reporter as UserRecordModel),
			create_time: report.created
		}));
	} catch (error) {
		console.error('Error fetching boss reports:', error);
		return [];
	}
}

export async function getLatestMobReports(
	mobId: string,
	reportCount: number
): Promise<
	Array<{
		id: string;
		channel: number;
		hp_percentage: number;
		user: { id: string; name: string; avatar: string };
		create_time: string;
	}>
> {
	try {
		// Fetch the latest X reports for this mob, sorted by newest
		// Expand both reporter and channel to get channel number
		const reports = await pb.collection('hp_reports').getList(1, reportCount, {
			filter: `mob = "${mobId}"`,
			sort: '-created',
			expand: 'reporter,channel',
			requestKey: `mob-reports-${mobId}` // Unique key per mob for parallel requests (prevent auto-cancellation)
		});

		validateHpReports(reports.items);

		return reports.items.map((report) => ({
			id: report.id,
			channel: report.expand?.channel?.number || 0, // Use actual channel number from expanded channel relation
			hp_percentage: report.hp_percentage,
			user: mapUserRecord(report.expand?.reporter as UserRecordModel),
			create_time: report.created
		}));
	} catch (error) {
		console.error('Error fetching latest mob reports:', error);
		return [];
	}
}

export async function getChannelReports(
	mobId: string,
	channelNumber: number
): Promise<
	Array<{
		id: string;
		channel: number;
		hp_percentage: number;
		user: { id: string; name: string; avatar: string };
		create_time: string;
	}>
> {
	try {
		// Try to get channel through mob-channel-status first
		let status_record = null;
		try {
			status_record = await pb.collection('mob_channel_status').getFirstListItem(`
				mob = "${mobId}" && channel.number = ${channelNumber}
			`);
		} catch {
			// Silent fail - WIP
		}

		// If we found a status record, get its channel ID
		let channel_id = status_record?.channel || null;

		// If not found via status, try direct channel lookup
		if (!channel_id && status_record?.channel) {
			const status_expanded = await pb
				.collection('mob_channel_status')
				.getFirstListItem(`mob = "${mobId}" && channel.number = ${channelNumber}`, {
					expand: 'channel'
				});
			channel_id = status_expanded?.expand?.channel?.id || null;
		}

		if (!channel_id) {
			return [];
		}

		// Fetch the latest 10 reports for this specific channel
		const reports = await pb.collection('hp_reports').getList(1, 10, {
			filter: `mob = "${mobId}" && channel = "${channel_id}"`,
			sort: '-created',
			expand: 'reporter,channel',
			requestKey: `channel-reports-${mobId}-${channelNumber}` // Unique key per channel
		});

		validateHpReports(reports.items);

		return reports.items.map((report) => ({
			id: report.id,
			channel: report.expand?.channel?.number || channelNumber, // Fallback to input number
			hp_percentage: report.hp_percentage,
			user: mapUserRecord(report.expand?.reporter as UserRecordModel),
			create_time: report.created
		}));
	} catch (error) {
		console.error('Error fetching channel reports:', error);
		return [];
	}
}
