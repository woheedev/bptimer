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

    const resetMobs = [];
    const mobIds = [];

    // Collect mob IDs that should reset
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

      if (shouldReset) {
        resetMobs.push({ id: mobId, name: mobName });
        mobIds.push(mobId);
      }
    }

    // Batch update all channel status records for resetting mobs
    if (mobIds.length > 0) {
      try {
        const placeholders = mobIds.map((_, i) => `{:mob${i}}`).join(',');
        const updateQuery = `UPDATE mob_channel_status SET last_hp = 100, last_update = {:timestamp} WHERE mob IN (${placeholders})`;
        const bindObj = { timestamp: new Date().toISOString().replace('T', ' ') };
        mobIds.forEach((id, i) => (bindObj[`mob${i}`] = id));
        $app.db().newQuery(updateQuery).bind(bindObj).execute();

        console.log(`[Mob Respawn] Batch reset channels for ${mobIds.length} mobs to 100% HP`);
      } catch (error) {
        console.error('[Mob Respawn] Error in batch update:', error);
      }
    }

    // Create reset events for all reset mobs
    if (resetMobs.length > 0) {
      try {
        for (const mob of resetMobs) {
          const eventRecord = new Record($app.findCollectionByNameOrId('mob_reset_events'));
          eventRecord.set('mob', mob.id);
          eventRecord.set('type', 'reset');
          eventRecord.set('timestamp', new Date().toISOString().replace('T', ' '));
          $app.save(eventRecord);
        }
        console.log(`[Mob Respawn] Created ${resetMobs.length} reset events`);
      } catch (error) {
        console.error('[Mob Respawn] Error creating reset events:', error);
      }
    }

    console.log(`[Mob Respawn] Completed: Reset ${resetMobs.length} total channel status records`);
  } catch (error) {
    console.error('[Mob Respawn] Unexpected error in respawn cron job:', error);
  }
});

console.log('[Mob Respawn] Cron jobs registered: mobRespawn check every minute');
