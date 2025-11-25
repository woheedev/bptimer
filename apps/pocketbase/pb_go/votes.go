package pb_go

import (
	"fmt"
	"log"
	"time"

	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/apis"
	"github.com/pocketbase/pocketbase/core"
)

// InitVoteHooks registers vote validation, reputation updates, and rate limiting hooks.
func InitVoteHooks(app core.App) {
	app.OnRecordCreate(COLLECTION_VOTES).BindFunc(func(e *core.RecordEvent) error {
		return validateVote(e)
	})

	app.OnRecordAfterCreateSuccess(COLLECTION_VOTES).BindFunc(func(e *core.RecordEvent) error {
		return handleVoteCreated(e)
	})

	app.OnRecordAfterUpdateSuccess(COLLECTION_VOTES).BindFunc(func(e *core.RecordEvent) error {
		return handleVoteUpdated(e)
	})

	app.OnRecordAfterDeleteSuccess(COLLECTION_VOTES).BindFunc(func(e *core.RecordEvent) error {
		return handleVoteDeleted(e)
	})

	app.OnRecordCreate(COLLECTION_HP_REPORTS).BindFunc(func(e *core.RecordEvent) error {
		return rateLimitBadActors(e)
	})

	log.Printf("[VOTES] Hooks registered")
}

// validateVote enforces vote rules: no self-voting, no voting on API user reports,
// 2-minute vote window, and reputation-based voting restrictions.
func validateVote(e *core.RecordEvent) error {
	voteRecord := e.Record
	voterId := voteRecord.GetString("voter")
	reportId := voteRecord.GetString("report")

	report, err := e.App.FindRecordById(COLLECTION_HP_REPORTS, reportId)
	if err != nil {
		return apis.NewNotFoundError("Report not found", err)
	}

	// Cache report in app.Store for reuse in handleVoteCreated
	// Key format: "vote_report_{voteId}" - cleaned up after vote operation
	e.App.Store().Set(fmt.Sprintf("vote_report_%s", voteRecord.Id), report)

	reporterId := report.GetString("reporter")

	if voterId == reporterId {
		return apis.NewForbiddenError("You cannot vote on your own report", nil)
	}

	if BypassVoteUserIDs[reporterId] {
		return apis.NewForbiddenError("Cannot vote on reports from this user", nil)
	}

	reportCreatedTime, err := time.Parse("2006-01-02 15:04:05.000Z", report.GetString("created"))
	if err != nil {
		return apis.NewBadRequestError("Invalid report creation time", err)
	}

	timeSinceReport := time.Since(reportCreatedTime)
	if timeSinceReport > voteTimeWindow {
		minutes := int(voteTimeWindow.Minutes())
		return apis.NewApiError(409,
			fmt.Sprintf("Voting period has expired. You can only vote within %d minutes of the report.", minutes),
			nil,
		)
	}

	if !BypassVoteUserIDs[voterId] {
		voter, err := e.App.FindRecordById(COLLECTION_USERS, voterId)
		if err != nil {
			return apis.NewBadRequestError("Voter not found", err)
		}

		voterReputation := voter.GetInt("reputation")
		if voterReputation <= RATE_LIMIT_THRESHOLD {
			return apis.NewForbiddenError(
				fmt.Sprintf("Your voting privileges are suspended due to low reputation (%d). Improve your report quality to restore voting rights.", voterReputation),
				nil,
			)
		}
	}

	return e.Next()
}

func handleVoteCreated(e *core.RecordEvent) error {
	voteRecord := e.Record
	reportId := voteRecord.GetString("report")
	voteType := voteRecord.GetString("vote_type")

	cacheKey := fmt.Sprintf("vote_report_%s", voteRecord.Id)
	var report *core.Record
	var reporterId string

	if cachedReport := e.App.Store().Get(cacheKey); cachedReport != nil {
		report = cachedReport.(*core.Record)
		reporterId = report.GetString("reporter")
		e.App.Store().Remove(cacheKey) // Clean up cache
	} else {
		// Cache miss - fetch from DB
		var err error
		report, err = e.App.FindRecordById(COLLECTION_HP_REPORTS, reportId)
		if err != nil {
			log.Printf("[VOTES] create report not found error=%v", err)
			return e.Next()
		}
		reporterId = report.GetString("reporter")
	}

	if err := updateReputation(e.App, reporterId, voteType, 1); err != nil {
		log.Printf("[VOTES] create reputation update error=%v", err)
	}

	if err := updateReportVoteCounts(e.App, reportId); err != nil {
		log.Printf("[VOTES] create vote counts update error=%v", err)
	}

	return e.Next()
}

