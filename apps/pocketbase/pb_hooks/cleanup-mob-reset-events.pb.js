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
      // Batch delete old events
      $app
        .db()
        .newQuery('DELETE FROM mob_reset_events WHERE timestamp < {:cutoff}')
        .bind({ cutoff: cutoffIso })
        .execute();

      console.log(`[Mob Reset Events Cleanup] Deleted ${count} old mob reset events`);
    }
  } catch (error) {
    console.error('[Mob Reset Events Cleanup] Unexpected error:', error);
  }
});

console.log(
  '[Mob Reset Events Cleanup] Cron job registered: cleanupMobResetEvents every 6 hours at 15 minutes past the hour'
);
