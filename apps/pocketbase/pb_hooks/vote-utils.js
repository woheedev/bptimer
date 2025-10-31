/// <reference path="../pb_data/types.d.ts" />

const { REPUTATION_UPVOTE_GAIN, REPUTATION_DOWNVOTE_LOSS } = require(`${__hooks}/constants.js`);

function updateReputation(app, userId, voteType, delta) {
  try {
    const user = app.findRecordById('users', userId);
    const currentReputation = user.getInt('reputation') || 0;

    let reputationChange = 0;
    if (voteType === 'up') {
      reputationChange = REPUTATION_UPVOTE_GAIN * delta;
    } else if (voteType === 'down') {
      reputationChange = -REPUTATION_DOWNVOTE_LOSS * delta;
    }

    const newReputation = currentReputation + reputationChange;
    user.set('reputation', newReputation);
    app.save(user);
  } catch (error) {
    console.error(`[VOTES] reputation error userId=${userId}:`, error);
  }
}

function updateReportVoteCounts(app, reportId) {
  try {
    const upvoteResult = new DynamicModel({ count: 0 });
    app
      .db()
      .newQuery(
        'SELECT COUNT(*) as count FROM votes WHERE report = {:reportId} && vote_type = "up"'
      )
      .bind({ reportId: reportId })
      .one(upvoteResult);

    const downvoteResult = new DynamicModel({ count: 0 });
    app
      .db()
      .newQuery(
        'SELECT COUNT(*) as count FROM votes WHERE report = {:reportId} && vote_type = "down"'
      )
      .bind({ reportId: reportId })
      .one(downvoteResult);

    const upvoteCount = upvoteResult.count;
    const downvoteCount = downvoteResult.count;

    const report = app.findRecordById('hp_reports', reportId);
    report.set('upvotes', upvoteCount);
    report.set('downvotes', downvoteCount);
    app.save(report);
  } catch (error) {
    console.error(`[VOTES] voteCounts error report=${reportId}:`, error);
  }
}

module.exports = {
  updateReputation,
  updateReportVoteCounts
};
