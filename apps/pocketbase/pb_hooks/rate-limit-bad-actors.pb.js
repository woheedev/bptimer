/// <reference path="../pb_data/types.d.ts" />

/**
 * Rate limit users with bad reputation
 * Checks if user has low reputation and enforces cooldown between reports
 */
onRecordCreate((e) => {
  const { BAD_REPORT_THRESHOLD, RATE_LIMITED_COOLDOWN, BYPASS_VOTE_USER_IDS_SET } = require(
    `${__hooks}/constants.js`
  );

  try {
    const reporterId = e.record.get('reporter');

    if (BYPASS_VOTE_USER_IDS_SET.has(reporterId)) {
      return e.next();
    }

    const reporter = e.app.findRecordById('users', reporterId);
    const reputation = reporter.getInt('reputation') || 0;

    if (reputation < BAD_REPORT_THRESHOLD) {
      const recentReports = e.app.findRecordsByFilter(
        'hp_reports',
        'reporter = {:reporterId}',
        '-created',
        1,
        0,
        { reporterId: reporterId }
      );

      if (recentReports.length > 0) {
        const lastReportTime = new Date(recentReports[0].get('created')).getTime();
        const now = Date.now();
        const timeSinceLastReport = now - lastReportTime;

        if (timeSinceLastReport < RATE_LIMITED_COOLDOWN) {
          const waitTimeMinutes = Math.ceil((RATE_LIMITED_COOLDOWN - timeSinceLastReport) / 60000);
          throw new BadRequestError(
            `Your reporting privileges are limited due to low reputation (${reputation}). Please wait ${waitTimeMinutes} more minutes before submitting another report.`
          );
        }
      }
    }
  } catch (error) {
    if (error instanceof BadRequestError) {
      throw error;
    }
    console.error(`[RATE_LIMIT] error:`, error);
    throw new BadRequestError('Failed to validate report submission');
  }

  return e.next();
}, 'hp_reports');

console.log('[RATE_LIMIT] hooks registered');
