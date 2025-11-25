// Macro to generate bidirectional mappings between mob IDs and names
// Data source: boss-meter-ids.json
macro_rules! define_mob_mappings {
    ($(($id:expr, $name:expr)),* $(,)?) => {
        // All boss and magical creature IDs
        pub const BOSS_AND_MAGICAL_CREATURE_IDS: &[u32] = &[$($id),*];

        // Get mob name from ID
        pub fn get_boss_or_magical_creature_name(mob_id: u32) -> Option<&'static str> {
            match mob_id {
                $($id => Some($name),)*
                _ => None,
            }
        }

        // Get mob ID from name
        pub fn get_game_mob_id_from_name(mob_name: &str) -> Option<u32> {
            match mob_name {
                $($name => Some($id),)*
                _ => None,
            }
        }
    };
}

define_mob_mappings! {
    (10007, "Storm Goblin King"),
    (10009, "Frost Ogre"),
    (10010, "Tempest Ogre"),
    (10018, "Inferno Ogre"),
    (10029, "Muku King"),
    (10032, "Golden Juggernaut"),
    (10056, "Brigand Leader"),
    (10059, "Muku Chief"),
    (10069, "Phantom Arachnocrab"),
    (10077, "Venobzzar Incubator"),
    (10081, "Iron Fang"),
    (10084, "Celestial Flier"),
    (10085, "Lizardman King"),
    (10086, "Goblin King"),
    (10900, "Golden Nappo"),
    (10901, "Silver Nappo"),
    (10902, "Lovely Boarlet"),
    (10903, "Breezy Boarlet"),
    (10904, "Loyal Boarlet"),
}

pub fn is_location_tracked_mob(mob_id: u32) -> bool {
    BOSS_AND_MAGICAL_CREATURE_IDS.contains(&mob_id)
}

pub fn requires_location_number(mob_id: u32) -> bool {
    matches!(mob_id, 10900 | 10901 | 10904)
}

pub fn get_location_name(mob_id: u32, location_image: i32) -> Option<&'static str> {
    match mob_id {
        10904 => match location_image {
            // Loyal Boarlet
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
        10900 => match location_image {
            // Golden Nappo
            1 => Some("Beach"),
            2 => Some("Cliff Ruins"),
            3 => Some("Muku"),
            4 => Some("Old Kana"),
            5 => Some("Brigand Leader"),
            6 => Some("Ruins E"),
            _ => None,
        },
        10901 => match location_image {
            // Silver Nappo
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
