use crate::ui::constants::player_table;
use egui::{Context, TextureHandle, TextureOptions};
use log::warn;
use std::collections::HashMap;
use std::sync::{Arc, Mutex};

pub struct ClassIconCache {
    cache: Arc<Mutex<HashMap<i32, Option<TextureHandle>>>>,
}

impl ClassIconCache {
    pub fn new() -> Self {
        Self {
            cache: Arc::new(Mutex::new(HashMap::new())),
        }
    }

    pub fn get_icon(&self, ctx: &Context, class_id: i32) -> Option<TextureHandle> {
        let mut cache = match self.cache.lock() {
            Ok(cache) => cache,
            Err(_) => return None,
        };

        if let Some(cached) = cache.get(&class_id) {
            return cached.clone();
        }

        let texture = self.load_icon(ctx, class_id);
        cache.insert(class_id, texture.clone());
        texture
    }

    fn load_icon(&self, ctx: &Context, class_id: i32) -> Option<TextureHandle> {
        let image_bytes = get_class_icon_bytes(class_id)?;

        let image = match image::load_from_memory(image_bytes) {
            Ok(img) => img.to_rgba8(),
            Err(e) => {
                warn!("Failed to decode class icon {}: {}", class_id, e);
                return None;
            }
        };

        let size = [image.width() as usize, image.height() as usize];
        let pixels = image.as_flat_samples();

        let color_image = egui::ColorImage::from_rgba_unmultiplied(size, pixels.as_slice());

        Some(ctx.load_texture(
            format!("class_icon_{}", class_id),
            color_image,
            TextureOptions::LINEAR,
        ))
    }
}

impl Default for ClassIconCache {
    fn default() -> Self {
        Self::new()
    }
}

pub fn render_class_icon(
    ui: &mut egui::Ui,
    icon_cache: &ClassIconCache,
    class_id: Option<i32>,
    is_local_player: bool,
    icon_color: egui::Color32,
) {
    let icon_size = player_table::ICON_SIZE;

    let (container_rect, _) =
        ui.allocate_exact_size(egui::vec2(icon_size, icon_size), egui::Sense::hover());

    if is_local_player && class_id.is_none() {
        ui.painter().text(
            container_rect.center(),
            egui::Align2::CENTER_CENTER,
            "★",
            egui::FontId::proportional(icon_size * 0.9),
            icon_color,
        );
        return;
    }

    let class_id = match class_id {
        Some(id) => id,
        None => return,
    };

    let texture = match icon_cache.get_icon(ui.ctx(), class_id) {
        Some(t) => t,
        None => return,
    };

    let texture_size = texture.size_vec2();

    if texture_size.x <= 0.0 || texture_size.y <= 0.0 {
        warn!(
            "Invalid texture size for class icon {}: {}x{}",
            class_id, texture_size.x, texture_size.y
        );
        return;
    }

    let aspect_ratio = texture_size.x / texture_size.y;
    let image_size = if aspect_ratio > 1.0 {
        egui::vec2(icon_size, icon_size / aspect_ratio)
    } else {
        egui::vec2(icon_size * aspect_ratio, icon_size)
    };

    let image_rect = egui::Rect::from_center_size(container_rect.center(), image_size);

    ui.painter().image(
        texture.id(),
        image_rect,
        egui::Rect::from_min_max(egui::pos2(0.0, 0.0), egui::pos2(1.0, 1.0)),
        icon_color,
    );
}

fn get_class_icon_bytes(class_id: i32) -> Option<&'static [u8]> {
    match class_id {
        1 => Some(include_bytes!("images/classes/1.webp")),
        2 => Some(include_bytes!("images/classes/2.webp")),
        4 => Some(include_bytes!("images/classes/4.webp")),
        5 => Some(include_bytes!("images/classes/5.webp")),
        9 => Some(include_bytes!("images/classes/9.webp")),
        11 => Some(include_bytes!("images/classes/11.webp")),
        12 => Some(include_bytes!("images/classes/12.webp")),
        13 => Some(include_bytes!("images/classes/13.webp")),
        _ => None,
    }
}
