// All boss and magical creature IDs from boss-meter-ids.json
// These are all tracked for radar/location purposes
pub const BOSS_AND_MAGICAL_CREATURE_IDS: &[u32] = &[
    10007, 10009, 10010, 10018, 10029, 10032, 10056, 10059, 10069, 10077, 10081, 10084, 10085,
    10086, 10900, 10901, 10902, 10903, 10904,
];

// Mob name mapping (from boss-meter-ids.json)
pub fn get_boss_or_magical_creature_name(mob_id: u32) -> Option<&'static str> {
    match mob_id {
        10007 => Some("Storm Goblin King"),
        10009 => Some("Frost Ogre"),
        10010 => Some("Tempest Ogre"),
        10018 => Some("Inferno Ogre"),
        10029 => Some("Muku King"),
        10032 => Some("Golden Juggernaut"),
        10056 => Some("Brigand Leader"),
        10059 => Some("Muku Chief"),
        10069 => Some("Phantom Arachnocrab"),
        10077 => Some("Venobzzar Incubator"),
        10081 => Some("Iron Fang"),
        10084 => Some("Celestial Flier"),
        10085 => Some("Lizardman King"),
        10086 => Some("Goblin King"),
        10900 => Some("Golden Nappo"),
        10901 => Some("Silver Nappo"),
        10902 => Some("Lovely Boarlet"),
        10903 => Some("Breezy Boarlet"),
        10904 => Some("Loyal Boarlet"),
        _ => None,
    }
}

pub fn is_location_tracked_mob(mob_id: u32) -> bool {
    BOSS_AND_MAGICAL_CREATURE_IDS.contains(&mob_id)
}

pub fn requires_location_number(mob_id: u32) -> bool {
    matches!(mob_id, 10900 | 10901 | 10904)
}

pub fn get_location_name(mob_name: &str, location_number: i32) -> Option<&'static str> {
    match mob_name {
        "Loyal Boarlet" => match location_number {
            1 => Some("Cliff Ruins"),
            2 => Some("Scout NW"),
            3 => Some("Scout E"),
            4 => Some("Scout NE"),
            5 => Some("Kana"),
            6 => Some("Farm"),
            7 => Some("Tent"),
            8 => Some("Andra"),
            _ => None,
        },
        "Golden Nappo" => match location_number {
            1 => Some("Beach"),
            2 => Some("Cliff Ruins"),
            3 => Some("Muku"),
            4 => Some("Farm"),
            5 => Some("Brigand Leader"),
            6 => Some("Ruins E"),
            _ => None,
        },
        "Silver Nappo" => match location_number {
            1 => Some("Beach"),
            2 => Some("Lone"),
            3 => Some("Cliff Ruins"),
            4 => Some("Scout N"),
            5 => Some("Scout E"),
            6 => Some("Kana Road"),
            7 => Some("Muku"),
            8 => Some("Farm"),
            9 => Some("Brigand Leader"),
            10 => Some("Ruins N"),
            11 => Some("Ruins E"),
            _ => None,
        },
        _ => None,
    }
}

pub fn user_agent() -> String {
    format!(
        "BPTimer-Desktop-Companion/{}",
        self_update::cargo_crate_version!()
    )
}
