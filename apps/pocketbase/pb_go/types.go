package pb_go

import (
	"time"
)

type CreateHPReportRequest struct {
	MonsterID int `json:"monster_id" form:"monster_id"`
	HPPct     int `json:"hp_pct" form:"hp_pct"`
	Channel   int `json:"line" form:"line"`
}

type CachedMobData struct {
	MobID         string
	TotalChannels int
	Cached        time.Time
}
