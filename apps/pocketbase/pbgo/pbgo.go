// pbgo contains handler used to extend the default pocketbase app
package pbgo

import (
	"database/sql"
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
 *   line: number - Channel number (1-1000)
 * }
 *
 * Requires X-API-Key header for authentication
 */
func CreateHPReportHandler() func(e *core.RequestEvent) error {
	return func(e *core.RequestEvent) error {
		data := struct {
			MonsterID int `json:"monster_id" form:"monster_id"`
			HPPct     int `json:"hp_pct" form:"hp_pct"`
			Line      int `json:"line" form:"line"`
		}{}
		if err := e.BindBody(&data); err != nil {
			return e.BadRequestError("Failed to read request data", err)
		}
		if data.MonsterID == 0 {
			return e.BadRequestError("monster_id cannot be 0", nil)
		}
		if data.HPPct < 0 || data.HPPct > 100 {
			return e.BadRequestError("hp_pct must be between 0 and 100", nil)
		}
		if data.Line < 1 || data.Line > 1000 {
			return e.BadRequestError("line must be between 1 and 1000", nil)
		}
		name, ok := bossMapping[data.MonsterID]
		if !ok {
			return e.BadRequestError(fmt.Sprintf("Unknown mosnter ID: %v", data.MonsterID), nil)
		}

		boss, err := e.App.FindFirstRecordByFilter(
			"mobs",
			"name = {:bossName}",
			map[string]any{
				"bossName": name,
			},
		)
		if err != nil {
			if err == sql.ErrNoRows {
				return e.NotFoundError(fmt.Sprintf("Boss %v not found in database", name), nil)
			}
			return e.InternalServerError("unexpected error encountered", nil)
		}

		mapId := boss.Get("map")
		m, err := e.App.FindRecordById("maps", mapId.(string))
		if err != nil {
			if err == sql.ErrNoRows {
				return e.NotFoundError(fmt.Sprintf("Map %v not found in database", mapId), nil)
			}
			return e.InternalServerError("unexpected error encountered", nil)
		}

		totalChannels := m.Get("total_channels").(float64) // i don't know why pb stores this as float??
		if data.Line > int(totalChannels) {
			return e.BadRequestError(fmt.Sprintf("line must be between 1 and %v", totalChannels), nil)
		}

		collection, err := e.App.FindCollectionByNameOrId("hp_reports")
		if err != nil {
			return e.InternalServerError("failed to find hp_reports collection", err)
		}
		hpReport := core.NewRecord(collection)
		hpReport.Set("mob", boss.Id)
		hpReport.Set("channel_number", data.Line)
		hpReport.Set("hp_percentage", data.HPPct)
		hpReport.Set("reporter", e.Auth.Id)

		err = e.App.Save(hpReport)
		if err != nil {
			return e.InternalServerError("failed to save hp report", err)
		}

		return e.String(http.StatusOK, `{"success": true}`)
	}
}
