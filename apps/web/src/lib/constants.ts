/**
 * Constants for common values used throughout the app
 */

import type { PageItem, ToolsSections, RegionOption } from '$lib/types/ui';

// Time constants
export const SECOND = 1000;
export const MINUTE = 60 * SECOND;
export const HOUR = 60 * MINUTE;
export const DAY = 24 * HOUR;
export const STALE_DATA_TIMEOUT = 2 * MINUTE; // Default timeout
export const STALE_DATA_TIMEOUT_FULL_HP = 5 * MINUTE; // For 100% HP
export const STALE_DATA_TIMEOUT_HIGH_HP = 3 * MINUTE; // For 80-99% HP
export const MOB_NOTIFICATION_DURATION = 60 * SECOND;
export const GAME_TIMEZONE_OFFSET = -2; // UTC-2 (deprecated)
export const DEBOUNCE_DELAY = 300; // ms
export const SMALL_DELAY = 100; // ms
export const JUST_NOW_THRESHOLD = 15; // seconds

// Realtime
export const REALTIME_DEBOUNCE_DELAY = 20; // ms
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
	hideStaleChannels: false,
	showTimestamp: true
};

// Mob respawn constants (all times in UTC)
// Format: mobName -> region -> []hours
export const MAGICAL_CREATURE_RESET_HOURS: Record<string, Record<string, number[]>> = {
	'Lovely Boarlet': {
		NA: [12, 16, 20], // 10AM, 2PM, 6PM UTC-2
		SEA: [3, 7, 11] // 1AM, 5AM, 9AM UTC-2
	},
	'Breezy Boarlet': {
		NA: [14, 18, 22], // 12PM, 4PM, 8PM UTC-2
		SEA: [5, 9, 13] // 3AM, 7AM, 11AM UTC-2
	}
};

export const SPECIAL_MAGICAL_CREATURES_DEAD_TIMEOUT: Record<string, number> = {
	'Loyal Boarlet': 20 * HOUR,
	'Silver Nappo': 2 * HOUR,
	'Golden Nappo': 20 * HOUR
};

// Special magical creatures with location mappings
// Keys are mob names, values are location number -> display name mappings
// Location count is inferred from the number of keys in each mob's location object
export const SPECIAL_MAGICAL_CREATURES: Record<string, Record<number, string>> = {
	'Loyal Boarlet': {
		1: 'Cliff Ruins',
		2: 'Scout NW',
		3: 'Scout E',
		4: 'Scout NE',
		5: 'Kana',
		6: 'Farm',
		7: 'Tent',
		8: 'Andra'
	},
	'Golden Nappo': {
		1: 'Beach',
		2: 'Cliff Ruins',
		3: 'Muku',
		4: 'Old Kana',
		5: 'Brigand Leader',
		6: 'Ruins E'
	},
	'Silver Nappo': {
		1: 'Beach',
		2: 'Lone',
		3: 'Cliff Ruins',
		4: 'Scout N',
		5: 'Scout E',
		6: 'Kana Road',
		7: 'Muku',
		8: 'Farm',
		9: 'Brigand Leader',
		10: 'Ruins N',
		11: 'Ruins E'
	}
};

export const SPECIAL_MAGICAL_CREATURES_REQUIRING_LOCATION = Object.keys(
	SPECIAL_MAGICAL_CREATURES
) as (keyof typeof SPECIAL_MAGICAL_CREATURES)[];

// Reputation and voting constants
export const VOTE_TIME_WINDOW = 2 * MINUTE;
export const REPUTATION_GOOD_THRESHOLD = 100;
export const REPUTATION_HIGH_THRESHOLD = 50;
export const REPUTATION_MEDIUM_THRESHOLD = 20;
export const REPUTATION_BAD_DISPLAY_THRESHOLD = -10;
export const LEADERBOARD_LIMIT = 50;

