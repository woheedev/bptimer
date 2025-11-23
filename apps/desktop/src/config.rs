use log::{info, warn};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

fn get_settings_path() -> PathBuf {
    if let Some(app_data_dir) = dirs::data_local_dir() {
        let settings_dir = app_data_dir.join("BPTimer");
        if let Err(e) = fs::create_dir_all(&settings_dir) {
            warn!(
                "Failed to create settings directory: {}. Using current directory.",
                e
            );
            return PathBuf::from("settings.json");
        }
        settings_dir.join("settings.json")
    } else {
        PathBuf::from("settings.json")
    }
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Settings {
    pub window_opacity: f32,
    pub click_through: bool,
    pub network_device_index: Option<usize>,
    pub show_top_10_only: bool,
    pub font_scale: f32,
    pub bptimer_enabled: bool,
    // Window position and size for persistence
    pub window_pos: Option<(f32, f32)>,
    pub window_size: Option<(f32, f32)>,
    // Mob radar settings
    #[serde(default = "default_show_radar")]
    pub show_radar: bool,
    #[serde(default)]
    pub hidden_mobs: std::collections::HashSet<String>, // Mob IDs to hide
    // Combat data column visibility
    #[serde(default = "default_hidden_columns")]
    pub hidden_columns: std::collections::HashSet<String>, // Column names to hide
    // Combat data clearing settings
    #[serde(default)]
    pub clear_combat_data_idle_seconds: Option<u64>, // None = disabled, Some(seconds) = clear after idle
    #[serde(default = "default_true")]
    pub clear_combat_data_on_server_change: bool, // Clear data when server/channel changes
    // Text color (RGBA)
    #[serde(default = "default_text_color")]
    pub text_color: [u8; 4], // RGBA color for UI text
    // Development settings
    #[serde(default)]
    pub show_console: bool, // Show/hide console window for debugging
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            window_opacity: 0.6,
            click_through: false,
            network_device_index: None,
            show_top_10_only: false,
            font_scale: 1.0,
            bptimer_enabled: true,
            window_pos: None,
            window_size: Some((485.0, 500.0)),
            show_radar: true,
            hidden_mobs: std::collections::HashSet::new(),
            hidden_columns: default_hidden_columns(),
            clear_combat_data_idle_seconds: None,
            clear_combat_data_on_server_change: true,
            text_color: [255, 255, 255, 255], // White text by default (RGBA)
            show_console: false,              // Console hidden by default
        }
    }
}

fn default_true() -> bool {
    true
}

impl Settings {
    pub fn load() -> Self {
        let settings_path = get_settings_path();
        if settings_path.exists() {
            match fs::read_to_string(&settings_path) {
                Ok(content) => match serde_json::from_str(&content) {
                    Ok(settings) => {
                        info!("Loaded settings from {:?}", settings_path);
                        return settings;
                    }
                    Err(e) => {
                        warn!("Failed to parse settings file: {}. Using defaults.", e);
                    }
                },
                Err(e) => {
                    warn!("Failed to read settings file: {}. Using defaults.", e);
                }
            }
        }
        Self::default()
    }

    pub fn save(&self) {
        let settings_path = get_settings_path();
        match serde_json::to_string_pretty(self) {
            Ok(content) => {
                if let Err(e) = fs::write(&settings_path, content) {
                    warn!("Failed to write settings file: {}", e);
                } else {
                    info!("Settings saved to {:?}", settings_path);
                }
            }
            Err(e) => {
                warn!("Failed to serialize settings: {}", e);
            }
        }
    }
}

fn default_show_radar() -> bool {
    true
}

fn default_text_color() -> [u8; 4] {
    [255, 255, 255, 255] // White text (RGBA)
}

fn default_hidden_columns() -> std::collections::HashSet<String> {
    let mut hidden = std::collections::HashSet::new();
    hidden.insert("Max Hit".to_string());
    hidden.insert("Lucky%".to_string());
    hidden.insert("Heal".to_string());
    hidden.insert("Taken".to_string());
    hidden
}
