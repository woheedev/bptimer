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

// handleCleanupMobChannelStatus removes channel status records where channel number exceeds map's region-specific channel count.
// This handles cases where maps reduce their channel count for a region. Runs daily at 00:15
func handleCleanupMobChannelStatus(app core.App) {
	statusRecords, err := app.FindRecordsByFilter(
		COLLECTION_MOB_CHANNEL_STATUS,
		"",
		"",
		10000,
		0,
	)
	if err != nil {
		log.Printf("[CLEANUP] mob_channel_status query error=%v", err)
		return
	}

	if len(statusRecords) == 0 {
		return
	}

	// Group by mob ID to fetch each mob once
	mobIDs := make(map[string]bool)
	for _, statusRecord := range statusRecords {
		mobIDs[statusRecord.GetString("mob")] = true
	}

	// Fetch all unique mobs with expanded maps
	mobMapCache := make(map[string]*core.Record)
	for mobID := range mobIDs {
		mob, err := app.FindRecordById(COLLECTION_MOBS, mobID)
		if err != nil {
			continue
		}
		if errs := app.ExpandRecord(mob, []string{"map"}, nil); len(errs) > 0 {
			continue
		}
		mobMapCache[mobID] = mob
	}

	var recordsToDelete []string

	for _, statusRecord := range statusRecords {
		mobID := statusRecord.GetString("mob")
		channelNumber := statusRecord.GetInt("channel_number")
		region := statusRecord.GetString("region")

		// Check if region is disabled
		isRegionEnabled := false
		for _, regionInfo := range ACCOUNT_ID_REGIONS {
			if regionInfo.Name == region {
				isRegionEnabled = regionInfo.Enabled
				break
			}
		}

		// Delete records for disabled regions
		if !isRegionEnabled {
			recordsToDelete = append(recordsToDelete, statusRecord.Id)
			continue
		}

		mob, exists := mobMapCache[mobID]
		if !exists {
			continue
		}

		mapRecord := mob.ExpandedOne("map")
		if mapRecord == nil {
			continue
		}

		regionData := mapRecord.Get("region_data")
		if regionData == nil {
			continue
		}

		regionMap, err := parseRegionData(regionData)
		if err != nil {
			continue
		}

		regionChannels, exists := regionMap[region]
		// Delete records for regions that don't exist in region_data
		if !exists {
			recordsToDelete = append(recordsToDelete, statusRecord.Id)
			continue
		}

		var totalChannels int
		if channels, ok := regionChannels.(float64); ok {
			totalChannels = int(channels)
		} else if channels, ok := regionChannels.(int); ok {
			totalChannels = channels
		} else {
			continue
		}

		// Delete records where channel number exceeds region-specific channel count
		if channelNumber > totalChannels {
			recordsToDelete = append(recordsToDelete, statusRecord.Id)
		}
	}

	if len(recordsToDelete) == 0 {
		return
	}

	// Delete in batches
	batchSize := 100
	for i := 0; i < len(recordsToDelete); i += batchSize {
		end := i + batchSize
		if end > len(recordsToDelete) {
			end = len(recordsToDelete)
		}

		batch := recordsToDelete[i:end]
		placeholders := make([]string, len(batch))
		params := dbx.Params{}

		for j, id := range batch {
			key := fmt.Sprintf("id%d", j)
			placeholders[j] = fmt.Sprintf("{:%s}", key)
			params[key] = id
		}

		deleteQuery := fmt.Sprintf(
			"DELETE FROM %s WHERE id IN (%s)",
			COLLECTION_MOB_CHANNEL_STATUS,
			strings.Join(placeholders, ","),
		)

		_, err := app.DB().NewQuery(deleteQuery).Bind(params).Execute()
		if err != nil {
			log.Printf("[CLEANUP] mob_channel_status delete error=%v", err)
			return
		}
	}

	log.Printf("[CLEANUP] mob_channel_status deleted=%d", len(recordsToDelete))
}
