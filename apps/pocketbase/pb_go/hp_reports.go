package pb_go

import (
	"database/sql"
	"errors"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/apis"
	"github.com/pocketbase/pocketbase/core"
)

// isInSubmissionBlackout checks if we're in the blackout period for a mob.
func isInSubmissionBlackout(monsterID int) bool {
	resetHours, exists := MagicalCreatureResetHours[monsterID]
	if !exists || len(resetHours) == 0 {
		return false // Not a magical creature or no resets configured
	}

	currentHour := time.Now().UTC().Hour()
	firstReset := resetHours[0]
	lastReset := resetHours[len(resetHours)-1]

	// Calculate cutoff hour
	cutoffHour := (lastReset + MAGICAL_CREATURE_CUTOFF_HOURS) % 24

	if cutoffHour < firstReset {
		// Cutoff wraps to next day
		return currentHour >= cutoffHour && currentHour < firstReset
	} else {
		// No wrap
		return currentHour < firstReset || currentHour >= cutoffHour
	}
}

// findClosestLocation finds the nearest spawn point using squared Euclidean distance (2D: X/Z only).
// Returns (locationID, squaredDistance).
func findClosestLocation(mobID int, x, y, z float64) (int, float64) {
	locations, exists := MOB_LOCATIONS[mobID]
	if !exists || len(locations) == 0 {
		return 0, 0
	}

	// If no position provided, return 0 (no location match)
	if x == 0 && y == 0 && z == 0 {
		return 0, 0
	}

	closestID := 0
	minDistSq := -1.0

	for _, loc := range locations {
		dx := x - loc.X
		dz := z - loc.Z
		distSq := dx*dx + dz*dz

		if minDistSq < 0 || distSq < minDistSq {
			minDistSq = distSq
			closestID = loc.ID
		}
	}

	return closestID, minDistSq
}

// getRegionFromAccountID extracts the region from an account_id by checking the first two characters.
// Returns the region name and whether it's enabled. Returns empty string and false if not found.
func getRegionFromAccountID(accountID string) (string, bool) {
	if len(accountID) < 2 {
		return "", false
	}
	prefix := accountID[:2]
	regionInfo, exists := ACCOUNT_ID_REGIONS[prefix]
	if !exists {
		return "", false
	}
	return regionInfo.Name, regionInfo.Enabled
}

// authenticateAPIKey validates an API key with API_KEY_CACHE_TTL_SECONDS caching.
func authenticateAPIKey(app core.App, apiKey string) (string, error) {
	cacheKey := API_KEY_CACHE_PREFIX + apiKey

	if cached := app.Store().Get(cacheKey); cached != nil {
		entry := cached.(ApiKeyCacheEntry)
		if time.Now().Before(entry.ExpiresAt) {
			return entry.UserID, nil
		}
		app.Store().Remove(cacheKey)
	}

	// Cache miss or expired - fetch from database
	apiKeyRecord, err := app.FindFirstRecordByData(COLLECTION_API_KEYS, "api_key", apiKey)
	if err != nil {
		return "", err
	}

	userID := apiKeyRecord.GetString("user")

	app.Store().Set(cacheKey, ApiKeyCacheEntry{
		UserID:    userID,
		ExpiresAt: time.Now().Add(apiKeyCacheTTL),
	})

	return userID, nil
}

