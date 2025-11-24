use global_hotkey::GlobalHotKeyManager;
use global_hotkey::hotkey::{Code, HotKey};
use log::{info, warn};
use std::collections::HashMap;

#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash)]
pub enum HotkeyAction {
    ToggleClickThrough,
    SwitchToMobView,
    SwitchToCombatView,
    MinimizeWindow,
    ResetStats,
}

pub struct HotkeyManager {
    manager: Option<GlobalHotKeyManager>,
    // Map hotkey ID to action
    action_map: HashMap<u32, HotkeyAction>,
    // Keep track of registered hotkeys (map action -> HotKey)
    // This allows us to unregister specific actions easily
    registered_hotkeys: HashMap<HotkeyAction, HotKey>,
}

impl HotkeyManager {
    pub fn new() -> Self {
        let manager = match GlobalHotKeyManager::new() {
            Ok(m) => Some(m),
            Err(e) => {
                warn!("Failed to initialize GlobalHotKeyManager: {}", e);
                None
            }
        };
        Self {
            manager,
            action_map: HashMap::new(),
            registered_hotkeys: HashMap::new(),
        }
    }

    // Unregister existing hotkey for this action, then register new one
    pub fn register(&mut self, hotkey: HotKey, action: HotkeyAction) -> bool {
        // Unregister existing
        let old_hotkey = self.registered_hotkeys.remove(&action);
        if let Some(old) = old_hotkey {
            if let Some(manager) = &self.manager {
                if let Err(e) = manager.unregister(old) {
                    warn!("Failed to unregister hotkey for {:?}: {}", action, e);
                }
            }
            // Also remove from action_map
            let id = old.id();
            self.action_map.remove(&id);
        }

        // Register new
        if let Some(manager) = &self.manager {
            match manager.register(hotkey) {
                Ok(_) => {
                    let id = hotkey.id();
                    self.action_map.insert(id, action);
                    self.registered_hotkeys.insert(action, hotkey);
                    info!("Registered hotkey for {:?}: id={}", action, id);
                    true
                }
                Err(e) => {
                    warn!("Failed to register hotkey for {:?}: {}", action, e);
                    false
                }
            }
        } else {
            false
        }
    }

    pub fn unregister_action(&mut self, action: HotkeyAction) {
        if let Some(hotkey) = self.registered_hotkeys.remove(&action) {
            if let Some(manager) = &self.manager {
                if let Err(e) = manager.unregister(hotkey) {
                    warn!("Failed to unregister hotkey for {:?}: {}", action, e);
                }
            }
            // Also remove from action_map
            let id = hotkey.id();
            self.action_map.remove(&id);
        }
    }

    pub fn reload_from_settings(&mut self, settings: &crate::config::Settings) {
        let mut process = |config: &Option<crate::config::HotkeyConfig>, action: HotkeyAction| {
            if let Some(cfg) = config {
                if let Some(hotkey) = cfg.to_hotkey() {
                    self.register(hotkey, action);
                }
            } else {
                self.unregister_action(action);
            }
        };

        process(
            &settings.hotkeys.toggle_click_through,
            HotkeyAction::ToggleClickThrough,
        );
        process(
            &settings.hotkeys.switch_to_mob_view,
            HotkeyAction::SwitchToMobView,
        );
        process(
            &settings.hotkeys.switch_to_combat_view,
            HotkeyAction::SwitchToCombatView,
        );
        process(
            &settings.hotkeys.minimize_window,
            HotkeyAction::MinimizeWindow,
        );
        process(&settings.hotkeys.reset_stats, HotkeyAction::ResetStats);
    }

    pub fn get_action(&self, event_id: u32) -> Option<HotkeyAction> {
        self.action_map.get(&event_id).copied()
    }
}

macro_rules! key_mappings {
    ($($egui_key:ident => $str_name:literal => $code:ident),* $(,)?) => {
        pub fn string_to_code(s: &str) -> Option<Code> {
            match s {
                $($str_name => Some(Code::$code),)*
                _ => None,
            }
        }

        pub fn egui_key_to_code(key: egui::Key) -> Option<Code> {
            use egui::Key;
            match key {
                $(Key::$egui_key => Some(Code::$code),)*
                _ => None,
            }
        }
    };
}

key_mappings! {
    A => "KeyA" => KeyA,
    B => "KeyB" => KeyB,
    C => "KeyC" => KeyC,
    D => "KeyD" => KeyD,
    E => "KeyE" => KeyE,
    F => "KeyF" => KeyF,
    G => "KeyG" => KeyG,
    H => "KeyH" => KeyH,
    I => "KeyI" => KeyI,
    J => "KeyJ" => KeyJ,
    K => "KeyK" => KeyK,
    L => "KeyL" => KeyL,
    M => "KeyM" => KeyM,
    N => "KeyN" => KeyN,
    O => "KeyO" => KeyO,
    P => "KeyP" => KeyP,
    Q => "KeyQ" => KeyQ,
    R => "KeyR" => KeyR,
    S => "KeyS" => KeyS,
    T => "KeyT" => KeyT,
    U => "KeyU" => KeyU,
    V => "KeyV" => KeyV,
    W => "KeyW" => KeyW,
    X => "KeyX" => KeyX,
    Y => "KeyY" => KeyY,
    Z => "KeyZ" => KeyZ,
    Num0 => "Digit0" => Digit0,
    Num1 => "Digit1" => Digit1,
    Num2 => "Digit2" => Digit2,
    Num3 => "Digit3" => Digit3,
    Num4 => "Digit4" => Digit4,
    Num5 => "Digit5" => Digit5,
    Num6 => "Digit6" => Digit6,
    Num7 => "Digit7" => Digit7,
    Num8 => "Digit8" => Digit8,
    Num9 => "Digit9" => Digit9,
    F1 => "F1" => F1,
    F2 => "F2" => F2,
    F3 => "F3" => F3,
    F4 => "F4" => F4,
    F5 => "F5" => F5,
    F6 => "F6" => F6,
    F7 => "F7" => F7,
    F8 => "F8" => F8,
    F9 => "F9" => F9,
    F10 => "F10" => F10,
    F11 => "F11" => F11,
    F12 => "F12" => F12,
    Space => "Space" => Space,
    Enter => "Enter" => Enter,
    Tab => "Tab" => Tab,
    Backspace => "Backspace" => Backspace,
    Escape => "Escape" => Escape,
}
