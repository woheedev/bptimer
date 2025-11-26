use egui::Color32;
use global_hotkey::GlobalHotKeyEvent;
use instant::Instant;
use log::{info, warn};

use crate::capture::packet;
use crate::models::events;
use crate::models::player::PlayerStats;
use crate::stats::{
    process_damage_hit, process_damage_taken_hit, process_healing_hit, update_realtime_dps,
};
use crate::ui::components::title_bar;
use crate::ui::constants::{app, colors, layout, radar, responsive, spacing, timing, window};
use crate::ui::views::{combat_view, mob_view, radar_view, settings_view};

use crate::config::Settings;

#[derive(PartialEq, Clone, Copy)]
pub enum ViewMode {
    Combat,
    Bosses,
    Settings,
}

use crate::api::bptimer::BPTimerClient;
use crate::api::pocketbase::PocketBaseClient;
use crate::models::mob::Mob;
use crate::models::radar::RadarState;
use crate::utils::constants::is_location_tracked_mob;
use std::sync::Arc;
use tokio::sync::mpsc::{Receiver, channel};

pub struct DpsMeterApp {
    // Aggregated DPS metrics
    pub dps_value: f32,
    pub total_damage: f32,
    pub max_dps: f32,
    pub dps_history: Vec<f32>,

    // UI state
    pub settings: Settings,
    pub sort_column: Option<usize>,
    pub sort_descending: bool,
    pub view_mode: ViewMode,
    pub window_locked: bool,

    // Packet capture + player data
    pub packet_capture: Option<packet::PacketCapture>,
    pub player_stats: std::collections::HashMap<i64, PlayerStats>,
    pub available_devices: Vec<(String, String)>, // (Name, Description)

    // Mob Timer State
    pub mobs: Vec<Mob>,
    pub mob_receiver: Receiver<Vec<Mob>>,
    pub pb_sender: tokio::sync::mpsc::Sender<Vec<Mob>>,
    pub pb_client: Option<Arc<crate::api::pocketbase::PocketBaseClient>>,
    pub pb_shutdown_tx: Option<tokio::sync::watch::Sender<bool>>,
    pub pb_task_handle: Option<std::thread::JoinHandle<()>>,
    pub show_mob_timers_prev: bool,

    // Radar State
    pub radar_state: RadarState,

    // Player name cache (persists across stats clearing)
    pub player_name_cache: crate::models::PlayerNameCache,

    // UI State
    pub show_bptimer_dialog: bool,
    pub settings_save_timer: Option<Instant>,

    // Combat data clearing tracking
    pub last_combat_event_time: Option<Instant>,
    pub current_server_endpoint: Option<String>,
    pub last_radar_update_time: Option<Instant>,

    pub player_state: crate::models::PlayerState,

    // BPTimer client for HP reporting
    pub bptimer_client: Option<std::sync::Arc<BPTimerClient>>,

    // Module data for optimizer
    pub extracted_modules: Vec<crate::utils::modules::Module>,

    // Update state
    pub update_status: std::sync::Arc<std::sync::Mutex<crate::updater::UpdateStatus>>,
    pub update_check_requested: bool,
    pub update_perform_requested: bool,

    pub hotkey_manager: crate::hotkeys::HotkeyManager,
    pub hotkey_recording_state: crate::ui::views::settings_view::HotkeyRecordingState,
    pub last_hotkey_press: Option<Instant>,
}

