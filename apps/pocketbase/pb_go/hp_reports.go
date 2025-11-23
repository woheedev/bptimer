package pb_go

import (
	"fmt"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/apis"
	"github.com/pocketbase/pocketbase/core"
)

// Global mob cache
var (
	mobCache   = make(map[string]CachedMobData)
	cacheMutex sync.RWMutex
)

// isInSubmissionBlackout checks if we're in the blackout period for a mob.
func isInSubmissionBlackout(mobName string) bool {
	resetHours, exists := MagicalCreatureResetHours[mobName]
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

func loadMobFromDB(app core.App, mobName string) (string, int, error) {
	mob, err := app.FindFirstRecordByFilter(
		COLLECTION_MOBS,
		"name = {:mobName}",
		map[string]any{"mobName": mobName},
	)
	if err != nil {
		return "", 0, fmt.Errorf("failed to load mob %s: %w", mobName, err)
	}

	if errs := app.ExpandRecord(mob, []string{"map"}, nil); len(errs) > 0 {
		return "", 0, fmt.Errorf("failed to expand map for mob %s: %w", mobName, errs["map"])
	}

	mapRecord := mob.ExpandedOne("map")
	if mapRecord == nil {
		return "", 0, fmt.Errorf("map not found for mob %s", mobName)
	}

	totalChannelsFloat, ok := mapRecord.Get("total_channels").(float64)
	if !ok {
		return "", 0, fmt.Errorf("invalid total_channels for mob %s", mobName)
	}

	return mob.Id, int(totalChannelsFloat), nil
}

func InitMobCache(app core.App) error {
	cacheMutex.Lock()
	defer cacheMutex.Unlock()

	// Load all mobs that are in MOB_MAPPING
	for _, mobName := range MOB_MAPPING {
		mobID, totalChannels, err := loadMobFromDB(app, mobName)
		if err != nil {
			return err
		}

		mobCache[mobName] = CachedMobData{
			MobID:         mobID,
			TotalChannels: totalChannels,
			Cached:        time.Now(),
		}
	}

	return nil
}

func getCachedMob(app core.App, mobName string) (string, int, error) {
	// Fast path: Check if cached and still valid (read lock only)
	cacheMutex.RLock()
	if data, found := mobCache[mobName]; found {
		if time.Since(data.Cached) < mobCacheTTL {
			cacheMutex.RUnlock()
			return data.MobID, data.TotalChannels, nil
		}
	}
	cacheMutex.RUnlock()

	// Slow path: Cache miss or expired - acquire write lock to refresh
	cacheMutex.Lock()
	defer cacheMutex.Unlock()

	// Double-check: Another goroutine may have refreshed while we waited for the lock
	// This prevents multiple concurrent requests from all querying the database
	if data, found := mobCache[mobName]; found {
		if time.Since(data.Cached) < mobCacheTTL {
			return data.MobID, data.TotalChannels, nil
		}
	}

	// Fetch from database
	mobID, totalChannels, err := loadMobFromDB(app, mobName)
	if err != nil {
		return "", 0, err
	}

	// Update cache
	mobCache[mobName] = CachedMobData{
		MobID:         mobID,
		TotalChannels: totalChannels,
		Cached:        time.Now(),
	}

	return mobID, totalChannels, nil
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
		return func(e *core.RequestEvent) error {
			return fmt.Errorf("failed to find hp_reports collection: %w", err)
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
			return e.BadRequestError("Missing or invalid monster_id", nil)
		}
		if data.HPPct < 0 || data.HPPct > 100 {
			return e.BadRequestError("HP percentage must be between 0 and 100", nil)
		}

		// Attach endpoint and user to logger
		logger := app.Logger().With(
			"endpoint", "/api/create-hp-report",
			"user_id", userId,
		)

		// Map game monster ID to mob name
		mobName, ok := MOB_MAPPING[data.MonsterID]
		if !ok {
			logger.Error("Unknown monster ID", "monster_id", data.MonsterID)
			return e.BadRequestError(fmt.Sprintf("Unknown monster ID: %d", data.MonsterID), nil)
		}

		// Check if submissions are currently blocked for this mob
		if isInSubmissionBlackout(mobName) {
			return e.BadRequestError("HP reports are currently closed for this mob. Please wait for the next reset.", nil)
		}

		// Get mob data from cache (auto-refreshes if expired)
		mobID, totalChannels, err := getCachedMob(e.App, mobName)
		if err != nil {
			return e.NotFoundError(fmt.Sprintf("Mob '%s' not found", mobName), nil)
		}

		// Validate channel number
		if data.Channel < 1 || data.Channel > totalChannels {
			return e.BadRequestError(fmt.Sprintf("Line must be between 1 and %d for this mob", totalChannels), nil)
		}

		// Validate position if mob requires location tracking
		if _, hasLocations := MOB_LOCATIONS[data.MonsterID]; hasLocations {
			hasAnyPos := (data.PosX != 0 || data.PosY != 0 || data.PosZ != 0)
			hasAllPos := (data.PosX != 0 && data.PosY != 0 && data.PosZ != 0)

			if !hasAnyPos {
				return e.BadRequestError("Position (pos_x, pos_y, pos_z) is required for this mob", nil)
			}
			if !hasAllPos {
				return e.BadRequestError("All position coordinates (pos_x, pos_y, pos_z) must be provided for this mob", nil)
			}
		}

		hpReport := core.NewRecord(collection)
		hpReport.Set("mob", mobID)
		hpReport.Set("channel_number", data.Channel)
		hpReport.Set("hp_percentage", data.HPPct)
		hpReport.Set("reporter", userId)

		// Match the received position to the closest known location
		if locationID, distSq := findClosestLocation(data.MonsterID, data.PosX, data.PosY, data.PosZ); locationID > 0 {
			// Reject if distance exceeds maximum allowed distance
			maxDistSq := MAX_LOCATION_DISTANCE * MAX_LOCATION_DISTANCE
			if distSq > maxDistSq {
				return e.BadRequestError("Mob position too far from any known location", nil)
			}
			hpReport.Set("location_image", locationID)
		}

		if data.HPPct%HP_REPORT_INTERVAL != 0 {
			return e.BadRequestError("Invalid HP percentage", nil)
		}

		if err := e.App.Save(hpReport); err != nil {
			return fmt.Errorf("failed to save hp report: %w", err)
		}

		logger.Info("HP report saved",
			"mob", mobName,
			"channel", data.Channel,
			"hp_pct", data.HPPct,
			"ip", e.RealIP(),
		)

		return e.JSON(http.StatusOK, successResponse)
	}
}

