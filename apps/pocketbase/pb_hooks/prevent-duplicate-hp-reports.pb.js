/// <reference path="../pb_data/types.d.ts" />

/**
 * Prevent Duplicate HP Reports Hook
 *
 * Prevents creating duplicate HP reports for the same user, mob, channel, and HP percentage.
 * If a duplicate is detected, updates the mob_channel_status instead and prevents the report creation.
 */
onRecordCreateRequest((e) => {
  try {
    const hpReport = e.record;
    const reporterId = hpReport.get('reporter');
    const mobId = hpReport.get('mob');
    const channelNumber = hpReport.get('channel_number');
    const hpPercentage = hpReport.get('hp_percentage');

    // Only check for duplicates within the last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

    // Check for existing report with same details within time window
    let existingReport;
    try {
      existingReport = e.app.findFirstRecordByFilter(
        'hp_reports',
        `reporter = "${reporterId}" && mob = "${mobId}" && channel_number = ${channelNumber} && hp_percentage = ${hpPercentage} && created > "${fiveMinutesAgo}"`
      );
    } catch {
      // No existing report found, allow creation
      return e.next();
    }

    if (existingReport) {
      // Duplicate found, update mob_channel_status and prevent creation
      let statusRecord;
      try {
        statusRecord = e.app.findFirstRecordByFilter(
          'mob_channel_status',
          `mob = "${mobId}" && channel_number = ${channelNumber}`
        );
      } catch {
        // Create new status record if it doesn't exist
        statusRecord = new Record(e.app.findCollectionByNameOrId('mob_channel_status'), {
          mob: mobId,
          channel_number: channelNumber,
          last_hp: hpPercentage,
          last_update: new Date().toISOString()
        });
        e.app.save(statusRecord);
      }

      // Update existing status record
      if (statusRecord) {
        statusRecord.set('last_hp', hpPercentage);
        statusRecord.set('last_update', new Date().toISOString());
        e.app.save(statusRecord);
      }

      // Prevent the duplicate report creation
      e.preventDefault();
      return;
    }

    // No duplicate, allow creation
    return e.next();
  } catch (error) {
    console.error('Error in prevent duplicate HP reports hook:', error);
    return e.next();
  }
}, 'hp_reports');
