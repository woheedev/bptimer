use crate::protocol::pb::SyncContainerData;
use serde::{Deserialize, Serialize};

/// Module data structure for encoding/decoding
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModuleData {
    pub modules: Vec<Module>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Module {
    pub id: String,
    pub effects: Vec<ModuleEffect>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModuleEffect {
    pub name: String,
    pub level: u32,
}

/// Map effect ID to English name
pub fn get_effect_name(effect_id: i32) -> Option<&'static str> {
    match effect_id {
        1110 => Some("Strength Boost"),
        1111 => Some("Agility Boost"),
        1112 => Some("Intellect Boost"),
        1113 => Some("Special Attack"),
        1114 => Some("Elite Strike"),
        1205 => Some("Healing Boost"),
        1206 => Some("Healing Enhance"),
        1307 => Some("Resistance"),
        1308 => Some("Armor"),
        1407 => Some("Cast Focus"),
        1408 => Some("Attack SPD"),
        1409 => Some("Crit Focus"),
        1410 => Some("Luck Focus"),
        2104 => Some("DMG Stack"),
        2105 => Some("Agile"),
        2204 => Some("Life Condense"),
        2205 => Some("First Aid"),
        2304 => Some("Final Protection"),
        2404 => Some("Life Wave"),
        2405 => Some("Life Steal"),
        2406 => Some("Team Luck & Crit"),

        _ => None,
    }
}

/// Map module config ID to module name
pub fn get_module_name(config_id: i32) -> Option<&'static str> {
    match config_id {
        5500101 => Some("Basic Attack"),
        5500102 => Some("High Performance Attack"),
        5500103 => Some("Excellent Attack"),
        5500201 => Some("Basic Healing"),
        5500202 => Some("High Performance Healing"),
        5500203 => Some("Excellent Support"),
        5500301 => Some("Basic Protection"),
        5500302 => Some("High Performance Protection"),
        5500303 => Some("Excellent Protection"),
        _ => None,
    }
}

/// Extract modules from SyncContainerData
pub fn extract_modules(
    sync_data: &SyncContainerData,
) -> Result<Vec<Module>, Box<dyn std::error::Error>> {
    let mut modules = Vec::new();

    let v_data = match &sync_data.v_data {
        Some(v) => v,
        None => {
            return Ok(modules);
        }
    };

    let mod_infos = match &v_data.r#mod {
        Some(mod_data) => &mod_data.mod_infos,
        None => {
            return Ok(modules);
        }
    };

    let item_package = match &v_data.item_package {
        Some(pkg) => pkg,
        None => {
            return Ok(modules);
        }
    };

    for (_package_type, package) in &item_package.packages {
        for (item_key, item) in &package.items {
            if let Some(mod_new_attr) = &item.mod_new_attr {
                if !mod_new_attr.mod_parts.is_empty() {
                    let config_id = item.config_id;

                    let mod_info = mod_infos.get(item_key);
                    let mut effects = Vec::new();
                    let mod_parts = &mod_new_attr.mod_parts;
                    let empty_vec = Vec::new();
                    let init_link_nums =
                        mod_info.map(|mi| &mi.init_link_nums).unwrap_or(&empty_vec);

                    let n = mod_parts.len().min(init_link_nums.len());

                    for i in 0..n {
                        let part_id = mod_parts[i];
                        let level = init_link_nums[i] as u32;

                        if let Some(effect_name) = get_effect_name(part_id) {
                            effects.push(ModuleEffect {
                                name: effect_name.to_string(),
                                level,
                            });
                        }
                    }

                    if !effects.is_empty() {
                        let module_name = get_module_name(config_id)
                            .map(|s| s.to_string())
                            .unwrap_or_else(|| format!("Module {}", config_id));

                        modules.push(Module {
                            id: module_name,
                            effects,
                        });
                    }
                }
            }
        }
    }

    Ok(modules)
}

/// Encode module data to base64-encoded gzip-compressed JSON string
pub fn encode_module_data(modules: &[Module]) -> Result<String, Box<dyn std::error::Error>> {
    use base64::{Engine as _, engine::general_purpose};
    use flate2::Compression;
    use flate2::write::GzEncoder;
    use std::io::Write;

    let data = ModuleData {
        modules: modules.to_vec(),
    };
    let json = serde_json::to_string(&data)?;

    let mut encoder = GzEncoder::new(Vec::new(), Compression::default());
    encoder.write_all(json.as_bytes())?;
    let compressed = encoder.finish()?;
    let encoded = general_purpose::URL_SAFE_NO_PAD.encode(&compressed);
    Ok(encoded)
}
