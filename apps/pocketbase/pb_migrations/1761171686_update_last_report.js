/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('mob_channel_status');
    const records = app.findRecordsByFilter(collection, 'last_report = null', '', 0, 0);
    let backfilled = 0;
    for (const record of records) {
      const lastUpdate = record.getDateTime('last_update');
      if (lastUpdate) {
        record.set('last_report', lastUpdate);
        app.save(record);
        backfilled++;
      }
    }
    console.log(`Backfilled last_report on ${backfilled} mob_channel_status rows.`);
  },
  (app) => {}
);
