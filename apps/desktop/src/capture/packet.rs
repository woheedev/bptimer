use netdev::interface::get_interfaces;
use netdev::interface::types::InterfaceType;
use pcap::{Capture, Device};
use std::sync::mpsc;
use std::thread;

use crate::capture::tcp::TcpStreamProcessor;
use crate::models::events::CombatEvent;

#[derive(Debug)]
enum Control {
    Switch(usize),
}

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

// Get the netdev interface corresponding to a pcap device
fn get_netdev_interface<'a>(
    device: &Device,
    interfaces: &'a [netdev::Interface],
) -> Option<&'a netdev::Interface> {
    interfaces
        .iter()
        .find(|iface| device.name.contains(&iface.name))
}

// Check if a netdev interface has valid IPv4 addresses
fn has_valid_ipv4_netdev(iface: &netdev::Interface) -> bool {
    iface.ipv4.iter().any(|ipnet| {
        let ipv4 = ipnet.addr();
        !ipv4.is_unspecified() && !ipv4.is_loopback() && !ipv4.is_link_local()
    })
}

pub struct PacketCapture {
    receiver: mpsc::Receiver<CombatEvent>,
    control_tx: mpsc::Sender<Control>,
}

impl PacketCapture {
    pub fn start(device_index: Option<usize>) -> Option<Self> {
        let devices = Device::list().ok()?;
        let (tx, rx) = mpsc::channel::<CombatEvent>();
        let (control_tx, control_rx) = mpsc::channel::<Control>();

        // Log available devices
        use log::info;
        info!("Available network devices:");
        for (i, dev) in devices.iter().enumerate() {
            let clean_name = clean_device_name(dev);
            info!("[{}] {}", i, clean_name);
        }

        let initial_idx = device_index.unwrap_or_else(|| {
            let best_idx = select_best_device(&devices).unwrap_or(0);
            info!("Auto-selected device: [{}]", best_idx);
            best_idx
        });

        if device_index.is_some() {
            info!("Selected device: [{}]", initial_idx);
        }

        thread::spawn(move || {
            let mut current_idx = initial_idx;

            loop {
                match capture_loop(tx.clone(), &devices, current_idx, &control_rx) {
                    Ok(Some(new_idx)) => current_idx = new_idx,
                    Ok(None) => break, // Shutdown
                    Err(e) => {
                        log::error!("Packet capture error: {}", e);
                        break;
                    }
                }
            }
        });

        Some(Self {
            receiver: rx,
            control_tx,
        })
    }

    pub fn drain_events(&mut self) -> Vec<CombatEvent> {
        let mut events = Vec::new();
        while let Ok(event) = self.receiver.try_recv() {
            events.push(event);
        }
        events
    }

    pub fn switch_device(&self, idx: usize) {
        self.control_tx.send(Control::Switch(idx)).ok();
    }
}

// Auto-select device: prefer default interface, then ethernet, then wifi
pub fn select_best_device(devices: &[Device]) -> Option<usize> {
    if devices.is_empty() {
        return None;
    }

    let interfaces = get_interfaces();

    // Try for default interface
    if let Some(default_if) = interfaces.iter().find(|i| i.default) {
        if default_if.is_up() && has_valid_ipv4_netdev(default_if) {
            for (i, dev) in devices.iter().enumerate() {
                if dev.name.contains(&default_if.name) {
                    return Some(i);
                }
            }
        }
    }

    // Fall back to ethernet > wifi
    let mut first_ethernet: Option<usize> = None;
    let mut first_wifi: Option<usize> = None;

    for (i, dev) in devices.iter().enumerate() {
        if let Some(iface) = get_netdev_interface(dev, &interfaces) {
            if iface.is_up() && has_valid_ipv4_netdev(iface) {
                match iface.if_type {
                    InterfaceType::Ethernet => {
                        if first_ethernet.is_none() {
                            first_ethernet = Some(i);
                        }
                    }
                    InterfaceType::Wireless80211 => {
                        if first_wifi.is_none() {
                            first_wifi = Some(i);
                        }
                    }
                    _ => {}
                }
            }
        }
    }

    // Return first match in priority order
    first_ethernet.or(first_wifi)
}

fn capture_loop(
    tx: mpsc::Sender<CombatEvent>,
    devices: &[Device],
    device_index: usize,
    control_rx: &mpsc::Receiver<Control>,
) -> Result<Option<usize>, Box<dyn std::error::Error>> {
    use log::info;

    let device = devices.get(device_index).ok_or("Device not found")?.clone();
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
            Err(pcap::Error::TimeoutExpired) => {}
            Err(e) => {
                log::error!("Error capturing packet: {}", e);
            }
        }

        // Check for control messages
        match control_rx.try_recv() {
            Ok(Control::Switch(new_idx)) => return Ok(Some(new_idx)),
            Err(mpsc::TryRecvError::Empty) => {}
            Err(mpsc::TryRecvError::Disconnected) => return Ok(None),
        }
    }
}