// CreateHPReportHandler handles POST /api/create-hp-report requests.
// Requires X-API-Key header or standard authentication.
func CreateHPReportHandler(app core.App) func(e *core.RequestEvent) error {
	collection, err := app.FindCollectionByNameOrId(COLLECTION_HP_REPORTS)
	if err != nil {
		log.Printf("[FATAL] Failed to find hp_reports collection: %v", err)
		return func(e *core.RequestEvent) error {
			return e.InternalServerError("Service temporarily unavailable", nil)
		}
	}

	// Pre-allocate success response
	successResponse := map[string]bool{"success": true}

	return func(e *core.RequestEvent) error {
		var userId string
		apiKey := e.Request.Header.Get("X-API-Key")

		if apiKey != "" {
			var err error
			userId, err = authenticateAPIKey(app, apiKey)
			if err != nil {
				return e.UnauthorizedError("Invalid API key", nil)
			}
		} else if e.Auth != nil {
			userId = e.Auth.Id
		} else {
			return e.UnauthorizedError("Authentication required", nil)
		}

		data := CreateHPReportRequest{}

		if err := e.BindBody(&data); err != nil {
			return e.BadRequestError("Invalid request body", err)
		}

		if data.MonsterID == 0 {
			return e.BadRequestError("Missing monster_id", nil)
		}

		if data.HPPct < 0 || data.HPPct > 100 {
			return e.BadRequestError("HP percentage must be between 0 and 100", LogData{
				"hp_pct": data.HPPct,
			})
		}
		if data.HPPct%HP_REPORT_INTERVAL != 0 {
			return e.BadRequestError("Invalid HP percentage", LogData{
				"hp_pct": data.HPPct,
			})
		}

		if data.AccountID == "" {
			return e.BadRequestError("Missing account_id", nil)
		}

		// Extract region for logging and validation
		region, regionEnabled := getRegionFromAccountID(data.AccountID)

		// Validate region exists
		if region == "" {
			return e.BadRequestError("Invalid account_id", LogData{
				"account_id": data.AccountID,
			})
		}

		// Validate region is enabled
		if !regionEnabled {
			return e.BadRequestError("Region not enabled for submissions", LogData{
				"account_id": data.AccountID,
				"region":     region,
			})
		}

		// Get mob data from cache by monster ID and region (auto-refreshes if expired)
		mobData, err := MobCache.GetByMonsterID(e.App, data.MonsterID, region)
		if err != nil {
			return e.BadRequestError("Unknown monster ID", LogData{
				"monster_id": data.MonsterID,
				"region":     region,
			})
		}

		// Check if submissions are currently blocked for this mob
		// TODO: Temporarily disabled - needs region-specific implementation
		/*
			if isInSubmissionBlackout(data.MonsterID) {
				return e.BadRequestError("HP reports are currently closed for this mob. Please wait for the next reset.", LogData{
					"mob_name": mobData.Name,
				})
			}
		*/

		// Validate channel number against region-specific channel count
		if data.Channel < 1 || data.Channel > mobData.TotalChannels {
			return e.BadRequestError(fmt.Sprintf("Line must be between 1 and %d for this mob in region %s", mobData.TotalChannels, region), nil)
		}

		// Validate position if mob requires location tracking
		if _, hasLocations := MOB_LOCATIONS[data.MonsterID]; hasLocations {
			hasAnyPos := (data.PosX != 0 || data.PosY != 0 || data.PosZ != 0)
			hasAllPos := (data.PosX != 0 && data.PosY != 0 && data.PosZ != 0)

			if !hasAnyPos {
				return e.BadRequestError("Position (pos_x, pos_y, pos_z) is required for this mob", LogData{
					"mob_name": mobData.Name,
				})
			}
			if !hasAllPos {
				return e.BadRequestError("All position coordinates (pos_x, pos_y, pos_z) must be provided for this mob", LogData{
					"mob_name": mobData.Name,
					"pos_x":    data.PosX,
					"pos_y":    data.PosY,
					"pos_z":    data.PosZ,
				})
			}
		}

		hpReport := core.NewRecord(collection)
		hpReport.Set("mob", mobData.MobID)
		hpReport.Set("channel_number", data.Channel)
		hpReport.Set("hp_percentage", data.HPPct)
		hpReport.Set("reporter", userId)
		hpReport.Set("region", region)

		// Match the received position to the closest known location
		if locationID, distSq := findClosestLocation(data.MonsterID, data.PosX, data.PosY, data.PosZ); locationID > 0 {
			// Reject if distance exceeds maximum allowed distance
			maxDistSq := MAX_LOCATION_DISTANCE * MAX_LOCATION_DISTANCE
			if distSq > maxDistSq {
				return e.BadRequestError("Mob position too far from any known location", LogData{
					"mob_name": mobData.Name,
					"pos_x":    data.PosX,
					"pos_y":    data.PosY,
					"pos_z":    data.PosZ,
				})
			}
			hpReport.Set("location_image", locationID)
		}

		if err := e.App.Save(hpReport); err != nil {
			// PocketBase's global error handler will convert errors to ApiError
			return err
		}

		logArgs := []any{
			"user_id", userId,
			"mob", mobData.Name,
			"channel", data.Channel,
			"hp_pct", data.HPPct,
			"ip", e.RealIP(),
			"account_id", data.AccountID,
			"region", region,
		}
		if data.UID != 0 {
			logArgs = append(logArgs, "uid", data.UID)
		}

		app.Logger().Info("HP report saved", logArgs...)

		return e.JSON(http.StatusOK, successResponse)
	}
}

