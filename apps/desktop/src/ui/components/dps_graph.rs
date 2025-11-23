use crate::models::PlayerStats;
use egui::{Color32, Ui};
use egui_plot::{Line, Plot, PlotPoints};

pub fn render_dps_graph(ui: &mut Ui, player: &PlayerStats, text_color: Color32) {
    let points_data: Vec<[f64; 2]> = player
        .dps_history
        .iter()
        .enumerate()
        .map(|(i, &dps)| [i as f64, dps as f64])
        .collect();

    let points = PlotPoints::new(points_data.clone());

    let mut sorted_dps: Vec<f32> = player
        .dps_history
        .iter()
        .copied()
        .filter(|&x| x > 0.0)
        .collect();
    sorted_dps.sort_by(|a, b| a.partial_cmp(b).unwrap());

    let y_max = if !sorted_dps.is_empty() {
        let percentile_idx = (((sorted_dps.len() - 1) as f32) * 0.95) as usize;
        let percentile_95 = sorted_dps[percentile_idx.min(sorted_dps.len() - 1)] as f64;

        let current_max = player.dps_history.iter().copied().fold(0.0f32, f32::max) as f64;
        let max_dps_ref = (player.max_dps as f64) * 0.8;

        let base = percentile_95.max(max_dps_ref).max(current_max);
        (base * 1.2).max(100.0)
    } else if player.max_dps > 0.0 {
        ((player.max_dps as f64) * 1.2).max(100.0)
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
