/// <reference path="../pb_data/types.d.ts" />

/**
 * HP Reports Cleanup Cron Job
 *
 * Deletes HP reports older than 1 hour every hour at the top of the hour.
 */

cronAdd('cleanupHpReports', '0 * * * *', () => {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const oldReports = $app.findRecordsByFilter(
      'hp_reports',
      `created < "${oneHourAgo}"`,
      '', // sort
      0, // limit
      0 // offset
    );

    if (!oldReports || oldReports.length === 0) {
      return;
    }

    let deletedCount = 0;

    for (const report of oldReports) {
      try {
        $app.delete(report);
        deletedCount++;
      } catch (error) {
        console.error('[HP Reports Cleanup] Error deleting report:', error);
      }
    }

    console.log(`[HP Reports Cleanup] Deleted ${deletedCount} old HP reports`);
  } catch (error) {
    console.error('[HP Reports Cleanup] Unexpected error:', error);
  }
});

console.log('[HP Reports Cleanup] Cron job registered: cleanupHpReports every hour');
