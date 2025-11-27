use crate::models::combat::{DamageEntry, DamageTakenEntry, HealingEntry};
use instant::Instant;

#[derive(Debug, Clone, Default)]
pub struct PlayerState {
    pub account_id: Option<String>,
    pub uid: Option<i64>,
    pub line_id: Option<u32>,
}

impl PlayerState {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn set_account_info(&mut self, account_id: String, uid: i64) {
        if self.account_id.as_ref() != Some(&account_id) || self.uid != Some(uid) {
            self.account_id = Some(account_id);
            self.uid = Some(uid);
        }
    }

    pub fn set_line_id(&mut self, line_id: u32) {
        self.line_id = Some(line_id);
    }

    pub fn get_line_id(&self) -> i32 {
        self.line_id.map(|id| id as i32).unwrap_or(0)
    }

    pub fn get_account_id(&self) -> Option<String> {
        self.account_id.clone()
    }

    pub fn get_uid(&self) -> Option<i64> {
        self.uid
    }
}

/// Player metadata stored in cache
#[derive(Debug, Clone, Default)]
pub struct PlayerMetadata {
    pub name: Option<String>,
    pub class_id: Option<i32>,
    pub ability_score: Option<i32>,
}

/// Global player info cache (uid => PlayerMetadata)
/// Persists across stats clearing until app closes
pub struct PlayerInfoCache {
    cache: std::sync::Arc<std::sync::Mutex<std::collections::HashMap<i64, PlayerMetadata>>>,
}

impl PlayerInfoCache {
    pub fn new() -> Self {
        Self {
            cache: std::sync::Arc::new(std::sync::Mutex::new(std::collections::HashMap::new())),
        }
    }

    pub fn set_name(&self, uid: i64, name: String) {
        if name.is_empty() {
            return;
        }
        if let Ok(mut cache) = self.cache.lock() {
            let entry = cache.entry(uid).or_insert_with(PlayerMetadata::default);
            if entry.name.as_ref() != Some(&name) {
                entry.name = Some(name);
            }
        }
    }

    pub fn set_class(&self, uid: i64, class_id: i32) {
        if class_id <= 0 {
            return;
        }
        if let Ok(mut cache) = self.cache.lock() {
            let entry = cache.entry(uid).or_insert_with(PlayerMetadata::default);
            if entry.class_id != Some(class_id) {
                entry.class_id = Some(class_id);
            }
        }
    }

    pub fn set_ability_score(&self, uid: i64, ability_score: i32) {
        if ability_score <= 0 {
            return;
        }
        if let Ok(mut cache) = self.cache.lock() {
            let entry = cache.entry(uid).or_insert_with(PlayerMetadata::default);
            if entry.ability_score != Some(ability_score) {
                entry.ability_score = Some(ability_score);
            }
        }
    }

    pub fn get_name(&self, uid: i64) -> Option<String> {
        self.cache
            .lock()
            .ok()
            .and_then(|cache| cache.get(&uid).and_then(|m| m.name.clone()))
    }

    pub fn get_name_or_default(&self, uid: i64) -> String {
        self.get_name(uid)
            .filter(|name| !name.is_empty())
            .unwrap_or_else(|| format!("Player {}", uid))
    }

    pub fn get(&self, uid: i64) -> PlayerMetadata {
        self.cache
            .lock()
            .ok()
            .and_then(|cache| cache.get(&uid).cloned())
            .unwrap_or_default()
    }
}

impl Default for PlayerInfoCache {
    fn default() -> Self {
        Self::new()
    }
}

/// Player combat statistics
#[derive(Clone, Debug)]
pub struct PlayerStats {
    // Identity
    pub uid: i64,
    pub name: String,

    // Damage stats
    pub total_damage: f32,
    pub normal_damage: f32,
    pub critical_damage: f32,
    pub lucky_damage: f32,
    pub crit_lucky_damage: f32,

    pub total_hits: u32,
    pub normal_hits: u32,
    pub critical_hits: u32,
    pub lucky_hits: u32,
    pub crit_lucky_hits: u32,

    // DPS tracking
    pub current_dps: f32,
    pub max_dps: f32,
    pub max_single_hit: f32,
    pub dps_history: Vec<f32>,
    pub damage_window: Vec<DamageEntry>,

    pub total_healing: f32,
    pub normal_healing: f32,
    pub critical_healing: f32,
    pub lucky_healing: f32,
    pub crit_lucky_healing: f32,
    pub total_heals: u32,
    pub critical_heals: u32,
    pub lucky_heals: u32,
    pub crit_lucky_heals: u32,
    pub max_single_heal: f32,

    // HPS tracking
    pub current_hps: f32,
    pub max_hps: f32,
    pub healing_window: Vec<HealingEntry>,

    pub total_damage_taken: f32,
    pub max_single_hit_taken: f32,
    pub total_hits_taken: u32,
    pub miss_count: u32,
    pub death_count: u32,

    // DTPS tracking
    pub current_dtps: f32,
    pub max_dtps: f32,
    pub damage_taken_window: Vec<DamageTakenEntry>,

    // Time windows for total averages
    pub first_damage_time: Option<Instant>,
    pub last_damage_time: Option<Instant>,
    pub first_healing_time: Option<Instant>,
    pub last_healing_time: Option<Instant>,
    pub first_damage_taken_time: Option<Instant>,
    pub last_damage_taken_time: Option<Instant>,
    pub dps_session_start_damage: f32,
}

impl PlayerStats {
    pub fn new(uid: i64) -> Self {
        Self {
            uid,
            name: format!("Player {}", uid),
            total_damage: 0.0,
            normal_damage: 0.0,
            critical_damage: 0.0,
            lucky_damage: 0.0,
            crit_lucky_damage: 0.0,
            total_hits: 0,
            normal_hits: 0,
            critical_hits: 0,
            lucky_hits: 0,
            crit_lucky_hits: 0,
            current_dps: 0.0,
            max_dps: 0.0,
            max_single_hit: 0.0,
            dps_history: vec![0.0; 600],
            damage_window: Vec::new(),
            total_healing: 0.0,
            normal_healing: 0.0,
            critical_healing: 0.0,
            lucky_healing: 0.0,
            crit_lucky_healing: 0.0,
            total_heals: 0,
            critical_heals: 0,
            lucky_heals: 0,
            crit_lucky_heals: 0,
            max_single_heal: 0.0,
            current_hps: 0.0,
            max_hps: 0.0,
            healing_window: Vec::new(),
            total_damage_taken: 0.0,
            max_single_hit_taken: 0.0,
            total_hits_taken: 0,
            miss_count: 0,
            death_count: 0,
            current_dtps: 0.0,
            max_dtps: 0.0,
            damage_taken_window: Vec::new(),
            first_damage_time: None,
            last_damage_time: None,
            first_healing_time: None,
            last_healing_time: None,
            first_damage_taken_time: None,
            last_damage_taken_time: None,
            dps_session_start_damage: 0.0,
        }
    }

    pub fn get_total_dps(&self, cutoff_seconds: f32) -> f32 {
        if let (Some(first), Some(last)) = (self.first_damage_time, self.last_damage_time) {
            let now = Instant::now();
            let time_since_last = now.duration_since(last).as_secs_f32();

            let duration = if time_since_last > cutoff_seconds {
                let combat_duration = last.duration_since(first).as_secs_f32();
                combat_duration + cutoff_seconds
            } else {
                now.duration_since(first).as_secs_f32()
            };

            let session_damage = self.total_damage - self.dps_session_start_damage;
            let duration_whole_secs = duration.round().max(1.0);
            return session_damage / duration_whole_secs;
        }
        0.0
    }
}
