package pb_go

type CreateHPReportRequest struct {
	MonsterID int `json:"monster_id" form:"monster_id"`
	HPPct     int `json:"hp_pct" form:"hp_pct"`
	Channel   int `json:"line" form:"line"`
}