impl DpsMeterApp {
    pub fn new(
        cc: &eframe::CreationContext<'_>,
        hotkey_manager: crate::hotkeys::HotkeyManager,
    ) -> Self {
        let settings = Settings::load();

        // Restore window position and size if available
        if let Some((x, y)) = settings.window_pos {
            let (width, height) = settings
                .window_size
                .unwrap_or((window::DEFAULT_WIDTH, window::DEFAULT_HEIGHT));
            cc.egui_ctx
                .send_viewport_cmd(egui::ViewportCommand::InnerSize(egui::vec2(width, height)));
            cc.egui_ctx
                .send_viewport_cmd(egui::ViewportCommand::OuterPosition(egui::pos2(x, y)));
        }

        // Get available devices for settings UI
        let available_devices = match pcap::Device::list() {
            Ok(devs) => devs
                .into_iter()
                .map(|d| {
                    let clean_name = crate::capture::packet::clean_device_name(&d);
                    (clean_name, d.desc.unwrap_or_default())
                })
                .collect(),
            Err(e) => {
                warn!("Failed to list network devices: {}", e);
                Vec::new()
            }
        };

        // Start packet capture
        let packet_capture = packet::PacketCapture::start(settings.network_device_index);
        if packet_capture.is_some() {
            info!("Packet capture started successfully");
        } else {
            warn!("Failed to start packet capture - continuing without capture");
        }

        // Initialize PocketBase channel
        let (tx, rx) = channel(100);
        let mut initial_pb_client: Option<Arc<PocketBaseClient>> = None;
        let mut initial_shutdown_tx: Option<tokio::sync::watch::Sender<bool>> = None;
        let mut initial_pb_task: Option<std::thread::JoinHandle<()>> = None;

        if settings.show_mob_timers {
            let (shutdown_tx, shutdown_rx) = tokio::sync::watch::channel(false);
            let pb_client = Arc::new(PocketBaseClient::new(tx.clone(), shutdown_rx));
            let pb_client_clone = pb_client.clone();
            let handle = std::thread::spawn(move || {
                let rt = tokio::runtime::Runtime::new().unwrap();
                rt.block_on(async {
                    pb_client_clone.start().await;
                });
            });

            initial_pb_client = Some(pb_client);
            initial_shutdown_tx = Some(shutdown_tx);
            initial_pb_task = Some(handle);
        }

        let instance = Self {
            dps_value: 0.0,
            total_damage: 0.0,
            max_dps: 1.0,
            dps_history: vec![0.0; app::DPS_HISTORY_SIZE],

            settings: settings.clone(),
            sort_column: Some(2),
            sort_descending: true,
            view_mode: ViewMode::Bosses,
            window_locked: false,

            packet_capture,
            player_stats: std::collections::HashMap::new(),
            available_devices,

            mobs: Vec::new(),
            mob_receiver: rx,
            pb_sender: tx,
            pb_client: initial_pb_client,
            pb_shutdown_tx: initial_shutdown_tx,
            pb_task_handle: initial_pb_task,
            show_mob_timers_prev: settings.show_mob_timers,

            radar_state: RadarState::new(),

            player_name_cache: crate::models::PlayerNameCache::new(),

            show_bptimer_dialog: false,
            settings_save_timer: None,

            last_combat_event_time: None,
            current_server_endpoint: None,
            last_radar_update_time: None,

            player_state: crate::models::PlayerState::new(),

            bptimer_client: {
                let api_url = std::env::var("BPTIMER_API_URL")
                    .unwrap_or_else(|_| crate::BPTIMER_API_URL.to_string());
                let api_key = std::env::var("BPTIMER_API_KEY")
                    .unwrap_or_else(|_| crate::BPTIMER_API_KEY.to_string());

                if !api_key.is_empty() && !api_url.is_empty() {
                    let client =
                        std::sync::Arc::new(BPTimerClient::new(api_url.clone(), api_key.clone()));

                    let api_url_clone = api_url.clone();
                    let api_key_clone = api_key.clone();
                    std::thread::spawn(move || {
                        let client = reqwest::blocking::Client::builder()
                            .user_agent(&crate::utils::constants::user_agent())
                            .use_rustls_tls()
                            .build()
                            .unwrap_or_else(|_| reqwest::blocking::Client::new());
                        let url = format!("{}/api/health", api_url_clone);

                        match client.get(&url).header("X-API-Key", &api_key_clone).send() {
                            Ok(resp) => {
                                if resp.status().is_success() {
                                    info!("[BPTimer] API connection test successful");
                                } else {
                                    warn!(
                                        "[BPTimer] API connection test failed: status {}",
                                        resp.status()
                                    );
                                }
                            }
                            Err(e) => {
                                warn!("[BPTimer] API connection test error: {:?}", e);
                            }
                        }
                    });

                    Some(client)
                } else {
                    warn!(
                        "BPTIMER_API_KEY or BPTIMER_API_URL not set - BPTimer integration disabled"
                    );
                    None
                }
            },

            extracted_modules: Vec::new(),

            update_status: std::sync::Arc::new(std::sync::Mutex::new(
                crate::updater::UpdateStatus::UpToDate,
            )),
            update_check_requested: false,
            update_perform_requested: false,

            hotkey_manager,
            hotkey_recording_state: crate::ui::views::settings_view::HotkeyRecordingState::default(
            ),
            last_hotkey_press: None,
        };

        instance.check_for_updates_on_launch();
        instance
    }

    fn check_for_updates_on_launch(&self) {
        let status = self.update_status.clone();
        std::thread::spawn(move || {
            if let Ok(mut s) = status.lock() {
                *s = crate::updater::UpdateStatus::Checking;
            }

            match crate::updater::check_for_updates() {
                Ok(update_status) => {
                    if let Ok(mut s) = status.lock() {
                        *s = update_status.clone();
                    }

                    // Automatically download and install if update is available
                    if matches!(update_status, crate::updater::UpdateStatus::Available(_)) {
                        info!("Update available on launch, automatically installing...");
                        crate::updater::perform_update_with_status_handling(status);
                    }
                }
                Err(e) => {
                    warn!("Failed to check for updates: {}", e);
                    if let Ok(mut s) = status.lock() {
                        *s = crate::updater::UpdateStatus::Error(e.to_string());
                    }
                }
            }
        });
    }

