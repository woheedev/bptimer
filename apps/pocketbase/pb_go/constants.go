package pb_go

import "time"

const MOB_CACHE_TTL_MINUTES = 60

var mobCacheTTL = time.Duration(MOB_CACHE_TTL_MINUTES) * time.Minute

// Boss game id to boss name mapping
var MOB_MAPPING = map[int]string{
	10007: "Storm Goblin King",
	10009: "Frost Ogre",
	10010: "Tempest Ogre",
	10018: "Inferno Ogre",
	10029: "Muku King",
	10032: "Golden Juggernaut",
	10056: "Brigand Leader",
	10059: "Muku Chief",
	10069: "Phantom Arachnocrab",
	10077: "Venobzzar Incubator",
	10081: "Iron Fang",
	10084: "Celestial Flier",
	10085: "Lizardman King",
	10086: "Goblin King",
	10900: "Golden Nappo",
	10901: "Silver Nappo",
	10902: "Lovely Boarlet",
	10903: "Breezy Boarlet",
	10904: "Loyal Boarlet",
}
