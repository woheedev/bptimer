use crate::models::events::{DamageHit, DamageTakenHit, HealingHit};
use crate::models::{DamageEntry, DamageTakenEntry, HealingEntry, PlayerStats};
use crate::stats::{DAMAGE_WINDOW_MAX_SIZE, DAMAGE_WINDOW_RETENTION_SECS};
use instant::Instant;

pub fn process_damage_hit(
    stats: &mut PlayerStats,
    total_damage: &mut f32,
    hit: DamageHit,
    cutoff_seconds: f32,
) {
    let now = Instant::now();
    let value = hit.damage as f32;

    if let Some(last) = stats.last_damage_time {
        if now.duration_since(last).as_secs_f32() > cutoff_seconds {
            stats.first_damage_time = None;
            stats.last_damage_time = None;
            stats.dps_session_start_damage = stats.total_damage;
        }
    }

    if stats.first_damage_time.is_none() {
        stats.first_damage_time = Some(now);
    }
    stats.last_damage_time = Some(now);

    *total_damage += value;
    stats.total_damage += value;
    stats.total_hits += 1;

    if value > stats.max_single_hit {
        stats.max_single_hit = value;
    }

    if hit.is_crit && hit.is_lucky {
        stats.crit_lucky_damage += value;
        stats.crit_lucky_hits += 1;
    } else if hit.is_crit {
        stats.critical_damage += value;
        stats.critical_hits += 1;
    } else if hit.is_lucky {
        stats.lucky_damage += value;
        stats.lucky_hits += 1;
    } else {
        stats.normal_damage += value;
        stats.normal_hits += 1;
    }

    stats.damage_window.push(DamageEntry {
        timestamp: now,
        damage: hit.damage,
    });

    if stats.damage_window.len() > DAMAGE_WINDOW_MAX_SIZE {
        stats.damage_window.retain(|e| {
            now.duration_since(e.timestamp).as_secs_f64() < DAMAGE_WINDOW_RETENTION_SECS
        });
    }
}

pub fn process_healing_hit(stats: &mut PlayerStats, hit: HealingHit) {
    let now = Instant::now();
    let value = hit.healing as f32;

    if stats.first_healing_time.is_none() {
        stats.first_healing_time = Some(now);
    }
    stats.last_healing_time = Some(now);

    stats.total_healing += value;
    stats.total_heals += 1;

    if value > stats.max_single_heal {
        stats.max_single_heal = value;
    }

    if hit.is_crit && hit.is_lucky {
        stats.crit_lucky_healing += value;
        stats.crit_lucky_heals += 1;
    } else if hit.is_crit {
        stats.critical_healing += value;
        stats.critical_heals += 1;
    } else if hit.is_lucky {
        stats.lucky_healing += value;
        stats.lucky_heals += 1;
    } else {
        stats.normal_healing += value;
    }

    stats.healing_window.push(HealingEntry {
        timestamp: now,
        healing: hit.healing,
    });
}

pub fn process_damage_taken_hit(stats: &mut PlayerStats, hit: DamageTakenHit) {
    let now = Instant::now();

    if hit.is_miss {
        stats.miss_count += 1;
        return;
    }

    if hit.is_dead {
        stats.death_count += 1;
    }

    if stats.first_damage_taken_time.is_none() {
        stats.first_damage_taken_time = Some(now);
    }
    stats.last_damage_taken_time = Some(now);

    let actual_damage = hit.hp_lessen as f32;
    stats.total_damage_taken += actual_damage;
    stats.total_hits_taken += 1;

    if actual_damage > stats.max_single_hit_taken {
        stats.max_single_hit_taken = actual_damage;
    }

    stats.damage_taken_window.push(DamageTakenEntry {
        timestamp: now,
        damage: hit.hp_lessen,
    });
}
