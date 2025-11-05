/// <reference path="../pb_data/types.d.ts" />

/**
 * HP Reports Hook
 *
 * Automatically creates/updates mob_channel_status records and broadcasts realtime updates when HP reports are created.
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
        'mob = {:mobId} && channel_number = {:channelNumber}',
        { mobId: mobId, channelNumber: channelNumber }
      );
      statusRecord.set('last_hp', hpPercentage);
      statusRecord.set('last_update', new Date().toISOString().replace('T', ' '));
      e.app.save(statusRecord);
    } catch {
      // If record doesn't exist, create it
      statusRecord = new Record(e.app.findCollectionByNameOrId('mob_channel_status'), {
        mob: mobId,
        channel_number: channelNumber,
        last_hp: hpPercentage,
        last_update: new Date().toISOString().replace('T', ' ')
      });
      e.app.save(statusRecord);
    }

    // Broadcast via custom topic
    try {
      const message = new SubscriptionMessage({
        name: 'mob_hp_updates',
        data: JSON.stringify([mobId, channelNumber, hpPercentage])
      });

      const clients = e.app.subscriptionsBroker().clients();
      for (let clientId in clients) {
        if (clients[clientId].hasSubscription('mob_hp_updates')) {
          clients[clientId].send(message);
        }
      }
    } catch (error) {
      console.error(`[CHANNEL_STATUS] broadcast error:`, error);
    }
  } catch (error) {
    console.error(`[CHANNEL_STATUS] error:`, error);
  }

  return e.next();
}, 'hp_reports');

console.log('[CHANNEL_STATUS] hooks registered');
