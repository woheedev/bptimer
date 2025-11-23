use crate::models::combat::{DamageEntry, DamageTakenEntry, HealingEntry};
use instant::Instant;

#[derive(Debug, Clone)]
pub struct PlayerState {
    pub account_id: Option<String>,
    pub uid: Option<i64>,
    pub line_id: Option<u32>,
}

impl PlayerState {
    pub fn new() -> Self {
        Self {
            account_id: None,
            uid: None,
            line_id: None,
        }
    }

    pub fn set_account_info(&mut self, account_id: String, uid: i64) -> bool {
        let changed = self.account_id != Some(account_id.clone()) || self.uid != Some(uid);
        if changed {
            self.account_id = Some(account_id);
            self.uid = Some(uid);
        }
        changed
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

impl Default for PlayerState {
    fn default() -> Self {
        Self::new()
    }
}

/// Global player name cache (uid => name)
/// Persists across stats clearing until app closes
pub struct PlayerNameCache {
    cache: std::sync::Arc<std::sync::Mutex<std::collections::HashMap<i64, String>>>,
}

impl PlayerNameCache {
    pub fn new() -> Self {
        Self {
            cache: std::sync::Arc::new(std::sync::Mutex::new(std::collections::HashMap::new())),
        }
    }

    pub fn set(&self, uid: i64, name: String) {
        if let Ok(mut cache) = self.cache.lock() {
            cache.insert(uid, name);
        }
    }

    pub fn get(&self, uid: i64) -> Option<String> {
        self.cache
            .lock()
            .ok()
            .and_then(|cache| cache.get(&uid).cloned())
    }

    pub fn get_or_default(&self, uid: i64) -> String {
        self.get(uid).unwrap_or_else(|| format!("Player {}", uid))
    }
}

impl Default for PlayerNameCache {
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
        }
    }

    pub fn get_total_dps(&self) -> f32 {
        if let (Some(first), Some(last)) = (self.first_damage_time, self.last_damage_time) {
            let duration = last.duration_since(first).as_secs_f32();
            if duration > 0.0 {
                return self.total_damage / duration;
            }
        }
        0.0
    }
}
