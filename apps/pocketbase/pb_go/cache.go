package pb_go

import (
	"encoding/json"
	"fmt"
	"log"
	"sync"
	"time"

	"github.com/pocketbase/pocketbase/core"
)

// Global mob cache instance
var MobCache = &MobCacheService{
	byID:        make(map[string]CachedMobData),
	byMonsterID: make(map[string]CachedMobData), // Key: "monsterID:region"
}

type MobCacheService struct {
	byID        map[string]CachedMobData
	byMonsterID map[string]CachedMobData // Key: "monsterID:region"
	mu          sync.RWMutex
}

func (s *MobCacheService) Init(app core.App) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	mobs, err := app.FindRecordsByFilter(
		COLLECTION_MOBS,
		"",
		"",
		0,
		0,
	)
	if err != nil {
		return fmt.Errorf("failed to load all mobs: %w", err)
	}

	// Get all unique regions from all maps' region_data
	regionsSet := make(map[string]bool)
	for _, mob := range mobs {
		if errs := app.ExpandRecord(mob, []string{"map"}, nil); len(errs) > 0 {
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

		for region := range regionMap {
			regionsSet[region] = true
		}
	}

	byMonsterIDCount := 0
	for _, mob := range mobs {
		// Load basic mob data (without region) for byID cache
		data, err := loadMobDataFromRecord(app, mob, "")
		if err != nil {
			return err
		}
		s.byID[data.MobID] = data

		// Pre-populate byMonsterID cache for all regions found
		for region := range regionsSet {
			regionData, err := loadMobDataFromRecord(app, mob, region)
			if err != nil {
				log.Printf("[CACHE] Warning: failed to load mob %s (monster_id=%d) for region %s: %v",
					mob.GetString("name"), mob.GetInt("monster_id"), region, err)
				continue
			}
			cacheKey := fmt.Sprintf("%d:%s", regionData.MonsterID, region)
			s.byMonsterID[cacheKey] = regionData
			byMonsterIDCount++
		}
	}

	log.Printf("[CACHE] Mob cache initialized: byID=%d byMonsterID=%d", len(s.byID), byMonsterIDCount)
	return nil
}

// GetCachedByID retrieves a mob by ID from the cache only.
// Returns false if not found or expired.
func (s *MobCacheService) GetCachedByID(id string) (CachedMobData, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	data, ok := s.byID[id]
	if ok && time.Since(data.Cached) < mobCacheTTL {
		return data, true
	}
	return CachedMobData{}, false
}

// GetByID retrieves a mob by ID, loading it from the DB if missing or expired.
func (s *MobCacheService) GetByID(app core.App, id string) (CachedMobData, error) {
	if data, ok := s.GetCachedByID(id); ok {
		return data, nil
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	// Double check
	if data, ok := s.byID[id]; ok && time.Since(data.Cached) < mobCacheTTL {
		return data, nil
	}

	// Load by ID
	mob, err := app.FindFirstRecordByFilter(
		COLLECTION_MOBS,
		"id = {:id}",
		map[string]any{"id": id},
	)
	if err != nil {
		return CachedMobData{}, fmt.Errorf("failed to load mob by ID %s: %w", id, err)
	}

	data, err := loadMobDataFromRecord(app, mob, "")
	if err != nil {
		return CachedMobData{}, err
	}

	s.byID[data.MobID] = data
	return data, nil
}

// GetByMonsterID retrieves a mob by monster ID and region, loading it from the DB if missing or expired.
// TotalChannels will be set from map.region_data[region].
func (s *MobCacheService) GetByMonsterID(app core.App, monsterID int, region string) (CachedMobData, error) {
	cacheKey := fmt.Sprintf("%d:%s", monsterID, region)
	s.mu.RLock()
	data, ok := s.byMonsterID[cacheKey]
	s.mu.RUnlock()
	if ok && time.Since(data.Cached) < mobCacheTTL {
		return data, nil
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	// Double check
	if data, ok := s.byMonsterID[cacheKey]; ok && time.Since(data.Cached) < mobCacheTTL {
		return data, nil
	}

	// Load from DB
	mob, err := app.FindFirstRecordByFilter(
		COLLECTION_MOBS,
		"monster_id = {:monster_id}",
		map[string]any{"monster_id": monsterID},
	)
	if err != nil {
		return CachedMobData{}, fmt.Errorf("failed to load mob by monster_id %d: %w", monsterID, err)
	}

	data, err = loadMobDataFromRecord(app, mob, region)
	if err != nil {
		return CachedMobData{}, err
	}

	s.byMonsterID[cacheKey] = data
	return data, nil
}

// parseRegionData extracts region map from region_data field, handling different types PocketBase may return.
func parseRegionData(regionData interface{}) (map[string]interface{}, error) {
	var regionMap map[string]interface{}

	// Handle different types that PocketBase may return for JSON fields
	if m, ok := regionData.(map[string]interface{}); ok {
		regionMap = m
	} else if str, ok := regionData.(string); ok {
		if err := json.Unmarshal([]byte(str), &regionMap); err != nil {
			return nil, fmt.Errorf("failed to parse region_data JSON string: %w", err)
		}
	} else {
		// For types like types.JSONRaw, marshal then unmarshal
		jsonBytes, err := json.Marshal(regionData)
		if err != nil {
			return nil, fmt.Errorf("invalid region_data format: %w", err)
		}
		if err := json.Unmarshal(jsonBytes, &regionMap); err != nil {
			return nil, fmt.Errorf("failed to parse region_data: %w", err)
		}
	}

	return regionMap, nil
}

// loadMobDataFromRecord loads mob data from an already fetched record.
// If region is provided, gets TotalChannels from map.region_data[region].
func loadMobDataFromRecord(app core.App, mob *core.Record, region string) (CachedMobData, error) {
	if errs := app.ExpandRecord(mob, []string{"map"}, nil); len(errs) > 0 {
		return CachedMobData{}, fmt.Errorf("failed to expand map for mob %s: %w", mob.GetString("name"), errs["map"])
	}

	mapRecord := mob.ExpandedOne("map")
	if mapRecord == nil {
		return CachedMobData{}, fmt.Errorf("map not found for mob %s", mob.GetString("name"))
	}

	totalChannels := 0
	if region != "" {
		regionData := mapRecord.Get("region_data")
		if regionData == nil {
			return CachedMobData{}, fmt.Errorf("region_data not found for mob %s", mob.GetString("name"))
		}

		regionMap, err := parseRegionData(regionData)
		if err != nil {
			return CachedMobData{}, fmt.Errorf("failed to parse region_data for mob %s: %w", mob.GetString("name"), err)
		}

		regionChannels, exists := regionMap[region]
		if !exists {
			return CachedMobData{}, fmt.Errorf("region %s not found in region_data for mob %s", region, mob.GetString("name"))
		}

		channels, ok := regionChannels.(float64)
		if !ok {
			return CachedMobData{}, fmt.Errorf("invalid channel count type for region %s in mob %s", region, mob.GetString("name"))
		}
		totalChannels = int(channels)

		if totalChannels <= 0 {
			return CachedMobData{}, fmt.Errorf("invalid total_channels for mob %s in region %s", mob.GetString("name"), region)
		}
	}

	return CachedMobData{
		MobID:         mob.Id,
		MonsterID:     mob.GetInt("monster_id"),
		Name:          mob.GetString("name"),
		TotalChannels: totalChannels,
		MobType:       mob.GetString("type"),
		RespawnTime:   mob.GetInt("respawn_time"),
		Cached:        time.Now(),
	}, nil
}
