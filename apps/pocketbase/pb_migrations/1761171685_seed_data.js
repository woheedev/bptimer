/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const regions = ['NA', 'SEA'];

    // Seed maps first (upsert)
    const mapsCollection = app.findCollectionByNameOrId('maps');
    const mapsData = [
      { uid: 1, name: 'Asterleeds', region_data: { NA: 101, SEA: 100 } },
      { uid: 2, name: 'Underground District', region_data: { NA: 10, SEA: 10 } },
      { uid: 3, name: 'Asteria Plains', region_data: { NA: 70, SEA: 70 } },
      { uid: 4, name: 'Windhowl Canyon', region_data: { NA: 10, SEA: 5 } },
      { uid: 5, name: "Skimmer's Lair", region_data: { NA: 10, SEA: 10 } },
      { uid: 6, name: 'Duskdye Woods', region_data: { NA: 10, SEA: 10 } },
      { uid: 7, name: 'Everfall Forest', region_data: { NA: 10, SEA: 10 } }
    ];

    const mapRecords = [];
    let mapsCreated = 0;
    for (const data of mapsData) {
      const existing = app.findRecordsByFilter(mapsCollection, 'uid = {:uid}', '', 1, 0, {
        uid: data.uid
      });
      let record;
      if (existing.length === 0) {
        record = new Record(mapsCollection);
        record.load(data);
        app.save(record);
        mapsCreated++;
      } else {
        record = existing[0];
        // Update if region_data changed
        const existingRegionData = record.get('region_data');
        if (JSON.stringify(existingRegionData) !== JSON.stringify(data.region_data)) {
          record.set('region_data', data.region_data);
          app.save(record);
        }
      }
      mapRecords.push(record);
    }

    // Seed mobs (upsert)
    const mobsCollection = app.findCollectionByNameOrId('mobs');
    const mobsData = [
      {
        uid: 1,
        type: 'boss',
        name: 'Golden Juggernaut',
        map: mapRecords[2].id,
        respawn_time: 0,
        monster_id: 10032
      },
      {
        uid: 2,
        type: 'boss',
        name: 'Frost Ogre',
        map: mapRecords[2].id,
        respawn_time: 30,
        monster_id: 10009
      },
      {
        uid: 3,
        type: 'boss',
        name: 'Inferno Ogre',
        map: mapRecords[2].id,
        respawn_time: 0,
        monster_id: 10018
      },
      {
        uid: 4,
        type: 'boss',
        name: 'Phantom Arachnocrab',
        map: mapRecords[1].id,
        respawn_time: 30,
        monster_id: 10069
      },
      {
        uid: 5,
        type: 'boss',
        name: 'Brigand Leader',
        map: mapRecords[2].id,
        respawn_time: 0,
        monster_id: 10056
      },
      {
        uid: 6,
        type: 'boss',
        name: 'Venobzzar Incubator',
        map: mapRecords[1].id,
        respawn_time: 30,
        monster_id: 10077
      },
      {
        uid: 7,
        type: 'boss',
        name: 'Muku Chief',
        map: mapRecords[2].id,
        respawn_time: 0,
        monster_id: 10059
      },
      {
        uid: 8,
        type: 'boss',
        name: 'Iron Fang',
        map: mapRecords[3].id,
        respawn_time: 30,
        monster_id: 10081
      },
      {
        uid: 9,
        type: 'boss',
        name: 'Storm Goblin King',
        map: mapRecords[3].id,
        respawn_time: 0,
        monster_id: 10007
      },
      {
        uid: 10,
        type: 'boss',
        name: 'Tempest Ogre',
        map: mapRecords[2].id,
        respawn_time: 30,
        monster_id: 10010
      },
      {
        uid: 11,
        type: 'boss',
        name: 'Celestial Flier',
        map: mapRecords[4].id,
        respawn_time: 0,
        monster_id: 10084
      },
      {
        uid: 12,
        type: 'boss',
        name: 'Lizardman King',
        map: mapRecords[4].id,
        respawn_time: 30,
        monster_id: 10085
      },
      {
        uid: 13,
        type: 'boss',
        name: 'Goblin King',
        map: mapRecords[5].id,
        respawn_time: 0,
        monster_id: 10086
      },
      {
        uid: 14,
        type: 'boss',
        name: 'Muku King',
        map: mapRecords[6].id,
        respawn_time: 30,
        monster_id: 10029
      },
      {
        uid: 15,
        type: 'magical_creature',
        name: 'Lovely Boarlet',
        map: mapRecords[2].id,
        respawn_time: 0,
        monster_id: 10902
      },
      {
        uid: 16,
        type: 'magical_creature',
        name: 'Breezy Boarlet',
        map: mapRecords[2].id,
        respawn_time: 0,
        monster_id: 10903
      },
      {
        uid: 17,
        type: 'magical_creature',
        name: 'Loyal Boarlet',
        map: mapRecords[2].id,
        respawn_time: 0,
        monster_id: 10904
      },
      {
        uid: 18,
        type: 'magical_creature',
        name: 'Golden Nappo',
        map: mapRecords[2].id,
        respawn_time: 0,
        monster_id: 10900
      },
      {
        uid: 19,
        type: 'magical_creature',
        name: 'Silver Nappo',
        map: mapRecords[2].id,
        respawn_time: 0,
        monster_id: 10901
      }
    ];

    const mobRecords = [];
    let mobsCreated = 0;
    for (const data of mobsData) {
      const existing = app.findRecordsByFilter(mobsCollection, 'uid = {:uid}', '', 1, 0, {
        uid: data.uid
      });
      let record;
      if (existing.length === 0) {
        record = new Record(mobsCollection);
        record.load(data);
        app.save(record);
        mobsCreated++;
      } else {
        record = existing[0];
        // Update fields if changed
        let changed = false;
        for (const [key, value] of Object.entries(data)) {
          if (record.get(key) !== value) {
            record.set(key, value);
            changed = true;
          }
        }
        if (changed) {
          app.save(record);
        }
      }
      mobRecords.push(record);
    }

    const mobChannelStatusCollection = app.findCollectionByNameOrId('mob_channel_status');
    let mobChannelStatusCount = 0;

    for (const mobRecord of mobRecords) {
      const mobMapId = mobRecord.get('map');

      // Find the map record to get region_data
      const mapRecord = mapRecords.find((m) => m.id === mobMapId);
      if (!mapRecord) continue;

      const regionData = mapRecord.get('region_data');

      // Create mob_channel_status for each region
      for (const region of regions) {
        const totalChannels = regionData?.[region] || 0;

        for (let channelNum = 1; channelNum <= totalChannels; channelNum++) {
          // Check if entry already exists
          const existingRecords = app.findRecordsByFilter(
            mobChannelStatusCollection,
            'mob = {:mobId} && channel_number = {:channelNum} && region = {:region}',
            '',
            1,
            0,
            { mobId: mobRecord.id, channelNum: channelNum, region: region }
          );

          if (existingRecords.length === 0) {
            const statusRecord = new Record(mobChannelStatusCollection);
            statusRecord.set('mob', mobRecord.id);
            statusRecord.set('channel_number', channelNum);
            statusRecord.set('region', region);
            statusRecord.set('last_hp', 100);
            app.save(statusRecord);
            statusRecord.set('last_update', statusRecord.getDateTime('created'));
            app.save(statusRecord);
            mobChannelStatusCount++;
          }
        }
      }
    }

    console.log(
      `Seeding complete: ${mapsCreated} new maps, ${mobsCreated} new mobs, ${mobChannelStatusCount} mob_channel_status entries created.`
    );
  },
  (app) => {
    // Optional cleanup on down migration
    // Remove all seeded records
    try {
      const collections = ['maps', 'mobs', 'mob_channel_status'];
      for (const collectionName of collections) {
        const collection = app.findCollectionByNameOrId(collectionName);
        const records = app.findRecordsByFilter(collection, "created >= '2025-01-01 00:00:00'");
        for (const record of records) {
          app.delete(record);
        }
      }
    } catch (error) {
      console.log('Cleanup skipped:', error.message);
    }
  }
);
