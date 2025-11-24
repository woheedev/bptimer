use crate::models::mob::Mob;
use crate::ui::constants::{spacing, style};
use crate::utils::constants::{get_location_name, requires_location_number};
use egui::{Align2, Color32, FontId, Pos2, Rect, RichText, Sense, Stroke, StrokeKind, Ui, Vec2};

const HP_CRITICAL_THRESHOLD: f32 = 30.0;
const HP_LOW_THRESHOLD: f32 = 60.0;
const COLOR_CRITICAL: Color32 = Color32::from_rgb(0xF2, 0x66, 0x11);
const COLOR_LOW: Color32 = Color32::from_rgb(0xDF, 0xAB, 0x08);
const COLOR_HEALTHY: Color32 = Color32::from_rgb(0x1C, 0xB4, 0x54);
const MAX_CHANNELS_DISPLAYED: usize = 10;
const CHANNELS_PER_ROW: usize = 5;

fn hp_color(hp: f32) -> Color32 {
    if hp < HP_CRITICAL_THRESHOLD {
        COLOR_CRITICAL
    } else if hp < HP_LOW_THRESHOLD {
        COLOR_LOW
    } else {
        COLOR_HEALTHY
    }
}

pub fn render_mob_view(ui: &mut Ui, mobs: &[Mob]) {
    if mobs.is_empty() {
        ui.vertical_centered(|ui| {
            ui.add_space(spacing::LG);
            ui.label("Loading mob data...");
            ui.spinner();
        });
        return;
    }

    egui::ScrollArea::vertical().show(ui, |ui| {
        ui.vertical(|ui| {
            for mob in mobs {
                ui.add_space(spacing::MD);

                // Mob card using styled frame
                style::card_frame(ui).show(ui, |ui| {
                    ui.set_width(ui.available_width());

                    // Mob name and type
                    let text_color = ui.visuals().text_color();
                    ui.horizontal(|ui| {
                        ui.label(
                            RichText::new(&mob.name)
                                .size(18.0)
                                .strong()
                                .color(text_color),
                        );
                        ui.with_layout(egui::Layout::right_to_left(egui::Align::Center), |ui| {
                            ui.label(RichText::new(&mob.r#type).small().weak());
                        });
                    });

                    ui.add_space(spacing::MD);

                    // Channel list
                    if let Some(channels) = &mob.latest_channels {
                        let mut alive_channels: Vec<_> =
                            channels.iter().filter(|c| c.hp_percentage > 0.0).collect();
                        alive_channels.sort_by(|a, b| {
                            a.hp_percentage
                                .partial_cmp(&b.hp_percentage)
                                .unwrap_or(std::cmp::Ordering::Equal)
                        });

                        if alive_channels.is_empty() {
                            ui.label(RichText::new("No active channel data").small().weak());
                        } else {
                            let channels_to_show: Vec<_> =
                                alive_channels.iter().take(MAX_CHANNELS_DISPLAYED).collect();
                            let total_rows = if channels_to_show.is_empty() {
                                0
                            } else {
                                (channels_to_show.len() + CHANNELS_PER_ROW - 1) / CHANNELS_PER_ROW
                            };
                            ui.vertical(|rows_ui| {
                                let text_color = rows_ui.visuals().text_color();
                                for (row_idx, chunk) in
                                    channels_to_show.chunks(CHANNELS_PER_ROW).enumerate()
                                {
                                    rows_ui.horizontal(|ui| {
                                        for channel in chunk {
                                            let label =
                                                if let Some(loc_num) = channel.location_number {
                                                    if requires_location_number(mob.uid as u32)
                                                        && let Some(loc_name) =
                                                            get_location_name(&mob.name, loc_num)
                                                    {
                                                        format!(
                                                            "CH {}  {}  {:.0}%",
                                                            channel.channel,
                                                            loc_name,
                                                            channel.hp_percentage
                                                        )
                                                    } else {
                                                        format!(
                                                            "CH {}  {:.0}%",
                                                            channel.channel, channel.hp_percentage
                                                        )
                                                    }
                                                } else {
                                                    format!(
                                                        "CH {}  {:.0}%",
                                                        channel.channel, channel.hp_percentage
                                                    )
                                                };
                                            ui.vertical(|channel_ui| {
                                                let font_id = FontId::proportional(12.0);
                                                let galley = channel_ui.painter().layout_no_wrap(
                                                    label.clone(),
                                                    font_id.clone(),
                                                    text_color,
                                                );
                                                let padding = Vec2::new(10.0, 4.0);
                                                let pill_size = galley.size() + padding * 2.0;
                                                channel_ui.set_width(pill_size.x);
                                                let (pill_rect, _) = channel_ui
                                                    .allocate_exact_size(pill_size, Sense::hover());
                                                channel_ui.painter().rect_filled(
                                                    pill_rect,
                                                    0.0,
                                                    Color32::TRANSPARENT,
                                                );
                                                channel_ui.painter().rect_stroke(
                                                    pill_rect,
                                                    0.0,
                                                    Stroke::new(1.0, Color32::from_gray(90)),
                                                    StrokeKind::Inside,
                                                );
                                                channel_ui.painter().text(
                                                    pill_rect.center(),
                                                    Align2::CENTER_CENTER,
                                                    label.clone(),
                                                    font_id.clone(),
                                                    text_color,
                                                );

                                                let bar_height = 2.0;
                                                let bar_rect = Rect::from_min_size(
                                                    Pos2::new(pill_rect.min.x, pill_rect.max.y),
                                                    Vec2::new(pill_rect.width(), bar_height),
                                                );
                                                channel_ui.painter().rect_filled(
                                                    bar_rect,
                                                    0.0,
                                                    Color32::from_gray(60),
                                                );
                                                let fill_width = bar_rect.width()
                                                    * (channel.hp_percentage / 100.0);
                                                let fill_rect = Rect::from_min_size(
                                                    bar_rect.min,
                                                    Vec2::new(fill_width, bar_height),
                                                );
                                                channel_ui.painter().rect_filled(
                                                    fill_rect,
                                                    0.0,
                                                    hp_color(channel.hp_percentage),
                                                );

                                                channel_ui.add_space(spacing::SM);
                                            });
                                        }
                                    });
                                    if total_rows > 0 && row_idx + 1 < total_rows {
                                        rows_ui.add_space(spacing::SM);
                                    }
                                }
                            });
                        }
                    } else {
                        ui.label(RichText::new("No channel data").small().weak());
                    }
                });
            }
        });
    });
}
