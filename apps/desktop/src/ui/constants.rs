use egui::{Color32, Stroke, Ui};

/// Spacing constants for consistent UI layout
/// Only includes values that are actually used in the UI
pub mod spacing {
    pub const XS: f32 = 2.0; // Extra small spacing
    pub const SM: f32 = 5.0; // Small spacing (most common)
    pub const MD: f32 = 10.0; // Medium spacing (most common)
    pub const LG: f32 = 20.0; // Large spacing (for empty states, etc.)
}

/// UI styling helpers
pub mod style {
    use super::*;

    /// Create a styled group frame (for settings sections, etc.)
    pub fn group_frame(ui: &Ui) -> egui::Frame {
        egui::Frame::group(ui.style())
            .stroke(Stroke::new(1.0, Color32::from_gray(60)))
            .corner_radius(8.0)
            .inner_margin(12.0)
    }

    /// Create a styled card frame (for mob cards, etc.)
    pub fn card_frame(ui: &Ui) -> egui::Frame {
        egui::Frame::group(ui.style())
            .stroke(Stroke::new(1.0, Color32::from_gray(60)))
            .corner_radius(8.0)
            .inner_margin(12.0)
    }
}

/// Theme/color helpers that use settings text_color
pub mod theme {
    use super::*;
    use crate::config::Settings;

    /// Get the text color from settings
    pub fn text_color(settings: &Settings) -> Color32 {
        Color32::from_rgba_unmultiplied(
            settings.text_color[0],
            settings.text_color[1],
            settings.text_color[2],
            settings.text_color[3],
        )
    }
}

/// Responsive layout helpers
pub mod responsive {
    use super::*;

    /// Create a ScrollArea with reserved space for footer/other elements
    pub fn scroll_area_with_reserve(ui: &Ui, reserve_height: f32) -> egui::ScrollArea {
        egui::ScrollArea::vertical().max_height(ui.available_height() - reserve_height)
    }

    /// Center content horizontally in available width
    pub fn center_horizontal(ui: &mut Ui, content_width: f32, f: impl FnOnce(&mut Ui)) {
        let available_width = ui.available_width();
        let padding = (available_width - content_width) / 2.0;

        ui.horizontal(|ui| {
            ui.add_space(padding.max(0.0));
            f(ui);
        });
    }
}

/// UI layout constants
pub mod layout {
    pub const TITLE_BAR_HEIGHT: f32 = 24.0;
    pub const CORNER_RADIUS: f32 = 8.0;
    pub const CONTENT_PADDING: f32 = 10.0;
}

/// UI color constants
pub mod colors {
    pub const BG_RGB: [u8; 3] = [15, 15, 15];
    pub const OPACITY_MULTIPLIER: f32 = 255.0;
}

/// UI timing constants (in milliseconds)
pub mod timing {
    pub const SETTINGS_SAVE_DEBOUNCE_MS: u128 = 500;
    pub const HOTKEY_DEBOUNCE_MS: u128 = 100;
}

/// Window size constants
pub mod window {
    pub const DEFAULT_WIDTH: f32 = 400.0;
    pub const DEFAULT_HEIGHT: f32 = 300.0;
    pub const MIN_WIDTH: f32 = 250.0;
    pub const MIN_HEIGHT: f32 = 150.0;
    pub const RESIZE_BORDER_SIZE: f32 = 4.0;
    pub const RESIZE_CORNER_SIZE: f32 = 12.0;
}

/// App constants
pub mod app {
    pub const DPS_HISTORY_SIZE: usize = 600;
}

/// Player table constants
pub mod player_table {
    pub const ROW_HEIGHT: f32 = 16.0;
    pub const ICON_SIZE: f32 = 16.0;
    pub const ICON_NAME_SPACING: f32 = 4.0;
}

/// Radar view constants
pub mod radar {
    use super::Color32;

    pub const SIZE: f32 = 100.0;
    pub const CLAMP_DISTANCE: f32 = 50.0;
    pub const PLAYER_COLOR: Color32 = Color32::from_rgb(100, 200, 255);
    pub const MOB_COLOR: Color32 = Color32::from_rgb(255, 100, 100);
    pub const MOB_COLOR_EDGE_RGBA: [u8; 4] = [255, 150, 150, 200];
    pub const GRID_COLOR_RGBA: [u8; 4] = [100, 100, 100, 100];
    pub const BG_COLOR_RGBA: [u8; 4] = [20, 20, 20, 200];

    pub const PLAYER_RADIUS: f32 = 5.0;
    pub const MOB_RADIUS: f32 = 4.0;
    pub const INDICATOR_OFFSET: f32 = 6.0;
    pub const INNER_PADDING: f32 = 10.0;
    pub const STROKE_WIDTH: f32 = 2.0;
    pub const GRID_STROKE_WIDTH: f32 = 1.0;

    pub const IDLE_TIMEOUT_SECS: u64 = 60;
}
