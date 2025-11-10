import { browser } from '$app/environment';
import { MOB_NOTIFICATIONS_STORAGE_KEY } from '$lib/constants';
import { SvelteSet } from 'svelte/reactivity';

function loadFromLocalStorage(): string[] {
	if (!browser) return [];
	try {
		const stored = localStorage.getItem(MOB_NOTIFICATIONS_STORAGE_KEY);
		if (stored) {
			return JSON.parse(stored);
		}
	} catch (error) {
		console.error('Failed to load mob notifications from localStorage:', error);
	}
	return [];
}

function saveToLocalStorage(enabledMobs: SvelteSet<string>) {
	if (!browser) return;
	try {
		localStorage.setItem(MOB_NOTIFICATIONS_STORAGE_KEY, JSON.stringify(Array.from(enabledMobs)));
	} catch (error) {
		console.error('Failed to save mob notifications to localStorage:', error);
	}
}

function createMobNotificationsStore() {
	const enabledMobs = new SvelteSet<string>(loadFromLocalStorage());

	function toggleNotifications(mobId: string) {
		if (enabledMobs.has(mobId)) {
			enabledMobs.delete(mobId);
		} else {
			enabledMobs.add(mobId);
		}
		saveToLocalStorage(enabledMobs);
	}

	function isEnabled(mobId: string): boolean {
		return enabledMobs.has(mobId);
	}

	return {
		get enabledMobs() {
			return enabledMobs;
		},
		toggleNotifications,
		isEnabled
	};
}

export const mobNotificationsStore = createMobNotificationsStore();
