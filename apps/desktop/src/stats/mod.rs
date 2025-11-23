pub mod calculator;
pub mod processor;

pub use calculator::update_realtime_dps;
pub use processor::{process_damage_hit, process_damage_taken_hit, process_healing_hit};

// Stats calculation constants
pub const DAMAGE_WINDOW_MAX_SIZE: usize = 1000;
pub const DAMAGE_WINDOW_RETENTION_SECS: f64 = 2.0;
pub const DPS_WINDOW_SECS: f64 = 1.0;
pub const DPS_HISTORY_INDEX: usize = 599;
