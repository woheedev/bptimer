/// Individual damage hit
#[derive(Debug, Clone)]
pub struct DamageHit {
    pub player_uid: i64,
    pub damage: i64,
    pub is_crit: bool,
    pub is_lucky: bool,
}

/// Individual healing hit
#[derive(Debug, Clone)]
pub struct HealingHit {
    pub player_uid: i64,
    pub healing: i64,
    pub is_crit: bool,
    pub is_lucky: bool,
}

/// Individual damage taken hit
#[derive(Debug, Clone)]
pub struct DamageTakenHit {
    pub player_uid: i64,
    pub hp_lessen: i64,
    pub is_miss: bool,
    pub is_dead: bool,
}

/// Player name update event
#[derive(Debug, Clone)]
pub struct PlayerNameUpdate {
    pub player_uid: i64,
    pub name: String,
}

/// Entity position update event
#[derive(Debug, Clone)]
pub struct EntityPositionUpdate {
    pub uuid: i64,
    pub entity_type: EntityType,
    pub position: Position,
    pub mob_base_id: Option<u32>, // Only set for monsters (None for players/NPCs)
    pub current_hp: Option<u64>,  // Current HP (if available)
    pub max_hp: Option<u64>,      // Max HP (if available)
}

/// Local player position update event
#[derive(Debug, Clone)]
pub struct LocalPlayerPositionUpdate {
    pub position: Position,
}

/// Position data
#[derive(Debug, Clone, Copy)]
pub struct Position {
    pub x: f32,
    pub y: f32,
    pub z: f32,
}

/// Entity type
#[derive(Debug, Clone, PartialEq)]
pub enum EntityType {
    Player,
    Monster,
}

/// Server change event
#[derive(Debug, Clone)]
pub struct ServerChangeUpdate {
    pub server_endpoint: String,
}

/// Player account info update event (account_id and uid)
#[derive(Debug, Clone)]
pub struct PlayerAccountInfoUpdate {
    pub account_id: String,
    pub uid: i64,
}

/// Player line ID update event (from SyncContainerData.scene_data.line_id)
#[derive(Debug, Clone)]
pub struct PlayerLineInfoUpdate {
    pub line_id: u32,
}

/// Module data update event (extracted modules from SyncContainerData)
#[derive(Debug, Clone)]
pub struct ModuleDataUpdate {
    pub modules: Vec<crate::utils::modules::Module>,
}

/// Player class update event
#[derive(Debug, Clone)]
pub struct PlayerClassUpdate {
    pub player_uid: i64,
    pub class_id: i32,
}

/// Player ability score update event
#[derive(Debug, Clone)]
pub struct PlayerAbilityScoreUpdate {
    pub player_uid: i64,
    pub ability_score: i32,
}

/// Combat event enum
#[derive(Debug, Clone)]
pub enum CombatEvent {
    Damage(DamageHit),
    Healing(HealingHit),
    DamageTaken(DamageTakenHit),
    PlayerName(PlayerNameUpdate),
    ServerChange(ServerChangeUpdate),
    EntityPosition(EntityPositionUpdate),
    LocalPlayerPosition(LocalPlayerPositionUpdate),
    PlayerAccountInfo(PlayerAccountInfoUpdate),
    PlayerLineInfo(PlayerLineInfoUpdate),
    ModuleData(ModuleDataUpdate),
    PlayerClass(PlayerClassUpdate),
    PlayerAbilityScore(PlayerAbilityScoreUpdate),
}
