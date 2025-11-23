use bytes::Bytes;
use prost::Message;
use std::convert::TryFrom;
use std::sync::mpsc;

use crate::capture::tcp::ServerEndpoint;
use crate::models::events::{
    CombatEvent, DamageHit, DamageTakenHit, EntityPositionUpdate, HealingHit,
    LocalPlayerPositionUpdate, ModuleDataUpdate, PlayerAccountInfoUpdate, PlayerLineInfoUpdate,
    PlayerNameUpdate,
};
use crate::protocol::constants::{
    MessageMethod, MessageType, SERVICE_UUID, entity, packet, packet_layout, server_detection,
};
use crate::protocol::pb::{
    AoiSyncDelta, AttrCollection, EDamageType, EEntityType, Position, SyncContainerData,
    SyncNearDeltaInfo, SyncNearEntities, SyncToMeDeltaInfo,
};

/// Global state for local player tracking
static mut LOCAL_PLAYER_UUID: i64 = 0;

/// Global UUID -> base_id mapping for mobs (populated when mobs first appear)
static mut MOB_UUID_TO_BASE_ID: *mut std::collections::HashMap<i64, u32> = std::ptr::null_mut();

pub fn detect_server_in_packet(payload: &[u8], endpoint: &ServerEndpoint) -> bool {
    if payload.len() == server_detection::LOGIN_RETURN_SIGNATURE_SIZE {
        if payload.len() >= 20
            && payload[0..10] == server_detection::LOGIN_RETURN_SIGNATURE[0..10]
            && payload[14..20] == server_detection::LOGIN_RETURN_SIGNATURE[14..20]
        {
            log::info!(
                "Detected login return signature from {}",
                endpoint.to_string()
            );
            return true;
        }
    }

    if payload.len() > 10 && payload[4] == 0 {
        let data = &payload[10..];
        let mut pos = 0;

        while pos + 4 <= data.len() {
            let packet_len =
                u32::from_be_bytes([data[pos], data[pos + 1], data[pos + 2], data[pos + 3]])
                    as usize;

            if packet_len < 4 || packet_len > data.len() - pos + 4 {
                break;
            }

            let packet_data_start = pos + 4;
            let packet_data_len = packet_len - 4;

            if packet_data_start + packet_data_len > data.len() {
                break;
            }

            if packet_data_len
                >= packet_layout::SERVER_SIGNATURE_OFFSET + server_detection::SERVER_SIGNATURE.len()
            {
                let signature_start = packet_data_start + packet_layout::SERVER_SIGNATURE_OFFSET;
                if data[signature_start..signature_start + server_detection::SERVER_SIGNATURE.len()]
                    == server_detection::SERVER_SIGNATURE[..]
                {
                    log::info!(
                        "Detected server signature in packet from {}",
                        endpoint.to_string()
                    );
                    return true;
                }
            }

            pos += packet_len;
        }
    }

    false
}

/// Process a single Blue Protocol packet (recursively unwraps FrameDown packets)
pub fn process_bp_packet(data: &[u8], tx: &mpsc::Sender<CombatEvent>) {
    process_bp_packet_recursive(data, tx, 0);
}

/// Recursively process BP packets (handles FrameDown unwrapping)
fn process_bp_packet_recursive(data: &[u8], tx: &mpsc::Sender<CombatEvent>, depth: usize) {
    if data.len() < 6 {
        return;
    }

    let packet_type = u16::from_be_bytes([data[4], data[5]]);
    let is_compressed = packet::is_compressed(packet_type);
    let msg_type = MessageType::from_u16(packet::extract_type(packet_type));

    match msg_type {
        MessageType::Notify => {
            process_notify_packet(data, tx, is_compressed);
        }
        MessageType::Return => {
            process_return_packet(data, tx, is_compressed);
        }
        MessageType::FrameDown => {
            if data.len() < 10 {
                return;
            }

            let nested_data = &data[10..];

            let final_nested_data = if is_compressed {
                match zstd::decode_all(nested_data) {
                    Ok(decompressed) => decompressed,
                    Err(_) => {
                        return;
                    }
                }
            } else {
                nested_data.to_vec()
            };

            // Extract nested packets from FrameDown payload
            let mut pos = 0;
            while pos + 4 <= final_nested_data.len() {
                let nested_packet_size = u32::from_be_bytes([
                    final_nested_data[pos],
                    final_nested_data[pos + 1],
                    final_nested_data[pos + 2],
                    final_nested_data[pos + 3],
                ]) as usize;

                if nested_packet_size < 6 || nested_packet_size > final_nested_data.len() - pos {
                    break;
                }

                let nested_packet = &final_nested_data[pos..pos + nested_packet_size];
                if depth < 10 {
                    process_bp_packet_recursive(nested_packet, tx, depth + 1);
                }

                pos += nested_packet_size;
            }
        }
        _ => {}
    }
}

