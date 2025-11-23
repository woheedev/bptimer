use pcap::{Capture, Device};
use std::sync::mpsc;
use std::thread;

use crate::capture::tcp::TcpStreamProcessor;
use crate::models::events::CombatEvent;

const PCAP_SNAPLEN: i32 = 65535;
const PCAP_TIMEOUT_MS: i32 = 10;

pub fn clean_device_name(device: &Device) -> String {
    let device_name = device
        .name
        .strip_prefix(r"\Device\NPF_")
        .unwrap_or(&device.name);
    device_name
        .strip_prefix('{')
        .and_then(|s| s.strip_suffix('}'))
        .and_then(|s| {
            if s.matches('-').count() == 4 && s.len() == 36 {
                None
            } else {
                Some(device_name)
            }
        })
        .unwrap_or_else(|| device.desc.as_deref().unwrap_or("Unknown device"))
        .to_string()
}

pub struct PacketCapture {
    receiver: mpsc::Receiver<CombatEvent>,
}

impl PacketCapture {
    pub fn start(device_index: Option<usize>) -> Option<Self> {
        let (tx, rx) = mpsc::channel::<CombatEvent>();

        thread::spawn(move || {
            if let Err(e) = capture_loop(tx, device_index) {
                log::error!("Packet capture error: {}", e);
            }
        });

        Some(Self { receiver: rx })
    }

    pub fn drain_events(&mut self) -> Vec<CombatEvent> {
        let mut events = Vec::new();
        while let Ok(event) = self.receiver.try_recv() {
            events.push(event);
        }
        events
    }
}

// Heuristic device choice: prefer physical Ethernet, then Wi-Fi, then anything else
fn select_best_device(devices: &[Device]) -> Option<usize> {
    if devices.is_empty() {
        return None;
    }

    // Virtual adapter keywords
    let virtual_keywords = [
        "zerotier",
        "vmware",
        "hyper-v",
        "virtual",
        "loopback",
        "tap",
        "bluetooth",
        "wan miniport",
        "wan",
        "miniport",
    ];

    let is_virtual = |name: &str, desc: &str| -> bool {
        let name_lower = name.to_lowercase();
        let desc_lower = desc.to_lowercase();
        virtual_keywords
            .iter()
            .any(|keyword| name_lower.contains(keyword) || desc_lower.contains(keyword))
    };

    let mut best_ethernet: Option<usize> = None;
    let mut best_wifi: Option<usize> = None;
    let mut best_other: Option<usize> = None;
    let mut physical_devices: Vec<usize> = Vec::new();

    for (i, dev) in devices.iter().enumerate() {
        let desc = dev.desc.as_deref().unwrap_or("");
        let name = &dev.name;

        // Skip virtual adapters
        if is_virtual(name, desc) {
            continue;
        }

        physical_devices.push(i);

        let desc_lower = desc.to_lowercase();
        let name_lower = name.to_lowercase();

        // Ethernet detection
        let is_ethernet = desc_lower.contains("ethernet")
            || desc_lower.contains("realtek")
            || desc_lower.contains("gbe")
            || (desc_lower.contains("pcie") && !desc_lower.contains("wi-fi"))
            || (desc_lower.contains("intel")
                && (desc_lower.contains("ethernet")
                    || desc_lower.contains("gigabit")
                    || desc_lower.contains("i225")
                    || desc_lower.contains("i226")
                    || desc_lower.contains("i350")))
            || name_lower.starts_with("eth")
            || name_lower.starts_with("enp")
            || name_lower.starts_with("ens")
            || name_lower.starts_with("enx");

        // Wi-Fi detection
        let is_wifi = desc_lower.contains("wi-fi")
            || desc_lower.contains("wireless")
            || desc_lower.contains("wlan")
            || (desc_lower.contains("intel")
                && (desc_lower.contains("wi-fi")
                    || desc_lower.contains("wireless")
                    || desc_lower.contains("ax")
                    || desc_lower.contains("ac")))
            || name_lower.starts_with("wlan")
            || name_lower.starts_with("wl")
            || (name_lower.starts_with("wlp") || name_lower.starts_with("wls")); // systemd Wi-Fi naming

        if is_ethernet {
            if best_ethernet.is_none() {
                best_ethernet = Some(i);
            }
        } else if is_wifi {
            if best_wifi.is_none() {
                best_wifi = Some(i);
            }
        } else if desc_lower.contains("intel")
            || desc_lower.contains("qualcomm")
            || desc_lower.contains("broadcom")
            || desc_lower.contains("marvell")
            || desc_lower.contains("atheros")
        {
            // Other physical adapters
            if best_other.is_none() {
                best_other = Some(i);
            }
        }
    }

    if let Some(idx) = best_ethernet.or(best_wifi).or(best_other) {
        return Some(idx);
    }

    if let Some(&idx) = physical_devices.first() {
        return Some(idx);
    }

    for (i, dev) in devices.iter().enumerate() {
        let desc = dev.desc.as_deref().unwrap_or("");
        if !is_virtual(&dev.name, desc) {
            return Some(i);
        }
    }

    Some(0)
}

fn capture_loop(
    tx: mpsc::Sender<CombatEvent>,
    device_index: Option<usize>,
) -> Result<(), Box<dyn std::error::Error>> {
    use log::info;

    info!("Available network devices:");
    let devices = Device::list()?;
    for (i, dev) in devices.iter().enumerate() {
        let clean_name = clean_device_name(dev);
        info!("[{}] {}", i, clean_name);
    }

    let device = (if let Some(idx) = device_index {
        info!("Selected device: [{}]", idx);
        devices.get(idx).ok_or("Device not found")?
    } else {
        let best_idx = select_best_device(&devices);
        if let Some(idx) = best_idx {
            info!("Auto-selected device: [{}]", idx);
            &devices[idx]
        } else {
            info!("No best device match, defaulting to [0]");
            devices.first().ok_or("No network devices found")?
        }
    })
    .clone();

    let clean_name = clean_device_name(&device);
    info!("Starting capture on device: {}", clean_name);

    let mut cap = Capture::from_device(device)?
        .promisc(true)
        .snaplen(PCAP_SNAPLEN)
        .timeout(PCAP_TIMEOUT_MS)
        .open()?;

    cap.filter("tcp", true)?;
    info!("Packet capture started (read-only mode)");
    info!("Filter: tcp");
    info!("Waiting for Blue Protocol traffic...\n");

    let mut processor = TcpStreamProcessor::new(tx);

    loop {
        match cap.next_packet() {
            Ok(packet) => {
                processor.process_packet(&packet.data);
            }
            Err(pcap::Error::TimeoutExpired) => {
                continue;
            }
            Err(e) => {
                log::error!("Error capturing packet: {}", e);
                continue;
            }
        }
    }
}
