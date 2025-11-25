package pb_go

import (
	"time"
)

type CreateHPReportRequest struct {
	MonsterID int     `json:"monster_id" form:"monster_id"`           // Game monster ID (from meter)
	HPPct     int     `json:"hp_pct" form:"hp_pct"`                   // HP percentage (0-100)
	Channel   int     `json:"line" form:"line"`                       // Channel/Line number
	PosX      float64 `json:"pos_x,omitempty" form:"pos_x"`           // X coordinate
	PosY      float64 `json:"pos_y,omitempty" form:"pos_y"`           // Y coordinate
	PosZ      float64 `json:"pos_z,omitempty" form:"pos_z"`           // Z coordinate
	AccountID string  `json:"account_id,omitempty" form:"account_id"` // User account ID (pending implementation)
	UID       string  `json:"uid,omitempty" form:"uid"`               // User Unique ID (pending implementation)
}

type CachedMobData struct {
	MobID         string    // PocketBase mob record ID
	TotalChannels int       // Number of channels for this mob's map
	Cached        time.Time // When this entry was cached
}

type ApiKeyCacheEntry struct {
	UserID    string    // PocketBase user ID
	ExpiresAt time.Time // Cache expiration time
}

type MobLocation struct {
	ID int     // Location ID (1-based index)
	X  float64 // X coordinate
	Y  float64 // Y coordinate (not used in distance calc)
	Z  float64 // Z coordinate
}

type MobUpdate struct {
	MobID         string // PocketBase mob record ID
	ChannelNumber int    // Channel number
	HPPercentage  int    // HP percentage
	LocationImage *int   // Location image ID (nil if not set)
}
