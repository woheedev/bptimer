/// <reference path="../pb_data/types.d.ts" />

/**
 * Prevent Duplicate HP Reports Hook
 *
 * Prevents creating duplicate HP reports for the same user, mob, channel, and HP percentage.
 * Also prevents submissions with HP higher than the user's previous report for the same mob/channel.
 */
onRecordCreate((e) => {
  const hpReport = e.record;
  const reporterId = hpReport.get('reporter');
  const mobId = hpReport.get('mob');
  const channelNumber = hpReport.get('channel_number');
  const hpPercentage = hpReport.get('hp_percentage');

  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString().replace('T', ' ');

  // Check for exact duplicate
  try {
    const duplicateResult = new DynamicModel({ count: 0 });
    $app
      .db()
      .newQuery(
        'SELECT COUNT(*) as count FROM hp_reports WHERE reporter = {:reporter} AND mob = {:mob} AND channel_number = {:channel} AND hp_percentage = {:hp} AND created > {:cutoff}'
      )
      .bind({
        reporter: reporterId,
        mob: mobId,
        channel: channelNumber,
        hp: hpPercentage,
        cutoff: fiveMinutesAgo
      })
      .one(duplicateResult);

    if (duplicateResult.count > 0) {
      throw new BadRequestError('You have already reported this HP percentage');
    }
  } catch (error) {
    if (error.message.includes('already reported this HP')) {
      throw error;
    }
    console.log(`[HP] Duplicate check error: ${error.message}`);
  }

  // Check for higher HP within time window
  try {
    const lastHpResult = new DynamicModel({ hp_percentage: 0 });
    $app
      .db()
      .newQuery(
        'SELECT hp_percentage FROM hp_reports WHERE reporter = {:reporter} AND mob = {:mob} AND channel_number = {:channel} AND created > {:cutoff} ORDER BY created DESC LIMIT 1'
      )
      .bind({
        reporter: reporterId,
        mob: mobId,
        channel: channelNumber,
        cutoff: fiveMinutesAgo
      })
      .one(lastHpResult);

    if (hpPercentage > lastHpResult.hp_percentage) {
      throw new BadRequestError('HP percentage can only decrease');
    }
  } catch (error) {
    if (error.message.includes('can only decrease')) {
      throw error;
    }
    // No previous report in window or query error (expected)
  }

  e.next();
}, 'hp_reports');

console.log('[Prevent Duplicate HP Reports] Hook registered for hp_reports collection');
