/// <reference path="../pb_data/types.d.ts" />

/**
 * Mob Respawn Cron Jobs
 *
 * This file handles automated mob respawn logic based on respawn_time values.
 *
 * Scenario 1: Reset mob_channel_status entries based on respawn_time
 * - If respawn_time is 0: Reset at the top of every hour (for bosses)
 * - If respawn_time is 30: Reset at the 30-minute mark
 * - For magical creatures: Reset at specific UTC hours (Lovely: 12,16,20; Breezy: 14,18,22)
 */

// Check for mob respawns every minute
cronAdd('mobRespawn', '* * * * *', () => {
  // Reset hours for magical creatures (UTC times to avoid DST changes)
  const magicalCreatureResetHours = {
    'Lovely Boarlet': [12, 16, 20],
    'Breezy Boarlet': [14, 18, 22]
  };

  try {
    const now = new Date();
    const currentMinute = now.getMinutes();
    const currentHour = now.getHours();

    console.log(
      `[Mob Respawn] Checking for respawns at ${currentHour}:${currentMinute.toString().padStart(2, '0')}`
    );

    // Find mobs that should respawn at the current minute
    const respawningMobs = $app.findRecordsByFilter(
      'mobs', // collection
      `respawn_time = ${currentMinute}`, // filter
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
      const mobType = mob.get('type');

      // Determine if this mob should reset based on type and time
      let shouldReset = false;
      if (mobType === 'boss') {
        shouldReset = true;
      } else if (mobType === 'magical_creature') {
        shouldReset = magicalCreatureResetHours[mobName]?.includes(currentHour);
      }

      if (!shouldReset) {
        continue;
      }

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
