use crate::config::Settings;
use crate::models::PlayerStats;
use crate::ui::constants::spacing;
use crate::utils::format_compact;
use egui::{Color32, Ui};
use egui_extras::{Column, TableBuilder};
use egui_material_icons;

pub fn render_player_table(
    ui: &mut Ui,
    players: &mut Vec<&PlayerStats>,
    party_total_damage: f32,
    sort_column: &mut Option<usize>,
    sort_descending: &mut bool,
    settings: &Settings,
) {
    if let Some(col) = *sort_column {
        players.sort_by(|a, b| {
            let cmp = match col {
                0 => std::cmp::Ordering::Equal, // Live DPS - not sortable
                1 => a.name.cmp(&b.name),       // Name
                2 => {
                    // DMG %
                    let a_pct = if party_total_damage > 0.0 {
                        (a.total_damage / party_total_damage) * 100.0
                    } else {
                        0.0
                    };
                    let b_pct = if party_total_damage > 0.0 {
                        (b.total_damage / party_total_damage) * 100.0
                    } else {
                        0.0
                    };
                    a_pct.partial_cmp(&b_pct).unwrap()
                }
                3 => a.get_total_dps().partial_cmp(&b.get_total_dps()).unwrap(), // DPS
                4 => a.total_damage.partial_cmp(&b.total_damage).unwrap(),       // Total DMG
                5 => a.max_single_hit.partial_cmp(&b.max_single_hit).unwrap(),   // Max Hit
                6 => {
                    // Crit %
                    let a_crit = if a.total_hits > 0 {
                        ((a.critical_hits as f32) / (a.total_hits as f32)) * 100.0
                    } else {
                        0.0
                    };
                    let b_crit = if b.total_hits > 0 {
                        ((b.critical_hits as f32) / (b.total_hits as f32)) * 100.0
                    } else {
                        0.0
                    };
                    a_crit.partial_cmp(&b_crit).unwrap()
                }
                7 => {
                    // Lucky %
                    let a_lucky = if a.total_hits > 0 {
                        ((a.lucky_hits as f32) / (a.total_hits as f32)) * 100.0
                    } else {
                        0.0
                    };
                    let b_lucky = if b.total_hits > 0 {
                        ((b.lucky_hits as f32) / (b.total_hits as f32)) * 100.0
                    } else {
                        0.0
                    };
                    a_lucky.partial_cmp(&b_lucky).unwrap()
                }
                8 => a.total_healing.partial_cmp(&b.total_healing).unwrap(), // Total Healing
                9 => a
                    .total_damage_taken
                    .partial_cmp(&b.total_damage_taken)
                    .unwrap(), // Total DMG Taken
                _ => std::cmp::Ordering::Equal,
            };
            if *sort_descending { cmp.reverse() } else { cmp }
        });
    }

    // Define all columns with their metadata
    let all_columns = [
        ("Live DPS", 0, 100.0, false), // not sortable
        ("Name", 1, 80.0, true),
        ("DMG%", 2, 50.0, true),
        ("DPS", 3, 50.0, true),
        ("DMG", 4, 65.0, true),
        ("Max Hit", 5, 55.0, true),
        ("Crit%", 6, 50.0, true),
        ("Lucky%", 7, 50.0, true),
        ("Heal", 8, 70.0, true),
        ("Taken", 9, 75.0, true),
    ];

    // Filter visible columns
    let visible_columns: Vec<_> = all_columns
        .iter()
        .filter(|(name, _, _, _)| !settings.hidden_columns.contains(*name))
        .collect();

    // Build column index mapping
    let mut col_index_map = std::collections::HashMap::new();
    for (new_idx, (_, orig_idx, _, _)) in visible_columns.iter().enumerate() {
        col_index_map.insert(*orig_idx, new_idx);
    }

    // Adjust sort column if the current one is hidden
    if let Some(sort_col) = *sort_column {
        if !col_index_map.contains_key(&sort_col) {
            *sort_column = None;
        }
    }

    egui::ScrollArea::both()
        .auto_shrink([false, false])
        .show(ui, |ui| {
            // Calculate available width for responsive layout BEFORE creating table builder
            let available_width = ui.available_width();
            let fixed_columns_width: f32 = visible_columns.iter().map(|(_, _, w, _)| *w).sum();
            let remaining_width = (available_width - fixed_columns_width).max(0.0);

            let mut table_builder = TableBuilder::new(ui)
                .striped(true)
                .resizable(true)
                .cell_layout(egui::Layout::left_to_right(egui::Align::Center));

            // Add columns for visible columns only
            // Make the last column fill remaining space if there's room
            for (idx, (_, _, width, _)) in visible_columns.iter().enumerate() {
                let is_last = idx == visible_columns.len() - 1;
                let col = if is_last && remaining_width > 0.0 {
                    // Last column fills remaining space
                    Column::auto().at_least(*width).clip(true).resizable(true)
                } else {
                    Column::auto().at_least(*width)
                };
                table_builder = table_builder.column(col);
            }

            table_builder
                .header(18.0, |mut header| {
                    for (name, orig_idx, _, is_sortable) in &visible_columns {
                        header.col(|ui| {
                            let is_sorted = *is_sortable && *sort_column == Some(*orig_idx);
                            let sort_indicator = if is_sorted {
                                if *sort_descending {
                                    format!(" {}", egui_material_icons::icons::ICON_ARROW_DOWNWARD)
                                } else {
                                    format!(" {}", egui_material_icons::icons::ICON_ARROW_UPWARD)
                                }
                            } else {
                                String::new()
                            };
                            let response = ui
                                .selectable_label(is_sorted, format!("{}{}", name, sort_indicator));
                            if response.clicked() && *is_sortable {
                                if *sort_column == Some(*orig_idx) {
                                    *sort_descending = !*sort_descending;
                                } else {
                                    *sort_column = Some(*orig_idx);
                                    *sort_descending = true;
                                }
                            }
                        });
                    }
                })
                .body(|mut body| {
                    for player in players.iter() {
                        let damage_pct = if party_total_damage > 0.0 {
                            (player.total_damage / party_total_damage) * 100.0
                        } else {
                            0.0
                        };

                        let crit_pct = if player.total_hits > 0 {
                            ((player.critical_hits as f32) / (player.total_hits as f32)) * 100.0
                        } else {
                            0.0
                        };

                        let lucky_pct = if player.total_hits > 0 {
                            ((player.lucky_hits as f32) / (player.total_hits as f32)) * 100.0
                        } else {
                            0.0
                        };

                        body.row(16.0, |mut row| {
                            // Extract text color from settings
                            let text_color = Color32::from_rgba_unmultiplied(
                                settings.text_color[0],
                                settings.text_color[1],
                                settings.text_color[2],
                                settings.text_color[3],
                            );

                            // Render cells for visible columns only
                            for (name, _, _, _) in &visible_columns {
                                row.col(|ui| match *name {
                                    "Live DPS" => {
                                        crate::ui::components::dps_graph::render_dps_graph(
                                            ui, player, text_color,
                                        );
                                    }
                                    "Name" => {
                                        let name_label = ui.colored_label(text_color, &player.name);
                                        name_label.on_hover_ui(|ui| {
                                            ui.label(format!("UID: {}", player.uid));
                                        });
                                    }
                                    "DMG%" => {
                                        ui.label(format!("{:.1}%", damage_pct));
                                    }
                                    "DPS" => {
                                        let (compact, raw) = format_compact(player.get_total_dps());
                                        let label = ui.label(compact);
                                        label.on_hover_text(raw);
                                    }
                                    "DMG" => {
                                        let (compact, raw) = format_compact(player.total_damage);
                                        let label = ui.label(compact);
                                        label.on_hover_text(raw);
                                    }
                                    "Max Hit" => {
                                        let (compact, raw) = format_compact(player.max_single_hit);
                                        let label = ui.label(compact);
                                        label.on_hover_text(raw);
                                    }
                                    "Crit%" => {
                                        ui.label(format!("{:.1}%", crit_pct));
                                    }
                                    "Lucky%" => {
                                        ui.label(format!("{:.1}%", lucky_pct));
                                    }
                                    "Heal" => {
                                        let (compact, raw) = format_compact(player.total_healing);
                                        let label = ui.label(compact);
                                        label.on_hover_text(raw);
                                    }
                                    "Taken" => {
                                        let (compact, raw) =
                                            format_compact(player.total_damage_taken);
                                        let label = ui.label(compact);
                                        label.on_hover_text(raw);
                                    }
                                    _ => {}
                                });
                            }
                        });
                    }
                });

            ui.add_space(spacing::LG);
        });
}
