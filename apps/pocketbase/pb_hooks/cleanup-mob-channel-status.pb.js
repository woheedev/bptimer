/// <reference path="../pb_data/types.d.ts" />

/**
 * Mob Channel Status Cleanup Cron Job
 *
 * Deletes mob_channel_status entries where channel_number exceeds the map's total_channels.
 * Runs daily 15 past midnight.
 */

cronAdd('cleanupMobChannelStatus', '15 0 * * *', () => {
  try {
    const countResult = new DynamicModel({ count: 0 });
    $app
      .db()
      .newQuery(
        `
        SELECT COUNT(*) as count
        FROM mob_channel_status mcs
        JOIN mobs m ON mcs.mob = m.id
        JOIN maps mp ON m.map = mp.id
        WHERE mcs.channel_number > mp.total_channels
      `
      )
      .one(countResult);

    const count = countResult.count;

    if (count > 0) {
      $app
        .db()
        .newQuery(
          `
          DELETE FROM mob_channel_status
          WHERE id IN (
            SELECT mcs.id
            FROM mob_channel_status mcs
            JOIN mobs m ON mcs.mob = m.id
            JOIN maps mp ON m.map = mp.id
            WHERE mcs.channel_number > mp.total_channels
          )
        `
        )
        .execute();

      console.log(`[CLEANUP] mob_channel_status deleted=${count}`);
    }
  } catch (error) {
    console.error(`[CLEANUP] mob_channel_status error:`, error);
  }
});

console.log('[CLEANUP] mob_channel_status hooks registered');
