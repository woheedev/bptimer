use crate::utils::constants;
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use std::time::{SystemTime, UNIX_EPOCH};

const CACHE_EXPIRY_MS: u64 = 5 * 60 * 1000;
const HP_REPORT_INTERVAL: f32 = 5.0;
const POSITION_ROUNDING_MULTIPLIER: f32 = 100.0;

struct CacheEntry {
    timestamp: u64,
    last_reported_hp: Option<f32>,
    is_pending: bool,
}

pub struct BPTimerClient {
    api_url: String,
    api_key: String,
    cache: Arc<Mutex<HashMap<String, CacheEntry>>>,
}

unsafe impl Send for BPTimerClient {}
unsafe impl Sync for BPTimerClient {}

impl BPTimerClient {
    pub fn new(api_url: String, api_key: String) -> Self {
        Self {
            api_url,
            api_key,
            cache: Arc::new(Mutex::new(HashMap::new())),
        }
    }

    /// Report HP to BPTimer API
    /// Handles validation, caching, and HTTP request internally
    pub fn report_hp(
        self: Arc<Self>,
        monster_id: u32,
        hp_pct: f32,
        line: i32,
        pos_x: Option<f32>,
        pos_y: Option<f32>,
        pos_z: Option<f32>,
        account_id: Option<String>,
        uid: Option<i64>,
    ) {
        // Check API credentials
        if self.api_key.is_empty() || self.api_url.is_empty() {
            return;
        }

        // Check if mob is tracked and requires position data
        if !constants::is_location_tracked_mob(monster_id) {
            return;
        }

        // All tracked mobs require complete position data (all or none)
        let has_all_positions = pos_x.is_some() && pos_y.is_some() && pos_z.is_some();
        if !has_all_positions {
            return;
        }

        // Round HP% to nearest HP_REPORT_INTERVAL
        let rounded_hp_pct = (hp_pct / HP_REPORT_INTERVAL).round() * HP_REPORT_INTERVAL;

        // Check cache
        let cache_key = format!("{}-{}", monster_id, line);
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_millis() as u64;

        let should_report = {
            let mut cache = self.cache.lock().unwrap();

            // Get or create cache entry
            let entry = cache
                .entry(cache_key.clone())
                .or_insert_with(|| CacheEntry {
                    timestamp: now,
                    last_reported_hp: None,
                    is_pending: false,
                });

            // Check if expired
            if now - entry.timestamp > CACHE_EXPIRY_MS {
                entry.timestamp = now;
                entry.last_reported_hp = None;
            }

            // Skip if already reported this HP value
            if entry.last_reported_hp == Some(rounded_hp_pct) {
                return;
            }

            // Skip if request is pending
            if entry.is_pending {
                return;
            }

            // Mark as pending and allow report
            entry.is_pending = true;
            true
        };

        if !should_report {
            return;
        }

        // Round position values
        let rounded_pos_x = pos_x
            .map(|x| (x * POSITION_ROUNDING_MULTIPLIER).round() / POSITION_ROUNDING_MULTIPLIER);
        let rounded_pos_y = pos_y
            .map(|y| (y * POSITION_ROUNDING_MULTIPLIER).round() / POSITION_ROUNDING_MULTIPLIER);
        let rounded_pos_z = pos_z
            .map(|z| (z * POSITION_ROUNDING_MULTIPLIER).round() / POSITION_ROUNDING_MULTIPLIER);

        // Clone values for thread
        let api_url = self.api_url.clone();
        let api_key = self.api_key.clone();
        let cache_key_clone = cache_key.clone();
        let cache = self.cache.clone();

        // Spawn thread for blocking HTTP call
        std::thread::spawn(move || {
            let client = reqwest::blocking::Client::builder()
                .user_agent(&crate::utils::constants::user_agent())
                .use_rustls_tls()
                .build()
                .unwrap_or_else(|_| reqwest::blocking::Client::new());

            let url = format!("{}/api/create-hp-report", api_url);

            let payload = serde_json::json!({
                "monster_id": monster_id as i32,
                "hp_pct": rounded_hp_pct as i32,
                "line": line,
                "pos_x": rounded_pos_x,
                "pos_y": rounded_pos_y,
                "pos_z": rounded_pos_z,
                "account_id": account_id,
                "uid": uid,
            });

            let _success = match client
                .post(&url)
                .header("X-API-Key", &api_key)
                .header("Content-Type", "application/json")
                .json(&payload)
                .send()
            {
                Ok(resp) => {
                    if resp.status().is_success() {
                        let mob_name = constants::get_boss_or_magical_creature_name(monster_id)
                            .unwrap_or("Unknown");
                        let pos_info = if rounded_pos_x.is_some() {
                            format!(
                                " X: {:.2}, Y: {:.2}, Z: {:.2}",
                                rounded_pos_x.unwrap(),
                                rounded_pos_y.unwrap(),
                                rounded_pos_z.unwrap()
                            )
                        } else {
                            String::new()
                        };
                        log::info!(
                            "[BPTimer] Reported {}% HP for {} ({}) on Line {}{}",
                            rounded_hp_pct,
                            mob_name,
                            monster_id,
                            line,
                            pos_info
                        );
                        true
                    } else {
                        let error_msg = format!("API error: {}", resp.status());
                        log::warn!("[BPTimer] Failed to report HP: {}", error_msg);
                        false
                    }
                }
                Err(e) => {
                    let error_msg = e.to_string();
                    log::warn!("[BPTimer] Failed to report HP: {}", error_msg);
                    false
                }
            };

            // Update cache on both success and error to prevent spam retries
            if let Ok(mut cache_guard) = cache.lock() {
                if let Some(entry) = cache_guard.get_mut(&cache_key_clone) {
                    entry.is_pending = false;
                    entry.last_reported_hp = Some(rounded_hp_pct);
                }
            }
        });
    }
}
