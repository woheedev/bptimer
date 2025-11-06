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
			return fmt.Errorf("Failed to find hp_reports collection: %w", err)
		}
	}

	// Pre-allocate success response
	successResponse := map[string]bool{"success": true}

	return func(e *core.RequestEvent) error {
		data := CreateHPReportRequest{}

		if err := e.BindBody(&data); err != nil {
			return e.BadRequestError("Invalid request body", err)
		}

		if e.Auth == nil {
			return e.UnauthorizedError("Authentication required", nil)
		}

		if data.MonsterID == 0 {
			return e.BadRequestError("Missing or invalid monster_id", nil)
		}
		if data.HPPct < 0 || data.HPPct > 100 {
			return e.BadRequestError("HP percentage must be between 0 and 100", nil)
		}

		// Map game monster ID to mob name
		mobName, ok := MOB_MAPPING[data.MonsterID]
		if !ok {
			return e.BadRequestError(fmt.Sprintf("Unknown monster ID: %d", data.MonsterID), nil)
		}

		// Find mob record (indexed on name)
		mob, err := e.App.FindFirstRecordByFilter(
			"mobs",
			"name = {:mobName}",
			map[string]any{
				"mobName": mobName,
			},
		)
		if err != nil {
			if errors.Is(err, sql.ErrNoRows) {
				return e.NotFoundError(fmt.Sprintf("Mob '%s' not found in database", mobName), nil)
			}
			return e.InternalServerError("Database error finding mob", err)
		}

		// Expand map relation
		if errs := e.App.ExpandRecord(mob, []string{"map"}, nil); len(errs) > 0 {
			return e.InternalServerError("Failed to expand map relation", errs["map"])
		}

		mapRecord := mob.ExpandedOne("map")
		if mapRecord == nil {
			return e.NotFoundError("Map not found for this mob", nil)
		}

		// PocketBase returns all number fields as float64, even integers
		totalChannelsFloat, ok := mapRecord.Get("total_channels").(float64)
		if !ok {
			return e.InternalServerError("Invalid total_channels value", nil)
		}
		totalChannels := int(totalChannelsFloat)
		if data.Channel < 1 || data.Channel > totalChannels {
			return e.BadRequestError(fmt.Sprintf("Line must be between 1 and %d for this mob", totalChannels), nil)
		}

		hpReport := core.NewRecord(collection)
		hpReport.Set("mob", mob.Id)
		hpReport.Set("channel_number", data.Channel)
		hpReport.Set("hp_percentage", data.HPPct)
		hpReport.Set("reporter", e.Auth.Id)

		if err := e.App.Save(hpReport); err != nil {
			return err
		}

		return e.JSON(http.StatusOK, successResponse)
	}
}