func handleVoteUpdated(e *core.RecordEvent) error {
	reportId := e.Record.GetString("report")

	if err := updateReportVoteCounts(e.App, reportId); err != nil {
		log.Printf("[VOTES] update vote counts error=%v", err)
	}

	return e.Next()
}

func handleVoteDeleted(e *core.RecordEvent) error {
	voteRecord := e.Record
	reportId := voteRecord.GetString("report")
	voteType := voteRecord.GetString("vote_type")

	report, err := e.App.FindRecordById(COLLECTION_HP_REPORTS, reportId)
	if err != nil {
		log.Printf("[VOTES] delete report not found error=%v", err)
		return e.Next()
	}

	reporterId := report.GetString("reporter")

	if err := updateReputation(e.App, reporterId, voteType, -1); err != nil {
		log.Printf("[VOTES] delete reputation update error=%v", err)
	}

	if err := updateReportVoteCounts(e.App, reportId); err != nil {
		log.Printf("[VOTES] delete vote counts update error=%v", err)
	}

	return e.Next()
}

func updateReputation(app core.App, userId string, voteType string, delta int) error {
	user, err := app.FindRecordById(COLLECTION_USERS, userId)
	if err != nil {
		return fmt.Errorf("failed to find user: %w", err)
	}

	currentReputation := user.GetInt("reputation")

	reputationChange := 0
	switch voteType {
	case "up":
		reputationChange = REPUTATION_UPVOTE_GAIN * delta
	case "down":
		reputationChange = -REPUTATION_DOWNVOTE_LOSS * delta
	default:
		reputationChange = 0
	}

	newReputation := currentReputation + reputationChange
	user.Set("reputation", newReputation)

	if err := app.Save(user); err != nil {
		return fmt.Errorf("failed to save user reputation: %w", err)
	}

	return nil
}

func updateReportVoteCounts(app core.App, reportId string) error {
	_, err := app.DB().
		NewQuery(`
			UPDATE hp_reports 
			SET 
				upvotes = (
					SELECT COALESCE(COUNT(*), 0) 
					FROM votes 
					WHERE report = {:reportId} AND vote_type = 'up'
				),
				downvotes = (
					SELECT COALESCE(COUNT(*), 0) 
					FROM votes 
					WHERE report = {:reportId} AND vote_type = 'down'
				)
			WHERE id = {:reportId}
		`).
		Bind(dbx.Params{"reportId": reportId}).
		Execute()

	if err != nil {
		return fmt.Errorf("failed to update vote counts: %w", err)
	}

	return nil
}

// rateLimitBadActors prevents low-reputation users from spamming reports.
func rateLimitBadActors(e *core.RecordEvent) error {
	reporterId := e.Record.GetString("reporter")

	// API users bypass rate limiting
	if BypassVoteUserIDs[reporterId] {
		return e.Next()
	}

	reporter, err := e.App.FindRecordById(COLLECTION_USERS, reporterId)
	if err != nil {
		return apis.NewBadRequestError("Reporter not found", err)
	}

	reputation := reporter.GetInt("reputation")

	if reputation <= BLOCKED_THRESHOLD {
		return apis.NewForbiddenError(
			fmt.Sprintf("Your reporting privileges have been revoked due to very low reputation (%d). Please contact Wohee if you believe this is an error.", reputation),
			nil,
		)
	}

	if reputation <= RATE_LIMIT_THRESHOLD {
		recentReports, err := e.App.FindRecordsByFilter(
			COLLECTION_HP_REPORTS,
			"reporter = {:reporterId}",
			"-created",
			1,
			0,
			dbx.Params{"reporterId": reporterId},
		)

		if err != nil {
			log.Printf("[RATE_LIMIT] recent reports query error=%v", err)
			return e.Next()
		}

		if len(recentReports) > 0 {
			lastReportTime, err := time.Parse("2006-01-02 15:04:05.000Z", recentReports[0].GetString("created"))
			if err != nil {
				log.Printf("[RATE_LIMIT] last report time parse error=%v", err)
				return e.Next()
			}

			timeSinceLastReport := time.Since(lastReportTime)

			if timeSinceLastReport < rateLimitedCooldown {
				waitTimeMinutes := int((rateLimitedCooldown - timeSinceLastReport).Minutes()) + 1
				return apis.NewTooManyRequestsError(
					fmt.Sprintf("Your reporting privileges are limited due to low reputation (%d). Please wait %d more minutes before submitting another report.", reputation, waitTimeMinutes),
					nil,
				)
			}
		}
	}

	return e.Next()
}
