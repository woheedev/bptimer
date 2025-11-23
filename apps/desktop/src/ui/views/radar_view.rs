use crate::models::radar::RadarState;
use crate::ui::constants::{radar, responsive, spacing};
use egui::{Color32, Pos2, Stroke, Ui};

pub fn render_radar_view(ui: &mut Ui, radar_state: &RadarState, text_color: Color32) {
    // Only show radar if player position is available
    let player_pos = match radar_state.player_position {
        Some(pos) => pos,
        None => {
            return; // Don't show anything if no player position
        }
    };

    // Check if there are any tracked mobs (show radar as soon as any mob is detected)
    if radar_state.tracked_mobs.is_empty() {
        return; // Don't show radar if no tracked mobs at all
    }

    // Show tracked mob names with distances and HP%
    let mut mob_labels: Vec<String> = Vec::new();
    for mob in radar_state.tracked_mobs.values() {
        let dx = mob.position.x - player_pos.x;
        let dz = mob.position.z - player_pos.z;
        let distance = (dx * dx + dz * dz).sqrt();

        // Format: "Name (2m - 54%)" or "Name (2m)" if HP% not available
        let label = if let Some(hp_pct) = mob.hp_percentage() {
            format!("{} ({:.0}m - {}%)", mob.name, distance, hp_pct)
        } else {
            format!("{} ({:.0}m)", mob.name, distance)
        };
        mob_labels.push(label);
    }
    if !mob_labels.is_empty() {
        ui.label(format!("Tracking: {}", mob_labels.join(", ")));
    }
    ui.add_space(spacing::SM);

    // Center the radar in the available width using responsive helper
    responsive::center_horizontal(ui, radar::SIZE, |ui| {
        // Radar display
        let radar_size_vec = egui::Vec2::splat(radar::SIZE);
        let rect = ui
            .allocate_exact_size(radar_size_vec, egui::Sense::hover())
            .0;

        // Draw radar background
        let bg_color = Color32::from_rgba_unmultiplied(
            radar::BG_COLOR_RGBA[0],
            radar::BG_COLOR_RGBA[1],
            radar::BG_COLOR_RGBA[2],
            radar::BG_COLOR_RGBA[3],
        );
        ui.painter()
            .circle_filled(rect.center(), radar::SIZE / 2.0, bg_color);

        // Draw grid lines
        let center = rect.center();
        let grid_color = Color32::from_rgba_unmultiplied(
            radar::GRID_COLOR_RGBA[0],
            radar::GRID_COLOR_RGBA[1],
            radar::GRID_COLOR_RGBA[2],
            radar::GRID_COLOR_RGBA[3],
        );
        ui.painter().line_segment(
            [
                Pos2::new(rect.left(), center.y),
                Pos2::new(rect.right(), center.y),
            ],
            Stroke::new(radar::GRID_STROKE_WIDTH, grid_color),
        );
        ui.painter().line_segment(
            [
                Pos2::new(center.x, rect.top()),
                Pos2::new(center.x, rect.bottom()),
            ],
            Stroke::new(radar::GRID_STROKE_WIDTH, grid_color),
        );

        // Draw N S E W indicators
        let indicator_color = text_color;
        let font_id = egui::TextStyle::Body.resolve(ui.style());
        let indicator_offset = radar::INDICATOR_OFFSET;

        // North (top)
        ui.painter().text(
            Pos2::new(center.x, rect.top() + indicator_offset),
            egui::Align2::CENTER_TOP,
            "N",
            font_id.clone(),
            indicator_color,
        );

        // South (bottom)
        ui.painter().text(
            Pos2::new(center.x, rect.bottom() - indicator_offset),
            egui::Align2::CENTER_BOTTOM,
            "S",
            font_id.clone(),
            indicator_color,
        );

        // East (right)
        ui.painter().text(
            Pos2::new(rect.right() - indicator_offset, center.y),
            egui::Align2::RIGHT_CENTER,
            "E",
            font_id.clone(),
            indicator_color,
        );

        // West (left)
        ui.painter().text(
            Pos2::new(rect.left() + indicator_offset, center.y),
            egui::Align2::LEFT_CENTER,
            "W",
            font_id.clone(),
            indicator_color,
        );

        // Draw player at center
        ui.painter()
            .circle_filled(center, radar::PLAYER_RADIUS, radar::PLAYER_COLOR);
        ui.painter().circle_stroke(
            center,
            radar::PLAYER_RADIUS,
            Stroke::new(radar::STROKE_WIDTH, radar::PLAYER_COLOR),
        );

        // Draw tracked mobs
        let inner_radius = radar::SIZE / 2.0 - radar::INNER_PADDING;
        let scale = inner_radius / radar::CLAMP_DISTANCE;
        let edge_radius = inner_radius; // Edge of radar circle

        for mob in radar_state.tracked_mobs.values() {
            let dx = mob.position.x - player_pos.x;
            let dz = mob.position.z - player_pos.z;
            let distance = (dx * dx + dz * dz).sqrt();

            // Calculate direction vector (normalized)
            let (dir_x, dir_z) = if distance > 0.0 {
                (dx / distance, dz / distance)
            } else {
                (0.0, 0.0)
            };

            // Calculate position on radar (invert Z axis to fix north/south direction)
            let mob_pos = if distance < radar::CLAMP_DISTANCE {
                // Within 50m: show actual position using inner area
                Pos2::new(
                    center.x + dx * scale,
                    center.y - dz * scale, // Negate dz to fix north/south inversion
                )
            } else {
                // 50m+: clamp to edge of radar circle in the correct direction
                Pos2::new(
                    center.x + dir_x * edge_radius,
                    center.y - dir_z * edge_radius, // Negate dir_z to fix north/south inversion
                )
            };

            // Use different color for mobs at edge (50m+)
            let mob_color = if distance >= radar::CLAMP_DISTANCE {
                Color32::from_rgba_unmultiplied(
                    radar::MOB_COLOR_EDGE_RGBA[0],
                    radar::MOB_COLOR_EDGE_RGBA[1],
                    radar::MOB_COLOR_EDGE_RGBA[2],
                    radar::MOB_COLOR_EDGE_RGBA[3],
                )
            } else {
                radar::MOB_COLOR
            };

            // Draw mob
            ui.painter()
                .circle_filled(mob_pos, radar::MOB_RADIUS, mob_color);
            ui.painter().circle_stroke(
                mob_pos,
                radar::MOB_RADIUS,
                Stroke::new(radar::STROKE_WIDTH, mob_color),
            );
            let line_start = if distance > 0.0 {
                // Calculate direction from player to mob
                let dir_x = dx / distance;
                let dir_z = dz / distance;
                // Start from edge of player dot
                Pos2::new(
                    center.x + dir_x * radar::PLAYER_RADIUS,
                    center.y - dir_z * radar::PLAYER_RADIUS,
                )
            } else {
                center
            };

            let line_end = if distance > 0.0 {
                // Calculate direction from player to mob
                let dir_x = dx / distance;
                let dir_z = dz / distance;
                // End at edge of mob dot
                Pos2::new(
                    mob_pos.x - dir_x * radar::MOB_RADIUS,
                    mob_pos.y + dir_z * radar::MOB_RADIUS,
                )
            } else {
                mob_pos
            };

            ui.painter().line_segment(
                [line_start, line_end],
                Stroke::new(radar::STROKE_WIDTH, text_color),
            );
        }
    });
}
