/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('pbc_3682110470');

    // update collection data
    unmarshal(
      {
        indexes: [
          'CREATE UNIQUE INDEX `idx_mob_channel_status_mob_channel` ON `mob_channel_status` (\n  `mob`,\n  `channel_number`,\n  `region`\n)'
        ]
      },
      collection
    );

    return app.save(collection);
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('pbc_3682110470');

    // update collection data
    unmarshal(
      {
        indexes: [
          'CREATE UNIQUE INDEX `idx_mob_channel_status_mob_channel` ON `mob_channel_status` (`mob`, `channel_number`)'
        ]
      },
      collection
    );

    return app.save(collection);
  }
);
