import { pb } from '$lib/pocketbase';
import { MAX_REPORTS_LIMIT } from '$lib/constants';
import { hpReportSchema } from '$lib/schemas';
import type { MobReport } from '$lib/types/db';
import type { UserRecordModel } from '$lib/types/auth';
import { mapUserRecord } from '$lib/utils/user-utils';
import { validateWithSchema } from '$lib/utils/validation';

// Validate HP report records
function validateHpReports(reports: Record<string, unknown>[]): void {
	for (const report of reports) {
		validateWithSchema(hpReportSchema, report, 'HP report');
	}
}

// Map report record to MobReport type
function mapReportToMobReport(
	report: Record<string, unknown>,
	reporter: UserRecordModel | undefined
): MobReport {
	return {
		id: report.id as string,
		channel: (report.channel_number as number) || 0,
		hp_percentage: report.hp_percentage as number,
		user: mapUserRecord(reporter),
		create_time: report.created as string,
		upvotes: (report.upvotes as number) || 0,
		downvotes: (report.downvotes as number) || 0,
		reporter_id: report.reporter as string,
		reporter_reputation: reporter?.reputation ?? 0,
		location_image: report.location_image as number | undefined
	};
}

export async function getLatestMobReports(
	mobId: string,
	reportCount: number
): Promise<MobReport[]> {
	try {
		// Fetch the latest X reports for this mob, sorted by newest
		const reports = await pb.collection('hp_reports').getList(1, reportCount, {
			filter: `mob = "${mobId}"`,
			sort: '-created',
			expand: 'reporter',
			skipTotal: true,
			requestKey: `mob-reports-${mobId}` // Unique key per mob for parallel requests (prevent auto-cancellation)
		});

		validateHpReports(reports.items);

		return reports.items.map((report) => {
			const reporter = report.expand?.reporter as UserRecordModel;
			return mapReportToMobReport(report, reporter);
		});
	} catch (error) {
		console.error('Error fetching latest mob reports:', error);
		return [];
	}
}

export async function getChannelReports(
	mobId: string,
	channelNumber: number
): Promise<MobReport[]> {
	try {
		// Query directly by channel number
		const reports = await pb.collection('hp_reports').getList(1, MAX_REPORTS_LIMIT, {
			filter: `mob = "${mobId}" && channel_number = ${channelNumber}`,
			sort: '-created',
			expand: 'reporter',
			skipTotal: true,
			requestKey: `channel-reports-${mobId}-${channelNumber}` // Unique key per channel
		});

		validateHpReports(reports.items);

		return reports.items.map((report) => {
			const reporter = report.expand?.reporter as UserRecordModel;
			return mapReportToMobReport(report, reporter);
		});
	} catch (error) {
		console.error('Error fetching channel reports:', error);
		return [];
	}
}
