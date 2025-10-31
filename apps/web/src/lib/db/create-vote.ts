import { pb } from '$lib/pocketbase';
import { voteInputSchema } from '$lib/schemas';

export async function createVote(reportId: string, voteType: 'up' | 'down') {
	try {
		// Validate input
		voteInputSchema.parse({ reportId, voteType });
	} catch (error) {
		console.error('Invalid vote input:', error);
		throw new Error('Invalid vote parameters');
	}
	try {
		// Check if user already voted on this report
		try {
			const existingVote = await pb
				.collection('votes')
				.getFirstListItem(`report = "${reportId}" && voter = "${pb.authStore.record?.id}"`, {
					fields: 'id'
				});

			// If vote exists, update it instead
			await pb.collection('votes').update(existingVote.id, {
				vote_type: voteType
			});

			return existingVote.id;
		} catch {
			// No existing vote, create new one
			const vote = await pb.collection('votes').create({
				report: reportId,
				voter: pb.authStore.record?.id,
				vote_type: voteType
			});

			return vote.id;
		}
	} catch (error) {
		console.error('Error creating/updating vote:', error);
		throw error;
	}
}
