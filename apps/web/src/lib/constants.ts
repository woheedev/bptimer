/**
 * Constants for common values used throughout the app
 */

// Time constants
export const SECOND = 1000;
export const MINUTE = 60 * SECOND;
export const HOUR = 60 * MINUTE;
export const DAY = 24 * HOUR;
export const STALE_DATA_TIMEOUT = 2 * MINUTE; // Default timeout
export const STALE_DATA_TIMEOUT_FULL_HP = 5 * MINUTE; // For 100% HP
export const STALE_DATA_TIMEOUT_HIGH_HP = 3 * MINUTE; // For 80-99% HP
export const DPS_METER_TOAST_DURATION = 10 * SECOND;
export const GAME_TIMEZONE_OFFSET = -2; // UTC-2
export const DEBOUNCE_DELAY = 300; // ms
export const SMALL_DELAY = 100; // ms
export const JUST_NOW_THRESHOLD = 15; // seconds
export const LAUNCH_REFERENCE_DATE = '2025-10-08';

// Realtime
export const REALTIME_DEBOUNCE_DELAY = 100; // ms
export const MAX_REALTIME_RETRIES = 3;
export const REALTIME_RETRY_BASE_DELAY = 2 * SECOND;
export const STALE_DATA_CHECK_INTERVAL = 30 * SECOND;

// HP-related constants
export const DEFAULT_HP_VALUE = 100;
export const MAX_HP_VALUE = 100;
export const MIN_HP_VALUE = 0;
export const DEAD_HP_VALUE = 0;
export const HP_SLIDER_STEP = 5;
export const HP_CRITICAL_THRESHOLD = 30; // %
export const HP_LOW_THRESHOLD = 60; // %
export const HP_HIGH_THRESHOLD = 80; // %

// UI constants
export const LATEST_CHANNELS_DISPLAY_COUNT = 15;
export const MAX_REPORTS_LIMIT = 10;
export const MAX_SEARCH_QUERY_LENGTH = 100;
export const MOBILE_BREAKPOINT = 768; // px

// Filter and sort settings defaults
import type { FilterSortSettings } from '$lib/schemas';
export const DEFAULT_FILTER_SORT_SETTINGS: FilterSortSettings = {
	sortField: 'channel',
	sortDirection: 'ascending',
	hpRange: [0, 100],
	hideStaleChannels: false
};

// Mob respawn constants
export const MAGICAL_CREATURE_RESET_HOURS = {
	'Lovely Boarlet': [12, 16, 20],
	'Breezy Boarlet': [14, 18, 22]
};

// Special magical creatures (# is total locations)
export const SPECIAL_MAGICAL_CREATURE_LOCATION_COUNTS: Record<string, number> = {
	'Loyal Boarlet': 10,
	'Golden Nappo': 10,
	'Silver Nappo': 10
};

export const SPECIAL_MAGICAL_CREATURES_REQUIRING_LOCATION = Object.keys(
	SPECIAL_MAGICAL_CREATURE_LOCATION_COUNTS
) as (keyof typeof SPECIAL_MAGICAL_CREATURE_LOCATION_COUNTS)[];

// Reputation and voting constants
export const VOTE_TIME_WINDOW = 1 * MINUTE;
export const REPUTATION_UPVOTE_GAIN = 5;
export const REPUTATION_DOWNVOTE_LOSS = 2;
export const REPUTATION_GOOD_THRESHOLD = 100;
export const REPUTATION_HIGH_THRESHOLD = 50;
export const REPUTATION_MEDIUM_THRESHOLD = 20;
export const REPUTATION_BAD_DISPLAY_THRESHOLD = -10;
export const BAD_REPORT_THRESHOLD = -20; // Rate limit threshold
export const BANNED_REPORT_THRESHOLD = -50;
export const RATE_LIMITED_COOLDOWN = 5 * MINUTE;
export const LEADERBOARD_LIMIT = 50;

// API users
export const API_USERS: Record<string, string> = {
	fovkhat7zlite07: 'discord.gg/bpsrfarmers',
	qctjhx7a061lhfq: 'tinyurl.com/bpsrlogs'
};
export const BYPASS_VOTE_USER_IDS = Object.keys(API_USERS);

// Storage keys
export const FAVORITE_MOBS_STORAGE_KEY = 'favorite-mobs';
export const EVENT_TIMERS_COLLAPSED_STORAGE_KEY = 'event-timers-collapsed';
export const FILTER_SORT_SETTINGS_STORAGE_KEY = 'filter-sort-settings';

import { Download, Hammer, Heart, Map, Medal, Sparkles, Swords } from '@lucide/svelte/icons';

export const PAGES = [
	{
		title: 'Download DPS Meter',
		url: 'https://github.com/winjwinj/bpsr-logs/releases/latest',
		icon: Download,
		external: true,
		variant: 'primary' as const
	},
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
		title: 'Leaderboard',
		url: '/leaderboard',
		icon: Medal
	},
	{
		title: 'Tools - Coming Soon',
		url: '#tools',
		icon: Hammer,
		comingSoon: true
	}
];

export const PARTNER_PAGES = [
	{
		title: 'Interactive Maps',
		url: 'https://starresonance.th.gl',
		icon: Map,
		external: true
	}
];
