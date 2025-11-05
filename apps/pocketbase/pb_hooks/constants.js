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
const VOTE_TIME_WINDOW = 2 * MINUTE;
const RATE_LIMIT_THRESHOLD = -10; // Rate limit threshold
const BLOCKED_THRESHOLD = -20; // Complete block threshold
const RATE_LIMITED_COOLDOWN = 5 * MINUTE;

// API users (bypass users for vote and rate limiting)
const API_USERS = {
  fovkhat7zlite07: 'discord.gg/bpsrfarmers',
  qctjhx7a061lhfq: 'tinyurl.com/bpsrlogs',
  ku99bl6jmjbijj4: 'tinyurl.com/meter-bpsr',
  gw8hsqxlvvbok37: 'BPTL - blueprotocol.fr'
};
const BYPASS_VOTE_USER_IDS = Object.keys(API_USERS);
const BYPASS_VOTE_USER_IDS_SET = new Set(BYPASS_VOTE_USER_IDS);

// Time windows for duplicate checks and cleanup
const DUPLICATE_CHECK_WINDOW = 5 * MINUTE;
const HP_REPORTS_CLEANUP_WINDOW = 2 * HOUR;

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
  HP_REPORTS_CLEANUP_WINDOW
};