// API users
export const API_USERS: Record<string, string> = {
	fovkhat7zlite07: 'BPTimer Companion',
	d7v77edry2kmhp5: 'discord.gg/bpsrfarmers',
	qctjhx7a061lhfq: 'tinyurl.com/bpsrlogs', // winjwinj
	ku99bl6jmjbijj4: 'tinyurl.com/meter-bpsr', // geonode
	gw8hsqxlvvbok37: 'BPTL - blueprotocol.fr', // kaws & solaray
	fftlpj0jgvmmoge: 'tinyurl.com/mrsnakke', // mrsnakke
	zdc1lhi31t05zco: 'tinyurl.com/gabrielsanbs', // gabrielsanbs
	g9bavfjybj4ezhb: 'tinyurl.com/zdpsmeter' // xennma
};
export const BYPASS_VOTE_USER_IDS = Object.keys(API_USERS);

// Admin users
export const ADMIN_USER_IDS = ['fovkhat7zlite07'];

// Storage keys
export const FAVORITE_MOBS_STORAGE_KEY = 'favorite-mobs';
export const EVENT_TIMERS_COLLAPSED_STORAGE_KEY = 'event-timers-collapsed';
export const FILTER_SORT_SETTINGS_STORAGE_KEY = 'filter-sort-settings';
export const MODULES_OPTIMIZER_MODULES_STORAGE_KEY = 'modules-optimizer-modules';
export const MODULES_OPTIMIZER_PRIORITY_EFFECTS_STORAGE_KEY = 'modules-optimizer-priority-effects';
export const MODULES_OPTIMIZER_NUM_SLOTS_STORAGE_KEY = 'modules-optimizer-num-slots';
export const MOB_NOTIFICATIONS_STORAGE_KEY = 'mob-notifications';
export const REGION_STORAGE_KEY = 'selected-region';

// import Discord from '$lib/components/icons/discord.svelte';
import {
	Calculator,
	Download,
	Hammer,
	Heart,
	ListTodo,
	Map,
	Medal,
	Sparkles,
	Swords,
	Tractor,
	Trophy
} from '@lucide/svelte/icons';

export const PAGES: PageItem[] = [
	{
		title: 'Download Companion App',
		url: 'https://github.com/woheedev/bptimer/releases/latest',
		icon: Download,
		external: true,
		variant: 'primary'
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
		title: 'Modules Optimizer',
		url: '/modules-optimizer',
		icon: Calculator
	},
	{
		title: 'Tools & Resources',
		url: '/tools',
		icon: Hammer
	},
	{
		title: 'Rep Leaderboard',
		url: '/leaderboard',
		icon: Trophy
	}
];

export const PARTNER_PAGES: PageItem[] = [
	{
		title: 'Daily Checklist',
		url: 'https://teawase.github.io/blue-protocol-checklist/',
		icon: ListTodo,
		external: true
	},
	{
		title: 'Interactive Maps',
		url: 'https://starresonance.th.gl',
		icon: Map,
		external: true
	},
	{
		title: 'Raid Leaderboards',
		url: 'https://blueprotocol.fr',
		icon: Medal,
		external: true
	},
	{
		title: 'Farmers Discord',
		url: 'https://discord.gg/bpsrfarmers',
		icon: Tractor,
		external: true
	}
	/*
	{
		title: 'Invite Discord Bot',
		url: 'https://discord.com/oauth2/authorize?client_id=1435655675081396366',
		icon: Discord,
		external: true
	}
	*/
];

// Module Optimizer constants
export const MODULE_MAX_PRIORITY_EFFECTS = 5;
export const MODULE_EFFECTS_PER_MODULE = 3; // 2 for purple, 3 for gold
export const MODULE_EFFECT_MAX_LEVEL = 10; // 1-10
export const MODULE_THIRD_EFFECT_MAX_LEVEL = 5; // 1-5 for 3rd effect
export const MODULE_DEFAULT_NAME_PREFIX = 'Module';
export const MODULE_AVAILABLE_EFFECTS: Record<number, string> = {
	1110: 'Strength Boost',
	1111: 'Agility Boost',
	1112: 'Intellect Boost',
	1113: 'Special Attack',
	1114: 'Elite Strike',
	1205: 'Healing Boost',
	1206: 'Healing Enhance',
	1307: 'Resistance',
	1308: 'Armor',
	1407: 'Cast Focus',
	1408: 'Attack SPD',
	1409: 'Crit Focus',
	1410: 'Luck Focus',
	2104: 'DMG Stack',
	2105: 'Agile',
	2204: 'Life Condense',
	2205: 'First Aid',
	2304: 'Final Protection',
	2404: 'Life Wave',
	2405: 'Life Steal',
	2406: 'Team Luck & Crit'
} as const;

