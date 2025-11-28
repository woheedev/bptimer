use crate::config::Settings;
use crate::models::{PlayerInfoCache, PlayerStats};
use crate::ui::components::class_icons;
use crate::ui::constants::{player_table, spacing};
use crate::utils::{constants, format_compact};
use egui::{Color32, Ui};
use egui_extras::{Column, TableBuilder};
use egui_material_icons;

#[derive(Debug, Clone)]
struct ColumnDef {
    name: &'static str,
    index: usize,
    sortable: bool,
}

impl ColumnDef {
    const fn new(name: &'static str, index: usize, sortable: bool) -> Self {
        Self {
            name,
            index,
            sortable,
        }
    }

    fn to_column(&self, should_fill_remaining: bool) -> Column {
        if should_fill_remaining {
            Column::remainder().resizable(true).clip(true)
        } else {
            Column::auto().resizable(true)
        }
    }

    fn value_for_player<'a>(
        &self,
        player: &'a PlayerStats,
        party_total_damage: f32,
        settings: &Settings,
        info_cache: &'a PlayerInfoCache,
        icon_cache: &'a class_icons::ClassIconCache,
    ) -> ColumnValue<'a> {
        match self.index {
            0 => ColumnValue::LiveDps(player),
            1 => ColumnValue::Name(&player.name, player.uid, info_cache, icon_cache),
            2 => {
                let pct = if party_total_damage > 0.0 {
                    (player.total_damage / party_total_damage) * 100.0
                } else {
                    0.0
                };
                ColumnValue::Percentage(pct)
            }
            3 => {
                ColumnValue::Compact(player.get_total_dps(settings.dps_calculation_cutoff_seconds))
            }
            4 => ColumnValue::Compact(player.total_damage),
            5 => ColumnValue::Compact(player.max_single_hit),
            6 => {
                let pct = if player.total_hits > 0 {
                    ((player.critical_hits as f32) / (player.total_hits as f32)) * 100.0
                } else {
                    0.0
                };
                ColumnValue::Percentage(pct)
            }
            7 => {
                let pct = if player.total_hits > 0 {
                    ((player.lucky_hits as f32) / (player.total_hits as f32)) * 100.0
                } else {
                    0.0
                };
                ColumnValue::Percentage(pct)
            }
            8 => ColumnValue::Compact(player.total_healing),
            9 => ColumnValue::Compact(player.total_damage_taken),
            _ => ColumnValue::Empty,
        }
    }

    fn compare_players(
        &self,
        a: &PlayerStats,
        b: &PlayerStats,
        party_total_damage: f32,
        settings: &Settings,
    ) -> std::cmp::Ordering {
        match self.index {
            0 => std::cmp::Ordering::Equal,
            1 => a.name.cmp(&b.name),
            2 => {
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
                a_pct
                    .partial_cmp(&b_pct)
                    .unwrap_or(std::cmp::Ordering::Equal)
            }
            3 => a
                .get_total_dps(settings.dps_calculation_cutoff_seconds)
                .partial_cmp(&b.get_total_dps(settings.dps_calculation_cutoff_seconds))
                .unwrap_or(std::cmp::Ordering::Equal),
            4 => a
                .total_damage
                .partial_cmp(&b.total_damage)
                .unwrap_or(std::cmp::Ordering::Equal),
            5 => a
                .max_single_hit
                .partial_cmp(&b.max_single_hit)
                .unwrap_or(std::cmp::Ordering::Equal),
            6 => {
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
                a_crit
                    .partial_cmp(&b_crit)
                    .unwrap_or(std::cmp::Ordering::Equal)
            }
            7 => {
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
                a_lucky
                    .partial_cmp(&b_lucky)
                    .unwrap_or(std::cmp::Ordering::Equal)
            }
            8 => a
                .total_healing
                .partial_cmp(&b.total_healing)
                .unwrap_or(std::cmp::Ordering::Equal),
            9 => a
                .total_damage_taken
                .partial_cmp(&b.total_damage_taken)
                .unwrap_or(std::cmp::Ordering::Equal),
            _ => std::cmp::Ordering::Equal,
        }
    }
}

enum ColumnValue<'a> {
    LiveDps(&'a PlayerStats),
    Name(
        &'a str,
        i64,
        &'a PlayerInfoCache,
        &'a class_icons::ClassIconCache,
    ),
    Percentage(f32),
    Compact(f32),
    Empty,
}

