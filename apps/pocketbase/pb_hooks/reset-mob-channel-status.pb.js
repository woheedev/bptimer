/// <reference path="../pb_data/types.d.ts"">

/**
 * Mob Respawn Cron Jobs
 *
 * This file handles automated mob respawn logic based on respawn_time values.
 *
 * Scenario 1: Reset mob_channel_status entries based on respawn_time
 * - If respawn_time is 0: Reset at the top of every hour
 * - If respawn_time is 30: Reset at the 30-minute mark
 */

// Check for mob respawns every minute
cronAdd('mobRespawn', '* * * * *', () => {
  try {
    const now = new Date();
    const currentMinute = now.getMinutes();
    const currentHour = now.getHours();

    console.log(
      `[Mob Respawn] Checking for respawns at ${currentHour}:${currentMinute.toString().padStart(2, '0')}`
    );

    // Find mobs that should respawn at the current minute
    // Only consider boss type mobs with respawn_time matching current minute
    const respawningMobs = $app.findRecordsByFilter(
      'mobs', // collection
      `type = 'boss' && respawn_time = ${currentMinute}`, // filter
      '', // sort
      0, // limit
      0 // offset
    );

    console.log(`[Mob Respawn] Found ${respawningMobs?.length || 0} mobs respawning this minute`);

    if (!respawningMobs || respawningMobs.length === 0) {
      return;
    }

    let totalResetCount = 0;

    // Reset each respawning mob's channel status
    for (const mob of respawningMobs) {
      const mobName = mob.get('name');
      const mobId = mob.id;

      try {
        // Find all channel status records for this mob
        const statusRecords = $app.findRecordsByFilter(
          'mob_channel_status', // collection
          `mob = "${mobId}"`, // filter
          '', // sort
          0, // limit
          0 // offset
        );

        if (!statusRecords || statusRecords.length === 0) {
          continue;
        }

        // Reset HP to 100% for all channel status records
        for (const status of statusRecords) {
          status.set('last_hp', 100);
          status.set('last_update', new Date().toISOString());
          $app.save(status);
          totalResetCount++;
        }

        console.log(
          `[Mob Respawn] Reset ${statusRecords.length} channels for ${mobName} to 100% HP`
        );
      } catch (error) {
        console.error(`[Mob Respawn] Error resetting ${mobName}:`, error);
      }
    }

    console.log(`[Mob Respawn] Completed: Reset ${totalResetCount} total channel status records`);
  } catch (error) {
    console.error('[Mob Respawn] Unexpected error in respawn cron job:', error);
  }
});

console.log('[Mob Respawn] Cron jobs registered: mobRespawn check every minute');
