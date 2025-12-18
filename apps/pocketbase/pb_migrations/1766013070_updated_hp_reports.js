/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('pbc_3114863239');

    // update collection data
    unmarshal(
      {
        indexes: [
          'CREATE INDEX `idx_hp_reports_mob_channel_number` ON `hp_reports` (`mob`, `channel_number`)',
          'CREATE INDEX `idx_hp_reports_mob_created` ON `hp_reports` (`mob`, `created` DESC)',
          'CREATE INDEX `idx_hp_reports_reporter_created` ON `hp_reports` (`reporter`, `created` DESC)',
          'CREATE INDEX `idx_hp_reports_mob_channel_created` ON `hp_reports` (`mob`, `channel_number`, `created` DESC)',
          'CREATE INDEX `idx_hp_reports_reporter_mob_channel_hp_created` ON `hp_reports` (`reporter`, `mob`, `channel_number`, `hp_percentage`, `created` DESC)',
          'CREATE INDEX `idx_hp_reports_reporter_mob_channel_created` ON `hp_reports` (`reporter`, `mob`, `channel_number`, `created` DESC)',
          'CREATE INDEX `idx_DdsxygPDZH` ON `hp_reports` (\n  `mob`,\n  `region`\n)'
        ]
      },
      collection
    );

    return app.save(collection);
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('pbc_3114863239');

    // update collection data
    unmarshal(
      {
        indexes: [
          'CREATE INDEX `idx_hp_reports_mob_channel_number` ON `hp_reports` (`mob`, `channel_number`)',
          'CREATE INDEX `idx_hp_reports_mob_created` ON `hp_reports` (`mob`, `created` DESC)',
          'CREATE INDEX `idx_hp_reports_reporter_created` ON `hp_reports` (`reporter`, `created` DESC)',
          'CREATE INDEX `idx_hp_reports_mob_channel_created` ON `hp_reports` (`mob`, `channel_number`, `created` DESC)',
          'CREATE INDEX `idx_hp_reports_reporter_mob_channel_hp_created` ON `hp_reports` (`reporter`, `mob`, `channel_number`, `hp_percentage`, `created` DESC)',
          'CREATE INDEX `idx_hp_reports_reporter_mob_channel_created` ON `hp_reports` (`reporter`, `mob`, `channel_number`, `created` DESC)'
        ]
      },
      collection
    );

    return app.save(collection);
  }
);
