package pb_go

import (
	"encoding/json"
	"fmt"
	"log"
	"strings"
	"time"

	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tools/subscriptions"
)

func InitCronJobs(app core.App) {
	app.Cron().MustAdd("mobRespawn", CRON_MOB_RESPAWN_SCHEDULE, func() {
		handleMobRespawn(app)
	})

	app.Cron().MustAdd("cleanupHpReports", CRON_CLEANUP_HP_REPORTS_SCHEDULE, func() {
		handleCleanupHpReports(app)
	})

	app.Cron().MustAdd("cleanupMobChannelStatus", CRON_CLEANUP_MOB_CHANNEL_STATUS_SCHEDULE, func() {
		handleCleanupMobChannelStatus(app)
	})

	log.Printf("[CRONS] Cron jobs registered")
}

// handleMobRespawn checks for mobs that should respawn based on current time.
// Bosses respawn every hour at their respawn_time minute.
// Magical creatures respawn at specific UTC hours.
func handleMobRespawn(app core.App) {
	now := time.Now().UTC()
	currentMinute := now.Minute()
	currentHour := now.Hour()

	respawningMobs, err := app.FindRecordsByFilter(
		COLLECTION_MOBS,
		"respawn_time = {:minute}",
		"",
		0,
		0,
		dbx.Params{"minute": currentMinute},
	)

	if err != nil {
		log.Printf("[MOB_RESPAWN] query error=%v", err)
		return
	}

	if len(respawningMobs) == 0 {
		log.Printf("[MOB_RESPAWN] no mobs respawn_time=%d", currentMinute)
		return
	}

	var resetMobIds []string

	for _, mob := range respawningMobs {
		mobName := mob.GetString("name")
		mobId := mob.Id
		mobType := mob.GetString("type")
		monsterID := mob.GetInt("monster_id")

		shouldReset := false
		if mobType == "boss" {
			shouldReset = true
		} else if mobType == "magical_creature" {
			// Check if current hour matches any reset hour for this magical creature
			if resetHours, exists := MagicalCreatureResetHours[monsterID]; exists {
				for _, hour := range resetHours {
					if hour == currentHour {
						shouldReset = true
						break
					}
				}
			}
		}

		if shouldReset {
			resetMobIds = append(resetMobIds, mobId)
		} else {
			log.Printf("[MOB_RESPAWN] skipped mob=%s type=%s hour=%d", mobName, mobType, currentHour)
		}
	}

	if len(resetMobIds) == 0 {
		log.Printf("[MOB_RESPAWN] no mobs to reset")
		return
	}

	if err := batchUpdateMobChannelStatus(app, resetMobIds); err != nil {
		log.Printf("[MOB_RESPAWN] reset error=%v", err)
		return
	}

	log.Printf("[MOB_RESPAWN] reset mobs=%d time=%02d:%02d", len(resetMobIds), currentHour, currentMinute)

	if err := broadcastMobResets(app, resetMobIds); err != nil {
		log.Printf("[MOB_RESPAWN] broadcast error=%v", err)
	} else {
		log.Printf("[MOB_RESPAWN] broadcast sent=%d", len(resetMobIds))
	}
}

func batchUpdateMobChannelStatus(app core.App, mobIds []string) error {
	if len(mobIds) == 0 {
		return nil
	}

	placeholders := make([]string, len(mobIds))
	params := dbx.Params{"timestamp": time.Now().Format("2006-01-02 15:04:05")}

	for i, mobId := range mobIds {
		key := fmt.Sprintf("mob%d", i)
		placeholders[i] = fmt.Sprintf("{:%s}", key)
		params[key] = mobId
	}

	query := fmt.Sprintf(
		"UPDATE %s SET last_hp = 100, last_update = {:timestamp} WHERE mob IN (%s)",
		COLLECTION_MOB_CHANNEL_STATUS,
		strings.Join(placeholders, ","),
	)

	_, err := app.DB().NewQuery(query).Bind(params).Execute()
	return err
}