fn process_notify_packet(data: &[u8], tx: &mpsc::Sender<CombatEvent>, is_compressed: bool) {
    if data.len() < 22 {
        return;
    }

    let service_uuid = u64::from_be_bytes([
        data[6], data[7], data[8], data[9], data[10], data[11], data[12], data[13],
    ]);

    if service_uuid != SERVICE_UUID {
        return;
    }

    let method_id = u32::from_be_bytes([data[18], data[19], data[20], data[21]]);
    let method = match MessageMethod::from_u32(method_id) {
        Some(m) => m,
        None => return,
    };

    let payload_offset = 22;
    if payload_offset >= data.len() {
        return;
    }

    let payload = &data[payload_offset..];
    let final_payload = if is_compressed {
        match zstd::decode_all(payload) {
            Ok(decompressed) => decompressed,
            Err(_) => {
                return;
            }
        }
    } else {
        payload.to_vec()
    };

    match method {
        MessageMethod::SyncNearDeltaInfo => {
            if let Ok(events) = process_sync_near_delta(&final_payload) {
                for event in events {
                    let _ = tx.send(event);
                }
            }
        }
        MessageMethod::SyncToMeDeltaInfo => {
            if let Ok(events) = process_sync_to_me_delta(&final_payload) {
                for event in events {
                    let _ = tx.send(event);
                }
            }
        }
        MessageMethod::SyncNearEntities => {
            if let Ok(events) = process_sync_near_entities(&final_payload) {
                for event in events {
                    let _ = tx.send(event);
                }
            }
        }
        MessageMethod::SyncContainerData => match process_sync_container_data(&final_payload) {
            Ok(events) => {
                for event in events {
                    let _ = tx.send(event);
                }
            }
            Err(e) => {
                log::warn!(
                    "[SyncContainerData] Error processing SyncContainerData: {}",
                    e
                );
            }
        },
        MessageMethod::SyncContainerDirtyData => {}
        MessageMethod::SyncServerTime => {}
    }
}

fn process_return_packet(_data: &[u8], _tx: &mpsc::Sender<CombatEvent>, _is_compressed: bool) {}

