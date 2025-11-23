use crate::config::Settings;
use crate::models::PlayerStats;
use crate::ui::components::player_table;
use crate::ui::constants::{spacing, theme};
use egui::Ui;

pub fn render_main_view(
    ui: &mut Ui,
    player_stats: &std::collections::HashMap<i64, PlayerStats>,
    sort_column: &mut Option<usize>,
    sort_descending: &mut bool,
    settings: &Settings,
) {
    // Filter out players with no combat activity
    let mut players: Vec<_> = player_stats
        .values()
        .filter(|p| p.total_damage > 0.0 || p.total_healing > 0.0 || p.total_damage_taken > 0.0)
        .collect();

    if players.is_empty() {
        ui.vertical_centered(|ui| {
            // Responsive vertical padding
            let available_height = ui.available_height();
            let vertical_padding = (available_height * 0.2).min(50.0); // 20% of height, max 50px
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
    } else {
        let party_total_damage: f32 = players.iter().map(|p| p.total_damage).sum();

        player_table::render_player_table(
            ui,
            &mut players,
            party_total_damage,
            sort_column,
            sort_descending,
            settings,
        );

        ui.add_space(spacing::SM);
    }
}
