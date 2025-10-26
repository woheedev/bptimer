import { pb } from '$lib/pocketbase';

export async function updateVote(voteId: string, voteType: 'up' | 'down') {
	try {
		const updatedVote = await pb.collection('votes').update(voteId, {
			vote_type: voteType
		});

		return updatedVote;
	} catch (error) {
		console.error('Error updating vote:', error);
		throw error;
	}
}