    /// Report mob HP to BPTimer
    fn report_mob_hp(
        &mut self,
        mob_id: u32,
        hp_pct: f32,
        position: crate::models::events::Position,
    ) {
        if !self.settings.bptimer_enabled {
            return;
        }

        let line = self.player_state.get_line_id();
        if line <= 0 {
            return;
        }

        let account_id = self.player_state.get_account_id();
        let uid = self.player_state.get_uid();
        if let Some(client) = self.bptimer_client.clone() {
            client.report_hp(
                mob_id,
                hp_pct,
                line,
                Some(position.x),
                Some(position.y),
                Some(position.z),
                account_id,
                uid,
            );
        }
    }

    fn clear_combat_data(&mut self) {
        self.player_stats.clear();
        self.dps_value = 0.0;
        self.total_damage = 0.0;
        self.max_dps = 0.0;
        self.dps_history = vec![0.0; app::DPS_HISTORY_SIZE];
        self.last_combat_event_time = None;
    }
}

impl eframe::App for DpsMeterApp {
    fn clear_color(&self, _visuals: &egui::Visuals) -> [f32; 4] {
        egui::Rgba::TRANSPARENT.to_array()
    }

    fn save(&mut self, storage: &mut dyn eframe::Storage) {
        self.settings.save();
        storage.set_string(
            "settings",
            serde_json::to_string(&self.settings).unwrap_or_default(),
        );
    }

