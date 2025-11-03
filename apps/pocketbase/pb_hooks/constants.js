/// <reference path="../pb_data/types.d.ts" />

/**
 * Shared constants for PocketBase hooks
 */

// Time constants (in milliseconds)
const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;

// Reputation and voting constants
const REPUTATION_UPVOTE_GAIN = 3;
const REPUTATION_DOWNVOTE_LOSS = 2;
const VOTE_TIME_WINDOW = 1 * MINUTE;
const RATE_LIMIT_THRESHOLD = -10; // Rate limit threshold
const BLOCKED_THRESHOLD = -20; // Complete block threshold
const RATE_LIMITED_COOLDOWN = 5 * MINUTE;

// API users (bypass users for vote and rate limiting)
const API_USERS = {
  fovkhat7zlite07: 'discord.gg/bpsrfarmers',
  qctjhx7a061lhfq: 'tinyurl.com/bpsrlogs',
  ku99bl6jmjbijj4: 'tinyurl.com/bpsr-meter'
};
const BYPASS_VOTE_USER_IDS = Object.keys(API_USERS);
const BYPASS_VOTE_USER_IDS_SET = new Set(BYPASS_VOTE_USER_IDS);

// Time windows for duplicate checks and cleanup
const DUPLICATE_CHECK_WINDOW = 5 * MINUTE;
const HP_REPORTS_CLEANUP_WINDOW = 2 * HOUR;

// Boss game id to boss name mapping
const BOSS_MAPPING = {
  80006: 'Golden Juggernaut',
  10032: 'Golden Juggernaut',
  108: 'Frost Ogre',
  10009: 'Frost Ogre',
  20100: 'Frost Ogre',
  20127: 'Frost Ogre',
  80002: 'Frost Ogre',
  2000129: 'Frost Ogre',
  2000140: 'Frost Ogre',
  2004172: 'Frost Ogre',
  3000006: 'Frost Ogre',
  3000019: 'Frost Ogre',
  80004: 'Inferno Ogre',
  10018: 'Inferno Ogre',
  80008: 'Phantom Arachnocrab',
  10069: 'Phantom Arachnocrab',
  10056: 'Brigand Leader',
  80009: 'Venobzzar Incubator',
  10077: 'Venobzzar Incubator',
  3000025: 'Venobzzar Incubator',
  80007: 'Muku Chief',
  10059: 'Muku Chief',
  3000022: 'Muku Chief',
  8611: 'Iron Fang',
  80010: 'Iron Fang',
  10081: 'Iron Fang',
  3000024: 'Iron Fang',
  80001: 'Storm Goblin King',
  10007: 'Storm Goblin King',
  61219: 'Storm Goblin King',
  61220: 'Storm Goblin King',
  61221: 'Storm Goblin King',
  4301: 'Tempest Ogre',
  10010: 'Tempest Ogre',
  20024: 'Tempest Ogre',
  20072: 'Tempest Ogre',
  20092: 'Tempest Ogre',
  80003: 'Tempest Ogre',
  2000131: 'Tempest Ogre',
  2000137: 'Tempest Ogre',
  3000001: 'Tempest Ogre',
  3000020: 'Tempest Ogre',
  530354: 'Tempest Ogre',
  10084: 'Celestial Flier',
  3000038: 'Celestial Flier',
  10085: 'Lizardman King',
  3000036: 'Lizardman King',
  8070: 'Goblin King',
  203: 'Goblin King',
  204: 'Goblin King',
  1400: 'Goblin King',
  1410: 'Goblin King',
  1413: 'Goblin King',
  10086: 'Goblin King',
  20028: 'Goblin King',
  20070: 'Goblin King',
  20107: 'Goblin King',
  60416: 'Goblin King',
  552020: 'Goblin King',
  612401: 'Goblin King',
  7700001: 'Goblin King',
  2000134: 'Goblin King',
  2000138: 'Goblin King',
  2004164: 'Goblin King',
  2004169: 'Goblin King',
  3000021: 'Goblin King',
  10029: 'Muku King',
  20027: 'Muku King',
  20071: 'Muku King',
  20108: 'Muku King',
  80005: 'Muku King',
  81000: 'Muku King',
  3000008: 'Muku King',
  10902: 'Lovely Boarlet',
  10903: 'Breezy Boarlet',
  10904: 'Loyal Boarlet',
  10900: 'Golden Nappo',
  10901: 'Silver Nappo'
};

module.exports = {
  SECOND,
  MINUTE,
  HOUR,

  REPUTATION_UPVOTE_GAIN,
  REPUTATION_DOWNVOTE_LOSS,
  VOTE_TIME_WINDOW,
  RATE_LIMIT_THRESHOLD,
  BLOCKED_THRESHOLD,
  RATE_LIMITED_COOLDOWN,

  API_USERS,
  BYPASS_VOTE_USER_IDS,
  BYPASS_VOTE_USER_IDS_SET,

  DUPLICATE_CHECK_WINDOW,
  HP_REPORTS_CLEANUP_WINDOW,

  BOSS_MAPPING
};
