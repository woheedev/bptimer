// pb_go contains handler used to extend the default pocketbase app
package pb_go

import (
	"fmt"
	"net/http"
	"sync"
	"time"

	"github.com/pocketbase/pocketbase/core"
)

// Global mob cache
var (
	mobCache   = make(map[string]CachedMobData)
	cacheMutex sync.RWMutex
)

func loadMobFromDB(app core.App, mobName string) (string, int, error) {
	mob, err := app.FindFirstRecordByFilter(
		"mobs",
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

/**
 * CreateHPReportHandler generates a handler for handling Create HP Report requests
 *
 * POST /api/create-hp-report
 *
 * Request body:
 * {
 *   monster_id: integer - Mob meter ID (From game)
 *   hp_pct: integer - HP percentage (0-100)
 *   line: integer - Line number
 * }
 *
 * Requires X-API-Key header for authentication
 */
func CreateHPReportHandler(app core.App) func(e *core.RequestEvent) error {
	collection, err := app.FindCollectionByNameOrId("hp_reports")
	if err != nil {
		return func(e *core.RequestEvent) error {
			return fmt.Errorf("failed to find hp_reports collection: %w", err)
		}
	}

	// Pre-allocate success response
	successResponse := map[string]bool{"success": true}

	return func(e *core.RequestEvent) error {
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

		// Authentication is handled by api-key-auth.pb.js middleware
		if e.Auth == nil {
			return e.UnauthorizedError("Authentication required", nil)
		}

		// Attach endpoint and user to logger
		logger := app.Logger().With(
			"endpoint", "/api/create-hp-report",
			"user_id", e.Auth.Id,
		)

		// Map game monster ID to mob name
		mobName, ok := MOB_MAPPING[data.MonsterID]
		if !ok {
			logger.Error("Unknown monster ID", "monster_id", data.MonsterID)
			return e.BadRequestError(fmt.Sprintf("Unknown monster ID: %d", data.MonsterID), nil)
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

		hpReport := core.NewRecord(collection)
		hpReport.Set("mob", mobID)
		hpReport.Set("channel_number", data.Channel)
		hpReport.Set("hp_percentage", data.HPPct)
		hpReport.Set("reporter", e.Auth.Id)

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
