/// <reference path="../pb_data/types.d.ts" />

/**
 * HP Reports Hook
 *
 * Automatically creates/updates mob_channel_status records when HP reports are created.
 */
onRecordAfterCreateSuccess((e) => {
  try {
    const hpReport = e.record;
    const mobId = hpReport.get('mob');
    const channelNumber = hpReport.get('channel_number');
    const hpPercentage = hpReport.get('hp_percentage');

    // Find existing mob_channel_status record
    let statusRecord;
    try {
      statusRecord = e.app.findFirstRecordByFilter(
        'mob_channel_status',
        `mob = "${mobId}" && channel_number = ${channelNumber}`
      );
    } catch {
      // If record doesn't exist, create it
      statusRecord = new Record(e.app.findCollectionByNameOrId('mob_channel_status'), {
        mob: mobId,
        channel_number: channelNumber,
        last_hp: hpPercentage,
        last_update: new Date().toISOString()
      });
      e.app.save(statusRecord);
    }

    // Update record
    if (statusRecord) {
      statusRecord.set('last_hp', hpPercentage);
      statusRecord.set('last_update', new Date().toISOString());
      e.app.save(statusRecord);
    }

    // Also update mob_channel_status_sse
    try {
      let statusSseRecord;
      try {
        statusSseRecord = e.app.findFirstRecordByFilter(
          'mob_channel_status_sse',
          `mob = "${mobId}" && channel_number = ${channelNumber}`
        );
      } catch {
        // If record doesn't exist, create it
        statusSseRecord = new Record(e.app.findCollectionByNameOrId('mob_channel_status_sse'), {
          mob: mobId,
          channel_number: channelNumber,
          last_hp: hpPercentage,
          last_update: new Date().toISOString()
        });
        e.app.save(statusSseRecord);
      }

      // Update record
      if (statusSseRecord) {
        statusSseRecord.set('last_hp', hpPercentage);
        statusSseRecord.set('last_update', new Date().toISOString());
        e.app.save(statusSseRecord);
      }
    } catch (error) {
      console.error('Error in mob_channel_status_sse reports hook:', error);
    }
  } catch (error) {
    console.error('Error in mob_channel_status reports hook:', error);
  }

  return e.next();
}, 'hp_reports');
