import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import { pb } from '$lib/pocketbase';

// Authenticate user with Discord OAuth2 using PocketBase's popup method
// This method handles everything within a single call without custom redirects

async function discordAuth(redirectPath: '/' | '/api-key'): Promise<void> {
	try {
		await pb.collection('users').authWithOAuth2({
			provider: 'discord'
		});
		await goto(resolve(redirectPath));
	} catch (error) {
		console.error('Discord OAuth error:', error);
		throw new Error((error as Error).message || 'Discord authentication failed');
	}
}

export async function signIn(): Promise<void> {
	return discordAuth('/');
}

export async function signInAPI(): Promise<void> {
	return discordAuth('/api-key');
}

export function signOut(): void {
	pb.authStore.clear();
}

export function isAuthenticated(): boolean {
	return pb.authStore.isValid;
}

export function getCurrentUser(): Record<string, unknown> | null {
	return pb.authStore.record;
}
