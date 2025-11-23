use crate::models::events::Position;

#[derive(Debug, Clone)]
pub struct RadarMob {
    pub name: String,
    pub position: Position,
    pub current_hp: Option<u64>,
    pub max_hp: Option<u64>,
}

impl RadarMob {
    /// Calculate HP percentage (0-100), rounded to nearest integer
    /// Returns None if HP data is not available
    pub fn hp_percentage(&self) -> Option<u32> {
        match (self.current_hp, self.max_hp) {
            (Some(current), Some(max)) if max > 0 => {
                let percentage = (current as f32 / max as f32) * 100.0;
                Some(percentage.round() as u32)
            }
            _ => None,
        }
    }
}

#[derive(Debug, Clone, Default)]
pub struct RadarState {
    pub player_position: Option<Position>,
    pub tracked_mobs: std::collections::HashMap<u32, RadarMob>,
    pub uuid_to_base_id: std::collections::HashMap<i64, u32>, // Map UUID to base_id for delta updates
}

impl RadarState {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn update_player_position(&mut self, position: Position) {
        self.player_position = Some(position);
    }

    pub fn update_mob_position(
        &mut self,
        mob_id: u32,
        name: String,
        position: Position,
        current_hp: Option<u64>,
        max_hp: Option<u64>,
    ) {
        // If mob already exists, update it; otherwise create new entry
        if let Some(mob) = self.tracked_mobs.get_mut(&mob_id) {
            mob.position = position;
            // Always update current_hp if provided (even if None, to clear stale data)
            // But preserve max_hp if update doesn't include it
            if current_hp.is_some() || max_hp.is_some() {
                // Only update if we have new data
                if current_hp.is_some() {
                    mob.current_hp = current_hp;
                }
                if max_hp.is_some() {
                    mob.max_hp = max_hp;
                }
            }
            // Preserve existing HP if update doesn't include it (for death detection)
        } else {
            self.tracked_mobs.insert(
                mob_id,
                RadarMob {
                    name,
                    position,
                    current_hp,
                    max_hp,
                },
            );
        }
    }

    /// Update HP only (for HP-only updates when position doesn't change)
    /// Returns true if mob was updated, false if mob doesn't exist
    pub fn update_mob_hp(
        &mut self,
        mob_id: u32,
        current_hp: Option<u64>,
        max_hp: Option<u64>,
    ) -> bool {
        if let Some(mob) = self.tracked_mobs.get_mut(&mob_id) {
            if current_hp.is_some() {
                mob.current_hp = current_hp;
            }
            if max_hp.is_some() {
                mob.max_hp = max_hp;
            }
            true
        } else {
            false
        }
    }

    pub fn remove_mob(&mut self, mob_id: u32) {
        self.tracked_mobs.remove(&mob_id);
    }

    pub fn register_mob_uuid(&mut self, uuid: i64, base_id: u32) {
        self.uuid_to_base_id.insert(uuid, base_id);
    }

    pub fn clear(&mut self) {
        self.player_position = None;
        self.tracked_mobs.clear();
        self.uuid_to_base_id.clear();
    }
}
