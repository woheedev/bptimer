/// <reference path="../pb_data/types.d.ts" />

/**
 * HP Reports Cleanup Cron Job
 *
 * Deletes HP reports older than 2 hours every hour at the 20th minute.
 */

cronAdd('cleanupHpReports', '20 * * * *', () => {
  try {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString().replace('T', ' ');

    const countResult = new DynamicModel({ count: 0 });
    $app
      .db()
      .newQuery('SELECT COUNT(*) as count FROM hp_reports WHERE created < {:cutoff}')
      .bind({ cutoff: twoHoursAgo })
      .one(countResult);

    const count = countResult.count;

    if (count > 0) {
      // Batch delete old reports
      $app
        .db()
        .newQuery('DELETE FROM hp_reports WHERE created < {:cutoff}')
        .bind({ cutoff: twoHoursAgo })
        .execute();

      console.log(`[HP Reports Cleanup] Deleted ${count} old HP reports`);
    }
  } catch (error) {
    console.error('[HP Reports Cleanup] Unexpected error:', error);
  }
});

console.log('[HP Reports Cleanup] Cron job registered: cleanupHpReports every hour');
