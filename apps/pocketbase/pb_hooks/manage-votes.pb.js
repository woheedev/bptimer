/// <reference path="../pb_data/types.d.ts" />

// Validate vote time window before creating votes
onRecordCreate((e) => {
  const { VOTE_TIME_WINDOW, BYPASS_VOTE_USER_IDS_SET } = require(`${__hooks}/constants.js`);

  const voteRecord = e.record;
  const voterId = voteRecord.get('voter');

  try {
    const report = e.app.findRecordById('hp_reports', voteRecord.get('report'));
    const reporterId = report.get('reporter');

    if (voterId === reporterId) {
      throw new BadRequestError('You cannot vote on your own report');
    }

    if (BYPASS_VOTE_USER_IDS_SET.has(reporterId)) {
      throw new BadRequestError('Cannot vote on reports from this user');
    }

    const reportCreatedTime = new Date(report.get('created')).getTime();
    const now = Date.now();
    const timeSinceReport = now - reportCreatedTime;

    if (timeSinceReport > VOTE_TIME_WINDOW) {
      throw new BadRequestError(
        `Voting period has expired. You can only vote within ${VOTE_TIME_WINDOW / 60000} minutes of the report.`
      );
    }

    console.log(`[VOTES] validated report=${voteRecord.get('report')}`);
  } catch (error) {
    if (error instanceof BadRequestError) {
      throw error;
    }
    console.error(`[VOTES] validation error:`, error);
    throw new BadRequestError('Failed to validate vote');
  }

  return e.next();
}, 'votes');

// After vote is created, update reputation and report counts
onRecordAfterCreateSuccess((e) => {
  const { updateReputation, updateReportVoteCounts } = require(`${__hooks}/vote-utils.js`);

  try {
    const voteRecord = e.record;
    const reportId = voteRecord.get('report');
    const voteType = voteRecord.get('vote_type');
    const report = e.app.findRecordById('hp_reports', reportId);
    const reporterId = report.get('reporter');

    updateReputation(e.app, reporterId, voteType, 1);
    updateReportVoteCounts(e.app, reportId);
  } catch (error) {
    console.error(`[VOTES] create error:`, error);
  }

  return e.next();
}, 'votes');

// After vote is updated, adjust reputation and report counts
onRecordUpdate((e) => {
  const { updateReputation, updateReportVoteCounts } = require(`${__hooks}/vote-utils.js`);

  try {
    const voteRecord = e.record;
    const newVoteType = voteRecord.get('vote_type');
    const oldRecord = e.app.findRecordById('votes', voteRecord.id);
    const oldVoteType = oldRecord.get('vote_type');

    if (newVoteType === oldVoteType) {
      return e.next();
    }

    const reportId = voteRecord.get('report');
    const report = e.app.findRecordById('hp_reports', reportId);
    const reporterId = report.get('reporter');

    updateReputation(e.app, reporterId, oldVoteType, -1);
    updateReputation(e.app, reporterId, newVoteType, 1);
    updateReportVoteCounts(e.app, reportId);
  } catch (error) {
    console.error(`[VOTES] update error:`, error);
  }

  return e.next();
}, 'votes');

// After vote is deleted, remove reputation impact and update counts
onRecordDelete((e) => {
  const { updateReputation, updateReportVoteCounts } = require(`${__hooks}/vote-utils.js`);

  try {
    const voteRecord = e.record;
    const reportId = voteRecord.get('report');
    const voteType = voteRecord.get('vote_type');
    const report = e.app.findRecordById('hp_reports', reportId);
    const reporterId = report.get('reporter');

    updateReputation(e.app, reporterId, voteType, -1);
    updateReportVoteCounts(e.app, reportId);
  } catch (error) {
    console.error(`[VOTES] delete error:`, error);
  }

  return e.next();
}, 'votes');

console.log('[VOTES] hooks registered');
