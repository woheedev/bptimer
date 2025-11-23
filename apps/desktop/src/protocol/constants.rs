/// Blue Protocol protocol constants and types
/// Protocol-level constants not part of protobuf definitions

/// Service UUID for Blue Protocol combat service
pub const SERVICE_UUID: u64 = 0x63335342;

/// Message type enumeration
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
#[repr(u16)]
pub enum MessageType {
    None = 0,
    Call = 1,
    Notify = 2,
    Return = 3,
    Echo = 4,
    FrameUp = 5,
    FrameDown = 6,
}

impl MessageType {
    pub fn from_u16(value: u16) -> Self {
        match value {
            0 => MessageType::None,
            1 => MessageType::Call,
            2 => MessageType::Notify,
            3 => MessageType::Return,
            4 => MessageType::Echo,
            5 => MessageType::FrameUp,
            6 => MessageType::FrameDown,
            _ => MessageType::None,
        }
    }
}

/// RPC method ID enumeration
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
#[repr(u32)]
pub enum MessageMethod {
    SyncNearEntities = 0x00000006,
    SyncContainerData = 0x00000015,
    SyncContainerDirtyData = 0x00000016,
    SyncServerTime = 0x0000002B,
    SyncNearDeltaInfo = 0x0000002D,
    SyncToMeDeltaInfo = 0x0000002E,
}

impl MessageMethod {
    pub fn from_u32(value: u32) -> Option<Self> {
        match value {
            0x00000006 => Some(MessageMethod::SyncNearEntities),
            0x00000015 => Some(MessageMethod::SyncContainerData),
            0x00000016 => Some(MessageMethod::SyncContainerDirtyData),
            0x0000002B => Some(MessageMethod::SyncServerTime),
            0x0000002D => Some(MessageMethod::SyncNearDeltaInfo),
            0x0000002E => Some(MessageMethod::SyncToMeDeltaInfo),
            _ => None,
        }
    }
}

/// Packet type parsing constants
pub mod packet {
    /// Compression flag mask (bit 15 indicates zstd compression)
    pub const COMPRESSION_FLAG: u16 = 0x8000;

    /// Message type mask (lower 15 bits contain the actual message type)
    pub const TYPE_MASK: u16 = 0x7FFF;

    #[inline]
    pub fn is_compressed(packet_type: u16) -> bool {
        (packet_type & COMPRESSION_FLAG) != 0
    }

    #[inline]
    pub fn extract_type(packet_type: u16) -> u16 {
        packet_type & TYPE_MASK
    }
}

/// Packet structure offsets and layout
pub mod packet_layout {
    /// Server signature offset within packet data (for detection)
    pub const SERVER_SIGNATURE_OFFSET: usize = 5;
}

/// Entity type constants for UUID parsing
pub mod entity {
    /// Player entity type identifier (UUID format: player_uid << 16 | entity_type)
    pub const TYPE_PLAYER: u16 = 640;

    /// Entity type mask (lower 16 bits of UUID)
    pub const TYPE_MASK: u16 = 0xFFFF;

    #[inline]
    pub fn is_player(uuid: i64) -> bool {
        (uuid as u16 & TYPE_MASK) == TYPE_PLAYER
    }

    /// Extract player UID from UUID (upper 48 bits)
    #[inline]
    pub fn get_player_uid(uuid: i64) -> i64 {
        uuid >> 16
    }
}

/// Server detection signatures and constants
pub mod server_detection {
    /// Server signature pattern: [0x00, 0x63, 0x33, 0x53, 0x42, 0x00] (ASCII: "c3SB")
    pub const SERVER_SIGNATURE: &[u8] = &[0x00, 0x63, 0x33, 0x53, 0x42, 0x00];

    pub const LOGIN_RETURN_SIGNATURE: &[u8] = &[
        0x00, 0x00, 0x00, 0x62, 0x00, 0x03, 0x00, 0x00, 0x00, 0x01, 0x00, 0x11, 0x45, 0x14, 0x00,
        0x00, 0x00, 0x00, 0x0a, 0x4e, 0x08, 0x01, 0x22, 0x24,
    ];

    /// Size of login return signature packets (0x62 = 98 bytes)
    pub const LOGIN_RETURN_SIGNATURE_SIZE: usize = 0x62;
}

/// TCP stream processing constants
pub mod tcp {
    use std::time::Duration;

    pub const GAP_TIMEOUT: Duration = Duration::from_secs(2);
    pub const IDLE_TIMEOUT: Duration = Duration::from_secs(10);
}

/// Entity attribute type enumeration
/// Used for parsing SyncNearEntities message attributes
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
#[repr(u32)]
pub enum AttrType {
    AttrName = 0x01,
    AttrId = 0x0A,
    AttrHp = 0x2C2E,
    AttrMaxHp = 0x2C38,
}
