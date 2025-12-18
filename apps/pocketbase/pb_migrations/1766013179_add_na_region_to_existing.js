/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    // Update mob_channel_status records with empty region to "NA"
    const mobChannelStatusCollection = app.findCollectionByNameOrId('mob_channel_status');
    const mobChannelStatusRecords = app.findRecordsByFilter(
      mobChannelStatusCollection,
      '',
      '',
      10000,
      0
    );

    for (const record of mobChannelStatusRecords) {
      if (!record.get('region')) {
        record.set('region', 'NA');
        app.save(record);
      }
    }

    // Update hp_reports records with empty region to "NA"
    const hpReportsCollection = app.findCollectionByNameOrId('hp_reports');
    const hpReportsRecords = app.findRecordsByFilter(hpReportsCollection, '', '', 10000, 0);

    for (const record of hpReportsRecords) {
      if (!record.get('region')) {
        record.set('region', 'NA');
        app.save(record);
      }
    }

    console.log('Migration completed: Seeded region data for existing records');
  },
  (app) => {
    // No rollback needed
  }
);