export function getEffectNames(): string[] {
	return Object.values(MODULE_AVAILABLE_EFFECTS).sort();
}

export function isKnownEffectId(id: number): boolean {
	return Object.prototype.hasOwnProperty.call(MODULE_AVAILABLE_EFFECTS, id);
}

export function getEffectName(id: number): string {
	return MODULE_AVAILABLE_EFFECTS[id] ?? `Unknown Effect (ID: ${id})`;
}

export const MODULE_SLOTS = [
	{ value: 2, label: '2 Slots' },
	{ value: 3, label: '3 Slots' },
	{ value: 4, label: '4 Slots' }
] as const;

export const MODULE_TIER_THRESHOLDS = [
	{ threshold: 20, score: 20 },
	{ threshold: 16, score: 16 },
	{ threshold: 12, score: 12 },
	{ threshold: 8, score: 8 },
	{ threshold: 4, score: 4 },
	{ threshold: 1, score: 1 }
] as const;

export const MODULE_PRIORITY_MULTIPLIERS = [10, 7, 5, 3, 2];
export const MODULE_OPTIMIZER_MAX_MODULES_FOR_FULL_SEARCH = 100;
export const MODULE_OPTIMIZER_PREFILTER_TOP_PER_ATTR = 30;
export const MODULE_OPTIMIZER_MAX_SOLUTIONS = 40;
export const MODULE_OPTIMIZER_MAX_ATTEMPTS_MULTIPLIER = 15;
export const MODULE_OPTIMIZER_GREEDY_CANDIDATE_LIMIT = 50;
export const MODULE_OPTIMIZER_LOCAL_SEARCH_MAX_ITERATIONS = 20;
export const MODULE_OPTIMIZER_LOCAL_SEARCH_MIN_RELEVANT_MODULES = 10;
export const MODULE_OPTIMIZER_LOCAL_SEARCH_SAMPLE_SIZE = 15;
export const MODULE_OPTIMIZER_YIELD_INTERVAL = 10;

// Region constants
export const DEFAULT_REGION = 'NA';
export const REGION_LAUNCH_DATES: Record<string, string> = {
	NA: '2025-10-09',
	SEA: '2025-12-17'
};
export const REGIONS: RegionOption[] = [
	{ value: 'NA', label: 'GLOBAL' },
	{ value: 'SEA', label: 'SEA' }
];

