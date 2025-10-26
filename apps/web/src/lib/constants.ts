/**
 * Constants for common values used throughout the app
 */
export const STALE_DATA_TIMEOUT = 5 * 60 * 1000; // 5 min
export const AUTO_REFRESH_INTERVAL = 15 * 1000; // 15 seconds
export const DEFAULT_HP_VALUE = 100;
export const MAX_HP_VALUE = 100;
export const MIN_HP_VALUE = 0;
export const DEAD_HP_VALUE = 0;
export const HP_SLIDER_STEP = 5;
export const LATEST_CHANNELS_DISPLAY_COUNT = 15;
export const DPS_METER_TOAST_DURATION = 10 * 1000; // 10 seconds
export const GAME_TIMEZONE_OFFSET = -2; // UTC-2
export const AUTO_REFRESH_STORAGE_KEY = 'auto-refresh-enabled';
export const FAVORITE_MOBS_STORAGE_KEY = 'favorite-mobs';
export const EVENT_TIMERS_COLLAPSED_STORAGE_KEY = 'event-timers-collapsed';

import { Hammer, Heart, Medal, Sparkles, Swords } from '@lucide/svelte/icons';
export const PAGES = [
	{
		title: 'Bosses',
		url: '/',
		icon: Swords
	},
	{
		title: 'Magical Creatures',
		url: '/magical-creatures',
		icon: Sparkles
	},
	{
		title: 'Favorites',
		url: '/favorites',
		icon: Heart
	},
	{
		title: 'Leaderboard - Coming Soon',
		url: '#leaderboard',
		icon: Medal,
		comingSoon: true
	},
	{
		title: 'Tools - Coming Soon',
		url: '#tools',
		icon: Hammer,
		comingSoon: true
	}
];
