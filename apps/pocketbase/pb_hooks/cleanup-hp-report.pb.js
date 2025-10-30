/// <reference path="../pb_data/types.d.ts" />

/**
 * HP Reports Cleanup Cron Job
 *
 * Deletes HP reports older than 4 hours every hour at the top of the hour.
 */

cronAdd('cleanupHpReports', '0 * * * *', () => {
  try {
    const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();

    const countResult = new DynamicModel({ count: 0 });
    $app
      .db()
      .newQuery('SELECT COUNT(*) as count FROM hp_reports WHERE created < {:cutoff}')
      .bind({ cutoff: fourHoursAgo })
      .one(countResult);

    const count = countResult.count;

    if (count > 0) {
      // Batch delete old reports
      $app
        .db()
        .newQuery('DELETE FROM hp_reports WHERE created < {:cutoff}')
        .bind({ cutoff: fourHoursAgo })
        .execute();

      console.log(`[HP Reports Cleanup] Deleted ${count} old HP reports`);
    }
  } catch (error) {
    console.error('[HP Reports Cleanup] Unexpected error:', error);
  }
});

console.log('[HP Reports Cleanup] Cron job registered: cleanupHpReports every hour');
