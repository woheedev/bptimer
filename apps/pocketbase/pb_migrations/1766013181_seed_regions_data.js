/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const regions = ['SEA', 'JPKR'];

    // Update maps with region_data
    const mapsCollection = app.findCollectionByNameOrId('maps');
    const mapsData = [
      { uid: 1, name: 'Asterleeds', region_data: { NA: 100, SEA: 500, JPKR: 500 } },
      { uid: 2, name: 'Underground District', region_data: { NA: 20, SEA: 500, JPKR: 500 } },
      { uid: 3, name: 'Asteria Plains', region_data: { NA: 100, SEA: 500, JPKR: 500 } },
      { uid: 4, name: 'Windhowl Canyon', region_data: { NA: 20, SEA: 500, JPKR: 500 } },
      { uid: 5, name: "Skimmer's Lair", region_data: { NA: 50, SEA: 500, JPKR: 500 } },
      { uid: 6, name: 'Duskdye Woods', region_data: { NA: 30, SEA: 500, JPKR: 500 } },
      { uid: 7, name: 'Everfall Forest', region_data: { NA: 20, SEA: 500, JPKR: 500 } }
    ];

    // Update maps with region_data and create lookup map
    const mapRecordsById = {};
    for (const data of mapsData) {
      const existing = app.findRecordsByFilter(mapsCollection, 'uid = {:uid}', '', 1, 0, {
        uid: data.uid
      });
      if (existing.length > 0) {
        const record = existing[0];
        record.set('region_data', data.region_data);
        app.save(record);
        mapRecordsById[record.id] = data.region_data;
      }
    }

    // Get all mobs
    const mobsCollection = app.findCollectionByNameOrId('mobs');
    const mobRecords = app.findRecordsByFilter(mobsCollection, '', '', 10000, 0);

    // Create mob_channel_status for SEA and JPKR regions
    const mobChannelStatusCollection = app.findCollectionByNameOrId('mob_channel_status');
    let mobChannelStatusCount = 0;

    for (const mobRecord of mobRecords) {
      const mobMapId = mobRecord.get('map');

      // Get region_data from mapsData lookup
      const regionData = mapRecordsById[mobMapId];
      if (!regionData) {
        console.log(`Warning: Map not found for mob ${mobRecord.id}, mapId: ${mobMapId}`);
        continue;
      }

      // Create mob_channel_status for SEA and JPKR only
      for (const region of regions) {
        const totalChannels = regionData[region] || 0;

        if (totalChannels === 0) {
          console.log(
            `Warning: No channels for region ${region} in map ${mobMapId}, region_data:`,
            JSON.stringify(regionData)
          );
          continue;
        }

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
            try {
              const statusRecord = new Record(mobChannelStatusCollection);
              statusRecord.set('mob', mobRecord.id);
              statusRecord.set('channel_number', channelNum);
              statusRecord.set('region', region);
              statusRecord.set('last_hp', 100);
              app.save(statusRecord);
              statusRecord.set('last_update', statusRecord.getDateTime('created'));
              app.save(statusRecord);
              mobChannelStatusCount++;
            } catch (error) {
              console.log(
                `Error creating mob_channel_status for mob ${mobRecord.id}, channel ${channelNum}, region ${region}:`,
                error
              );
            }
          }
        }
      }
    }

    console.log(
      `Migration completed: Updated ${Object.keys(mapRecordsById).length} maps with region_data, processed ${mobRecords.length} mobs, created ${mobChannelStatusCount} mob_channel_status entries for SEA and JPKR regions.`
    );

    if (mobChannelStatusCount === 0) {
      console.log(
        'WARNING: No mob_channel_status records were created. Check logs above for warnings.'
      );
    }
  },
  (app) => {
    // No rollback needed
  }
);
