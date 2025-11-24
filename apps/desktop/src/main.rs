#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use eframe::egui;
use env_logger;
use log::{info, warn};

// Load .env file if it exists (non-fatal if missing)
fn load_env() {
    match dotenvy::dotenv() {
        Ok(path) => {
            info!("Loaded .env file from: {:?}", path);
        }
        Err(dotenvy::Error::Io(_)) => {
            // .env file doesn't exist - this is fine, use environment variables or defaults
        }
        Err(e) => {
            warn!("Failed to load .env file: {}", e);
        }
    }
}

// Include build-time generated config
include!(concat!(env!("OUT_DIR"), "/config.rs"));

mod api;
mod capture;
mod config;
mod hotkeys;
mod models;
mod protocol;
mod stats;
mod ui;
mod updater;
mod utils;

use ui::app::DpsMeterApp;

fn main() -> eframe::Result {
    // Load .env file before initializing logger
    load_env();

    // Initialize console based on settings (if settings file exists)
    #[cfg(windows)]
    {
        let settings = crate::config::Settings::load();
        if settings.show_console {
            use windows_sys::Win32::System::Console::AllocConsole;
            unsafe {
                AllocConsole();
            }
        }
    }

    env_logger::Builder::from_default_env()
        .filter_level(log::LevelFilter::Info)
        .init();

    info!(
        "Starting BPTimer Desktop Companion v{}",
        self_update::cargo_crate_version!()
    );

    let mut hotkey_manager = crate::hotkeys::HotkeyManager::new();

    // Load settings and register initial hotkeys
    let settings = crate::config::Settings::load();
    hotkey_manager.reload_from_settings(&settings);

    let options = eframe::NativeOptions {
        viewport: egui::ViewportBuilder::default()
            .with_inner_size([400.0, 300.0])
            .with_min_inner_size([250.0, 150.0])
            .with_decorations(false)
            .with_transparent(true)
            .with_always_on_top()
            .with_resizable(true),
        ..Default::default()
    };

    eframe::run_native(
        "BPTimer Desktop Companion",
        options,
        Box::new(move |cc| {
            egui_material_icons::initialize(&cc.egui_ctx);
            Ok(Box::new(DpsMeterApp::new(cc, hotkey_manager)))
        }),
    )
}
