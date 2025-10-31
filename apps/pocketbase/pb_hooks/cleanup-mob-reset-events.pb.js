/// <reference path="../pb_data/types.d.ts" />

/**
 * Mob Reset Events Cleanup Cron Job
 *
 * Deletes mob reset events older than 6 hours every 6 hours.
 */

cronAdd('cleanupMobResetEvents', '15 */6 * * *', () => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - 6); // 6 hours ago
    const cutoffIso = cutoffDate.toISOString().replace('T', ' ');

    const countResult = new DynamicModel({ count: 0 });
    $app
      .db()
      .newQuery('SELECT COUNT(*) as count FROM mob_reset_events WHERE timestamp < {:cutoff}')
      .bind({ cutoff: cutoffIso })
      .one(countResult);

    const count = countResult.count;

    if (count > 0) {
      $app
        .db()
        .newQuery('DELETE FROM mob_reset_events WHERE timestamp < {:cutoff}')
        .bind({ cutoff: cutoffIso })
        .execute();

      console.log(`[CLEANUP] mob_reset_events deleted=${count}`);
    }
  } catch (error) {
    console.error(`[CLEANUP] mob_reset_events error:`, error);
  }
});

console.log('[CLEANUP] mob_reset_events hooks registered');