// Tools & Resources constants
export const TOOLS_SECTIONS: ToolsSections = {
	officialTools: {
		title: 'DPS Meters',
		shortTitle: 'Meters',
		cards: [
			{
				title: 'BPTimer Companion App',
				description:
					'Official BPTimer.com companion app for Blue Protocol: Star Resonance. It includes mob timers just like the website, a mob radar to better track mob locations, and a simple DPS meter.',
				author: 'woheedev',
				badge: 'Official',
				badgeVariant: 'default',
				driver: 'npcap',
				tags: 'EN|Rust|EGUI|Windows|Linux',
				url: 'https://github.com/woheedev/bptimer',
				previewImage: '/images/tools/bptimer-companion-app.webp'
			},
			{
				title: 'ZDPS Meter',
				description:
					'ZDPS is a Damage Meter for Blue Protocol: Star Resonance along with supporting a Module Optimizer, Log Reporting, and so much more.',
				author: 'xennma',
				badge: 'BPTimer',
				badgeVariant: 'default',
				driver: 'npcap',
				tags: 'EN|C#|.NET|Windows',
				url: 'https://github.com/Blue-Protocol-Source/BPSR-ZDPS',
				previewImage: '/images/tools/zdps-meter.webp'
			},
			{
				title: 'BPSR Logs',
				description:
					'BPSR Logs is a "blazingly fast" open source Blue Protocol: Star Resonance DPS meter, written in Rust by winj. It is heavily inspired by loa-logs, and uses reverse engineering work done by StarResonanceDamageCounter and @Yuerino.',
				author: 'winjwinj',
				badge: 'BPTimer',
				badgeVariant: 'default',
				driver: 'windivert',
				tags: 'EN|Rust|Svelte|Tauri|WinDivert|Windows',
				url: 'https://github.com/winjwinj/bpsr-logs',
				previewImage: '/images/tools/bpsr-logs.webp'
			},
			{
				title: 'BPSR Meter',
				description:
					"BPSR Meter is yet another fork of NeRooNx's BPSR Meter which is a fork of MrSnakke BPSR-Meter which is a customized version of Dimole's Star Resonance counter.",
				author: 'geonode',
				badge: 'BPTimer',
				badgeVariant: 'default',
				driver: 'both',
				tags: 'EN|React|Electron|JavaScript|Node.js|Express|Socket.IO',
				url: 'https://github.com/Denoder/BPSR-Meter',
				previewImage: '/images/tools/bpsr-meter-denoder.webp'
			},
			{
				title: 'BPSR-Meter',
				description:
					'A real-time DPS meter for Blue Protocol: Star Resonance. It captures game data and converts it into performance statistics.',
				author: 'mrsnakke',
				badge: 'BPTimer',
				badgeVariant: 'default',
				driver: 'npcap',
				tags: 'EN|Electron|JavaScript|Node.js|Express|Socket.IO',
				url: 'https://github.com/mrsnakke/BPSR-Meter',
				previewImage: '/images/tools/bpsr-meter-mrsnakke.webp'
			},
			{
				title: 'BPSR Meter',
				description:
					'BPSR Meter - Damage Meter for Blue Protocol | Real-time DPS tracking, multilingual fight history, optimized performance.',
				author: 'gabrielsanbs',
				badge: 'BPTimer',
				badgeVariant: 'default',
				driver: 'npcap',
				tags: 'EN|ES|PT-BR|Electron|JavaScript|Node.js|Express|Socket.IO',
				url: 'https://github.com/gabrielsanbs/BPSR-Meter',
				previewImage: '/images/tools/bpsr-meter-gabrielsanbs.webp'
			},
			{
				title: 'BPSR-PSO-SX',
				description:
					'BPSR-PSO-SX is an overlay / monitoring tool for Blue Protocol that tracks player performance metrics such as DPS/HPS on a per-second basis and provides extended functionality over the original toolset.',
				author: 'Sola-Ray',
				badge: 'Fork',
				driver: 'npcap',
				tags: 'EN|Electron|JavaScript|Node.js|Express|Socket.IO',
				url: 'https://github.com/Sola-Ray/BPSR-PSO-SX',
				previewImage: '/images/tools/bpsr-pso-sx.webp'
			},
			{
				title: 'Star Resonance DPS EN',
				description:
					'Star Resonance DPS is a fork of the original Star Resonance Damage Counter with Chinese translation support, offering real-time combat statistics for Blue Protocol: Star Resonance.',
				author: 'DannyDog',
				badge: 'Fork',
				driver: 'npcap',
				tags: 'CN|EN-Translated|C#|.NET|WPF|Windows',
				url: 'https://github.com/DannyDog/StarResonanceDps',
				previewImage: '/images/tools/star-resonance-dps-dannydog.webp'
			},
			{
				title: 'Star Resonance DPS',
				description:
					'Star Resonance Toolbox is a comprehensive DPS statistics tool for Blue Protocol: Star Resonance, featuring real-time combat analysis and performance tracking.',
				author: 'anying1073',
				badge: 'Original',
				driver: 'npcap',
				tags: 'CN|C#|.NET|WPF|Windows',
				url: 'https://github.com/anying1073/StarResonanceDps',
				previewImage: '/images/tools/star-resonance-dps-anying1073.webp'
			},
			{
				title: 'Star Resonance Damage Counter',
				description:
					'Star Resonance Damage Counter is a real-time combat data tool for Blue Protocol: Star Resonance, providing detailed damage and healing statistics through packet interception.',
				author: 'dmlgzs',
				badge: 'Original',
				driver: 'npcap',
				tags: 'CN|EN|JavaScript|Node.js|Express|Socket.IO',
				url: 'https://github.com/dmlgzs/StarResonanceDamageCounter',
				previewImage: '/images/tools/star-resonance-damage-counter-dmlgzs.webp'
			}
		]
	},
	communityDiscords: {
		title: 'Community Discords',
		shortTitle: 'Discords',
		cards: [
			/*
			{
				title: 'BPSR Info',
				description:
					'A community Discord bot that provides HP alert notifications with customizable thresholds, event timers, and much more.',
				badge: 'BP Timer',
				badgeVariant: 'default',
				url: 'https://discord.com/oauth2/authorize?client_id=1435655675081396366'
			},
			*/
			{
				title: 'BPSR Devs',
				description: "Developer community for BPSR. Home to winj's DPS Meter and BP Timer.",
				badge: 'BP Timer',
				badgeVariant: 'default',
				url: 'https://discord.gg/3UTC4pfCyC'
			},
			{
				title: 'BP:SR Farmers',
				description:
					'Community focused on Pigs, Nappo, World Boss, and Dungeon farming coordination.',
				badge: 'Partner',
				url: 'https://discord.gg/bpsrfarmers'
			},
			{
				title: 'BPSR Rarefarmers',
				description:
					'Specialized community dedicated to hunting magical creatures (Boarlets and Nappos).',
				url: 'https://discord.gg/xYeZx28Jc3'
			},
			{
				title: 'Official BPSR Discord',
				description: 'Official Discord server for the Anime MMORPG Blue Protocol: Star Resonance.',
				badge: 'Official',
				url: 'https://discord.gg/starresonance'
			}
		]
	},
	communityWebsites: {
		title: 'Community Websites',
		shortTitle: 'Websites',
		cards: [
			{
				title: 'Blue Protocol Leaderboard',
				description:
					'Automatic leaderboard based on DPS application. All displayed times are real session times, not game times, to ensure fairplay.',
				badge: 'BPTimer',
				badgeVariant: 'default',
				author: 'Kaws & Solaray',
				tags: 'Closed Source',
				url: 'https://blueprotocol.fr/'
			},
			{
				title: 'Blue Protocol: Star Resonance Checklist',
				description:
					'A simple, responsive web-based checklist for tracking daily and weekly tasks for Blue Protocol: Star Resonance. Built with HTML, CSS, and JavaScript. No external dependencies beyond confetti.js for celebrations.',
				badge: 'BPTimer',
				badgeVariant: 'default',
				author: 'Teawase',
				url: 'https://teawase.github.io/blue-protocol-checklist/'
			},
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
				title: 'Blue Protocol Global Timers',
				description:
					'Live countdown timers for Blue Protocol: Star Resonance server events, including daily/weekly resets and special events. Automatically adjusts to your local time.',
				author: 'Natsu',
				url: 'https://natsume.io/bpsr/'
			}
		]
	}
};

