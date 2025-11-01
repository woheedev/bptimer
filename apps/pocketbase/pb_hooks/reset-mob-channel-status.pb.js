/// <reference path="../pb_data/types.d.ts" />

/**
 * Mob Respawn Cron Jobs
 *
 * This file handles automated mob respawn logic based on respawn_time values.
 * - If respawn_time is 0: Reset at the top of every hour (for bosses)
 * - If respawn_time is 30: Reset at the 30-minute mark
 * - For magical creatures: Reset at specific UTC hours (Lovely: 12,16,20; Breezy: 14,18,22)
 */

// Check for mob respawns every minute
cronAdd('mobRespawn', '* * * * *', () => {
  const magicalCreatureResetHours = {
    'Lovely Boarlet': [12, 16, 20],
    'Breezy Boarlet': [14, 18, 22]
  };
  try {
    const now = new Date();
    const currentMinute = now.getMinutes();
    const currentHour = now.getHours();

    const respawningMobs = $app.findRecordsByFilter(
      'mobs',
      'respawn_time = {:currentMinute}',
      '',
      0,
      0,
      { currentMinute: currentMinute }
    );

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

        console.log(
          `[MOB_RESPAWN] reset mobs=${mobIds.length} time=${currentHour}:${currentMinute.toString().padStart(2, '0')}`
        );
      } catch (error) {
        console.error(`[MOB_RESPAWN] reset error:`, error);
      }
    }

    // Create reset events for all reset mobs
    if (resetMobs.length > 0) {
      try {
        const timestamp = new Date().toISOString().replace('T', ' ');
        const collection = $app.findCollectionByNameOrId('mob_reset_events');

        $app.runInTransaction((txApp) => {
          for (const mob of resetMobs) {
            const eventRecord = new Record(collection);
            eventRecord.set('mob', mob.id);
            eventRecord.set('type', 'reset');
            eventRecord.set('timestamp', timestamp);
            txApp.save(eventRecord);
          }
        });

        console.log(`[MOB_RESPAWN] events created=${resetMobs.length}`);
      } catch (error) {
        console.error(`[MOB_RESPAWN] events error:`, error);
      }
    }
  } catch (error) {
    console.error(`[MOB_RESPAWN] error:`, error);
  }
});

console.log('[MOB_RESPAWN] hooks registered');
