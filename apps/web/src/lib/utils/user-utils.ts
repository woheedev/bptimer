import { pb } from '$lib/pocketbase';
import type { UserRecordModel } from '$types/auth';

/**
 * Gets the PocketBase file URL for a user's avatar
 *
 * @param model - The user model with avatar field
 * @returns The avatar URL or undefined if no avatar
 */
export function getAvatarUrl(model: UserRecordModel | null): string | undefined {
	if (!model) return undefined;
	if (typeof model.avatar !== 'string' || !model.avatar) return undefined;

	// If avatar is already a full URL (e.g., from OAuth providers), return it directly
	if (model.avatar.startsWith('http://') || model.avatar.startsWith('https://')) {
		return model.avatar;
	}

	// Otherwise, generate PocketBase file URL
	return pb.files.getURL(model, model.avatar);
}

/**
 * Extracts a user's display name from their record.
 * Falls back to email prefix or provided fallback string.
 */
export function extractUserName(
	reporter: UserRecordModel | undefined | null,
	fallback: string = 'Unknown'
): string {
	return reporter?.username || reporter?.email?.split('@')[0] || fallback;
}

/**
 * Maps a user/reporter record to a standard user object format.
 * Useful for consistent user data across the app.
 */
export function mapUserRecord(reporter: UserRecordModel | undefined | null): {
	id: string;
	name: string;
	avatar: string;
} {
	return {
		id: reporter?.id || '',
		name: extractUserName(reporter),
		avatar: getAvatarUrl(reporter as UserRecordModel) || ''
	};
}
