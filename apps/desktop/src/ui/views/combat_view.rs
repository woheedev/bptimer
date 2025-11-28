use crate::config::Settings;
use crate::models::PlayerStats;
use crate::ui::components::player_table;
use crate::ui::constants::{spacing, theme};
use egui::{Align, Layout, TextStyle, Ui};
use instant::Instant;

pub fn collect_active_players<'a>(
    player_stats: &'a std::collections::HashMap<i64, PlayerStats>,
) -> Vec<&'a PlayerStats> {
    player_stats
        .values()
        .filter(|p| p.total_damage > 0.0 || p.total_healing > 0.0 || p.total_damage_taken > 0.0)
        .collect()
}

pub fn render_combat_view(
    ui: &mut Ui,
    players: &mut Vec<&PlayerStats>,
    sort_column: &mut Option<usize>,
    sort_descending: &mut bool,
    settings: &mut Settings,
    info_cache: &crate::models::PlayerInfoCache,
    icon_cache: &crate::ui::components::class_icons::ClassIconCache,
    player_state: &crate::models::PlayerState,
) -> bool {
    if players.is_empty() {
        ui.vertical_centered(|ui| {
            let available_height = ui.available_height();
            let vertical_padding = (available_height * 0.2).min(50.0);
            ui.add_space(vertical_padding);
            ui.label(
                egui::RichText::new("Waiting for player data...")
                    .size(16.0)
                    .color(theme::text_color(settings)),
            );
            ui.add_space(spacing::MD);
            ui.spinner();
            ui.add_space(vertical_padding);
        });
        return false;
    }

    let party_total_damage: f32 = players.iter().map(|p| p.total_damage).sum();

    player_table::render_player_table(
        ui,
        players,
        party_total_damage,
        sort_column,
        sort_descending,
        settings,
        info_cache,
        icon_cache,
        player_state,
    );

    true
}

pub fn dps_window_text(
    player_stats: &std::collections::HashMap<i64, PlayerStats>,
    settings: &Settings,
) -> String {
    calculate_dps_window_seconds(player_stats, settings)
        .map(format_duration_hms)
        .unwrap_or_else(|| "--:--:--".to_string())
}

pub fn render_footer(ui: &mut Ui, timer_text: &str, settings: &Settings) {
    ui.add_space(spacing::XS);
    ui.separator();
    ui.add_space(spacing::XS);

    ui.with_layout(Layout::right_to_left(Align::Center), |ui| {
        ui.label(
            egui::RichText::new(timer_text)
                .monospace()
                .size(11.0)
                .color(theme::text_color(settings))
                .weak(),
        );
    });
}

pub fn footer_height(ui: &Ui) -> f32 {
    let text_height = ui.text_style_height(&TextStyle::Body);
    let spacing = ui.spacing().item_spacing.y;
    (spacing::XS * 2.0) + spacing + text_height
}

fn calculate_dps_window_seconds(
    player_stats: &std::collections::HashMap<i64, PlayerStats>,
    settings: &Settings,
) -> Option<f32> {
    let mut earliest_start = None;
    let mut latest_end = None;

    for stats in player_stats.values() {
        if let (Some(first), Some(last)) = (stats.first_damage_time, stats.last_damage_time) {
            earliest_start = Some(match earliest_start {
                Some(current) => first.min(current),
                None => first,
            });
            latest_end = Some(match latest_end {
                Some(current) => last.max(current),
                None => last,
            });
        }
    }

    let (first, last) = (earliest_start?, latest_end?);
    if last < first {
        return None;
    }

    let now = Instant::now();
    let time_since_last = now.duration_since(last).as_secs_f32();
    let duration = if time_since_last > settings.dps_calculation_cutoff_seconds {
        last.duration_since(first).as_secs_f32() + settings.dps_calculation_cutoff_seconds
    } else {
        now.duration_since(first).as_secs_f32()
    };

    Some(duration.max(0.0))
}

fn format_duration_hms(seconds: f32) -> String {
    let total_seconds = seconds.round().max(0.0) as i64;
    let hours = total_seconds / 3600;
    let minutes = (total_seconds % 3600) / 60;
    let secs = total_seconds % 60;
    format!("{:02}:{:02}:{:02}", hours, minutes, secs)
}
