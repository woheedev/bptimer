pub const BPTIMER_BASE_URL: &str = "https://bptimer.com";

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

pub fn get_class_name(class_id: i32) -> Option<&'static str> {
    match class_id {
        1 => Some("Stormblade"),
        2 => Some("Frost Mage"),
        3 => Some("Fire Axe"),
        4 => Some("Wind Knight"),
        5 => Some("Verdant Oracle"),
        8 => Some("Gunner"),
        9 => Some("Heavy Guardian"),
        10 => Some("Spirit Dancer"),
        11 => Some("Marksman"),
        12 => Some("Shield Knight"),
        13 => Some("Beat Performer"),
        _ => None,
    }
}

/// Account ID prefix constants for region detection
pub mod account_id_regions {
    use crate::config::MobTimersRegion;

    pub const PREFIX_DEV: &str = "0_";
    pub const PREFIX_CN: &str = "1_";
    pub const PREFIX_INT: &str = "2_";
    pub const PREFIX_TW: &str = "3_";
    pub const PREFIX_NA: &str = "4_";
    pub const PREFIX_JPKR: &str = "5_";
    pub const PREFIX_SEA: &str = "6_";

    pub struct RegionInfo {
        pub prefix: &'static str,
        pub name: &'static str,
        pub display_name: &'static str,
        pub enabled: bool,
        pub region: Option<MobTimersRegion>,
    }

    pub const REGIONS: &[RegionInfo] = &[
        RegionInfo {
            prefix: PREFIX_DEV,
            name: "DEV",
            display_name: "DEV",
            enabled: false,
            region: Some(MobTimersRegion::DEV),
        },
        RegionInfo {
            prefix: PREFIX_CN,
            name: "CN",
            display_name: "CN",
            enabled: false,
            region: Some(MobTimersRegion::CN),
        },
        RegionInfo {
            prefix: PREFIX_INT,
            name: "INT",
            display_name: "INT",
            enabled: false,
            region: Some(MobTimersRegion::INT),
        },
        RegionInfo {
            prefix: PREFIX_TW,
            name: "TW",
            display_name: "TW",
            enabled: false,
            region: Some(MobTimersRegion::TW),
        },
        RegionInfo {
            prefix: PREFIX_NA,
            name: "NA",
            display_name: "NA",
            enabled: true,
            region: Some(MobTimersRegion::NA),
        },
        RegionInfo {
            prefix: PREFIX_JPKR,
            name: "JPKR",
            display_name: "JP/KR",
            enabled: false,
            region: Some(MobTimersRegion::JPKR),
        },
        RegionInfo {
            prefix: PREFIX_SEA,
            name: "SEA",
            display_name: "SEA",
            enabled: true,
            region: Some(MobTimersRegion::SEA),
        },
    ];

    /// Get MobTimersRegion from account_id prefix
    pub fn get_mob_timers_region_from_prefix(prefix: &str) -> Option<MobTimersRegion> {
        REGIONS
            .iter()
            .find(|r| r.prefix == prefix && r.enabled)
            .and_then(|r| r.region.clone())
    }

    /// Check if a prefix exists in REGIONS but is not enabled
    pub fn is_prefix_known_but_disabled(prefix: &str) -> bool {
        REGIONS.iter().any(|r| r.prefix == prefix && !r.enabled)
    }

    /// Get region info from MobTimersRegion enum
    pub fn get_region_info(region: &MobTimersRegion) -> Option<&'static RegionInfo> {
        REGIONS.iter().find(|r| r.region.as_ref() == Some(region))
    }

    /// Get topic name for a region, adding region suffix if not NA
    /// (e.g., "mob_hp_updates" for NA, "mob_hp_updates_sea" for SEA)
    pub fn get_topic_name(region: &MobTimersRegion, base_name: &str) -> String {
        let region_info = get_region_info(region);
        match region_info {
            Some(info) => {
                if info.name == "NA" {
                    base_name.to_string()
                } else {
                    format!("{}_{}", base_name, info.name.to_lowercase())
                }
            }
            None => base_name.to_string(), // Fallback
        }
    }

    /// Get region string name for API queries (e.g., "NA", "SEA", "JPKR")
    pub fn get_region_string(region: &MobTimersRegion) -> String {
        get_region_info(region)
            .map(|r| r.name.to_string())
            .unwrap_or_else(|| "NA".to_string()) // Fallback
    }

    /// Get region display name for UI (e.g., "Auto", "NA", "JP/KR")
    pub fn get_region_display_name(region: &Option<MobTimersRegion>) -> &'static str {
        match region {
            None => "Auto",
            Some(region) => get_region_info(region)
                .map(|r| r.display_name)
                .unwrap_or("Unknown"),
        }
    }
}