/// Process SyncNearDeltaInfo (method_id=45) - damage/healing data and position updates
fn process_sync_near_delta(payload: &[u8]) -> Result<Vec<CombatEvent>, Box<dyn std::error::Error>> {
    let delta_info = SyncNearDeltaInfo::decode(Bytes::copy_from_slice(payload))?;
    let mut events = Vec::new();

    for delta in &delta_info.delta_infos {
        let uuid = delta.uuid;

        let mut monster_base_id: Option<u32> = None;

        if let Some(attrs) = &delta.attrs {
            for attr in &attrs.attrs {
                if attr.id == crate::protocol::constants::AttrType::AttrId as i32 {
                    if let Ok(id) = decode_protobuf_int32(&attr.raw_data) {
                        monster_base_id = Some(id as u32);
                        break;
                    }
                }
            }
        }

        let base_id = if let Some(id) = monster_base_id {
            unsafe {
                if MOB_UUID_TO_BASE_ID.is_null() {
                    let map = Box::into_raw(Box::new(std::collections::HashMap::new()));
                    MOB_UUID_TO_BASE_ID = map;
                }
                if !MOB_UUID_TO_BASE_ID.is_null() {
                    (*MOB_UUID_TO_BASE_ID).insert(uuid, id);
                }
            }
            Some(id)
        } else {
            unsafe {
                if !MOB_UUID_TO_BASE_ID.is_null() {
                    (*MOB_UUID_TO_BASE_ID).get(&uuid).copied()
                } else {
                    None
                }
            }
        };

        if let Some(base_id) = base_id {
            if let Some(attrs) = &delta.attrs {
                let should_log = crate::utils::constants::is_location_tracked_mob(base_id);
                if should_log {
                    let position = extract_position_from_attrs(&Some(attrs.clone()));
                    let (current_hp, max_hp) = extract_hp_from_attrs(&Some(attrs.clone()));

                    // (mob can take damage without moving)
                    let has_position = position.is_some();
                    let has_hp = current_hp.is_some() || max_hp.is_some();

                    if has_position || has_hp {
                        if let Some(pos) = position {
                            events.push(CombatEvent::EntityPosition(EntityPositionUpdate {
                                uuid,
                                entity_type: crate::models::events::EntityType::Monster,
                                position: pos,
                                mob_base_id: Some(base_id),
                                current_hp,
                                max_hp,
                            }));
                        } else if has_hp {
                            // HP-only update (sentinel position)
                            events.push(CombatEvent::EntityPosition(EntityPositionUpdate {
                                uuid,
                                entity_type: crate::models::events::EntityType::Monster,
                                position: crate::models::events::Position {
                                    x: f32::NEG_INFINITY,
                                    y: f32::NEG_INFINITY,
                                    z: f32::NEG_INFINITY,
                                },
                                mob_base_id: Some(base_id),
                                current_hp,
                                max_hp,
                            }));
                        }
                    }
                }
            }
        }

        events.extend(extract_combat_events_from_aoi_delta(delta));
    }

    Ok(events)
}

/// Process SyncToMeDeltaInfo (method_id=46) - local player data and combat events
fn process_sync_to_me_delta(payload: &[u8]) -> Result<Vec<CombatEvent>, prost::DecodeError> {
    let delta_info = SyncToMeDeltaInfo::decode(Bytes::copy_from_slice(payload))?;
    let mut events = Vec::new();

    if let Some(delta) = delta_info.delta_info.as_ref() {
        let uuid = delta.uuid;
        if uuid != 0 {
            unsafe {
                if uuid != LOCAL_PLAYER_UUID {
                    LOCAL_PLAYER_UUID = uuid;
                }
            }
        }

        if let Some(base_delta) = &delta.base_delta {
            if let Some(attrs) = &base_delta.attrs {
                if let Some(position) = extract_position_from_attrs(&Some(attrs.clone())) {
                    events.push(CombatEvent::LocalPlayerPosition(
                        LocalPlayerPositionUpdate { position },
                    ));
                }
            }

            events.extend(extract_combat_events_from_aoi_delta(base_delta));
        }
    }

    Ok(events)
}