impl<'a> ColumnValue<'a> {
    fn render(&self, ui: &mut Ui, text_color: Color32, local_player_uid: Option<i64>) {
        match self {
            ColumnValue::LiveDps(player) => {
                crate::ui::components::dps_graph::render_dps_graph(ui, player, text_color);
            }
            ColumnValue::Name(name, uid, info_cache, icon_cache) => {
                let old_spacing = {
                    let spacing = ui.spacing_mut();
                    let old = spacing.item_spacing;
                    spacing.item_spacing = egui::vec2(0.0, 0.0);
                    old
                };

                ui.horizontal(|ui| {
                    ui.set_min_height(player_table::ROW_HEIGHT);
                    let metadata = info_cache.get(*uid);
                    let is_local = local_player_uid == Some(*uid);
                    class_icons::render_class_icon(
                        ui,
                        icon_cache,
                        metadata.class_id,
                        is_local,
                        text_color,
                    );
                    ui.add_space(player_table::ICON_NAME_SPACING);
                    let label = ui.colored_label(text_color, *name);
                    label.on_hover_ui(|ui| {
                        ui.vertical(|ui| {
                            ui.label(format!("UID: {}", uid));
                            if let Some(class_id) = metadata.class_id {
                                let class_name = constants::get_class_name(class_id)
                                    .map(|s| s.to_string())
                                    .unwrap_or_else(|| format!("Unknown ({})", class_id));
                                ui.label(format!("Class: {}", class_name));
                            }
                            if let Some(score) = metadata.ability_score {
                                ui.label(format!("Ability Score: {}", score));
                            }
                        });
                    });
                });

                ui.spacing_mut().item_spacing = old_spacing;
            }
            ColumnValue::Percentage(pct) => {
                ui.label(format!("{:.1}%", pct));
            }
            ColumnValue::Compact(value) => {
                let (compact, raw) = format_compact(*value);
                let label = ui.label(compact);
                label.on_hover_text(raw);
            }
            ColumnValue::Empty => {}
        }
    }
}

const COLUMNS: &[ColumnDef] = &[
    ColumnDef::new("Live DPS", 0, false),
    ColumnDef::new("Name", 1, true),
    ColumnDef::new("DMG%", 2, true),
    ColumnDef::new("DPS", 3, true),
    ColumnDef::new("DMG", 4, true),
    ColumnDef::new("Max Hit", 5, true),
    ColumnDef::new("Crit%", 6, true),
    ColumnDef::new("Lucky%", 7, true),
    ColumnDef::new("Heal", 8, true),
    ColumnDef::new("Taken", 9, true),
];

pub fn render_player_table(
    ui: &mut Ui,
    players: &mut Vec<&PlayerStats>,
    party_total_damage: f32,
    sort_column: &mut Option<usize>,
    sort_descending: &mut bool,
    settings: &mut Settings,
    info_cache: &PlayerInfoCache,
    icon_cache: &class_icons::ClassIconCache,
    player_state: &crate::models::PlayerState,
) {
    let visible_columns: Vec<&ColumnDef> = COLUMNS
        .iter()
        .filter(|col| !settings.hidden_columns.contains(col.name))
        .collect();

    if let Some(sort_idx) = *sort_column {
        if !visible_columns.iter().any(|col| col.index == sort_idx) {
            *sort_column = None;
        }
    }

    if let Some(sort_idx) = *sort_column {
        if let Some(col_def) = COLUMNS.iter().find(|c| c.index == sort_idx && c.sortable) {
            players.sort_by(|a, b| {
                let cmp = col_def.compare_players(a, b, party_total_damage, settings);
                if *sort_descending { cmp.reverse() } else { cmp }
            });
        }
    }

    egui::ScrollArea::both()
        .auto_shrink([false, false])
        .show(ui, |ui| {
            let mut table_builder = TableBuilder::new(ui)
                .striped(true)
                .resizable(true)
                .cell_layout(egui::Layout::left_to_right(egui::Align::Center));

            let visible_len = visible_columns.len();
            for (idx, col_def) in visible_columns.iter().enumerate() {
                let should_fill_remaining = idx == visible_len.saturating_sub(1);
                table_builder = table_builder.column(col_def.to_column(should_fill_remaining));
            }

            table_builder
                .header(18.0, |mut header| {
                    for col_def in &visible_columns {
                        header.col(|ui| {
                            let is_sorted = col_def.sortable && *sort_column == Some(col_def.index);
                            let sort_indicator = if is_sorted {
                                if *sort_descending {
                                    format!(" {}", egui_material_icons::icons::ICON_ARROW_DOWNWARD)
                                } else {
                                    format!(" {}", egui_material_icons::icons::ICON_ARROW_UPWARD)
                                }
                            } else {
                                String::new()
                            };
                            let response = ui.selectable_label(
                                is_sorted,
                                format!("{}{}", col_def.name, sort_indicator),
                            );
                            if response.clicked() && col_def.sortable {
                                let sort_changed = if *sort_column == Some(col_def.index) {
                                    *sort_descending = !*sort_descending;
                                    true
                                } else {
                                    *sort_column = Some(col_def.index);
                                    *sort_descending = true;
                                    true
                                };
                                if sort_changed {
                                    settings.sort_column = *sort_column;
                                    settings.sort_descending = *sort_descending;
                                    settings.save();
                                }
                            }
                        });
                    }
                })
                .body(|mut body| {
                    let text_color = Color32::from_rgba_unmultiplied(
                        settings.text_color[0],
                        settings.text_color[1],
                        settings.text_color[2],
                        settings.text_color[3],
                    );
                    let local_player_uid = player_state.get_uid();

                    for player in players.iter() {
                        body.row(player_table::ROW_HEIGHT, |mut row| {
                            for col_def in &visible_columns {
                                row.col(|ui| {
                                    let value = col_def.value_for_player(
                                        player,
                                        party_total_damage,
                                        settings,
                                        info_cache,
                                        icon_cache,
                                    );
                                    value.render(ui, text_color, local_player_uid);
                                });
                            }
                        });
                    }
                });

            ui.add_space(spacing::LG);
        });
}