// InitHPReportsHooks registers validation hooks for HP reports.
// Prevents duplicate reports and enforces HP can only decrease.
func InitHPReportsHooks(app core.App) {
	app.OnRecordCreate(COLLECTION_HP_REPORTS).BindFunc(func(e *core.RecordEvent) error {
		return preventDuplicateHPReports(e)
	})

	log.Printf("[HP] Hooks registered")
}

// preventDuplicateHPReports ensures users can't spam identical HP reports
// within 5 minutes and that HP only decreases for same mob/channel.
func preventDuplicateHPReports(e *core.RecordEvent) error {
	hpReport := e.Record
	reporterId := hpReport.GetString("reporter")
	mobId := hpReport.GetString("mob")
	channelNumber := hpReport.GetInt("channel_number")
	hpPercentage := hpReport.GetInt("hp_percentage")

	cutoffTime := time.Now().Add(-time.Duration(DUPLICATE_CHECK_WINDOW_MINUTES) * time.Minute)
	cutoffStr := cutoffTime.Format("2006-01-02 15:04:05")

	// Reusable query params for both checks
	params := dbx.Params{
		"reporter": reporterId,
		"mob":      mobId,
		"channel":  channelNumber,
		"cutoff":   cutoffStr,
	}

	duplicateResult := struct {
		Count int `db:"count"`
	}{}

	params["hp"] = hpPercentage
	err := e.App.DB().
		NewQuery("SELECT COUNT(*) as count FROM hp_reports WHERE reporter = {:reporter} AND mob = {:mob} AND channel_number = {:channel} AND hp_percentage = {:hp} AND created > {:cutoff}").
		Bind(params).
		One(&duplicateResult)

	if err == nil && duplicateResult.Count > 0 {
		return apis.NewBadRequestError("You have already reported this HP percentage.", nil)
	}

	lastHpResult := struct {
		HPPercentage int `db:"hp_percentage"`
	}{}

	delete(params, "hp") // Remove hp from params for this query
	err = e.App.DB().
		NewQuery("SELECT hp_percentage FROM hp_reports WHERE reporter = {:reporter} AND mob = {:mob} AND channel_number = {:channel} AND created > {:cutoff} ORDER BY created DESC LIMIT 1").
		Bind(params).
		One(&lastHpResult)

	if err == nil && hpPercentage > lastHpResult.HPPercentage {
		return apis.NewBadRequestError("HP percentage can only decrease.", nil)
	}

	return e.Next()
}
