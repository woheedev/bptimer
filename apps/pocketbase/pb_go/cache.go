package pb_go

import (
	"fmt"
	"log"
	"sync"
	"time"

	"github.com/pocketbase/pocketbase/core"
)

// Global mob cache instance
var MobCache = &MobCacheService{
	byName:      make(map[string]CachedMobData),
	byID:        make(map[string]CachedMobData),
	byMonsterID: make(map[int]CachedMobData),
}

type MobCacheService struct {
	byName      map[string]CachedMobData
	byID        map[string]CachedMobData
	byMonsterID map[int]CachedMobData
	mu          sync.RWMutex
}

func (s *MobCacheService) updateAllIndices(data CachedMobData) {
	s.byName[data.Name] = data
	s.byID[data.MobID] = data
	s.byMonsterID[data.MonsterID] = data
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

	for _, mob := range mobs {
		data, err := loadMobDataFromRecord(app, mob)
		if err != nil {
			return err
		}
		s.updateAllIndices(data)
	}

	log.Printf("[CACHE] Mob cache initialized count=%d", len(s.byName))
	return nil
}

// GetCachedByName retrieves a mob by name from the cache only.
// Returns false if not found or expired.
func (s *MobCacheService) GetCachedByName(name string) (CachedMobData, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	data, ok := s.byName[name]
	if ok && time.Since(data.Cached) < mobCacheTTL {
		return data, true
	}
	return CachedMobData{}, false
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

// GetByName retrieves a mob by name, loading it from the DB if missing or expired.
func (s *MobCacheService) GetByName(app core.App, name string) (CachedMobData, error) {
	if data, ok := s.GetCachedByName(name); ok {
		return data, nil
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	// Double check
	if data, ok := s.byName[name]; ok && time.Since(data.Cached) < mobCacheTTL {
		return data, nil
	}

	// Load from DB
	mob, err := app.FindFirstRecordByFilter(
		COLLECTION_MOBS,
		"name = {:name}",
		map[string]any{"name": name},
	)
	if err != nil {
		return CachedMobData{}, fmt.Errorf("failed to load mob %s: %w", name, err)
	}

	data, err := loadMobDataFromRecord(app, mob)
	if err != nil {
		return CachedMobData{}, err
	}

	s.updateAllIndices(data)
	return data, nil
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

	data, err := loadMobDataFromRecord(app, mob)
	if err != nil {
		return CachedMobData{}, err
	}

	s.updateAllIndices(data)
	return data, nil
}

// GetByMonsterID retrieves a mob by monster ID, loading it from the DB if missing or expired.
func (s *MobCacheService) GetByMonsterID(app core.App, monsterID int) (CachedMobData, error) {
	s.mu.RLock()
	data, ok := s.byMonsterID[monsterID]
	s.mu.RUnlock()
	if ok && time.Since(data.Cached) < mobCacheTTL {
		return data, nil
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	// Double check
	if data, ok := s.byMonsterID[monsterID]; ok && time.Since(data.Cached) < mobCacheTTL {
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

	data, err = loadMobDataFromRecord(app, mob)
	if err != nil {
		return CachedMobData{}, err
	}

	s.updateAllIndices(data)
	return data, nil
}

// loadMobDataFromRecord loads mob data from an already fetched record.
func loadMobDataFromRecord(app core.App, mob *core.Record) (CachedMobData, error) {
	if errs := app.ExpandRecord(mob, []string{"map"}, nil); len(errs) > 0 {
		return CachedMobData{}, fmt.Errorf("failed to expand map for mob %s: %w", mob.GetString("name"), errs["map"])
	}

	mapRecord := mob.ExpandedOne("map")
	if mapRecord == nil {
		return CachedMobData{}, fmt.Errorf("map not found for mob %s", mob.GetString("name"))
	}

	totalChannels := mapRecord.GetInt("total_channels")
	if totalChannels <= 0 {
		return CachedMobData{}, fmt.Errorf("invalid total_channels for mob %s", mob.GetString("name"))
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
