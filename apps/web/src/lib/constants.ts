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

// Special magical creatures with location mappings
// Keys are mob names, values are location number -> display name mappings
// Location count is inferred from the number of keys in each mob's location object
export const SPECIAL_MAGICAL_CREATURES: Record<string, Record<number, string>> = {
	'Loyal Boarlet': {
		1: 'Cliff Ruins',
		2: 'Scout 1',
		3: 'Scout 2',
		4: 'Scout 3',
		5: 'Muku',
		6: 'Farm',
		7: 'Rest 1',
		8: 'Rest 2'
	},
	'Golden Nappo': {
		1: 'Beech',
		2: 'Cliff Ruins',
		3: 'Muku',
		4: 'Farm',
		5: 'Brigand Leader',
		6: 'Ruins'
	},
	'Silver Nappo': {
		1: 'Beech',
		2: 'Lone',
		3: 'Cliff Ruins',
		4: 'Scout 1',
		5: 'Scout 2',
		6: 'Muku 1',
		7: 'Muku 2',
		8: 'Farm',
		9: 'Brigand Leader',
		10: 'Ruins 1',
		11: 'Ruins 2'
	}
};

export const SPECIAL_MAGICAL_CREATURES_REQUIRING_LOCATION = Object.keys(
	SPECIAL_MAGICAL_CREATURES
) as (keyof typeof SPECIAL_MAGICAL_CREATURES)[];

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

import {
	Download,
	Hammer,
	Heart,
	Map,
	Medal,
	Sparkles,
	Swords,
	Tractor
} from '@lucide/svelte/icons';

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
		title: 'Tools & Resources',
		url: '/tools',
		icon: Hammer
	}
];

export const PARTNER_PAGES = [
	{
		title: 'Interactive Maps',
		url: 'https://starresonance.th.gl',
		icon: Map,
		external: true
	},
	{
		title: 'BP:SR Farmers',
		url: 'https://discord.gg/bpsrfarmers',
		icon: Tractor,
		external: true
	}
];

