/// <reference path="../pb_data/types.d.ts" />

/**
 * HP Reports Cleanup Cron Job
 *
 * Deletes HP reports older than 2 hours every hour at the 20th minute.
 */

cronAdd('cleanupHpReports', '20 * * * *', () => {
  const { HP_REPORTS_CLEANUP_WINDOW } = require(`${__hooks}/constants.js`);

  try {
    const cutoffTime = new Date(Date.now() - HP_REPORTS_CLEANUP_WINDOW)
      .toISOString()
      .replace('T', ' ');

    const countResult = new DynamicModel({ count: 0 });
    $app
      .db()
      .newQuery('SELECT COUNT(*) as count FROM hp_reports WHERE created < {:cutoff}')
      .bind({ cutoff: cutoffTime })
      .one(countResult);

    const count = countResult.count;

    if (count > 0) {
      $app
        .db()
        .newQuery('DELETE FROM hp_reports WHERE created < {:cutoff}')
        .bind({ cutoff: cutoffTime })
        .execute();

      console.log(`[CLEANUP] hp_reports deleted=${count}`);
    }
  } catch (error) {
    console.error(`[CLEANUP] hp_reports error:`, error);
  }
});

console.log('[CLEANUP] hp_reports hooks registered');
