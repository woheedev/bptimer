package pb_go

import "time"

// Cache
const MOB_CACHE_TTL_MINUTES = 60
const API_KEY_CACHE_TTL_SECONDS = 30
const API_KEY_CACHE_PREFIX = "api_key_cache_"
const MAX_LOCATION_DISTANCE = 30.0

// SSE
const SSE_BATCH_INTERVAL_MS = 200
const SSE_IDLE_TIMEOUT_MINUTES = 2
const SSE_TOPIC_HP_UPDATES = "mob_hp_updates"
const SSE_TOPIC_RESETS = "mob_resets"
const SSE_TOPIC_RESETS_SEA = "mob_resets_sea"
const COLLECTION_CACHE_KEY = "pb_mob_channel_status_collection"

// Collection names
const COLLECTION_HP_REPORTS = "hp_reports"
const COLLECTION_MOB_CHANNEL_STATUS = "mob_channel_status"
const COLLECTION_MOBS = "mobs"
const COLLECTION_VOTES = "votes"
const COLLECTION_USERS = "users"
const COLLECTION_API_KEYS = "api_keys"

// Cronjobs
const CRON_MOB_RESPAWN_SCHEDULE = "* * * * *"
const CRON_CLEANUP_HP_REPORTS_SCHEDULE = "20 * * * *"
const CRON_CLEANUP_MOB_CHANNEL_STATUS_SCHEDULE = "15 0 * * *"

// Junk time windows
const HP_REPORTS_CLEANUP_HOURS = 2
const DUPLICATE_CHECK_WINDOW_MINUTES = 5

// Validation constants
const HP_REPORT_INTERVAL = 5

// Voting and Rep
const REPUTATION_UPVOTE_GAIN = 3
const REPUTATION_DOWNVOTE_LOSS = 2
const VOTE_TIME_WINDOW_MINUTES = 2
const RATE_LIMIT_THRESHOLD = -10
const BLOCKED_THRESHOLD = -20
const RATE_LIMITED_COOLDOWN_MINUTES = 5

// Computed time durations
var (
	mobCacheTTL         = time.Duration(MOB_CACHE_TTL_MINUTES) * time.Minute
	apiKeyCacheTTL      = time.Duration(API_KEY_CACHE_TTL_SECONDS) * time.Second
	sseBatchInterval    = time.Duration(SSE_BATCH_INTERVAL_MS) * time.Millisecond
	sseIdleTimeout      = time.Duration(SSE_IDLE_TIMEOUT_MINUTES) * time.Minute
	voteTimeWindow      = time.Duration(VOTE_TIME_WINDOW_MINUTES) * time.Minute
	rateLimitedCooldown = time.Duration(RATE_LIMITED_COOLDOWN_MINUTES) * time.Minute
)

// Maps magical creature monster_ids to region-specific UTC hours when they respawn
// Format: monsterID -> region -> []hours
var MagicalCreatureResetHours = map[int]map[string][]int{
	10902: { // Lovely Boarlet
		"NA":  {12, 16, 20}, // 10AM, 2PM, 6PM UTC-2
		"SEA": {3, 7, 11},   // 1AM, 5AM, 9AM UTC-2
	},
	10903: { // Breezy Boarlet
		"NA":  {14, 18, 22}, // 12PM, 4PM, 8PM UTC-2
		"SEA": {5, 9, 13},   // 3AM, 7AM, 11AM UTC-2
	},
}

// Hours after last magical creature reset to stop accepting HP report submissions
const MAGICAL_CREATURE_CUTOFF_HOURS = 2

// API users that bypass vote and rate limiting checks
var BypassVoteUserIDs = map[string]bool{
	"fovkhat7zlite07": true, // BPTimer Companion
	"d7v77edry2kmhp5": true, // discord.gg/bpsrfarmers
	"qctjhx7a061lhfq": true, // tinyurl.com/bpsrlogs
	"ku99bl6jmjbijj4": true, // tinyurl.com/meter-bpsr
	"gw8hsqxlvvbok37": true, // BPTL - blueprotocol.fr
	"fftlpj0jgvmmoge": true, // tinyurl.com/mrsnakke,
	"zdc1lhi31t05zco": true, // tinyurl.com/gabrielsanbs
	"g9bavfjybj4ezhb": true, // ZDPS Meter - xennma
}

// ACCOUNT_ID_REGIONS maps account_id prefixes to their region information
var ACCOUNT_ID_REGIONS = map[string]RegionInfo{
	"0_": {Name: "DEV", Enabled: false},
	"1_": {Name: "CN", Enabled: false},
	"2_": {Name: "INT", Enabled: false},
	"3_": {Name: "TW", Enabled: false},
	"4_": {Name: "NA", Enabled: true},
	"5_": {Name: "JPKR", Enabled: false},
	"6_": {Name: "SEA", Enabled: true},
}

// MOB_LOCATIONS maps game monster IDs to their known spawn coordinates
var MOB_LOCATIONS = map[int][]MobLocation{
	10900: { // Golden Nappo
		{ID: 1, X: -710, Y: 100, Z: 97},   // Beach
		{ID: 2, X: -151, Y: 125, Z: -282}, // Cliff Ruins
		{ID: 3, X: 600, Y: 198, Z: 226},   // Muku
		{ID: 4, X: 186, Y: 183, Z: 414},   // Farm
		{ID: 5, X: -116, Y: 172, Z: 314},  // BL
		{ID: 6, X: -111, Y: 281, Z: 597},  // Ruins E
	},
	10901: { // Silver Nappo
		{ID: 1, X: -592, Y: 102, Z: 32},   // Beach
		{ID: 2, X: -318, Y: 125, Z: -318}, // Lone
		{ID: 3, X: 100, Y: 155, Z: -142},  // Cliff Ruins
		{ID: 4, X: 316, Y: 191, Z: 134},   // Scout N
		{ID: 5, X: 348, Y: 170, Z: -73},   // Scout E
		{ID: 6, X: 502, Y: 174, Z: 376},   // Kana Road
		{ID: 7, X: 638, Y: 152, Z: 281},   // Muku
		{ID: 8, X: 306, Y: 184, Z: 313},   // Farm
		{ID: 9, X: -170, Y: 166, Z: 254},  // BL
		{ID: 10, X: -415, Y: 239, Z: 695}, // Ruins N
		{ID: 11, X: -42, Y: 287, Z: 473},  // Ruins E
	},
	10904: { // Loyal Boarlet
		{ID: 1, X: -54, Y: 200, Z: -205}, // Cliff Ruins
		{ID: 2, X: 220, Y: 142, Z: 32},   // Scout NW
		{ID: 3, X: 348, Y: 170, Z: -83},  // Scout E
		{ID: 4, X: 355, Y: 159, Z: 18},   // Scout NE
		{ID: 5, X: 460, Y: 213, Z: 471},  // Muku
		{ID: 6, X: 210, Y: 160, Z: 274},  // Farm
		{ID: 7, X: -482, Y: 207, Z: 166}, // Tent
		{ID: 8, X: -282, Y: 157, Z: 86},  // Andra
	},
}
