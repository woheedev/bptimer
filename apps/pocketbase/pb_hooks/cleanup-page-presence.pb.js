/// <reference path="../pb_data/types.d.ts" />

/**
 * Cleanup Stale Page Presence Hook
 *
 * Removes presence records that haven't been updated in the last 3 minutes.
 * Runs every 5 minutes.
 */
cronAdd('cleanupPagePresence', '2,7,12,17,22,27,32,37,42,47,52,57 * * * *', () => {
  const { PRESENCE_STALE_THRESHOLD } = require(`${__hooks}/constants.js`);

  try {
    const cutoffTime = new Date(Date.now() - PRESENCE_STALE_THRESHOLD)
      .toISOString()
      .replace('T', ' ');

    const db = $app.db();
    const result = db
      .newQuery('DELETE FROM page_presence WHERE last_seen < {:cutoff}')
      .bind({
        cutoff: cutoffTime
      })
      .execute();

    if (result.rowsAffected > 0) {
      console.log(`[CLEANUP] page_presence deleted=${result.rowsAffected}`);
    }
  } catch (error) {
    console.error(`[CLEANUP] page_presence error:`, error);
  }
});

console.log('[CLEANUP] page_presence hooks registered');
