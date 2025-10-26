import { pb } from '$lib/pocketbase';

export async function deleteVote(voteId: string) {
	try {
		await pb.collection('votes').delete(voteId);
	} catch (error) {
		console.error('Error deleting vote:', error);
		throw error;
	}
}
