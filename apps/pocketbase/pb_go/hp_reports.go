// pb_go contains handler used to extend the default pocketbase app
package pb_go

import (
	"database/sql"
	"errors"
	"fmt"
	"net/http"

	"github.com/pocketbase/pocketbase/core"
)

/**
 * CreateHPReportHandler generates a handler for handling Create HP Report requests
 *
 * POST /api/create-hp-report
 *
 * Request body:
 * {
 *   monster_id: number - Boss meter ID (From game)
 *   hp_pct: number - HP percentage (0-100)
 *   line: number - Line number (1-1000)
 * }
 *
 * Requires X-API-Key header for authentication
 */
func CreateHPReportHandler(app core.App) func(e *core.RequestEvent) error {
	collection, err := app.FindCollectionByNameOrId("hp_reports")
	if err != nil {
		panic(fmt.Sprintf("Failed to find hp_reports collection: %v", err))
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
		if data.Channel < 1 || data.Channel > 1000 {
			return e.BadRequestError("Line number must be between 1 and 1000", nil)
		}

		// Map game monster ID to boss name
		bossName, ok := BOSS_MAPPING[data.MonsterID]
		if !ok {
			return e.BadRequestError(fmt.Sprintf("Unknown monster ID: %d", data.MonsterID), nil)
		}

		// Find boss record (indexed on name)
		boss, err := e.App.FindFirstRecordByFilter(
			"mobs",
			"name = {:bossName}",
			map[string]any{
				"bossName": bossName,
			},
		)
		if err != nil {
			if errors.Is(err, sql.ErrNoRows) {
				return e.NotFoundError(fmt.Sprintf("Boss '%s' not found in database", bossName), nil)
			}
			return e.InternalServerError("Database error finding boss", err)
		}

		// Expand map relation
		if errs := e.App.ExpandRecord(boss, []string{"map"}, nil); len(errs) > 0 {
			return e.InternalServerError("Failed to expand map relation", errs["map"])
		}

		mapRecord := boss.ExpandedOne("map")
		if mapRecord == nil {
			return e.NotFoundError("Map not found for this boss", nil)
		}

		// PocketBase returns all number fields as float64, even integers
		totalChannels := int(mapRecord.Get("total_channels").(float64))
		if data.Channel > totalChannels {
			return e.BadRequestError(fmt.Sprintf("Line must be between 1 and %d for this boss", totalChannels), nil)
		}

		hpReport := core.NewRecord(collection)
		hpReport.Set("mob", boss.Id)
		hpReport.Set("channel_number", data.Channel)
		hpReport.Set("hp_percentage", data.HPPct)
		hpReport.Set("reporter", e.Auth.Id)

		if err := e.App.Save(hpReport); err != nil {
			return err
		}

		return e.JSON(http.StatusOK, successResponse)
	}
}
