package pb_go

import (
	"encoding/json"
	"fmt"
	"log"
	"strings"
	"time"

	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/core"
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

	app.Cron().MustAdd("shrinkChannels", CRON_SHRINK_CHANNELS_SCHEDULE, func() {
		handleShrinkChannels(app)
	})

	log.Printf("[CRONS] Cron jobs registered")
}

// handleMobRespawn checks for mobs that should respawn based on current time.
// Bosses respawn every hour at their respawn_time minute and broadcast to all regions.
// Magical creatures respawn at region-specific UTC hours.
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

	// Group mobs by region (region -> []mobIds)
	mobsByRegion := make(map[string][]string)
	var mobResets []MobReset

	for _, mob := range respawningMobs {
		mobName := mob.GetString("name")
		mobId := mob.Id
		mobType := mob.GetString("type")
		monsterID := mob.GetInt("monster_id")

		var regions []string

		if mobType == "boss" {
			// Bosses reset for all active regions
			regions = append(regions, ALL_ACTIVE_REGIONS...)
		} else if mobType == "magical_creature" {
			// Check if current hour matches any reset hour for any region
			if regionHours, exists := MagicalCreatureResetHours[monsterID]; exists {
				for region, hours := range regionHours {
					for _, hour := range hours {
						if hour == currentHour {
							regions = append(regions, region)
							break
						}
					}
				}
			}
		}

		if len(regions) > 0 {
			for _, region := range regions {
				mobResets = append(mobResets, MobReset{
					MobID:  mobId,
					Region: region,
				})
				mobsByRegion[region] = append(mobsByRegion[region], mobId)
			}
		} else {
			log.Printf("[MOB_RESPAWN] skipped mob=%s type=%s hour=%d", mobName, mobType, currentHour)
		}
	}

	if len(mobResets) == 0 {
		log.Printf("[MOB_RESPAWN] no mobs to reset")
		return
	}

	if err := batchUpdateMobChannelStatus(app, mobResets); err != nil {
		log.Printf("[MOB_RESPAWN] reset error=%v", err)
		return
	}

	log.Printf("[MOB_RESPAWN] reset mobs=%d time=%02d:%02d", len(mobResets), currentHour, currentMinute)

	// Broadcast each region with its mobs
	for region, mobIds := range mobsByRegion {
		if err := broadcastMobResets(app, mobIds, region); err != nil {
			log.Printf("[MOB_RESPAWN] broadcast error region=%s: %v", region, err)
		}
	}
}

func batchUpdateMobChannelStatus(app core.App, mobResets []MobReset) error {
	if len(mobResets) == 0 {
		return nil
	}

	// Build conditions for (mob, region) pairs
	conditions := make([]string, 0, len(mobResets))
	params := dbx.Params{"timestamp": time.Now().UTC().Format("2006-01-02 15:04:05")}

	for i, reset := range mobResets {
		mobKey := fmt.Sprintf("mob%d", i)
		regionKey := fmt.Sprintf("region%d", i)
		conditions = append(conditions, fmt.Sprintf("(mob = {:%s} AND region = {:%s})", mobKey, regionKey))
		params[mobKey] = reset.MobID
		params[regionKey] = reset.Region
	}

	query := fmt.Sprintf(
		"UPDATE %s SET last_hp = 100, last_update = {:timestamp}, last_player_name = 'Respawned' WHERE %s",
		COLLECTION_MOB_CHANNEL_STATUS,
		strings.Join(conditions, " OR "),
	)

	_, err := app.DB().NewQuery(query).Bind(params).Execute()
	return err
}

func broadcastMobResets(app core.App, mobIds []string, region string) error {
	if len(mobIds) == 0 {
		return nil
	}

	topic := regionTopic(SSE_TOPIC_RESETS, region)

	// Broadcast legacy format (array of mob ID strings)
	data, err := json.Marshal(mobIds)
	if err != nil {
		return fmt.Errorf("failed to marshal mob IDs: %w", err)
	}
	broadcastToTopic(app, topic, data)

	// Broadcast JSON format to _json topic: object with mob_ids array and timestamp.
	type MobResetsJSON struct {
		MobIDs    []string `json:"mob_ids"`
		Timestamp int64    `json:"timestamp"`
	}

	jsonData, err := json.Marshal(MobResetsJSON{
		MobIDs:    mobIds,
		Timestamp: time.Now().Unix(),
	})
	if err != nil {
		return fmt.Errorf("failed to marshal JSON mob resets: %w", err)
	}
	broadcastToTopic(app, topic+"_json", jsonData)

	return nil
}