    fn update(&mut self, ctx: &egui::Context, _frame: &mut eframe::Frame) {
        // Fallback if current view is disabled
        match self.view_mode {
            ViewMode::Combat if !self.settings.show_combat_data => {
                if self.settings.show_radar || self.settings.show_mob_timers {
                    self.view_mode = ViewMode::Bosses;
                } else {
                    self.view_mode = ViewMode::Settings;
                }
            }
            ViewMode::Bosses if !self.settings.show_radar && !self.settings.show_mob_timers => {
                if self.settings.show_combat_data {
                    self.view_mode = ViewMode::Combat;
                } else {
                    self.view_mode = ViewMode::Settings;
                }
            }
            _ => {}
        }

        if self.settings.show_mob_timers {
            while let Ok(mobs) = self.mob_receiver.try_recv() {
                self.mobs = mobs;
            }
        } else {
            // Drain receiver to prevent buffer buildup when disabled
            while let Ok(_) = self.mob_receiver.try_recv() {}
        }

        // Handle PocketBase client start/stop based on show_mob_timers setting
        if self.settings.show_mob_timers != self.show_mob_timers_prev {
            if self.settings.show_mob_timers {
                // Start PocketBase client
                if self.pb_client.is_none() {
                    let (shutdown_tx, shutdown_rx) = tokio::sync::watch::channel(false);
                    let pb_client =
                        Arc::new(PocketBaseClient::new(self.pb_sender.clone(), shutdown_rx));

                    let pb_client_clone = pb_client.clone();
                    let handle = std::thread::spawn(move || {
                        let rt = tokio::runtime::Runtime::new().unwrap();
                        rt.block_on(async {
                            pb_client_clone.start().await;
                        });
                    });

                    self.pb_client = Some(pb_client);
                    self.pb_shutdown_tx = Some(shutdown_tx);
                    self.pb_task_handle = Some(handle);
                    info!("PocketBase client started");
                }
            } else {
                // Stop PocketBase client
                if let Some(shutdown_tx) = self.pb_shutdown_tx.take() {
                    let _ = shutdown_tx.send(true);
                }
                if let Some(handle) = self.pb_task_handle.take() {
                    std::thread::spawn(move || {
                        if let Err(err) = handle.join() {
                            warn!("Failed to join PocketBase thread: {:?}", err);
                        }
                    });
                }
                self.pb_client = None;
                self.mobs.clear();
                info!("PocketBase client stopped");
            }
            self.show_mob_timers_prev = self.settings.show_mob_timers;
        }

        let mut has_new_events = false;
        if let Some(ref mut capture) = self.packet_capture {
            let events = capture.drain_events();
            if !events.is_empty() {
                has_new_events = true;
            }
            for event in events {
                match event {
                    events::CombatEvent::Damage(hit) => {
                        if self.settings.show_combat_data {
                            self.last_combat_event_time = Some(Instant::now());
                            let player_uid = hit.player_uid;
                            let stats = self.player_stats.entry(player_uid).or_insert_with(|| {
                                let mut stats = PlayerStats::new(player_uid);
                                stats.name = self.player_name_cache.get_or_default(player_uid);
                                stats
                            });
                            process_damage_hit(
                                stats,
                                &mut self.total_damage,
                                hit,
                                self.settings.dps_calculation_cutoff_seconds,
                            );
                        }
                    }
                    events::CombatEvent::Healing(hit) => {
                        if self.settings.show_combat_data {
                            self.last_combat_event_time = Some(Instant::now());
                            let player_uid = hit.player_uid;
                            let stats = self.player_stats.entry(player_uid).or_insert_with(|| {
                                let mut stats = PlayerStats::new(player_uid);
                                stats.name = self.player_name_cache.get_or_default(player_uid);
                                stats
                            });
                            process_healing_hit(stats, hit);
                        }
                    }
                    events::CombatEvent::DamageTaken(hit) => {
                        if self.settings.show_combat_data {
                            self.last_combat_event_time = Some(Instant::now());
                            let player_uid = hit.player_uid;
                            let stats = self.player_stats.entry(player_uid).or_insert_with(|| {
                                let mut stats = PlayerStats::new(player_uid);
                                stats.name = self.player_name_cache.get_or_default(player_uid);
                                stats
                            });
                            process_damage_taken_hit(stats, hit);
                        }
                    }
                    events::CombatEvent::ServerChange(update) => {
                        if self.settings.clear_combat_data_on_server_change {
                            self.clear_combat_data();
                        }
                        self.radar_state.clear();
                        self.last_radar_update_time = None;
                        self.current_server_endpoint = Some(update.server_endpoint);
                    }
                    events::CombatEvent::PlayerName(update) => {
                        self.player_name_cache
                            .set(update.player_uid, update.name.clone());
                        if let Some(stats) = self.player_stats.get_mut(&update.player_uid) {
                            stats.name = update.name.clone();
                        }
                    }
                    events::CombatEvent::PlayerAccountInfo(update) => {
                        self.player_state
                            .set_account_info(update.account_id.clone(), update.uid);
                    }
                    events::CombatEvent::PlayerLineInfo(update) => {
                        self.player_state.set_line_id(update.line_id);
                        self.radar_state.clear();
                        self.last_radar_update_time = None;
                    }
                    events::CombatEvent::ModuleData(update) => {
                        self.extracted_modules = update.modules;
                    }
                    events::CombatEvent::EntityPosition(update) => {
                        if update.entity_type == crate::models::events::EntityType::Monster {
                            if let Some(mob_base_id) = update.mob_base_id {
                                if self.settings.show_radar || self.settings.bptimer_enabled {
                                    self.radar_state.register_mob_uuid(update.uuid, mob_base_id);

                                    if is_location_tracked_mob(mob_base_id) {
                                        let is_hp_only_update = update.position.x
                                            == f32::NEG_INFINITY
                                            && update.position.y == f32::NEG_INFINITY
                                            && update.position.z == f32::NEG_INFINITY;

                                        if is_hp_only_update {
                                            if self.radar_state.update_mob_hp(
                                                mob_base_id,
                                                update.current_hp,
                                                update.max_hp,
                                            ) {
                                                self.last_radar_update_time = Some(Instant::now());
                                            } else {
                                                continue;
                                            }
                                        } else {
                                            let mob_name = self.mobs.iter()
                                                .find(|m| m.id.parse::<u32>().unwrap_or(0) == mob_base_id)
                                                .map(|m| m.name.clone())
                                                .unwrap_or_else(|| {
                                                    crate::utils::constants::get_boss_or_magical_creature_name(mob_base_id)
                                                        .map(|s| s.to_string())
                                                        .unwrap_or_else(|| format!("Mob {}", mob_base_id))
                                                });

                                            self.radar_state.update_mob_position(
                                                mob_base_id,
                                                mob_name,
                                                update.position,
                                                update.current_hp,
                                                update.max_hp,
                                            );
                                            self.last_radar_update_time = Some(Instant::now());
                                        }

                                        if let Some(mob) =
                                            self.radar_state.tracked_mobs.get(&mob_base_id)
                                        {
                                            let hp_pct = mob.hp_percentage();
                                            let position = mob.position;
                                            let is_dead = match hp_pct {
                                                Some(0) => true,
                                                _ => mob.current_hp == Some(0),
                                            };

                                            if let Some(hp_pct) = hp_pct {
                                                self.report_mob_hp(
                                                    mob_base_id,
                                                    hp_pct as f32,
                                                    position,
                                                );
                                            }

                                            if is_dead {
                                                self.radar_state.remove_mob(mob_base_id);
                                                continue;
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                    events::CombatEvent::LocalPlayerPosition(update) => {
                        if self.settings.show_radar || self.settings.bptimer_enabled {
                            self.radar_state.update_player_position(update.position);
                        }
                    }
                }
            }
        }

        if self.settings.show_combat_data {
            update_realtime_dps(
                &mut self.player_stats,
                &mut self.dps_value,
                &mut self.max_dps,
                &mut self.dps_history,
            );
        }

        if let Some(idle_seconds) = self.settings.clear_combat_data_idle_seconds {
            if let Some(last_event) = self.last_combat_event_time {
                if last_event.elapsed().as_secs() >= idle_seconds {
                    self.clear_combat_data();
                    self.last_combat_event_time = None;
                }
            }
        }

        if let Some(last_update) = self.last_radar_update_time {
            if last_update.elapsed().as_secs() >= radar::IDLE_TIMEOUT_SECS {
                self.radar_state.clear();
                self.last_radar_update_time = None;
            }
        }

        if let Some(timer) = self.settings_save_timer {
            if timer.elapsed().as_millis() >= timing::SETTINGS_SAVE_DEBOUNCE_MS {
                self.settings.save();
                self.hotkey_manager.reload_from_settings(&self.settings);
                self.settings_save_timer = None;
            }
        }

        if self.update_check_requested {
            self.update_check_requested = false;
            let status = self.update_status.clone();
            std::thread::spawn(move || {
                if let Ok(mut s) = status.lock() {
                    *s = crate::updater::UpdateStatus::Checking;
                }

                match crate::updater::check_for_updates() {
                    Ok(update_status) => {
                        if let Ok(mut s) = status.lock() {
                            *s = update_status;
                        }
                    }
                    Err(e) => {
                        warn!("Failed to check for updates: {}", e);
                        if let Ok(mut s) = status.lock() {
                            *s = crate::updater::UpdateStatus::Error(e.to_string());
                        }
                    }
                }
            });
        }

        if self.update_perform_requested {
            self.update_perform_requested = false;
            let status = self.update_status.clone();
            std::thread::spawn(move || {
                crate::updater::perform_update_with_status_handling(status);
            });
        }

        // Request immediate repaint if we have new events, otherwise schedule frequent updates
        if has_new_events {
            ctx.request_repaint();
        } else {
            ctx.request_repaint_after(std::time::Duration::from_millis(8)); // ~120 FPS
        }

        while let Ok(event) = GlobalHotKeyEvent::receiver().try_recv() {
            if event.state == global_hotkey::HotKeyState::Pressed {
                let now = Instant::now();
                let should_handle = match self.last_hotkey_press {
                    Some(last) => now.duration_since(last).as_millis() > timing::HOTKEY_DEBOUNCE_MS,
                    None => true,
                };

                if should_handle {
                    if let Some(action) = self.hotkey_manager.get_action(event.id) {
                        match action {
                            crate::hotkeys::HotkeyAction::ToggleClickThrough => {
                                self.settings.click_through = !self.settings.click_through;
                                self.settings.save();
                                info!(
                                    "Hotkey pressed: click-through toggled to {}",
                                    self.settings.click_through
                                );
                            }
                            crate::hotkeys::HotkeyAction::SwitchToMobView => {
                                if self.settings.show_radar || self.settings.show_mob_timers {
                                    self.view_mode = ViewMode::Bosses;
                                    info!("Hotkey pressed: switched to mob view");
                                }
                            }
                            crate::hotkeys::HotkeyAction::SwitchToCombatView => {
                                if self.settings.show_combat_data {
                                    self.view_mode = ViewMode::Combat;
                                    info!("Hotkey pressed: switched to combat view");
                                }
                            }
                            crate::hotkeys::HotkeyAction::MinimizeWindow => {
                                let is_minimized =
                                    ctx.input(|i| i.viewport().minimized.unwrap_or(false));
                                ctx.send_viewport_cmd(egui::ViewportCommand::Minimized(
                                    !is_minimized,
                                ));
                                info!(
                                    "Hotkey pressed: minimize window (toggled from {})",
                                    is_minimized
                                );
                            }
                            crate::hotkeys::HotkeyAction::ResetStats => {
                                self.dps_value = 0.0;
                                self.total_damage = 0.0;
                                self.max_dps = 0.0;
                                self.dps_history = vec![0.0; app::DPS_HISTORY_SIZE];
                                self.player_stats.clear();
                                info!("Hotkey pressed: reset stats");
                            }
                        }
                        self.last_hotkey_press = Some(now);
                    }
                }
            }
        }

        ctx.send_viewport_cmd(egui::ViewportCommand::MousePassthrough(
            self.settings.click_through,
        ));

        if self.window_locked {
            ctx.send_viewport_cmd(egui::ViewportCommand::Resizable(false));
        } else {
            ctx.send_viewport_cmd(egui::ViewportCommand::Resizable(true));
        }

        if let Some(viewport_info) = ctx.input(|i| i.viewport().outer_rect) {
            let new_size = (viewport_info.width(), viewport_info.height());
            let new_pos = (viewport_info.min.x, viewport_info.min.y);

            let size_changed = self
                .settings
                .window_size
                .map(|(w, h)| (w - new_size.0).abs() > 1.0 || (h - new_size.1).abs() > 1.0)
                .unwrap_or(true);
            let pos_changed = self
                .settings
                .window_pos
                .map(|(x, y)| (x - new_pos.0).abs() > 1.0 || (y - new_pos.1).abs() > 1.0)
                .unwrap_or(true);

            if size_changed || pos_changed {
                self.settings.window_size = Some(new_size);
                self.settings.window_pos = Some(new_pos);
                self.settings_save_timer = Some(Instant::now());
            }
        }

        ctx.set_pixels_per_point(self.settings.font_scale);

        let mut style = (*ctx.style()).clone();
        style.visuals = egui::Visuals::dark();
        let text_color = Color32::from_rgba_unmultiplied(
            self.settings.text_color[0],
            self.settings.text_color[1],
            self.settings.text_color[2],
            self.settings.text_color[3],
        );
        style.visuals.override_text_color = Some(text_color);
        ctx.set_style(style);

        let bg_color = Color32::from_rgba_unmultiplied(
            colors::BG_RGB[0],
            colors::BG_RGB[1],
            colors::BG_RGB[2],
            (self.settings.window_opacity * colors::OPACITY_MULTIPLIER) as u8,
        );
        let corner_radius = layout::CORNER_RADIUS;

        egui::CentralPanel::default()
            .frame(egui::Frame::NONE)
            .show(ctx, |ui| {
                let app_rect = ui.max_rect();
                ui.painter().rect_filled(app_rect, corner_radius, bg_color);

                let title_bar_rect = {
                    let mut rect = app_rect;
                    rect.max.y = rect.min.y + layout::TITLE_BAR_HEIGHT;
                    rect
                };
                title_bar::render_title_bar(
                    ui,
                    title_bar_rect,
                    ctx,
                    self.settings.window_opacity,
                    &mut self.settings.click_through,
                    &mut self.window_locked,
                    &mut self.view_mode,
                    &mut self.dps_value,
                    &mut self.total_damage,
                    &mut self.max_dps,
                    &mut self.dps_history,
                    &mut self.player_stats,
                    self.settings.show_radar,
                    self.settings.show_mob_timers,
                    self.settings.show_combat_data,
                );

                let content_rect = {
                    let mut rect = app_rect;
                    rect.min.y = title_bar_rect.max.y;
                    rect
                }
                .shrink(layout::CONTENT_PADDING);

                let mut content_ui = ui.new_child(egui::UiBuilder::new().max_rect(content_rect));

                content_ui.vertical(|ui| {
                    let mut combat_players = if self.view_mode == ViewMode::Combat {
                        combat_view::collect_active_players(&self.player_stats)
                    } else {
                        Vec::new()
                    };

                    let reserve_height =
                        if self.view_mode == ViewMode::Combat && !combat_players.is_empty() {
                            combat_view::footer_height(ui)
                        } else {
                            0.0
                        };

                    let mut combat_footer_text = None;
                    let scroll_area = if reserve_height > 0.0 {
                        responsive::scroll_area_with_reserve(ui, reserve_height)
                    } else {
                        egui::ScrollArea::vertical()
                    };

                    scroll_area.show(ui, |ui| match self.view_mode {
                        ViewMode::Combat => {
                            if self.settings.show_combat_data {
                                if combat_view::render_combat_view(
                                    ui,
                                    &mut combat_players,
                                    &mut self.sort_column,
                                    &mut self.sort_descending,
                                    &self.settings,
                                ) {
                                    combat_footer_text = Some(combat_view::dps_window_text(
                                        &self.player_stats,
                                        &self.settings,
                                    ));
                                }
                            }
                        }
                        ViewMode::Bosses => {
                            ui.vertical(|ui| {
                                if self.settings.show_radar {
                                    let show_radar = self.radar_state.player_position.is_some()
                                        && !self.radar_state.tracked_mobs.is_empty();

                                    if show_radar {
                                        ui.heading("Mob Radar");
                                        radar_view::render_radar_view(
                                            ui,
                                            &self.radar_state,
                                            text_color,
                                        );
                                        ui.add_space(spacing::MD);
                                        ui.separator();
                                        ui.add_space(spacing::MD);
                                    }
                                }

                                if self.settings.show_mob_timers {
                                    ui.heading("Mob Timers");
                                    let visible_mobs: Vec<_> = self
                                        .mobs
                                        .iter()
                                        .filter(|mob| !self.settings.hidden_mobs.contains(&mob.id))
                                        .cloned()
                                        .collect();
                                    mob_view::render_mob_view(ui, &visible_mobs);
                                }
                            });
                        }
                        ViewMode::Settings => {
                            settings_view::render_settings_view(
                                ui,
                                &mut self.settings,
                                &self.available_devices,
                                &mut self.show_bptimer_dialog,
                                &mut self.settings_save_timer,
                                &self.mobs,
                                &self.extracted_modules,
                                &self.update_status,
                                &mut self.update_check_requested,
                                &mut self.update_perform_requested,
                                &mut self.hotkey_manager,
                                &mut self.hotkey_recording_state,
                            );
                        }
                    });

                    if let Some(timer_text) = combat_footer_text {
                        combat_view::render_footer(ui, &timer_text, &self.settings);
                    }
                });

                // Resize handles for undecorated windows
                if !self.window_locked && !self.settings.click_through {
                    let resize_border_size = window::RESIZE_BORDER_SIZE;
                    let corner_size = window::RESIZE_CORNER_SIZE;

                    let top_rect = egui::Rect::from_min_max(
                        egui::pos2(app_rect.min.x + corner_size, title_bar_rect.max.y),
                        egui::pos2(
                            app_rect.max.x - corner_size,
                            title_bar_rect.max.y + resize_border_size,
                        ),
                    );
                    let top_response =
                        ui.interact(top_rect, ui.id().with("resize_top"), egui::Sense::drag());
                    if top_response.hovered() {
                        ctx.set_cursor_icon(egui::CursorIcon::ResizeVertical);
                    }
                    if top_response.dragged() {
                        let delta = top_response.drag_delta();
                        if let Some(viewport_info) = ctx.input(|i| i.viewport().outer_rect) {
                            let new_height =
                                (viewport_info.height() - delta.y).max(window::MIN_HEIGHT);
                            ctx.send_viewport_cmd(egui::ViewportCommand::InnerSize(egui::vec2(
                                viewport_info.width(),
                                new_height,
                            )));
                        }
                    }

                    let bottom_rect = egui::Rect::from_min_max(
                        egui::pos2(
                            app_rect.min.x + corner_size,
                            app_rect.max.y - resize_border_size,
                        ),
                        egui::pos2(app_rect.max.x - corner_size, app_rect.max.y),
                    );
                    let bottom_response = ui.interact(
                        bottom_rect,
                        ui.id().with("resize_bottom"),
                        egui::Sense::drag(),
                    );
                    if bottom_response.hovered() {
                        ctx.set_cursor_icon(egui::CursorIcon::ResizeVertical);
                    }
                    if bottom_response.dragged() {
                        let delta = bottom_response.drag_delta();
                        if let Some(viewport_info) = ctx.input(|i| i.viewport().outer_rect) {
                            let new_height =
                                (viewport_info.height() + delta.y).max(window::MIN_HEIGHT);
                            ctx.send_viewport_cmd(egui::ViewportCommand::InnerSize(egui::vec2(
                                viewport_info.width(),
                                new_height,
                            )));
                        }
                    }

                    let left_rect = egui::Rect::from_min_max(
                        egui::pos2(app_rect.min.x, title_bar_rect.max.y + corner_size),
                        egui::pos2(
                            app_rect.min.x + resize_border_size,
                            app_rect.max.y - corner_size,
                        ),
                    );
                    let left_response =
                        ui.interact(left_rect, ui.id().with("resize_left"), egui::Sense::drag());
                    if left_response.hovered() {
                        ctx.set_cursor_icon(egui::CursorIcon::ResizeHorizontal);
                    }
                    if left_response.dragged() {
                        let delta = left_response.drag_delta();
                        if let Some(viewport_info) = ctx.input(|i| i.viewport().outer_rect) {
                            let new_width =
                                (viewport_info.width() - delta.x).max(window::MIN_WIDTH);
                            let new_x = viewport_info.min.x + delta.x;
                            ctx.send_viewport_cmd(egui::ViewportCommand::InnerSize(egui::vec2(
                                new_width,
                                viewport_info.height(),
                            )));
                            ctx.send_viewport_cmd(egui::ViewportCommand::OuterPosition(
                                egui::pos2(new_x, viewport_info.min.y),
                            ));
                        }
                    }

                    let right_rect = egui::Rect::from_min_max(
                        egui::pos2(
                            app_rect.max.x - resize_border_size,
                            title_bar_rect.max.y + corner_size,
                        ),
                        egui::pos2(app_rect.max.x, app_rect.max.y - corner_size),
                    );
                    let right_response = ui.interact(
                        right_rect,
                        ui.id().with("resize_right"),
                        egui::Sense::drag(),
                    );
                    if right_response.hovered() {
                        ctx.set_cursor_icon(egui::CursorIcon::ResizeHorizontal);
                    }
                    if right_response.dragged() {
                        let delta = right_response.drag_delta();
                        if let Some(viewport_info) = ctx.input(|i| i.viewport().outer_rect) {
                            let new_width =
                                (viewport_info.width() + delta.x).max(window::MIN_WIDTH);
                            ctx.send_viewport_cmd(egui::ViewportCommand::InnerSize(egui::vec2(
                                new_width,
                                viewport_info.height(),
                            )));
                        }
                    }

                    let br_corner = egui::Rect::from_min_max(
                        egui::pos2(app_rect.max.x - corner_size, app_rect.max.y - corner_size),
                        app_rect.max,
                    );
                    let br_response =
                        ui.interact(br_corner, ui.id().with("resize_br"), egui::Sense::drag());
                    if br_response.hovered() {
                        ctx.set_cursor_icon(egui::CursorIcon::ResizeNwSe);
                    }
                    if br_response.dragged() {
                        let delta = br_response.drag_delta();
                        if let Some(viewport_info) = ctx.input(|i| i.viewport().outer_rect) {
                            let new_width =
                                (viewport_info.width() + delta.x).max(window::MIN_WIDTH);
                            let new_height =
                                (viewport_info.height() + delta.y).max(window::MIN_HEIGHT);
                            ctx.send_viewport_cmd(egui::ViewportCommand::InnerSize(egui::vec2(
                                new_width, new_height,
                            )));
                        }
                    }

                    let bl_corner = egui::Rect::from_min_max(
                        egui::pos2(app_rect.min.x, app_rect.max.y - corner_size),
                        egui::pos2(app_rect.min.x + corner_size, app_rect.max.y),
                    );
                    let bl_response =
                        ui.interact(bl_corner, ui.id().with("resize_bl"), egui::Sense::drag());
                    if bl_response.hovered() {
                        ctx.set_cursor_icon(egui::CursorIcon::ResizeNeSw);
                    }
                    if bl_response.dragged() {
                        let delta = bl_response.drag_delta();
                        if let Some(viewport_info) = ctx.input(|i| i.viewport().outer_rect) {
                            let new_width =
                                (viewport_info.width() - delta.x).max(window::MIN_WIDTH);
                            let new_height =
                                (viewport_info.height() + delta.y).max(window::MIN_HEIGHT);
                            let new_x = viewport_info.min.x + delta.x;
                            ctx.send_viewport_cmd(egui::ViewportCommand::InnerSize(egui::vec2(
                                new_width, new_height,
                            )));
                            ctx.send_viewport_cmd(egui::ViewportCommand::OuterPosition(
                                egui::pos2(new_x, viewport_info.min.y),
                            ));
                        }
                    }

                    let tl_corner = egui::Rect::from_min_max(
                        egui::pos2(app_rect.min.x, title_bar_rect.max.y),
                        egui::pos2(
                            app_rect.min.x + corner_size,
                            title_bar_rect.max.y + corner_size,
                        ),
                    );
                    let tl_response =
                        ui.interact(tl_corner, ui.id().with("resize_tl"), egui::Sense::drag());
                    if tl_response.hovered() {
                        ctx.set_cursor_icon(egui::CursorIcon::ResizeHorizontal);
                    }
                    if tl_response.dragged() {
                        let delta = tl_response.drag_delta();
                        if let Some(viewport_info) = ctx.input(|i| i.viewport().outer_rect) {
                            let new_width =
                                (viewport_info.width() - delta.x).max(window::MIN_WIDTH);
                            let new_height =
                                (viewport_info.height() - delta.y).max(window::MIN_HEIGHT);
                            let new_x = viewport_info.min.x + delta.x;
                            ctx.send_viewport_cmd(egui::ViewportCommand::InnerSize(egui::vec2(
                                new_width, new_height,
                            )));
                            ctx.send_viewport_cmd(egui::ViewportCommand::OuterPosition(
                                egui::pos2(new_x, viewport_info.min.y),
                            ));
                        }
                    }

                    let tr_corner = egui::Rect::from_min_max(
                        egui::pos2(app_rect.max.x - corner_size, title_bar_rect.max.y),
                        egui::pos2(app_rect.max.x, title_bar_rect.max.y + corner_size),
                    );
                    let tr_response =
                        ui.interact(tr_corner, ui.id().with("resize_tr"), egui::Sense::drag());
                    if tr_response.hovered() {
                        ctx.set_cursor_icon(egui::CursorIcon::ResizeHorizontal);
                    }
                    if tr_response.dragged() {
                        let delta = tr_response.drag_delta();
                        if let Some(viewport_info) = ctx.input(|i| i.viewport().outer_rect) {
                            let new_width =
                                (viewport_info.width() + delta.x).max(window::MIN_WIDTH);
                            let new_height =
                                (viewport_info.height() - delta.y).max(window::MIN_HEIGHT);
                            ctx.send_viewport_cmd(egui::ViewportCommand::InnerSize(egui::vec2(
                                new_width, new_height,
                            )));
                        }
                    }
                }
            });
    }
}