import type { ToolsSections } from '$lib/schemas';
export const TOOLS_SECTIONS: ToolsSections = {
	officialTools: {
		title: 'DPS Meters',
		cards: [
			{
				title: 'BPSR Logs',
				description:
					'BPSR Logs is a "blazingly fast" open source Blue Protocol: Star Resonance DPS meter, written in Rust by winj. It is heavily inspired by loa-logs, and uses reverse engineering work done by StarResonanceDamageCounter and @Yuerino.',
				author: 'winjwinj',
				badge: 'BPTimer Supported',
				badgeVariant: 'default',
				tags: 'EN|Rust|Svelte|Tauri|WinDivert|Windows',
				url: 'https://github.com/winjwinj/bpsr-logs'
			},
			{
				title: 'BPSR Meter',
				description: 'Real-time combat statistics and performance tracking tool.',
				author: 'mrsnakke',
				badge: 'Fork',
				npcap: true,
				tags: 'EN|Electron|JavaScript|Node.js|Express|Socket.IO',
				url: 'https://github.com/mrsnakke/BPSR-Meter'
			},
			{
				title: 'BPSR-PSO-SX',
				description:
					'BPSR-PSO-SX is an overlay / monitoring tool for Blue Protocol that tracks player performance metrics such as DPS/HPS on a per-second basis and provides extended functionality over the original toolset.',
				author: 'Sola-Ray',
				badge: 'Fork',
				npcap: true,
				tags: 'EN|Electron|JavaScript|Node.js|Express|Socket.IO',
				url: 'https://github.com/Sola-Ray/BPSR-PSO-SX'
			},
			{
				title: 'Infamous BPSR DPS Meter',
				description:
					'The Ultimate Blue Protocol Combat Tracker - Real-time DPS/HPS analysis with modern UI',
				author: 'ssalihsrz',
				badge: 'Fork',
				npcap: true,
				tags: 'EN|AI|Electron|JavaScript|Node.js|Express|Socket.IO',
				url: 'https://github.com/ssalihsrz/InfamousBPSRDPSMeter'
			},
			{
				title: 'Star Resonance DPS',
				description:
					'Star Resonance DPS is a fork of the original Star Resonance Damage Counter with Chinese translation support, offering real-time combat statistics for Blue Protocol: Star Resonance.',
				author: 'DannyDog',
				badge: 'Fork',
				npcap: true,
				tags: 'CN|EN-Translated|C#|.NET|WPF|Windows',
				url: 'https://github.com/DannyDog/StarResonanceDps'
			},
			{
				title: 'Star Resonance DPS',
				description:
					'Star Resonance Toolbox is a comprehensive DPS statistics tool for Blue Protocol: Star Resonance, featuring real-time combat analysis and performance tracking.',
				author: 'anying1073',
				badge: 'Original',
				npcap: true,
				tags: 'CN|EN-Translated|C#|.NET|WPF|Windows',
				url: 'https://github.com/anying1073/StarResonanceDps'
			},
			{
				title: 'Star Resonance Damage Counter',
				description:
					'Star Resonance Damage Counter is a real-time combat data tool for Blue Protocol: Star Resonance, providing detailed damage and healing statistics through packet interception.',
				author: 'dmlgzs',
				badge: 'Original',
				npcap: true,
				tags: 'CN|EN-Translated|JavaScript|Node.js|Express|Socket.IO',
				url: 'https://github.com/dmlgzs/StarResonanceDamageCounter'
			}
		]
	},
	communityDiscords: {
		title: 'Community Discords',
		cards: [
			{
				title: 'Official BPSR Discord',
				description: 'Official Discord server for the Anime MMORPG Blue Protocol: Star Resonance.',
				badge: 'Official',
				url: 'https://discord.gg/starresonance'
			},
			{
				title: 'BP:SR Farmers',
				description:
					'Community focused on Pigs, Nappo, World Boss, and Dungeon farming coordination.',
				badge: 'Partner',
				url: 'https://discord.gg/bpsrfarmers'
			},
			{
				title: 'BPSR Devs',
				description: "Developer community for BPSR. Home to winj's DPS Meter and BP Timer.",
				badge: 'BP Timer Discord',
				badgeVariant: 'default',
				url: 'https://discord.gg/3UTC4pfCyC'
			}
		]
	},
	communityWebsites: {
		title: 'Community Websites',
		cards: [
			{
				title: 'Star Resonance Interactive Maps',
				description:
					'Explore Asteria Plains Map, Asterleeds Map, Windhowl Canyon Map in Blue Protocol: Star Resonance with BPSR, Bosses, Guides, Maps, Rare Spawns, Engram Hubs, plus more locations brought to you by The Hidden Gaming Lair!',
				badge: 'Partner',
				author: 'DevLeon',
				url: 'https://starresonance.th.gl/'
			},
			{
				title: 'Maxroll',
				description:
					"Maxroll's Build Guides, Community Builds, Tier Lists, Resources, Items, Tools, Database and much more for Blue Protocol: Star Resonance",
				url: 'https://maxroll.gg/blue-protocol'
			},
			{
				title: 'QuestLog',
				description: 'Guides, Builds and Tools for Blue Protocol: Star Resonance',
				url: 'https://questlog.gg/blue-protocol/en'
			},
			{
				title: 'BPSR Talent Planner',
				description: 'Plan and share talent builds!',
				url: 'https://bpsrtalent.vercel.app/'
			},
			{
				title: 'Blue Protocol Database',
				description:
					'Blue Protocol player database and statistics tracker with live player rankings and class distributions',
				author: 'Lunixx',
				url: 'https://blueprotocol.lunixx.de/'
			},
			{
				title: 'Blue Protocol Leaderboard',
				description:
					'Automatic leaderboard based on DPS application. All displayed times are real session times, not game times, to ensure fairplay.',
				author: 'Kaws & Solaray',
				url: 'https://blueprotocol.fr/'
			},
			{
				title: 'Blue Protocol Global Timers',
				description:
					'Live countdown timers for Blue Protocol: Star Resonance server events, including daily/weekly resets and special events. Automatically adjusts to your local time.',
				author: 'Natsu',
				url: 'https://natsume.io/bpsr/'
			}
		]
	}
};
