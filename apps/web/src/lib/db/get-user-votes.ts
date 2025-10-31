import { pb } from '$lib/pocketbase';
import type { UserVoteInfo, UserVotesMap } from '$lib/types/db';

/**
 * Fetch user's votes for multiple reports at once
 * Returns a Map of report_id -> vote info
 * Maximum votes returned equals reportIds.length
 */
export async function getUserVotesForReports(
	reportIds: string[],
	userId: string
): Promise<UserVotesMap> {
	if (!userId || reportIds.length === 0) {
		return new Map();
	}

	try {
		// Build filter for all report IDs
		const reportFilters = reportIds.map((id) => `report = "${id}"`).join(' || ');
		const filter = `(${reportFilters}) && voter = "${userId}"`;

		const votes = await pb.collection('votes').getList(1, reportIds.length, {
			filter,
			fields: 'id,report,vote_type',
			skipTotal: true
		});

		// Convert to Map for O(1) lookups
		const voteMap = new Map<string, UserVoteInfo>();
		for (const vote of votes.items) {
			voteMap.set(vote.report, {
				id: vote.id,
				vote_type: vote.vote_type as 'up' | 'down'
			});
		}

		return voteMap;
	} catch (error) {
		console.error('Error fetching user votes:', error);
		return new Map();
	}
}
