use crate::models::PlayerStats;
use egui::{Color32, Ui};
use egui_plot::{Line, Plot, PlotPoints};

fn smooth_dps_history(history: &[f32], window_size: usize) -> Vec<f32> {
    if history.is_empty() {
        return Vec::new();
    }

    let window_size = window_size.max(1).min(history.len());
    let half_window = window_size / 2;
    let mut smoothed = Vec::with_capacity(history.len());

    for i in 0..history.len() {
        let start = i.saturating_sub(half_window);
        let end = (i + half_window + 1).min(history.len());

        let mut weighted_sum = 0.0;
        let mut weight_sum = 0.0;

        for (j, &value) in history[start..end].iter().enumerate() {
            let center_idx = start + j;
            let distance = (center_idx as i32 - i as i32).abs() as f32;
            let sigma = (half_window as f32) / 2.0;
            let weight = (-(distance * distance) / (2.0 * sigma * sigma)).exp();
            weighted_sum += value * weight;
            weight_sum += weight;
        }

        smoothed.push(if weight_sum > 0.0 {
            weighted_sum / weight_sum
        } else {
            0.0
        });
    }

    smoothed
}

pub fn render_dps_graph(ui: &mut Ui, player: &PlayerStats, text_color: Color32) {
    let smoothed_history = smooth_dps_history(&player.dps_history, 20);

    let points_data: Vec<[f64; 2]> = smoothed_history
        .iter()
        .enumerate()
        .map(|(i, &dps)| [i as f64, dps as f64])
        .collect();

    let points = PlotPoints::new(points_data.clone());

    let y_max = if !smoothed_history.is_empty() {
        let max_y = smoothed_history.iter().copied().fold(0.0f32, f32::max) as f64;
        let range_y = max_y - 0.0;
        if range_y == 0.0 {
            100.0
        } else {
            (range_y * 1.15).max(100.0)
        }
    } else if player.max_dps > 0.0 {
        ((player.max_dps as f64) * 1.15).max(100.0)
    } else {
        100.0
    };

    Plot::new(format!("player_dps_{}", player.uid))
        .height(16.0)
        .width(100.0)
        .view_aspect(2.0)
        .include_y(0.0)
        .include_y(y_max)
        .show_axes(false)
        .show_background(false)
        .allow_zoom(false)
        .allow_drag(false)
        .allow_scroll(false)
        .show_grid(false)
        .show(ui, |plot_ui| {
            let main_line = Line::new("", points)
                .color(text_color)
                .width(2.0)
                .fill(0.0)
                .fill_alpha(0.3);
            plot_ui.line(main_line);
        });
}