func broadcastMobResets(app core.App, mobIds []string) error {
	if len(mobIds) == 0 {
		return nil
	}

	data, err := json.Marshal(mobIds)
	if err != nil {
		return fmt.Errorf("failed to marshal mob IDs: %w", err)
	}

	message := subscriptions.Message{
		Name: SSE_TOPIC_RESETS,
		Data: data,
	}

	broker := app.SubscriptionsBroker()
	clients := broker.Clients()

	sentCount := 0
	droppedCount := 0

	for _, client := range clients {
		if !client.HasSubscription(SSE_TOPIC_RESETS) {
			continue
		}

		// Catch panic per-client to handle closed channels gracefully
		func() {
			defer func() {
				if r := recover(); r != nil {
					droppedCount++
					if droppedCount%100 == 1 {
						log.Printf("[MOB_RESPAWN] client panic (likely closed channel): %v", r)
					}
				}
			}()

			select {
			case client.Channel() <- message:
				sentCount++
			default:
				droppedCount++
				if droppedCount%100 == 1 {
					log.Printf("[MOB_RESPAWN] dropped=%d sent=%d (client channels full)", droppedCount, sentCount)
				}
			}
		}()
	}

	if droppedCount > 0 {
		log.Printf("[MOB_RESPAWN] broadcast complete: sent=%d dropped=%d total_clients=%d", sentCount, droppedCount, len(clients))
	}

	return nil
}

// handleCleanupHpReports deletes HP reports older than 2 hours.
// Runs hourly at :20
func handleCleanupHpReports(app core.App) {
	cutoffTime := time.Now().Add(-time.Duration(HP_REPORTS_CLEANUP_HOURS) * time.Hour)
	cutoffStr := cutoffTime.Format("2006-01-02 15:04:05")

	countResult := struct {
		Count int `db:"count"`
	}{}

	err := app.DB().
		NewQuery("SELECT COUNT(*) as count FROM hp_reports WHERE created < {:cutoff}").
		Bind(dbx.Params{"cutoff": cutoffStr}).
		One(&countResult)

	if err != nil {
		log.Printf("[CLEANUP] hp_reports count error=%v", err)
		return
	}

	if countResult.Count > 0 {
		_, err := app.DB().
			NewQuery("DELETE FROM hp_reports WHERE created < {:cutoff}").
			Bind(dbx.Params{"cutoff": cutoffStr}).
			Execute()

		if err != nil {
			log.Printf("[CLEANUP] hp_reports error=%v", err)
			return
		}

		log.Printf("[CLEANUP] hp_reports deleted=%d", countResult.Count)
	}
}

// handleCleanupMobChannelStatus removes channel status records where channel number exceeds map's total channels.
// This handles cases where maps reduce their channel count. Runs daily at 00:15
func handleCleanupMobChannelStatus(app core.App) {
	countResult := struct {
		Count int `db:"count"`
	}{}

	countQuery := `
		SELECT COUNT(*) as count
		FROM mob_channel_status mcs
		JOIN mobs m ON mcs.mob = m.id
		JOIN maps mp ON m.map = mp.id
		WHERE mcs.channel_number > mp.total_channels
	`

	err := app.DB().NewQuery(countQuery).One(&countResult)

	if err != nil {
		log.Printf("[CLEANUP] mob_channel_status count error=%v", err)
		return
	}

	if countResult.Count > 0 {
		deleteQuery := `
			DELETE FROM mob_channel_status
			WHERE id IN (
				SELECT mcs.id
				FROM mob_channel_status mcs
				JOIN mobs m ON mcs.mob = m.id
				JOIN maps mp ON m.map = mp.id
				WHERE mcs.channel_number > mp.total_channels
			)
		`

		_, err := app.DB().NewQuery(deleteQuery).Execute()

		if err != nil {
			log.Printf("[CLEANUP] mob_channel_status error=%v", err)
			return
		}

		log.Printf("[CLEANUP] mob_channel_status deleted=%d", countResult.Count)
	}
}
