use crate::models::mob::{Mob, MobChannel};
use chrono::{DateTime, Utc};
use eventsource_stream::Eventsource;
use futures::stream::StreamExt;
use log::{debug, error, info, warn};
use reqwest::{Client, Url};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::{HashMap, HashSet};
use std::sync::Arc;
use std::sync::atomic::{AtomicBool, Ordering};
use std::time::Duration;
use tokio::sync::{Mutex, mpsc::Sender};
use tokio::time::sleep;

const POCKETBASE_URL: &str = "https://db.bptimer.com";
const MOB_PAGE_SIZE: usize = 100;
const STATUS_PAGE_SIZE: usize = 200;
const STATUS_CHUNK_SIZE: usize = 25;
const REALTIME_TOPICS: [&str; 2] = ["mob_hp_updates", "mob_resets"];
const LATEST_CHANNELS_DISPLAY_COUNT: usize = 10;
const DEAD_STALE_SECS: i64 = 30 * 60;
const ALIVE_STALE_SECS: i64 = 5 * 60;

#[derive(Debug, Clone, Serialize, Deserialize)]
struct MobChannelStatus {
    id: String,
    mob: String,
    channel_number: i32,
    last_hp: f32,
    #[serde(default)]
    last_update: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    location_image: Option<i32>,
}

pub struct PocketBaseClient {
    client: Client,
    sender: Sender<Vec<Mob>>, // Send full mob list updates to UI
    mobs_state: Mutex<Vec<Mob>>,
    has_connected: AtomicBool,
}

impl PocketBaseClient {
    pub fn new(sender: Sender<Vec<Mob>>) -> Self {
        let client = Client::builder()
            .user_agent(&crate::utils::constants::user_agent())
            .timeout(Duration::from_secs(600))
            .build()
            .unwrap_or_else(|_| Client::new());
        Self {
            client,
            sender,
            mobs_state: Mutex::new(Vec::new()),
            has_connected: AtomicBool::new(false),
        }
    }

    pub async fn start(self: Arc<Self>) {
        self.fetch_and_emit_full().await;

        loop {
            match self.listen_realtime().await {
                Ok(()) => {
                    warn!("Realtime stream closed gracefully. Reconnecting in 5s...");
                }
                Err(e) => {
                    warn!("Realtime connection error: {}. Reconnecting in 5s...", e);
                }
            }
            sleep(Duration::from_secs(5)).await;
        }
    }

    async fn fetch_and_emit_full(&self) {
        match self.build_full_state().await {
            Ok(mobs) => {
                {
                    let mut state = self.mobs_state.lock().await;
                    *state = mobs.clone();
                }
                if let Err(e) = self.sender.send(mobs).await {
                    error!("Failed to send mobs to UI: {}", e);
                }
            }
            Err(e) => {
                error!("Error fetching mobs: {}", e);
            }
        }
    }

    async fn build_full_state(&self) -> Result<Vec<Mob>, &'static str> {
        let mobs = match self.fetch_all_mobs().await {
            Ok(m) => m,
            Err(e) => {
                error!("Error fetching mobs: {}", e);
                return Err(e);
            }
        };

        if mobs.is_empty() {
            info!("Fetched 0 mobs from PocketBase");
            return Ok(Vec::new());
        }

        let mob_ids: HashSet<String> = mobs.iter().map(|m| m.id.clone()).collect();
        let all_channel_statuses = self.fetch_channel_statuses(&mob_ids).await;

        let mut statuses_by_mob: HashMap<String, Vec<MobChannelStatus>> = HashMap::new();
        for status in all_channel_statuses {
            statuses_by_mob
                .entry(status.mob.clone())
                .or_insert_with(Vec::new)
                .push(status);
        }

        let mut mobs_with_channels: Vec<Mob> = Vec::new();
        for mut mob in mobs {
            if let Some(statuses) = statuses_by_mob.get(&mob.id) {
                let mut channels: Vec<MobChannel> = statuses
                    .iter()
                    .map(|s| MobChannel {
                        channel: s.channel_number,
                        status: if s.last_hp > 0.0 {
                            "alive".to_string()
                        } else {
                            "dead".to_string()
                        },
                        hp_percentage: s.last_hp,
                        last_updated: Some(s.last_update.clone()),
                        location_number: s.location_image,
                    })
                    .collect();

                sanitize_channels_list(&mut channels);
                mob.latest_channels = Some(channels);
            } else {
                mob.latest_channels = Some(Vec::new());
            }
            mobs_with_channels.push(mob);
        }

