use crate::ui::app::ViewMode;
use egui::{Color32, Context, Rect, Ui, Vec2};
use egui_material_icons;

pub fn render_title_bar(
    ui: &mut Ui,
    title_bar_rect: Rect,
    ctx: &Context,
    opacity: f32,
    click_through: &mut bool,
    window_locked: &mut bool,
    view_mode: &mut ViewMode,
    dps_value: &mut f32,
    total_damage: &mut f32,
    max_dps: &mut f32,
    dps_history: &mut Vec<f32>,
    player_stats: &mut std::collections::HashMap<i64, crate::models::PlayerStats>,
    show_radar: bool,
    show_mob_timers: bool,
    show_combat_data: bool,
) {
    let visuals = ui.style().visuals.clone();
    let text_color = visuals.text_color();
    let title_bar_color = Color32::from_rgba_unmultiplied(50, 50, 50, (opacity * 255.0) as u8);
    let corner_radius = 8.0;
    let main_rect = Rect::from_min_max(
        egui::pos2(title_bar_rect.min.x, title_bar_rect.min.y + corner_radius),
        title_bar_rect.max,
    );
    ui.painter().rect_filled(main_rect, 0.0, title_bar_color);

    ui.painter().circle_filled(
        egui::pos2(
            title_bar_rect.min.x + corner_radius,
            title_bar_rect.min.y + corner_radius,
        ),
        corner_radius,
        title_bar_color,
    );
    ui.painter().circle_filled(
        eframe::egui::pos2(
            title_bar_rect.max.x - corner_radius,
            title_bar_rect.min.y + corner_radius,
        ),
        corner_radius,
        title_bar_color,
    );

    let top_rect = Rect::from_min_max(
        egui::pos2(title_bar_rect.min.x + corner_radius, title_bar_rect.min.y),
        egui::pos2(
            title_bar_rect.max.x - corner_radius,
            title_bar_rect.min.y + corner_radius,
        ),
    );
    ui.painter().rect_filled(top_rect, 0.0, title_bar_color);

    // Title text (left side)
    ui.painter().text(
        title_bar_rect.left_center() + Vec2::new(8.0, 0.0),
        egui::Align2::LEFT_CENTER,
        "BPTimer Desktop Companion",
        egui::FontId::proportional(12.0),
        text_color,
    );

    let button_size = 16.0;
    let button_padding = 4.0;
    let mut button_offset = button_padding;

    // Close button (rightmost)
    let close_btn_rect = Rect::from_min_size(
        title_bar_rect.right_top() + Vec2::new(-button_size - button_offset, button_padding),
        Vec2::splat(button_size),
    );

    let close_response = ui.interact(close_btn_rect, ui.id().with("close"), egui::Sense::click());

    ui.painter().rect_filled(
        close_btn_rect,
        3.0,
        if close_response.hovered() {
            Color32::from_rgb(200, 50, 50)
        } else {
            Color32::from_rgba_unmultiplied(100, 100, 100, 100)
        },
    );

    ui.painter().text(
        close_btn_rect.center(),
        egui::Align2::CENTER_CENTER,
        egui_material_icons::icons::ICON_CLOSE,
        egui::FontId::proportional(14.0),
        text_color,
    );

    if close_response.clicked() {
        ctx.send_viewport_cmd(egui::ViewportCommand::Close);
    }

    button_offset += button_size + button_padding;

    // Minimize button
    let minimize_btn_rect = Rect::from_min_size(
        title_bar_rect.right_top() + Vec2::new(-button_size - button_offset, button_padding),
        Vec2::splat(button_size),
    );

    let minimize_response = ui.interact(
        minimize_btn_rect,
        ui.id().with("minimize"),
        egui::Sense::click(),
    );

    ui.painter().rect_filled(
        minimize_btn_rect,
        3.0,
        if minimize_response.hovered() {
            Color32::from_rgba_unmultiplied(150, 150, 150, 150)
        } else {
            Color32::from_rgba_unmultiplied(100, 100, 100, 100)
        },
    );

    ui.painter().text(
        minimize_btn_rect.center(),
        egui::Align2::CENTER_CENTER,
        egui_material_icons::icons::ICON_REMOVE,
        egui::FontId::proportional(14.0),
        text_color,
    );

    if minimize_response.clicked() {
        ctx.send_viewport_cmd(egui::ViewportCommand::Minimized(true));
    }

    minimize_response.on_hover_text("Minimize");

    button_offset += button_size + button_padding;

    // Settings button - toggles between Settings and Home
    let settings_btn_rect = Rect::from_min_size(
        title_bar_rect.right_top() + Vec2::new(-button_size - button_offset, button_padding),
        Vec2::splat(button_size),
    );

    let settings_response = ui.interact(
        settings_btn_rect,
        ui.id().with("settings"),
        egui::Sense::click(),
    );

    ui.painter().rect_filled(
        settings_btn_rect,
        3.0,
        if settings_response.hovered() {
            Color32::from_rgba_unmultiplied(150, 150, 150, 150)
        } else {
            Color32::from_rgba_unmultiplied(100, 100, 100, 100)
        },
    );

    let settings_icon = if *view_mode == ViewMode::Settings {
        egui_material_icons::icons::ICON_HOME
    } else {
        egui_material_icons::icons::ICON_SETTINGS
    };

    ui.painter().text(
        settings_btn_rect.center(),
        egui::Align2::CENTER_CENTER,
        settings_icon,
        egui::FontId::proportional(14.0),
        text_color,
    );

    if settings_response.clicked() {
        if *view_mode == ViewMode::Settings {
            if show_radar || show_mob_timers {
                *view_mode = ViewMode::Bosses;
            } else {
                *view_mode = ViewMode::Combat;
            }
        } else {
            *view_mode = ViewMode::Settings;
        }
    }

    settings_response.on_hover_text(if *view_mode == ViewMode::Settings {
        "Back to Home"
    } else {
        "Settings"
    });

    button_offset += button_size + button_padding;

    // Refresh button
    let refresh_btn_rect = Rect::from_min_size(
        title_bar_rect.right_top() + Vec2::new(-button_size - button_offset, button_padding),
        Vec2::splat(button_size),
    );

    let refresh_response = ui.interact(
        refresh_btn_rect,
        ui.id().with("refresh"),
        egui::Sense::click(),
    );

    ui.painter().rect_filled(
        refresh_btn_rect,
        3.0,
        if refresh_response.hovered() {
            Color32::from_rgba_unmultiplied(150, 150, 150, 150)
        } else {
            Color32::from_rgba_unmultiplied(100, 100, 100, 100)
        },
    );

    ui.painter().text(
        refresh_btn_rect.center(),
        egui::Align2::CENTER_CENTER,
        egui_material_icons::icons::ICON_REFRESH,
        egui::FontId::proportional(14.0),
        text_color,
    );

    if refresh_response.clicked() {
        *dps_value = 0.0;
        *total_damage = 0.0;
        *max_dps = 0.0;
        *dps_history = vec![0.0; 600];
        player_stats.clear();
    }

    refresh_response.on_hover_text("Reset Stats");

    button_offset += button_size + button_padding;

    // Click-through button (mouse icon)
    let click_through_btn_rect = Rect::from_min_size(
        title_bar_rect.right_top() + Vec2::new(-button_size - button_offset, button_padding),
        Vec2::splat(button_size),
    );

    let click_through_response = ui.interact(
        click_through_btn_rect,
        ui.id().with("click_through"),
        egui::Sense::click(),
    );

    ui.painter().rect_filled(
        click_through_btn_rect,
        3.0,
        if click_through_response.hovered() {
            Color32::from_rgba_unmultiplied(150, 150, 150, 150)
        } else {
            Color32::from_rgba_unmultiplied(100, 100, 100, 100)
        },
    );

    ui.painter().text(
        click_through_btn_rect.center(),
        egui::Align2::CENTER_CENTER,
        egui_material_icons::icons::ICON_TOUCH_APP,
        egui::FontId::proportional(14.0),
        if *click_through {
            Color32::from_rgb(100, 150, 255)
        } else {
            text_color
        },
    );

    if click_through_response.clicked() {
        *click_through = !*click_through;
    }

    click_through_response.on_hover_text("Toggle Click-Through (Ctrl+Shift+L)");

    button_offset += button_size + button_padding;

    // Lock position button
    let lock_btn_rect = Rect::from_min_size(
        title_bar_rect.right_top() + Vec2::new(-button_size - button_offset, button_padding),
        Vec2::splat(button_size),
    );

    let lock_response = ui.interact(lock_btn_rect, ui.id().with("lock"), egui::Sense::click());

    ui.painter().rect_filled(
        lock_btn_rect,
        3.0,
        if lock_response.hovered() {
            Color32::from_rgba_unmultiplied(150, 150, 150, 150)
        } else {
            Color32::from_rgba_unmultiplied(100, 100, 100, 100)
        },
    );

    let lock_icon = if *window_locked {
        egui_material_icons::icons::ICON_LOCK
    } else {
        egui_material_icons::icons::ICON_LOCK_OPEN
    };

    ui.painter().text(
        lock_btn_rect.center(),
        egui::Align2::CENTER_CENTER,
        lock_icon,
        egui::FontId::proportional(14.0),
        text_color,
    );

    if lock_response.clicked() {
        *window_locked = !*window_locked;
    }

    lock_response.on_hover_text(if *window_locked {
        "Unlock Window Position"
    } else {
        "Lock Window Position"
    });

    button_offset += button_size + button_padding;

    // Open BPTimer button
    let bptimer_btn_rect = Rect::from_min_size(
        title_bar_rect.right_top() + Vec2::new(-button_size - button_offset, button_padding),
        Vec2::splat(button_size),
    );

    let bptimer_response = ui.interact(
        bptimer_btn_rect,
        ui.id().with("bptimer"),
        egui::Sense::click(),
    );

    ui.painter().rect_filled(
        bptimer_btn_rect,
        3.0,
        if bptimer_response.hovered() {
            Color32::from_rgba_unmultiplied(150, 150, 150, 150)
        } else {
            Color32::from_rgba_unmultiplied(100, 100, 100, 100)
        },
    );

    ui.painter().text(
        bptimer_btn_rect.center(),
        egui::Align2::CENTER_CENTER,
        egui_material_icons::icons::ICON_OPEN_IN_NEW,
        egui::FontId::proportional(14.0),
        text_color,
    );

    if bptimer_response.clicked() {
        if let Err(e) = open::that(crate::utils::constants::BPTIMER_BASE_URL) {
            log::warn!("Failed to open BPTimer website: {}", e);
        }
    }

    bptimer_response.on_hover_text("Open BPTimer");

    button_offset += button_size + button_padding;

    // Combat button
    if show_combat_data {
        let combat_btn_rect = Rect::from_min_size(
            title_bar_rect.right_top() + Vec2::new(-button_size - button_offset, button_padding),
            Vec2::splat(button_size),
        );
        let combat_response = ui.interact(
            combat_btn_rect,
            ui.id().with("combat"),
            egui::Sense::click(),
        );
        let is_combat_active = *view_mode == ViewMode::Combat;

        ui.painter().rect_filled(
            combat_btn_rect,
            3.0,
            if is_combat_active {
                Color32::from_rgba_unmultiplied(150, 100, 100, 200)
            } else if combat_response.hovered() {
                Color32::from_rgba_unmultiplied(150, 150, 150, 150)
            } else {
                Color32::from_rgba_unmultiplied(100, 100, 100, 100)
            },
        );

        ui.painter().text(
            combat_btn_rect.center(),
            egui::Align2::CENTER_CENTER,
            egui_material_icons::icons::ICON_SWORDS,
            egui::FontId::proportional(14.0),
            text_color,
        );

        if combat_response.clicked() {
            *view_mode = ViewMode::Combat;
        }

        combat_response.on_hover_text("Combat");

        button_offset += button_size + button_padding;
    }

    // Bosses button
    if show_radar || show_mob_timers {
        let bosses_btn_rect = Rect::from_min_size(
            title_bar_rect.right_top() + Vec2::new(-button_size - button_offset, button_padding),
            Vec2::splat(button_size),
        );
        let bosses_response = ui.interact(
            bosses_btn_rect,
            ui.id().with("bosses"),
            egui::Sense::click(),
        );
        let is_bosses_active = *view_mode == ViewMode::Bosses;

        ui.painter().rect_filled(
            bosses_btn_rect,
            3.0,
            if is_bosses_active {
                Color32::from_rgba_unmultiplied(100, 150, 100, 200)
            } else if bosses_response.hovered() {
                Color32::from_rgba_unmultiplied(150, 150, 150, 150)
            } else {
                Color32::from_rgba_unmultiplied(100, 100, 100, 100)
            },
        );

        ui.painter().text(
            bosses_btn_rect.center(),
            egui::Align2::CENTER_CENTER,
            egui_material_icons::icons::ICON_RADAR,
            egui::FontId::proportional(14.0),
            text_color,
        );

        if bosses_response.clicked() {
            *view_mode = ViewMode::Bosses;
        }

        bosses_response.on_hover_text("Mobs");

        button_offset += button_size + button_padding;
    }

    let drag_area_rect = Rect::from_min_max(
        title_bar_rect.min,
        egui::pos2(
            title_bar_rect.right_top().x - button_offset,
            title_bar_rect.max.y,
        ),
    );

    if !*click_through && !*window_locked {
        let drag_response = ui.allocate_rect(drag_area_rect, egui::Sense::drag());

        if drag_response.drag_started_by(egui::PointerButton::Primary) {
            ctx.send_viewport_cmd(egui::ViewportCommand::StartDrag);
        }
    }
}
