use crate::models::PlayerStats;
use crate::stats::{DPS_HISTORY_INDEX, DPS_WINDOW_SECS};
use instant::Instant;

pub fn update_realtime_dps(
    player_stats: &mut std::collections::HashMap<i64, PlayerStats>,
    dps_value: &mut f32,
    max_dps: &mut f32,
    dps_history: &mut Vec<f32>,
) {
    let now = Instant::now();
    let mut total_dps = 0.0;

    for (_player_uid, stats) in player_stats.iter_mut() {
        stats
            .damage_window
            .retain(|e| now.duration_since(e.timestamp).as_secs_f64() < DPS_WINDOW_SECS);

        let player_dps: i64 = stats.damage_window.iter().map(|e| e.damage).sum();
        let player_dps_f32 = player_dps as f32;

        stats.current_dps = player_dps_f32;
        if player_dps_f32 > stats.max_dps {
            stats.max_dps = player_dps_f32;
        }

        stats
            .healing_window
            .retain(|e| now.duration_since(e.timestamp).as_secs_f64() < DPS_WINDOW_SECS);

        let player_hps: i64 = stats.healing_window.iter().map(|e| e.healing).sum();
        let player_hps_f32 = player_hps as f32;

        stats.current_hps = player_hps_f32;
        if player_hps_f32 > stats.max_hps {
            stats.max_hps = player_hps_f32;
        }

        stats
            .damage_taken_window
            .retain(|e| now.duration_since(e.timestamp).as_secs_f64() < DPS_WINDOW_SECS);

        let player_dtps: i64 = stats.damage_taken_window.iter().map(|e| e.damage).sum();
        let player_dtps_f32 = player_dtps as f32;

        stats.current_dtps = player_dtps_f32;
        if player_dtps_f32 > stats.max_dtps {
            stats.max_dtps = player_dtps_f32;
        }

        stats.dps_history.rotate_left(1);
        stats.dps_history[DPS_HISTORY_INDEX] = player_dps_f32;

        total_dps += player_dps_f32;
    }

    *dps_value = total_dps;
    if total_dps > *max_dps {
        *max_dps = total_dps;
    }

    dps_history.rotate_left(1);
    dps_history[DPS_HISTORY_INDEX] = total_dps;
}
