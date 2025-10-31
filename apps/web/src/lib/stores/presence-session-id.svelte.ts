import { browser } from '$app/environment';
import { PRESENCE_SESSION_ID_STORAGE_KEY } from '$lib/constants';

function loadFromLocalStorage(): string {
	if (!browser) return '';
	try {
		const stored = localStorage.getItem(PRESENCE_SESSION_ID_STORAGE_KEY);
		if (stored) {
			return stored;
		}
	} catch (error) {
		console.error('Failed to load presence session ID from localStorage:', error);
	}
	return '';
}

function generateSessionId(): string {
	return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

function saveToLocalStorage(sessionId: string) {
	if (!browser) return;
	try {
		localStorage.setItem(PRESENCE_SESSION_ID_STORAGE_KEY, sessionId);
	} catch (error) {
		console.error('Failed to save presence session ID to localStorage:', error);
	}
}

function createPresenceSessionIdStore() {
	let sessionId = $state<string>(loadFromLocalStorage());

	function getOrCreateSessionId(): string {
		if (!sessionId) {
			sessionId = generateSessionId();
			saveToLocalStorage(sessionId);
		}
		return sessionId;
	}

	return {
		get sessionId() {
			return getOrCreateSessionId();
		}
	};
}

export const presenceSessionIdStore = createPresenceSessionIdStore();
