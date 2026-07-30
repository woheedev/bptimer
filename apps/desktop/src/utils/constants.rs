use std::collections::{HashMap, HashSet};
use std::sync::{LazyLock, Mutex};

pub const BPTIMER_BASE_URL: &str = "https://bptimer.com";

// Fallback mob mappings (used if prefetch fails or hasn't been called)
const FALLBACK_MOB_MAPPINGS: &[(u32, &str)] = &[
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
];

// Fallback location-tracked mob IDs
const FALLBACK_LOCATION_TRACKED_MOBS: &[u32] = &[10900, 10901, 10904];

// Dynamic mob mapping (populated by prefetch)
static MOB_MAPPING: LazyLock<Mutex<HashMap<u32, String>>> = LazyLock::new(|| {
    let mut map = HashMap::new();
    for (id, name) in FALLBACK_MOB_MAPPINGS {
        map.insert(*id, name.to_string());
    }
    Mutex::new(map)
});

static LOCATION_TRACKED_MOBS: LazyLock<Mutex<HashSet<u32>>> = LazyLock::new(|| {
    let mut set = HashSet::new();
    for &id in FALLBACK_LOCATION_TRACKED_MOBS {
        set.insert(id);
    }
    Mutex::new(set)
});

pub fn get_mob_name(mob_id: u32) -> Option<String> {
    MOB_MAPPING.lock().unwrap().get(&mob_id).cloned()
}

pub fn get_monster_id_from_name(mob_name: &str) -> Option<u32> {
    MOB_MAPPING
        .lock()
        .unwrap()
        .iter()
        .find(|(_, name)| name.as_str() == mob_name)
        .map(|(id, _)| *id)
}

pub fn is_tracked_mob(mob_id: u32) -> bool {
    MOB_MAPPING.lock().unwrap().contains_key(&mob_id)
}

pub fn is_location_tracked_mob(mob_id: u32) -> bool {
    LOCATION_TRACKED_MOBS.lock().unwrap().contains(&mob_id)
}

pub fn set_mob_mapping(mapping: HashMap<u32, String>) {
    *MOB_MAPPING.lock().unwrap() = mapping;
}

pub fn set_location_tracked_mobs(mobs: HashSet<u32>) {
    *LOCATION_TRACKED_MOBS.lock().unwrap() = mobs;
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

/// Scene IP to region helpers. Region detection on the desktop is driven by
/// `scene_ip` from the NotifyEnterWorld packet (see `SCENE_IP_REGIONS`); the
/// PocketBase backend still honors the account_id prefix for older clients.
pub mod account_id_regions {
    use crate::config::MobTimersRegion;

    /// Maps SceneIp values from game VRequest packets to region names.
    pub const SCENE_IP_REGIONS: &[(&str, &str)] = &[
        ("gamesvr.playbpsr.com", "NA"),
        ("gamesvr-eu.playbpsr.com", "EU"),
        ("bpm-sea-gamesvra.haoplay.net", "SEA"),
        ("bpm-jp-gamesvra.xdg.com", "JP"),
        ("bpm-kr-gamesvra.xdg.com", "KR"),
    ];

    /// Get region from SceneIp value
    pub fn get_region_from_scene_ip(scene_ip: &str) -> Option<&'static str> {
        SCENE_IP_REGIONS
            .iter()
            .find(|(ip, _)| *ip == scene_ip)
            .map(|(_, region)| *region)
    }

    /// Get topic name for a region, adding region suffix if not NA.
    /// Uses the actual MobTimersRegion variant so EU → "_eu", KR → "_kr", etc.
    pub fn get_topic_name(region: &MobTimersRegion, base_name: &str) -> String {
        match region {
            MobTimersRegion::NA => base_name.to_string(),
            _ => format!("{}_{}", base_name, region_name_lower(region)),
        }
    }

    /// Lowercase region name used as a topic suffix.
    fn region_name_lower(region: &MobTimersRegion) -> &'static str {
        match region {
            MobTimersRegion::DEV => "dev",
            MobTimersRegion::CN => "cn",
            MobTimersRegion::INT => "int",
            MobTimersRegion::TW => "tw",
            MobTimersRegion::NA => "na",
            MobTimersRegion::EU => "eu",
            MobTimersRegion::JP => "jp",
            MobTimersRegion::KR => "kr",
            MobTimersRegion::SEA => "sea",
        }
    }

    /// Get region string name for API queries (e.g., "NA", "SEA", "EU", "JP", "KR")
    pub fn get_region_string(region: &MobTimersRegion) -> &'static str {
        match region {
            MobTimersRegion::NA => "NA",
            MobTimersRegion::EU => "EU",
            MobTimersRegion::JP => "JP",
            MobTimersRegion::KR => "KR",
            MobTimersRegion::SEA => "SEA",
            MobTimersRegion::DEV => "DEV",
            MobTimersRegion::CN => "CN",
            MobTimersRegion::INT => "INT",
            MobTimersRegion::TW => "TW",
        }
    }

    /// Get region display name for UI (e.g., "Auto", "NA", "EU", "JP", "KR", "SEA")
    pub fn get_region_display_name(region: &Option<MobTimersRegion>) -> &'static str {
        match region {
            None => "Auto",
            Some(region) => match region {
                MobTimersRegion::DEV => "DEV",
                MobTimersRegion::CN => "CN",
                MobTimersRegion::INT => "INT",
                MobTimersRegion::TW => "TW",
                MobTimersRegion::NA => "NA",
                MobTimersRegion::EU => "EU",
                MobTimersRegion::JP => "JP",
                MobTimersRegion::KR => "KR",
                MobTimersRegion::SEA => "SEA",
            },
        }
    }
}