        info!(
            "Fetched {} mobs from PocketBase with channel data",
            mobs_with_channels.len()
        );
        Ok(mobs_with_channels)
    }

    async fn listen_realtime(self: &Arc<Self>) -> anyhow::Result<()> {
        let url = format!("{}/api/realtime", POCKETBASE_URL);
        let response = self
            .client
            .get(&url)
            .header("Accept", "text/event-stream")
            .header("Cache-Control", "no-cache")
            .send()
            .await?;
        let mut stream = response.bytes_stream().eventsource();

        // Subscribe to mobs collection

        while let Some(event) = stream.next().await {
            match event {
                Ok(event) => {
                    if event.event == "PB_CONNECT" {
                        let data: serde_json::Value = serde_json::from_str(&event.data)?;
                        if let Some(client_id) = data.get("clientId").and_then(|s| s.as_str()) {
                            info!("Connected to PocketBase Realtime. Client ID: {}", client_id);
                            self.subscribe(client_id).await?;
                            if self.has_connected.swap(true, Ordering::Relaxed) {
                                self.fetch_and_emit_full().await;
                            }
                        }
                    } else if event.event == "mob_hp_updates" {
                        self.handle_hp_updates(&event.data).await?;
                    } else if event.event == "mob_resets" {
                        self.handle_reset_events(&event.data).await?;
                    } else if event.event.starts_with("PB_") {
                        debug!("Realtime control event: {}", event.event);
                    } else {
                        debug!("Unhandled realtime event: {}", event.event);
                    }
                }
                Err(e) => return Err(anyhow::anyhow!("SSE error: {}", e)),
            }
        }

        Err(anyhow::anyhow!("Realtime stream ended by server"))
    }

    async fn subscribe(&self, client_id: &str) -> anyhow::Result<()> {
        let url = format!("{}/api/realtime", POCKETBASE_URL);
        let body = serde_json::json!({
            "clientId": client_id,
            "subscriptions": REALTIME_TOPICS
        });

        let resp = self.client.post(&url).json(&body).send().await?;
        if !resp.status().is_success() {
            let status = resp.status();
            let text = resp.text().await.unwrap_or_default();
            warn!(
                "Failed to set realtime subscriptions: {} - {}",
                status, text
            );
        } else {
            info!("Subscribed to realtime topics: {:?}", REALTIME_TOPICS);
        }
        Ok(())
    }

    async fn fetch_all_mobs(&self) -> Result<Vec<Mob>, &'static str> {
        let mut mobs: Vec<Mob> = Vec::new();
        let mut page = 1;

        loop {
            let mut mobs_url =
                Url::parse(&format!("{}/api/collections/mobs/records", POCKETBASE_URL))
                    .expect("valid PocketBase URL");
            {
                let mut qp = mobs_url.query_pairs_mut();
                qp.append_pair("page", &page.to_string());
                qp.append_pair("perPage", &MOB_PAGE_SIZE.to_string());
                qp.append_pair("sort", "uid");
                qp.append_pair("expand", "map");
                qp.append_pair("skipTotal", "1");
            }

            let resp = match self.client.get(mobs_url).send().await {
                Ok(resp) => resp,
                Err(e) => {
                    error!("Failed to fetch mobs page {}: {}", page, e);
                    return Err("request failed");
                }
            };

            if !resp.status().is_success() {
                error!("Failed to fetch mobs page {}: HTTP {}", page, resp.status());
                return Err("http error");
            }

            let json = match resp.json::<serde_json::Value>().await {
                Ok(json) => json,
                Err(e) => {
                    error!("Failed to parse mobs JSON page {}: {}", page, e);
                    return Err("json parse error");
                }
            };

            let items = match json.get("items").and_then(|i| i.as_array()) {
                Some(items) => items,
                None => {
                    warn!("No items in mobs response page {}", page);
                    break;
                }
            };

            if items.is_empty() {
                break;
            }

            for (idx, item) in items.iter().enumerate() {
                match serde_json::from_value::<Mob>(item.clone()) {
                    Ok(mut mob) => {
                        if let Some(expand) = item.get("expand") {
                            if let Some(map) = expand.get("map") {
                                if let Some(total_channels) =
                                    map.get("total_channels").and_then(|v| v.as_i64())
                                {
                                    mob.total_channels = total_channels as i32;
                                }
                            }
                        }
                        mobs.push(mob);
                    }
                    Err(e) => {
                        error!("Failed to deserialize mob page {} idx {}: {}", page, idx, e);
                        if idx < 3 {
                            if let Ok(data) = serde_json::to_string_pretty(item) {
                                debug!("Mob payload: {}", data);
                            }
                        }
                    }
                }
            }

            if items.len() < MOB_PAGE_SIZE {
                break;
            }

            page += 1;
        }

        info!("Successfully deserialized {} mobs", mobs.len());
        Ok(mobs)
    }

    async fn fetch_channel_statuses(&self, mob_ids: &HashSet<String>) -> Vec<MobChannelStatus> {
        let mut all_statuses = Vec::new();

        let mob_list: Vec<String> = mob_ids.iter().cloned().collect();

        for chunk in mob_list.chunks(STATUS_CHUNK_SIZE) {
            let filter = chunk
                .iter()
                .map(|id| format!("mob='{}'", id))
                .collect::<Vec<_>>()
                .join(" || ");

            let mut page = 1;
            loop {
                let mut status_url = Url::parse(&format!(
                    "{}/api/collections/mob_channel_status/records",
                    POCKETBASE_URL
                ))
                .expect("valid PocketBase URL");
                {
                    let mut qp = status_url.query_pairs_mut();
                    qp.append_pair("page", &page.to_string());
                    qp.append_pair("perPage", &STATUS_PAGE_SIZE.to_string());
                    qp.append_pair("skipTotal", "1");
                    qp.append_pair("filter", &filter);
                }

                let resp = match self.client.get(status_url).send().await {
                    Ok(resp) => resp,
                    Err(e) => {
                        warn!("Failed to fetch channel statuses page {}: {}", page, e);
                        break;
                    }
                };

                if !resp.status().is_success() {
                    warn!(
                        "Channel status request failed (page {}): HTTP {}",
                        page,
                        resp.status()
                    );
                    break;
                }

                let json = match resp.json::<serde_json::Value>().await {
                    Ok(json) => json,
                    Err(e) => {
                        warn!("Failed to parse channel statuses JSON page {}: {}", page, e);
                        break;
                    }
                };

                let items = match json.get("items").and_then(|i| i.as_array()) {
                    Some(items) => items,
                    None => break,
                };

                if items.is_empty() {
                    break;
                }

                for item in items {
                    if let Ok(mut status) = serde_json::from_value::<MobChannelStatus>(item.clone())
                    {
                        if status.last_update.trim().is_empty() {
                            if let Some(updated) = item.get("updated").and_then(|v| v.as_str()) {
                                status.last_update = updated.to_string();
                            }
                        }
                        all_statuses.push(status);
                    }
                }

                if items.len() < STATUS_PAGE_SIZE {
                    break;
                }

                page += 1;
            }
        }

        all_statuses
    }

    async fn handle_hp_updates(&self, payload: &str) -> anyhow::Result<()> {
        let raw: Value = serde_json::from_str(payload)?;
        let entries = raw
            .as_array()
            .ok_or_else(|| anyhow::anyhow!("Invalid HP update payload"))?;
        if entries.is_empty() {
            return Ok(());
        }

        let timestamp = Utc::now().to_rfc3339();
        let mut state = self.mobs_state.lock().await;
        let mut changed = false;

        for entry in entries {
            if let Some((mob_id, channel, hp, location)) = parse_hp_entry(entry) {
                if let Some(mob) = state.iter_mut().find(|m| m.id == mob_id) {
                    if update_channel_entry(mob, channel, hp, location, &timestamp) {
                        sanitize_channels(mob);
                        changed = true;
                    }
                }
            }
        }

        if changed {
            let snapshot = state.clone();
            drop(state);
            if let Err(e) = self.sender.send(snapshot).await {
                error!("Failed to send mobs to UI: {}", e);
            }
        }

        Ok(())
    }

    async fn handle_reset_events(&self, payload: &str) -> anyhow::Result<()> {
        let raw: Value = serde_json::from_str(payload)?;
        let ids = raw
            .as_array()
            .ok_or_else(|| anyhow::anyhow!("Invalid reset payload"))?;
        if ids.is_empty() {
            return Ok(());
        }

        let mut state = self.mobs_state.lock().await;
        let mut changed = false;

        for id in ids {
            if let Some(mob_id) = id.as_str() {
                if let Some(mob) = state.iter_mut().find(|m| m.id == mob_id) {
                    if reset_mob_channels(mob) {
                        sanitize_channels(mob);
                        changed = true;
                    }
                }
            }
        }

        if changed {
            let snapshot = state.clone();
            drop(state);
            if let Err(e) = self.sender.send(snapshot).await {
                error!("Failed to send mobs to UI: {}", e);
            }
        }

        Ok(())
    }
}

