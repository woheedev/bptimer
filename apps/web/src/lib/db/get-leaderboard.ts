import { pb } from '$lib/pocketbase';
import { leaderboardEntrySchema } from '$lib/schemas';
import type { LeaderboardEntry } from '$lib/schemas';
import { validateWithSchema } from '$lib/utils/validation';

function mapToLeaderboardEntry(record: {
	id: string;
	username: string;
	avatar?: string;
	reputation?: number;
}): LeaderboardEntry {
	const entry: LeaderboardEntry = {
		id: record.id,
		username: record.username,
		avatar: record.avatar,
		reputation: record.reputation ?? 0
	};
	validateWithSchema(leaderboardEntrySchema, entry, 'Leaderboard entry');
	return entry;
}

function mapRecordToLeaderboardEntry(record: Record<string, unknown>): LeaderboardEntry {
	return mapToLeaderboardEntry({
		id: record.id as string,
		username: record.username as string,
		avatar: record.avatar as string | undefined,
		reputation: record.reputation as number | undefined
	});
}

export async function getLeaderboard(
	limit: number
): Promise<{ data: LeaderboardEntry[] } | { error: string }> {
	try {
		const records = await pb.collection('users').getList(1, limit, {
			sort: '-reputation',
			filter: 'verified = true',
			skipTotal: true
		});

		const entries = records.items.map(mapRecordToLeaderboardEntry);
		return { data: entries };
	} catch (error) {
		console.error('Error fetching leaderboard:', error);
		return { error: 'Failed to fetch leaderboard' };
	}
}

// Not used currently but can be used to get a user's rank to make everyone an entry at the top
export async function getUserLeaderboardRank(
	userId: string
): Promise<{ rank: number; entry: LeaderboardEntry } | { error: string }> {
	try {
		const record = await pb.collection('users').getOne(userId);
		const entry = mapRecordToLeaderboardEntry(record);

		// Count verified users with higher reputation (reputation is sanitized from DB)
		const higherRankedCount = await pb.collection('users').getList(1, 1, {
			filter: `verified = true && reputation > ${entry.reputation}`,
			skipTotal: false
		});

		const rank = (higherRankedCount.totalItems || 0) + 1;
		return { rank, entry };
	} catch (error) {
		console.error('Error fetching user leaderboard rank:', error);
		return { error: 'Failed to fetch user rank' };
	}
}
