/// <reference path="../pb_data/types.d.ts" />

/**
 * Mob Reset Events Cleanup Cron Job
 *
 * Deletes mob reset events older than 24 hours every 6 hours.
 */

cronAdd('cleanupMobResetEvents', '0 */6 * * *', () => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - 24); // 24 hours ago

    const oldEvents = $app.findRecordsByFilter(
      'mob_reset_events',
      `timestamp < "${cutoffDate.toISOString()}"`,
      '', // sort
      0, // limit
      0 // offset
    );

    if (!oldEvents || oldEvents.length === 0) {
      return;
    }

    let deletedCount = 0;

    for (const event of oldEvents) {
      try {
        $app.delete(event);
        deletedCount++;
      } catch (error) {
        console.error('[Mob Reset Events Cleanup] Error deleting event:', error);
      }
    }

    console.log(`[Mob Reset Events Cleanup] Deleted ${deletedCount} old mob reset events`);
  } catch (error) {
    console.error('[Mob Reset Events Cleanup] Unexpected error:', error);
  }
});

console.log('[Mob Reset Events Cleanup] Cron job registered: cleanupMobResetEvents every 6 hours');
