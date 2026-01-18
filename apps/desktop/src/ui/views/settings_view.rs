use crate::capture::packet;
use crate::config::Settings;
use crate::hotkeys::{HotkeyAction, HotkeyManager};
use crate::ui::constants::{responsive, spacing, style, theme};
use crate::utils::constants::account_id_regions;
use egui::{Ui, Window};
use global_hotkey::hotkey::{HotKey, Modifiers};
use instant::Instant;

const FONT_SCALE_MIN: f32 = 0.5;
const FONT_SCALE_MAX: f32 = 2.0;
const FONT_SCALE_STEP: f32 = 0.05;

#[derive(Default)]
pub struct HotkeyRecordingState {
    pub action: Option<HotkeyAction>,
    was_recording: bool,
}

pub fn render_settings_view(
    ui: &mut Ui,
    settings: &mut Settings,
    packet_capture: Option<&packet::PacketCapture>,
    devices: &[pcap::Device],
    show_bptimer_dialog: &mut bool,
    settings_save_timer: &mut Option<instant::Instant>,
    mobs: &[crate::models::mob::Mob],
    extracted_modules: &[crate::utils::modules::Module],
    update_status: &std::sync::Arc<std::sync::Mutex<crate::updater::UpdateStatus>>,
    update_check_requested: &mut bool,
    update_perform_requested: &mut bool,
    hotkey_manager: &mut HotkeyManager,
    recording_state: &mut HotkeyRecordingState,
) {
    // Handle hotkey recording
    let is_recording = recording_state.action.is_some();

    // When recording starts, disable all hotkeys
    if is_recording && !recording_state.was_recording {
        hotkey_manager.unregister_all();
    }

    recording_state.was_recording = is_recording;

    if let Some(action) = recording_state.action {
        ui.input(|i| {
            // Check for Esc to cancel/clear
            if i.key_pressed(egui::Key::Escape) {
                // Clear the hotkey
                hotkey_manager.unregister_action(action);
                settings.hotkeys.set(action, None);
                *settings_save_timer = Some(Instant::now());
                recording_state.action = None;
                return;
            }

            // Map egui modifiers to global_hotkey modifiers
            let mut gh_modifiers = Modifiers::empty();
            if i.modifiers.ctrl {
                gh_modifiers |= Modifiers::CONTROL;
            }
            if i.modifiers.shift {
                gh_modifiers |= Modifiers::SHIFT;
            }
            if i.modifiers.alt {
                gh_modifiers |= Modifiers::ALT;
            }

            for key in [
                egui::Key::A,
                egui::Key::B,
                egui::Key::C,
                egui::Key::D,
                egui::Key::E,
                egui::Key::F,
                egui::Key::G,
                egui::Key::H,
                egui::Key::I,
                egui::Key::J,
                egui::Key::K,
                egui::Key::L,
                egui::Key::M,
                egui::Key::N,
                egui::Key::O,
                egui::Key::P,
                egui::Key::Q,
                egui::Key::R,
                egui::Key::S,
                egui::Key::T,
                egui::Key::U,
                egui::Key::V,
                egui::Key::W,
                egui::Key::X,
                egui::Key::Y,
                egui::Key::Z,
                egui::Key::Num0,
                egui::Key::Num1,
                egui::Key::Num2,
                egui::Key::Num3,
                egui::Key::Num4,
                egui::Key::Num5,
                egui::Key::Num6,
                egui::Key::Num7,
                egui::Key::Num8,
                egui::Key::Num9,
                egui::Key::F1,
                egui::Key::F2,
                egui::Key::F3,
                egui::Key::F4,
                egui::Key::F5,
                egui::Key::F6,
                egui::Key::F7,
                egui::Key::F8,
                egui::Key::F9,
                egui::Key::F10,
                egui::Key::F11,
                egui::Key::F12,
                egui::Key::Space,
                egui::Key::Enter,
                egui::Key::Tab,
                egui::Key::Backspace,
                egui::Key::Escape,
                egui::Key::ArrowUp,
                egui::Key::ArrowDown,
                egui::Key::ArrowLeft,
                egui::Key::ArrowRight,
                egui::Key::Home,
                egui::Key::End,
                egui::Key::PageUp,
                egui::Key::PageDown,
                egui::Key::Insert,
                egui::Key::Delete,
                egui::Key::Backtick,
                egui::Key::Minus,
                egui::Key::Equals,
                egui::Key::OpenBracket,
                egui::Key::CloseBracket,
                egui::Key::Semicolon,
                egui::Key::Quote,
                egui::Key::Comma,
                egui::Key::Period,
                egui::Key::Slash,
                egui::Key::Backslash,
            ] {
                if i.key_pressed(key) {
                    let Some(code) = crate::hotkeys::egui_key_to_code(key) else {
                        continue;
                    };

                    let hotkey = HotKey::new(
                        if gh_modifiers.is_empty() {
                            None
                        } else {
                            Some(gh_modifiers)
                        },
                        code,
                    );

                    // Register
                    if hotkey_manager.register(hotkey, action) {
                        // Update settings
                        let config = crate::config::HotkeyConfig::new(
                            if gh_modifiers.is_empty() {
                                None
                            } else {
                                Some(gh_modifiers)
                            },
                            code,
                        );
                        settings.hotkeys.set(action, Some(config));
                        *settings_save_timer = Some(Instant::now());
                    }

                    recording_state.action = None;
                    break;
                }
            }
        });
    }

    ui.heading("Settings");
    ui.add_space(spacing::MD);

    let text_color = theme::text_color(settings);

    responsive::scroll_area_with_reserve(ui, 50.0).show(ui, |ui| {
        style::group_frame(ui).show(ui, |ui| {
            ui.set_width(ui.available_width());
            ui.label(egui::RichText::new("Modules").strong().color(text_color));
            ui.add_space(spacing::SM);
            ui.label(
                egui::RichText::new("Disabling a module will stop calculations / processing for that module, not just hide the view.")
                    .small()
                    .weak(),
            );
            ui.add_space(spacing::SM);

            if ui
                .checkbox(&mut settings.show_radar, "Mob Radar")
                .changed()
            {
                *settings_save_timer = Some(Instant::now());
            }

            if ui
                .checkbox(&mut settings.show_mob_timers, "Mob Timers")
                .changed()
            {
                *settings_save_timer = Some(Instant::now());
            }

            if ui
                .checkbox(&mut settings.show_combat_data, "Combat Data")
                .changed()
            {
                *settings_save_timer = Some(Instant::now());
            }

            ui.horizontal(|ui| {
                let mut bptimer_checkbox = settings.bptimer_enabled;
                if ui
                    .checkbox(&mut bptimer_checkbox, "BPTimer Integration")
                    .changed()
                {
                    if !bptimer_checkbox {
                        *show_bptimer_dialog = true;
                    } else {
                        settings.bptimer_enabled = true;
                        *settings_save_timer = Some(Instant::now());
                    }
                }
            });
        });

        ui.add_space(spacing::MD);

        style::group_frame(ui).show(ui, |ui| {
            ui.set_width(ui.available_width());
            ui.label(egui::RichText::new("Hotkeys").strong().color(text_color));
            ui.add_space(spacing::SM);

            if recording_state.action.is_some() {
                ui.label(
                    egui::RichText::new("Press desired hotkey combination... (Esc to clear)")
                        .color(egui::Color32::YELLOW),
                );
                ui.add_space(spacing::SM);
            }

            let mut render_hotkey_btn =
                |label: &str,
                 action: HotkeyAction,
                 config: &Option<crate::config::HotkeyConfig>| {
                    ui.horizontal(|ui| {
                        ui.label(label);
                        ui.with_layout(egui::Layout::right_to_left(egui::Align::Center), |ui| {
                            let btn_text = if recording_state.action == Some(action) {
                                "Recording...".to_string()
                            } else if let Some(cfg) = config {
                                cfg.to_display_string()
                            } else {
                                "Not Set".to_string()
                            };

                            if ui.button(btn_text).clicked() {
                                recording_state.action = Some(action);
                            }
                        });
                    });
                    ui.add_space(spacing::XS);
                };

            render_hotkey_btn(
                "Toggle Click-Through",
                HotkeyAction::ToggleClickThrough,
                &settings.hotkeys.toggle_click_through,
            );
            render_hotkey_btn(
                "Switch to Mob View",
                HotkeyAction::SwitchToMobView,
                &settings.hotkeys.switch_to_mob_view,
            );
            render_hotkey_btn(
                "Switch to Combat View",
                HotkeyAction::SwitchToCombatView,
                &settings.hotkeys.switch_to_combat_view,
            );
            render_hotkey_btn(
                "Minimize Window",
                HotkeyAction::MinimizeWindow,
                &settings.hotkeys.minimize_window,
            );
            render_hotkey_btn(
                "Reset Stats",
                HotkeyAction::ResetStats,
                &settings.hotkeys.reset_stats,
            );
        });

        ui.add_space(spacing::MD);

        style::group_frame(ui).show(ui, |ui| {
            ui.set_width(ui.available_width());
            ui.label(egui::RichText::new("Appearance").strong().color(text_color));
            ui.add_space(spacing::SM);

            ui.horizontal(|ui| {
                ui.label("Window Opacity:");
                if ui
                    .add(
                        egui::Slider::new(&mut settings.window_opacity, 0.1..=1.0).show_value(true),
                    )
                    .changed()
                {
                    *settings_save_timer = Some(Instant::now());
                }
            });

            ui.horizontal(|ui| {
                ui.label("Font Scale:");
                ui.label(format!("{:.2}", settings.font_scale));
                if ui.button("−").clicked() {
                    settings.font_scale =
                        (settings.font_scale - FONT_SCALE_STEP).max(FONT_SCALE_MIN);
                    *settings_save_timer = Some(Instant::now());
                }
                if ui.button("+").clicked() {
                    settings.font_scale =
                        (settings.font_scale + FONT_SCALE_STEP).min(FONT_SCALE_MAX);
                    *settings_save_timer = Some(Instant::now());
                }
            });

            ui.add_space(spacing::SM);

            ui.horizontal(|ui| {
                ui.label("Text Color:");
                let mut color = theme::text_color(settings);
                if egui::color_picker::color_edit_button_srgba(
                    ui,
                    &mut color,
                    egui::color_picker::Alpha::OnlyBlend,
                )
                .changed()
                {
                    settings.text_color = [color.r(), color.g(), color.b(), color.a()];
                    *settings_save_timer = Some(Instant::now());
                }
            });

            ui.add_space(spacing::SM);
            if ui.button("Reset Window Size").clicked() {
                let default_size = Settings::default().window_size.unwrap_or((485.0, 500.0));
                settings.window_size = Some(default_size);
                ui.ctx()
                    .send_viewport_cmd(egui::ViewportCommand::InnerSize(egui::vec2(
                        default_size.0,
                        default_size.1,
                    )));
                settings.save();
            }
        });

        ui.add_space(spacing::MD);

        style::group_frame(ui).show(ui, |ui| {
            ui.set_width(ui.available_width());
            ui.label(
                egui::RichText::new("Combat Data")
                    .strong()
                    .color(text_color),
            );
            ui.add_space(spacing::SM);

            ui.horizontal(|ui| {
                ui.label("DPS calculation cutoff:");
                if ui
                    .add(
                        egui::Slider::new(&mut settings.dps_calculation_cutoff_seconds, 1.0..=60.0)
                            .text("sec")
                            .step_by(1.0),
                    )
                    .changed()
                {
                    *settings_save_timer = Some(Instant::now());
                }
            });
            ui.label(
                egui::RichText::new("DPS stops calculating after this many seconds from last hit")
                    .small()
                    .weak(),
            );

            ui.add_space(spacing::MD);

            ui.horizontal(|ui| {
                ui.label("Clear after idle (seconds):");
                let mut idle_enabled = settings.clear_combat_data_idle_seconds.is_some();
                if ui.checkbox(&mut idle_enabled, "").changed() {
                    if idle_enabled {
                        settings.clear_combat_data_idle_seconds = Some(60); // Default 60 seconds
                    } else {
                        settings.clear_combat_data_idle_seconds = None;
                    }
                    *settings_save_timer = Some(Instant::now());
                }
                if let Some(ref mut seconds) = settings.clear_combat_data_idle_seconds {
                    if ui
                        .add(egui::Slider::new(seconds, 10..=600).text("sec"))
                        .changed()
                    {
                        *settings_save_timer = Some(Instant::now());
                    }
                } else {
                    ui.label(egui::RichText::new("Disabled").weak());
                }
            });

            ui.add_space(spacing::SM);

            if ui
                .checkbox(
                    &mut settings.clear_combat_data_on_server_change,
                    "Clear on Server/Channel change",
                )
                .changed()
            {
                *settings_save_timer = Some(Instant::now());
            }

            ui.add_space(spacing::SM);

            if ui
                .checkbox(
                    &mut settings.show_ability_score_in_name,
                    "Show ability score in player name",
                )
                .changed()
            {
                *settings_save_timer = Some(Instant::now());
            }

            ui.add_space(spacing::SM);

            ui.label(
                egui::RichText::new("Hide/Show Columns")
                    .strong()
                    .color(text_color),
            );
            ui.label(
                egui::RichText::new("Check to show columns in the Combat Data table")
                    .small()
                    .weak(),
            );
            ui.add_space(spacing::SM);

            let columns = [
                "Live DPS", "Name", "DMG%", "DPS", "DMG", "Max Hit", "Crit%", "Lucky%", "Heal",
                "Taken",
            ];

            for column_name in &columns {
                let is_hidden = settings.hidden_columns.contains(*column_name);
                let mut checked = !is_hidden;
                if ui.checkbox(&mut checked, *column_name).changed() {
                    if checked {
                        settings.hidden_columns.remove(*column_name);
                    } else {
                        settings.hidden_columns.insert(column_name.to_string());
                    }
                    *settings_save_timer = Some(Instant::now());
                }
            }
        });

        ui.add_space(spacing::MD);

        style::group_frame(ui).show(ui, |ui| {
            ui.set_width(ui.available_width());

            ui.label("Network Device");
            let mut device_changed = false;
            egui::ComboBox::from_id_salt("device_selector")
                .selected_text(
                    settings
                        .network_device_index
                        .and_then(|idx| devices.get(idx))
                        .map(crate::capture::packet::clean_device_name)
                        .unwrap_or_else(|| "Auto-select".to_string()),
                )
                .show_ui(ui, |ui| {
                    if ui
                        .selectable_value(&mut settings.network_device_index, None, "Auto-select")
                        .changed()
                    {
                        device_changed = true;
                    }
                    for (i, dev) in devices.iter().enumerate() {
                        let clean_name = crate::capture::packet::clean_device_name(dev);
                        if ui
                            .selectable_value(
                                &mut settings.network_device_index,
                                Some(i),
                                clean_name,
                            )
                            .changed()
                        {
                            device_changed = true;
                        }
                    }
                });
            if device_changed {
                if let Some(capture) = packet_capture {
                    if let Some(idx) = settings.network_device_index {
                        // Manual selection
                        capture.switch_device(idx);
                    } else {
                        // Auto-select
                        if let Some(best_idx) = crate::capture::packet::select_best_device(devices) {
                            capture.switch_device(best_idx);
                        }
                    }
                }
                *settings_save_timer = Some(Instant::now());
            }
        });

        ui.add_space(spacing::MD);

        style::group_frame(ui).show(ui, |ui| {
            ui.set_width(ui.available_width());
            ui.label(egui::RichText::new("Mob Timers").strong().color(text_color));
            ui.add_space(spacing::SM);

            ui.horizontal(|ui| {
                ui.label("Timers Region:");
                let region_str = account_id_regions::get_region_display_name(&settings.mob_timers_region);

                if egui::ComboBox::from_id_salt("timers_region_settings")
                    .selected_text(region_str)
                    .show_ui(ui, |ui| {
                        ui.selectable_value(&mut settings.mob_timers_region, None, "Auto");
                        for region_info in account_id_regions::REGIONS.iter().filter(|r| r.enabled) {
                            if let Some(region) = region_info.region {
                                ui.selectable_value(
                                    &mut settings.mob_timers_region,
                                    Some(region),
                                    region_info.display_name,
                                );
                            }
                        }
                    })
                    .response
                    .changed()
                {
                    *settings_save_timer = Some(Instant::now());
                }
            });
            ui.add_space(spacing::SM);

            ui.label(
                egui::RichText::new("Hide/Show Mobs")
                    .strong()
                    .color(text_color),
            );
            ui.label(
                egui::RichText::new("Check to show mobs in the Mob Timers view.")
                    .small()
                    .weak(),
            );
            ui.add_space(spacing::SM);

            if mobs.is_empty() {
                ui.label(egui::RichText::new("Loading mobs...").small().weak());
            } else {
                let mut sorted_mobs: Vec<_> = mobs.iter().collect();
                sorted_mobs.sort_by(|a, b| a.name.cmp(&b.name));
                for mob in sorted_mobs {
                    let is_hidden = settings.hidden_mobs.contains(&mob.id);
                    let mut checked = !is_hidden;
                    if ui.checkbox(&mut checked, &mob.name).changed() {
                        if checked {
                            settings.hidden_mobs.remove(&mob.id);
                        } else {
                            settings.hidden_mobs.insert(mob.id.clone());
                        }
                        *settings_save_timer = Some(Instant::now());
                    }
                }
            }
        });

        ui.add_space(spacing::MD);

        style::group_frame(ui).show(ui, |ui| {
            ui.set_width(ui.available_width());
            ui.label(
                egui::RichText::new("Module Optimizer")
                    .strong()
                    .color(text_color),
            );
            ui.add_space(spacing::SM);
            ui.label(
                egui::RichText::new(
                    "Extract module data and import into module optimizer on BPTimer website.",
                )
                .small()
                .weak(),
            );
            if extracted_modules.is_empty() {
                ui.label(
                    egui::RichText::new(
                        "No modules available to extract yet. Change line to load module data.",
                    )
                    .small()
                    .weak(),
                );
            } else {
                ui.label(
                    egui::RichText::new(format!("{} modules ready", extracted_modules.len()))
                        .small()
                        .weak(),
                );
            }
            if ui.button("Open Module Optimizer").clicked() {
                let base_url = format!(
                    "{}/modules-optimizer",
                    crate::utils::constants::BPTIMER_BASE_URL
                );
                let url = if !extracted_modules.is_empty() {
                    match crate::utils::modules::encode_module_data(extracted_modules) {
                        Ok(encoded) => {
                            format!("{}?data={}", base_url, encoded)
                        }
                        Err(e) => {
                            log::warn!("Failed to encode module data: {}", e);
                            base_url.to_string()
                        }
                    }
                } else {
                    base_url.to_string()
                };
                if let Err(e) = open::that(&url) {
                    log::warn!("Failed to open module optimizer: {}", e);
                }
            }
        });

        ui.add_space(spacing::MD);

        style::group_frame(ui).show(ui, |ui| {
            ui.set_width(ui.available_width());
            ui.label(egui::RichText::new("Updates").strong().color(text_color));
            ui.add_space(spacing::SM);

            let status = update_status.lock().unwrap().clone();
            match &status {
                crate::updater::UpdateStatus::Checking => {
                    ui.horizontal(|ui| {
                        ui.spinner();
                        ui.label("Checking for updates...");
                    });
                }
                crate::updater::UpdateStatus::Available(version) => {
                    ui.label(egui::RichText::new(format!(
                        "Update available: v{}",
                        version
                    )));
                    ui.add_space(spacing::SM);
                    if ui.button("Download and Install Update").clicked() {
                        *update_perform_requested = true;
                    }
                }
                crate::updater::UpdateStatus::UpToDate => {
                    ui.label(egui::RichText::new("Application is up to date"));
                    ui.add_space(spacing::SM);
                    if ui.button("Check for Updates").clicked() {
                        *update_check_requested = true;
                    }
                }
                crate::updater::UpdateStatus::Updating => {
                    ui.horizontal(|ui| {
                        ui.spinner();
                        ui.label("Downloading and installing update...");
                    });
                }
                crate::updater::UpdateStatus::Updated(version) => {
                    ui.label(
                        egui::RichText::new(format!("Updated to v{} - Restart required", version))
                            .color(egui::Color32::YELLOW),
                    );
                    ui.label(
                        egui::RichText::new("The application will restart automatically...")
                            .small()
                            .weak(),
                    );
                }
                crate::updater::UpdateStatus::Error(msg) => {
                    ui.label(
                        egui::RichText::new(format!("Update error: {}", msg))
                            .color(egui::Color32::RED),
                    );
                    ui.add_space(spacing::SM);
                    if ui.button("Retry Check").clicked() {
                        *update_check_requested = true;
                    }
                }
            }
        });

        ui.add_space(spacing::MD);

        style::group_frame(ui).show(ui, |ui| {
            ui.set_width(ui.available_width());
            ui.label(
                egui::RichText::new("Development")
                    .strong()
                    .color(text_color),
            );
            ui.add_space(spacing::SM);

            let mut show_console = settings.show_console;
            if ui
                .checkbox(&mut show_console, "Show Console Window")
                .changed()
            {
                settings.show_console = show_console;
                #[cfg(windows)]
                {
                    use windows_sys::Win32::System::Console::{AllocConsole, FreeConsole};
                    unsafe {
                        if show_console {
                            AllocConsole();
                        } else {
                            FreeConsole();
                        }
                    }
                }
                *settings_save_timer = Some(Instant::now());
            }
            ui.label(
                egui::RichText::new("Toggle console window for viewing logs.")
                    .small()
                    .weak(),
            );
        });
    });

    ui.add_space(spacing::MD);
    ui.separator();
    ui.add_space(spacing::SM);
    ui.horizontal(|ui| {
        ui.with_layout(egui::Layout::right_to_left(egui::Align::Center), |ui| {
            ui.label(
                egui::RichText::new(format!(
                    "Made by Wohee | v{}",
                    self_update::cargo_crate_version!()
                ))
                .small()
                .weak(),
            );
        });
    });

    // BPTimer opt-out dialog
    if *show_bptimer_dialog {
        Window::new("BPTimer Integration")
            .collapsible(false)
            .resizable(false)
            .default_size([400.0, 200.0])
            .anchor(egui::Align2::CENTER_CENTER, [0.0, 0.0])
            .show(ui.ctx(), |ui| {
                ui.add_space(spacing::MD);
                ui.label("BPTimer helps crowdsource mob tracking data by sharing HP and location information.");
                ui.label("This data is anonymous and only includes:");
                ui.label("  • Mob HP %");
                ui.label("  • Line number");
                ui.label("  • Position data");
                ui.label("  • Region data");
                ui.add_space(spacing::MD);
                ui.horizontal(|ui| {
                    if ui.button("Keep Enabled").clicked() {
                        settings.bptimer_enabled = true;
                        *show_bptimer_dialog = false;
                        *settings_save_timer = Some(Instant::now());
                    }
                    if ui.button("Disable").clicked() {
                        settings.bptimer_enabled = false;
                        *show_bptimer_dialog = false;
                        *settings_save_timer = Some(Instant::now());
                    }
                });
            });
    }
}
