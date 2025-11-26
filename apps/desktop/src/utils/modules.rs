use crate::protocol::pb::SyncContainerData;
use serde::{Deserialize, Serialize};

/// Module data structure for encoding/decoding
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModuleData {
    pub modules: Vec<Module>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Module {
    pub effects: Vec<ModuleEffect>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModuleEffect {
    pub id: i32,
    pub level: u32,
}

pub fn is_valid_effect_id(effect_id: i32) -> bool {
    matches!(
        effect_id,
        1110 | 1111
            | 1112
            | 1113
            | 1114
            | 1205
            | 1206
            | 1307
            | 1308
            | 1407
            | 1408
            | 1409
            | 1410
            | 2104
            | 2105
            | 2204
            | 2205
            | 2304
            | 2404
            | 2405
            | 2406
    )
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

                        if is_valid_effect_id(part_id) {
                            effects.push(ModuleEffect { id: part_id, level });
                        }
                    }

                    if !effects.is_empty() {
                        modules.push(Module { effects });
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