// InitHPReportsHooks registers validation hooks for HP reports.
// Prevents duplicate reports and enforces HP can only decrease.
func InitHPReportsHooks(app core.App) {
	app.OnRecordCreate(COLLECTION_HP_REPORTS).BindFunc(func(e *core.RecordEvent) error {
		return validateHPReport(e)
	})

	log.Printf("[HP] Hooks registered")
}

// calculateBossRespawnCutoff calculates the cutoff time for boss duplicate checks.
// For bosses, only consider reports after the last respawn time.
func calculateBossRespawnCutoff(e *core.RecordEvent, mobId string, defaultCutoff time.Time) time.Time {
	cachedData, err := MobCache.GetByID(e.App, mobId)
	if err != nil || cachedData.MobType != "boss" {
		return defaultCutoff
	}

	if cachedData.RespawnTime < 0 || cachedData.RespawnTime >= 60 {
		return defaultCutoff
	}

	now := time.Now().UTC()
	currentMinute := now.Minute()
	currentHour := now.Hour()

	// Calculate last respawn time
	// If current minute >= respawn_time, boss respawned this hour
	// Otherwise, boss respawned in the previous hour
	var lastRespawn time.Time
	if currentMinute >= cachedData.RespawnTime {
		lastRespawn = time.Date(now.Year(), now.Month(), now.Day(), currentHour, cachedData.RespawnTime, 0, 0, time.UTC)
	} else {
		// Respawned in previous hour
		lastRespawn = time.Date(now.Year(), now.Month(), now.Day(), currentHour-1, cachedData.RespawnTime, 0, 0, time.UTC)
	}

	// Use the last respawn time as cutoff for bosses
	return lastRespawn
}

// validateHPReport ensures users can't spam identical HP reports
// within 5 minutes and that HP only decreases for same mob/channel/region.
func validateHPReport(e *core.RecordEvent) error {
	hpReport := e.Record
	reporterId := hpReport.GetString("reporter")
	mobId := hpReport.GetString("mob")
	channelNumber := hpReport.GetInt("channel_number")
	hpPercentage := hpReport.GetInt("hp_percentage")
	region := hpReport.GetString("region")

	defaultCutoff := time.Now().Add(-time.Duration(DUPLICATE_CHECK_WINDOW_MINUTES) * time.Minute)
	cutoffTime := calculateBossRespawnCutoff(e, mobId, defaultCutoff)
	cutoffStr := cutoffTime.Format("2006-01-02 15:04:05")

	// Reusable query params for both checks
	params := dbx.Params{
		"reporter": reporterId,
		"mob":      mobId,
		"channel":  channelNumber,
		"region":   region,
		"cutoff":   cutoffStr,
	}

	lastHpResult := struct {
		HPPercentage int `db:"hp_percentage"`
	}{}

	err := e.App.DB().
		NewQuery("SELECT hp_percentage FROM hp_reports WHERE reporter = {:reporter} AND mob = {:mob} AND channel_number = {:channel} AND region = {:region} AND created > {:cutoff} ORDER BY created DESC LIMIT 1").
		Bind(params).
		One(&lastHpResult)

	if err == nil && hpPercentage > lastHpResult.HPPercentage {
		return apis.NewApiError(409, "HP percentage can only decrease.", nil)
	}

	if err != nil && !errors.Is(err, sql.ErrNoRows) {
		log.Printf("[HP] Error querying last HP report: %v", err)
	}

	duplicateResult := struct {
		Count int `db:"count"`
	}{}

	params["hp"] = hpPercentage
	err = e.App.DB().
		NewQuery("SELECT COUNT(*) as count FROM hp_reports WHERE reporter = {:reporter} AND mob = {:mob} AND channel_number = {:channel} AND region = {:region} AND hp_percentage = {:hp} AND created > {:cutoff}").
		Bind(params).
		One(&duplicateResult)

	if err == nil && duplicateResult.Count > 0 {
		return apis.NewApiError(409, "You have already reported this HP percentage.", nil)
	}

	return e.Next()
}