export const BOSS_LOOT_DROPS: Record<string, string[]> = {
	'Golden Juggernaut': ['epic_weapon', 'epic_helmet', 'epic_necklace'],
	'Frost Ogre': ['epic_weapon', 'epic_armor', 'epic_ring'],
	'Inferno Ogre': ['epic_weapon', 'epic_bracelet_left', 'epic_bracelet_right'],
	'Phantom Arachnocrab': ['epic_weapon', 'epic_helmet', 'epic_necklace'],
	'Brigand Leader': ['epic_weapon', 'epic_armor', 'epic_ring'],
	'Venobzzar Incubator': ['epic_weapon', 'epic_gauntlets', 'epic_earrings'],
	'Muku Chief': ['epic_weapon', 'epic_boots', 'epic_charm'],
	'Iron Fang': ['epic_weapon', 'epic_bracelet_left', 'epic_bracelet_right'],
	'Storm Goblin King': [
		'legendary_box_helmet_necklace',
		'legendary_weapon',
		'legendary_helmet',
		'legendary_necklace'
	],
	'Tempest Ogre': [
		'legendary_box_armor_ring',
		'legendary_weapon',
		'legendary_armor',
		'legendary_ring'
	],
	'Celestial Flier': [
		'legendary_box_gauntlets_earrings',
		'legendary_weapon',
		'legendary_gauntlets',
		'legendary_earrings'
	],
	'Lizardman King': [
		'legendary_box_boots_charm',
		'legendary_weapon',
		'legendary_boots',
		'legendary_charm'
	],
	'Goblin King': [
		'legendary_box_bracelets',
		'legendary_weapon',
		'legendary_bracelet_left',
		'legendary_bracelet_right'
	],
	'Muku King': ['legendary_box_weapon', 'legendary_weapon', 'legendary_armor']
};