fn parse_hp_entry(entry: &Value) -> Option<(String, i32, f32, Option<i32>)> {
    let arr = entry.as_array()?;
    let mob_id = arr.get(0)?.as_str()?;
    let channel = arr.get(1)?.as_i64()? as i32;
    let hp = arr.get(2)?.as_f64()? as f32;
    let location = arr.get(3).and_then(|v| {
        if v.is_null() {
            None
        } else {
            v.as_i64().map(|n| n as i32)
        }
    });
    Some((mob_id.to_string(), channel, hp, location))
}

fn update_channel_entry(
    mob: &mut Mob,
    channel_num: i32,
    hp: f32,
    location: Option<i32>,
    timestamp: &str,
) -> bool {
    let channels = mob.latest_channels.get_or_insert_with(Vec::new);
    if let Some(entry) = channels.iter_mut().find(|c| c.channel == channel_num) {
        if (entry.hp_percentage - hp).abs() < f32::EPSILON {
            entry.last_updated = Some(timestamp.to_string());
            return false;
        }
        entry.hp_percentage = hp;
        entry.status = status_from_hp(hp).to_string();
        entry.last_updated = Some(timestamp.to_string());
        entry.location_number = location;
        true
    } else {
        channels.push(MobChannel {
            channel: channel_num,
            status: status_from_hp(hp).to_string(),
            hp_percentage: hp,
            last_updated: Some(timestamp.to_string()),
            location_number: location,
        });
        true
    }
}