/// Extract combat events from AoiSyncDelta (proto: AoiSyncDelta)
/// Processes all damage entries in skill_effects.damages[]
fn extract_combat_events_from_aoi_delta(delta: &AoiSyncDelta) -> Vec<CombatEvent> {
    let skill_effects = match delta.skill_effects.as_ref() {
        Some(se) => se,
        None => {
            return Vec::new();
        }
    };

    let damages = &skill_effects.damages;
    if damages.is_empty() {
        return Vec::new();
    }

    let mut events = Vec::new();

    for damage_info in damages.iter() {
        let skill_id = damage_info.owner_id;
        if skill_id == 0 {
            continue;
        }

        // Prefer summoner UUID over attacker UUID
        let attacker_uuid = if damage_info.top_summoner_id != 0 {
            damage_info.top_summoner_id
        } else if damage_info.attacker_uuid != 0 {
            damage_info.attacker_uuid
        } else {
            continue;
        };

        // Prefer lucky damage value if available
        let damage = if damage_info.lucky_value != 0 {
            damage_info.lucky_value
        } else {
            damage_info.value
        };

        let hp_lessen = damage_info.hp_lessen_value;

        let damage_type_enum =
            EDamageType::try_from(damage_info.r#type).unwrap_or(EDamageType::Normal);

        let is_miss = damage_info.is_miss;
        let is_dead = damage_info.is_dead;
        let is_heal = damage_type_enum == EDamageType::Heal;
        let is_miss_type = damage_type_enum == EDamageType::Miss;

        let target_uuid_raw = delta.uuid;
        let target_uuid = entity::get_player_uid(target_uuid_raw);
        let is_target_player = entity::is_player(target_uuid_raw);

        let is_player_attacker = entity::is_player(attacker_uuid);
        let player_uid = entity::get_player_uid(attacker_uuid);

        // Extract crit/lucky flags
        let is_crit = (damage_info.type_flag & 1) == 1;
        let is_lucky = damage_info.lucky_value != 0;

        if damage == 0 && !is_miss_type && !is_miss {
            continue;
        }

        // Misses: damage may be non-zero, but hp_lessen is always 0
        if is_miss_type || is_miss {
            if is_target_player {
                events.push(CombatEvent::DamageTaken(DamageTakenHit {
                    player_uid: target_uuid,
                    hp_lessen: 0,
                    is_miss: true,
                    is_dead,
                }));
            }
            continue;
        }

        if is_heal {
            if is_player_attacker && is_target_player {
                events.push(CombatEvent::Healing(HealingHit {
                    player_uid,
                    healing: damage,
                    is_crit,
                    is_lucky,
                }));
            }
            continue;
        }

        if is_player_attacker {
            events.push(CombatEvent::Damage(DamageHit {
                player_uid,
                damage,
                is_crit,
                is_lucky,
            }));
        }

        if is_target_player {
            let actual_hp_lessen = if hp_lessen > 0 { hp_lessen } else { damage };
            events.push(CombatEvent::DamageTaken(DamageTakenHit {
                player_uid: target_uuid,
                hp_lessen: actual_hp_lessen,
                is_miss: false,
                is_dead,
            }));
        }
    }

    events
}

/// Extract HP from AttrCollection if available
/// AttrHp (0x2C2E = 11310) contains current HP as varint-encoded uint64
/// AttrMaxHp (0x2C38 = 11320) contains max HP as varint-encoded uint64
fn extract_hp_from_attrs(attrs: &Option<AttrCollection>) -> (Option<u64>, Option<u64>) {
    let attrs = match attrs.as_ref() {
        Some(a) => a,
        None => return (None, None),
    };

    let mut current_hp = None;
    let mut max_hp = None;

    for attr in &attrs.attrs {
        if attr.id == crate::protocol::constants::AttrType::AttrHp as i32 {
            if let Ok(value) = decode_protobuf_int64(&attr.raw_data) {
                current_hp = Some(value as u64);
            }
        } else if attr.id == crate::protocol::constants::AttrType::AttrMaxHp as i32 {
            if let Ok(value) = decode_protobuf_int64(&attr.raw_data) {
                max_hp = Some(value as u64);
            }
        }
    }

    (current_hp, max_hp)
}

/// Extract position from AttrCollection if available
fn extract_position_from_attrs(
    attrs: &Option<AttrCollection>,
) -> Option<crate::models::events::Position> {
    let attrs = attrs.as_ref()?;

    // AttrPos = 52: Position protobuf
    for attr in &attrs.attrs {
        if attr.id == 52 {
            if let Ok(pb_position) = Position::decode(Bytes::copy_from_slice(&attr.raw_data)) {
                let x_abs = pb_position.x.abs();
                let z_abs = pb_position.z.abs();
                if x_abs < 100000.0 && z_abs < 100000.0 {
                    return Some(crate::models::events::Position {
                        x: pb_position.x,
                        y: pb_position.y,
                        z: pb_position.z,
                    });
                }
            }
        }
    }

    None
}

/// Process SyncNearEntities (method_id=6) - entity appearance/disappearance data
fn process_sync_near_entities(
    payload: &[u8],
) -> Result<Vec<CombatEvent>, Box<dyn std::error::Error>> {
    let sync_info = SyncNearEntities::decode(Bytes::copy_from_slice(payload))?;
    let mut events = Vec::new();

    for entity in &sync_info.appear {
        let position = extract_position_from_attrs(&entity.attrs);

        // Extract player names
        if entity.ent_type == EEntityType::EntChar as i32 {
            let player_uid = entity::get_player_uid(entity.uuid);
            if player_uid == 0 {
                continue;
            }

            if let Some(attrs) = &entity.attrs {
                for attr in &attrs.attrs {
                    if attr.id == crate::protocol::constants::AttrType::AttrName as i32 {
                        if let Ok(player_name) = decode_protobuf_string(&attr.raw_data) {
                            if !player_name.is_empty() {
                                events.push(CombatEvent::PlayerName(PlayerNameUpdate {
                                    player_uid,
                                    name: player_name,
                                }));
                            }
                        }
                    }
                }
            }

            if let Some(pos) = position {
                let (current_hp, max_hp) = extract_hp_from_attrs(&entity.attrs);
                events.push(CombatEvent::EntityPosition(EntityPositionUpdate {
                    uuid: entity.uuid,
                    entity_type: crate::models::events::EntityType::Player,
                    position: pos,
                    mob_base_id: None, // Players don't have mob_base_id
                    current_hp,
                    max_hp,
                }));
            }
        }
        // Track monster positions
        else if entity.ent_type == EEntityType::EntMonster as i32 || entity.ent_type == 1 {
            let mut monster_base_id: Option<u32> = None;

            if let Some(attrs) = &entity.attrs {
                for attr in &attrs.attrs {
                    if attr.id == crate::protocol::constants::AttrType::AttrId as i32 {
                        if let Ok(id) = decode_protobuf_int32(&attr.raw_data) {
                            let id = id as u32;
                            monster_base_id = Some(id);
                            break;
                        }
                    }
                }
            }

            let monster_base_id = match monster_base_id {
                Some(id) => id,
                None => {
                    // UUID fallback
                    let uuid_id = entity::get_player_uid(entity.uuid) as u32;
                    log::warn!(
                        "[RADAR] Monster entity detected but no AttrId found, using UUID fallback: base_id={}, uuid={}",
                        uuid_id,
                        entity.uuid
                    );
                    uuid_id
                }
            };

            if monster_base_id == 0 {
                continue;
            }

            unsafe {
                if MOB_UUID_TO_BASE_ID.is_null() {
                    let map = Box::into_raw(Box::new(std::collections::HashMap::new()));
                    MOB_UUID_TO_BASE_ID = map;
                }
                if !MOB_UUID_TO_BASE_ID.is_null() {
                    (*MOB_UUID_TO_BASE_ID).insert(entity.uuid, monster_base_id);
                }
            }

            if crate::utils::constants::is_location_tracked_mob(monster_base_id) {
                let position = extract_position_from_attrs(&entity.attrs);
                let (current_hp, max_hp) = extract_hp_from_attrs(&entity.attrs);
                if let Some(pos) = position {
                    events.push(CombatEvent::EntityPosition(EntityPositionUpdate {
                        uuid: entity.uuid,
                        entity_type: crate::models::events::EntityType::Monster,
                        position: pos,
                        mob_base_id: Some(monster_base_id),
                        current_hp,
                        max_hp,
                    }));
                }
            }
        }
    }

    Ok(events)
}

/// Process SyncContainerData (method_id=21) - local player's full container data
fn process_sync_container_data(
    payload: &[u8],
) -> Result<Vec<CombatEvent>, Box<dyn std::error::Error>> {
    let sync_data = match SyncContainerData::decode(Bytes::copy_from_slice(payload)) {
        Ok(data) => data,
        Err(e) => {
            log::error!(
                "[SyncContainerData] Failed to decode SyncContainerData: {}",
                e
            );
            return Err(Box::new(e));
        }
    };
    let mut events = Vec::new();

    if let Some(v_data) = &sync_data.v_data {
        let player_uid = v_data.char_id;
        if player_uid == 0 {
            log::warn!("[SyncContainerData] player_uid is 0, returning early");
            return Ok(events);
        }

        if let Some(char_base) = &v_data.char_base {
            if !char_base.name.is_empty() {
                events.push(CombatEvent::PlayerName(PlayerNameUpdate {
                    player_uid,
                    name: char_base.name.clone(),
                }));
            }

            if !char_base.account_id.is_empty() {
                events.push(CombatEvent::PlayerAccountInfo(PlayerAccountInfoUpdate {
                    account_id: char_base.account_id.clone(),
                    uid: player_uid,
                }));
            }
        }

        if let Some(scene_data) = &v_data.scene_data {
            if scene_data.line_id > 0 {
                events.push(CombatEvent::PlayerLineInfo(PlayerLineInfoUpdate {
                    line_id: scene_data.line_id,
                }));
            }
        }

        if let Ok(extracted_modules) = crate::utils::modules::extract_modules(&sync_data) {
            if !extracted_modules.is_empty() {
                events.push(CombatEvent::ModuleData(ModuleDataUpdate {
                    modules: extracted_modules,
                }));
            }
        }
    } else {
        if let Ok(extracted_modules) = crate::utils::modules::extract_modules(&sync_data) {
            if !extracted_modules.is_empty() {
                events.push(CombatEvent::ModuleData(ModuleDataUpdate {
                    modules: extracted_modules,
                }));
            }
        }
    }

    Ok(events)
}

/// Decode a protobuf varint-encoded int32 from raw bytes
fn decode_protobuf_int64(data: &[u8]) -> Result<i64, Box<dyn std::error::Error>> {
    if data.is_empty() {
        return Err("Empty data".into());
    }

    let mut cursor = 0;
    let mut value = 0u64;
    let mut shift = 0;

    loop {
        if cursor >= data.len() {
            return Err("Incomplete varint".into());
        }

        let byte = data[cursor];
        cursor += 1;

        value |= ((byte & 0x7F) as u64) << shift;

        if (byte & 0x80) == 0 {
            break; // Last byte of varint
        }

        shift += 7;
        if shift >= 64 {
            return Err("Varint too large".into());
        }
    }

    Ok(value as i64)
}

fn decode_protobuf_int32(data: &[u8]) -> Result<i32, Box<dyn std::error::Error>> {
    if data.is_empty() {
        return Err("Empty data".into());
    }

    let mut cursor = 0;
    let mut value = 0u64;
    let mut shift = 0;

    loop {
        if cursor >= data.len() {
            return Err("Incomplete varint".into());
        }

        let byte = data[cursor];
        cursor += 1;

        value |= ((byte & 0x7F) as u64) << shift;

        if (byte & 0x80) == 0 {
            break; // Last byte of varint
        }

        shift += 7;
        if shift >= 64 {
            return Err("Varint too large".into());
        }
    }

    Ok(value as i32)
}

/// Decode a protobuf-encoded string from raw bytes
fn decode_protobuf_string(data: &[u8]) -> Result<String, Box<dyn std::error::Error>> {
    if data.is_empty() {
        return Err("Empty data".into());
    }

    let mut cursor = 0;
    let mut length = 0u32;
    let mut shift = 0;

    loop {
        if cursor >= data.len() {
            return Err("Incomplete varint".into());
        }

        let byte = data[cursor];
        cursor += 1;

        length |= ((byte & 0x7F) as u32) << shift;

        if (byte & 0x80) == 0 {
            break; // Last byte of varint
        }

        shift += 7;
        if shift >= 32 {
            return Err("Varint too large".into());
        }
    }

    if cursor + length as usize > data.len() {
        return Err("Insufficient data for string length".into());
    }

    let string_bytes = &data[cursor..cursor + length as usize];
    let name = String::from_utf8(string_bytes.to_vec())?;

    Ok(name)
}
