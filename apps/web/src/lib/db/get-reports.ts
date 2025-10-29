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
		channel: number;
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

		validateHpReports(reports.items);

		return reports.items.map((report) => ({
			id: report.id,
			channel: report.channel_number || 0,
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
		const reports = await pb.collection('hp_reports').getList(1, reportCount, {
			filter: `mob = "${mobId}"`,
			sort: '-created',
			expand: 'reporter',
			requestKey: `mob-reports-${mobId}` // Unique key per mob for parallel requests (prevent auto-cancellation)
		});

		validateHpReports(reports.items);

		return reports.items.map((report) => ({
			id: report.id,
			channel: report.channel_number || 0,
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
		// Query directly by channel number
		const reports = await pb.collection('hp_reports').getList(1, 10, {
			filter: `mob = "${mobId}" && channel_number = ${channelNumber}`,
			sort: '-created',
			expand: 'reporter',
			requestKey: `channel-reports-${mobId}-${channelNumber}` // Unique key per channel
		});

		validateHpReports(reports.items);

		return reports.items.map((report) => ({
			id: report.id,
			channel: report.channel_number || channelNumber,
			hp_percentage: report.hp_percentage,
			user: mapUserRecord(report.expand?.reporter as UserRecordModel),
			create_time: report.created
		}));
	} catch (error) {
		console.error('Error fetching channel reports:', error);
		return [];
	}
}