fn reset_mob_channels(mob: &mut Mob) -> bool {
    if mob.latest_channels.as_ref().map_or(true, |c| c.is_empty()) {
        return false;
    }
    mob.latest_channels = Some(Vec::new());
    true
}

fn sanitize_channels(mob: &mut Mob) {
    if let Some(channels) = mob.latest_channels.as_mut() {
        sanitize_channels_list(channels);
    }
}

fn sanitize_channels_list(channels: &mut Vec<MobChannel>) {
    let now = Utc::now();
    channels.retain(|c| c.hp_percentage > 0.0);
    channels.retain(|c| !is_channel_stale(c, &now));
    channels.sort_by(|a, b| {
        let a_is_dead = a.hp_percentage <= 0.0;
        let b_is_dead = b.hp_percentage <= 0.0;

        if !a_is_dead && b_is_dead {
            return std::cmp::Ordering::Less;
        }
        if a_is_dead && !b_is_dead {
            return std::cmp::Ordering::Greater;
        }

        if !a_is_dead && !b_is_dead {
            let hp_diff = a
                .hp_percentage
                .partial_cmp(&b.hp_percentage)
                .unwrap_or(std::cmp::Ordering::Equal);
            if hp_diff != std::cmp::Ordering::Equal {
                return hp_diff;
            }
            return a.channel.cmp(&b.channel);
        }

        let a_time = parse_timestamp(a.last_updated.as_deref());
        let b_time = parse_timestamp(b.last_updated.as_deref());
        b_time.cmp(&a_time)
    });
    if channels.len() > LATEST_CHANNELS_DISPLAY_COUNT {
        channels.truncate(LATEST_CHANNELS_DISPLAY_COUNT);
    }
}

fn is_channel_stale(channel: &MobChannel, now: &DateTime<Utc>) -> bool {
    if let Some(ts) = channel.last_updated.as_deref() {
        if let Ok(parsed) = DateTime::parse_from_rfc3339(ts) {
            let age = (now.timestamp() - parsed.with_timezone(&Utc).timestamp()).abs() as i64;
            if channel.hp_percentage <= 0.0 {
                return age > DEAD_STALE_SECS;
            } else {
                return age > ALIVE_STALE_SECS;
            }
        }
    }
    false
}

fn parse_timestamp(ts: Option<&str>) -> i64 {
    ts.and_then(|s| DateTime::parse_from_rfc3339(s).ok())
        .map(|dt| dt.with_timezone(&Utc).timestamp())
        .unwrap_or(0)
}

fn status_from_hp(hp: f32) -> &'static str {
    if hp > 0.0 { "alive" } else { "dead" }
}