// handleCleanupHpReports deletes HP reports older than 2 hours.
// Runs hourly at :20
func handleCleanupHpReports(app core.App) {
	cutoffTime := time.Now().UTC().Add(-time.Duration(HP_REPORTS_CLEANUP_HOURS) * time.Hour)
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
		0,
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

		// Check if region is active (includes EU/KR which share prefixes with NA/JP)
		isRegionEnabled := false
		for _, activeRegion := range ALL_ACTIVE_REGIONS {
			if activeRegion == region {
				isRegionEnabled = true
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

		totalChannels, ok := regionCountToInt(regionChannels)
		if !ok {
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

// handleShrinkChannels reduces channel counts per (map, region) based on recent activity.
// It queries the highest active channel_number in the last 7 days and shrinks region_data
// to that max if it is lower than the current count.
// Runs daily at 00:30 server time.
func handleShrinkChannels(app core.App) {
	cutoff := time.Now().UTC().AddDate(0, 0, -7).Format("2006-01-02 15:04:05")

	// Fetch all maps
	mapRecords, err := app.FindRecordsByFilter("maps", "", "", 0, 0)
	if err != nil {
		log.Printf("[SHRINK] failed to fetch maps: %v", err)
		return
	}

	// Build mob IDs per map ID
	type mobIDsResult struct {
		MobID string `db:"mob_id"`
		MapID string `db:"map_id"`
	}
	var mobMapRows []mobIDsResult
	err = app.DB().NewQuery("SELECT id as mob_id, map as map_id FROM mobs").All(&mobMapRows)
	if err != nil {
		log.Printf("[SHRINK] failed to fetch mobs: %v", err)
		return
	}

	mobsByMap := make(map[string][]string)
	for _, row := range mobMapRows {
		mobsByMap[row.MapID] = append(mobsByMap[row.MapID], row.MobID)
	}

	shrunkCount := 0

	for _, mapRecord := range mapRecords {
		mapName := mapRecord.GetString("name")
		mapID := mapRecord.Id

		mobIDs := mobsByMap[mapID]
		if len(mobIDs) == 0 {
			continue
		}

		regionData := mapRecord.Get("region_data")
		if regionData == nil {
			continue
		}

		regionMap, err := parseRegionData(regionData)
		if err != nil {
			log.Printf("[SHRINK] parseRegionData error map=%s: %v", mapName, err)
			continue
		}

		// Build the activity query once per map; only the region param varies below.
		placeholders := make([]string, len(mobIDs))
		mobParams := dbx.Params{}
		for i, mobID := range mobIDs {
			key := fmt.Sprintf("mob%d", i)
			placeholders[i] = fmt.Sprintf("{:%s}", key)
			mobParams[key] = mobID
		}

		// max_all is a safety signal: if any status record sits above the current
		// region_data, a concurrent auto-grow (or manual edit) expanded channels and
		// we must not undo it. max_active is the shrink target: the highest channel
		// with an HP report within the cutoff window.
		activityQuery := fmt.Sprintf(
			"SELECT COALESCE(MAX(channel_number), 0) as max_all, "+
				"COALESCE(MAX(CASE WHEN last_report > {:cutoff} THEN channel_number END), 0) as max_active "+
				"FROM %s WHERE mob IN (%s) AND region = {:region}",
			COLLECTION_MOB_CHANNEL_STATUS,
			strings.Join(placeholders, ","),
		)

		changed := false

		for _, region := range ALL_ACTIVE_REGIONS {
			current, ok := regionCountToInt(regionMap[region])
			if !ok {
				continue
			}

			params := dbx.Params{"region": region, "cutoff": cutoff}
			for k, v := range mobParams {
				params[k] = v
			}

			result := struct {
				MaxAll    int `db:"max_all"`
				MaxActive int `db:"max_active"`
			}{}
			if err := app.DB().NewQuery(activityQuery).Bind(params).One(&result); err != nil {
				log.Printf("[SHRINK] query error map=%s region=%s: %v", mapName, region, err)
				continue
			}

			if result.MaxAll > current {
				log.Printf("[SHRINK] Skipped map=%s region=%s: mob_channel_status has channel %d > region_data %d",
					mapName, region, result.MaxAll, current)
				continue
			}

			newCount := result.MaxActive

			// Cap at MAX_CHANNELS
			if newCount > MAX_CHANNELS {
				newCount = MAX_CHANNELS
			}

			if newCount < current {
				regionMap[region] = newCount
				changed = true
				shrunkCount++
				log.Printf("[SHRINK] Shrunk channels map=%s region=%s from=%d to=%d", mapName, region, current, newCount)
			}
		}

		if changed {
			// Re-read region_data immediately before Save to detect a concurrent auto-grow
			freshRecord, err := app.FindRecordById("maps", mapID)
			if err != nil {
				log.Printf("[SHRINK] re-read error map=%s: %v", mapName, err)
				continue
			}
			freshRegionMap, err := parseRegionData(freshRecord.Get("region_data"))
			if err != nil {
				log.Printf("[SHRINK] re-read parse error map=%s: %v", mapName, err)
				continue
			}
			skipSave := false
			for region, newCountVal := range regionMap {
				existing, ok := freshRegionMap[region]
				if !ok {
					continue
				}
				existingInt, ok := regionCountToInt(existing)
				if !ok {
					continue
				}
				newCount, ok := regionCountToInt(newCountVal)
				if !ok {
					continue
				}
				// If the DB now has a higher count than what we want to write, a concurrent
				// auto-grow raised it — defer to the grow and skip this map entirely.
				if existingInt > newCount {
					log.Printf("[SHRINK] Skipping map=%s region=%s: concurrent auto-grow raised channels to %d (our newCount=%d)",
						mapName, region, existingInt, newCount)
					skipSave = true
					break
				}
				freshRegionMap[region] = newCount
			}
			if skipSave {
				continue
			}

			updatedJSON, err := json.Marshal(freshRegionMap)
			if err != nil {
				log.Printf("[SHRINK] marshal error map=%s: %v", mapName, err)
				continue
			}
			freshRecord.Set("region_data", string(updatedJSON))
			if err := app.Save(freshRecord); err != nil {
				log.Printf("[SHRINK] save error map=%s: %v", mapName, err)
			}
		}
	}

	// Invalidate mob cache so next reads pick up new channel counts
	MobCache.Clear()

	log.Printf("[SHRINK] Complete: maps_processed=%d shrunk=%d", len(mapRecords), shrunkCount)
}
