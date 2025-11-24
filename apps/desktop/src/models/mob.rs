use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Mob {
    pub id: String,
    pub uid: i32,
    pub name: String,
    pub r#type: String, // "boss" or "magical_creature"
    pub map: String,    // Relation to map collection
    #[serde(rename = "respawn_time")]
    pub respawn_time: Option<i32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub icon_name: Option<String>,
    #[serde(skip)]
    pub total_channels: i32,
    #[serde(rename = "latestChannels", skip_serializing_if = "Option::is_none")]
    pub latest_channels: Option<Vec<MobChannel>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MobChannel {
    pub channel: i32,
    pub status: String, // "alive", "dead", "unknown"
    pub hp_percentage: f32,
    #[serde(rename = "last_updated", skip_serializing_if = "Option::is_none")]
    pub last_updated: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub location_image: Option<i32>,
}
