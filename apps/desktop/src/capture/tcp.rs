use crate::protocol::constants::tcp;
use std::collections::{HashMap, VecDeque};
use std::time::SystemTime;

/// Server endpoint
#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub struct ServerEndpoint {
    pub src_addr: String,
    pub src_port: u16,
    pub dst_addr: String,
    pub dst_port: u16,
}

impl ServerEndpoint {
    pub fn new(src_addr: String, src_port: u16, dst_addr: String, dst_port: u16) -> Self {
        Self {
            src_addr,
            src_port,
            dst_addr,
            dst_port,
        }
    }

    pub fn to_string(&self) -> String {
        format!(
            "{}:{} -> {}:{}",
            self.src_addr, self.src_port, self.dst_addr, self.dst_port
        )
    }

    pub fn reverse(&self) -> ServerEndpoint {
        ServerEndpoint::new(
            self.dst_addr.clone(),
            self.dst_port,
            self.src_addr.clone(),
            self.src_port,
        )
    }
}

use crate::models::events::CombatEvent;
use std::sync::mpsc;

/// TCP Stream Processor
#[derive(Debug)]
pub struct TcpStreamProcessor {
    pub current_server: Option<ServerEndpoint>,
    pub next_seq: Option<u32>,
    pub tcp_cache: HashMap<u32, Vec<u8>>,
    pub stream_buffer: VecDeque<u8>,
    pub last_packet_time: Option<SystemTime>,
    pub last_any_packet_time: Option<SystemTime>,
    pub waiting_gap_since: Option<SystemTime>,
    pub tx: mpsc::Sender<CombatEvent>,
}

impl TcpStreamProcessor {
    pub fn new(tx: mpsc::Sender<CombatEvent>) -> Self {
        Self {
            current_server: None,
            next_seq: None,
            tcp_cache: HashMap::new(),
            stream_buffer: VecDeque::new(),
            last_packet_time: None,
            last_any_packet_time: None,
            waiting_gap_since: None,
            tx,
        }
    }

    /// Reset processor state
    pub fn reset(&mut self) {
        self.current_server = None;
        self.next_seq = None;
        self.last_packet_time = None;
        self.last_any_packet_time = None;
        self.waiting_gap_since = None;
        self.tcp_cache.clear();
        self.stream_buffer.clear();
    }

    /// Sequence comparison with 32-bit wrapping
    fn seq_cmp(a: u32, b: u32) -> i32 {
        a.wrapping_sub(b) as i32
    }

    pub fn force_reconnect(&mut self, reason: &str) {
        log::info!("Reconnect due to {}", reason);
        self.reset();
    }

    pub fn force_resync_to(&mut self, seq: u32) {
        self.tcp_cache.clear();
        self.stream_buffer.clear();
        self.next_seq = Some(seq);
        self.waiting_gap_since = None;
        self.last_packet_time = Some(SystemTime::now());
    }

    pub fn process_segment(&mut self, seq: u32, payload: &[u8]) -> Vec<Vec<u8>> {
        let mut complete_packets = Vec::new();
        let now = SystemTime::now();

        self.last_any_packet_time = Some(now);

        if self.next_seq.is_none() {
            if payload.len() > 4 {
                let packet_size =
                    u32::from_be_bytes([payload[0], payload[1], payload[2], payload[3]]) as usize;
                if packet_size < 0x0fffff {
                    self.next_seq = Some(seq);
                }
            }
        }

        if let Some(next_seq) = self.next_seq {
            let cmp = Self::seq_cmp(seq, next_seq);
            if cmp > 0 {
                if self.waiting_gap_since.is_none() {
                    self.waiting_gap_since = Some(now);
                } else if let Some(gap_since) = self.waiting_gap_since {
                    if now.duration_since(gap_since).unwrap_or_default() > tcp::GAP_TIMEOUT {
                        self.force_resync_to(seq);
                    }
                }
            } else if cmp == 0 {
                self.waiting_gap_since = None;
            }
        }

        if self.next_seq.is_none() || Self::seq_cmp(seq, self.next_seq.unwrap()) >= 0 {
            self.tcp_cache.insert(seq, payload.to_vec());
        }

        // Assemble contiguous segments from cache
        while let Some(next_seq) = self.next_seq {
            if let Some(segment) = self.tcp_cache.remove(&next_seq) {
                self.stream_buffer.extend(&segment);
                self.next_seq = Some(next_seq.wrapping_add(segment.len() as u32));
                self.last_packet_time = Some(now);
            } else {
                break;
            }
        }

        // Extract complete packets from assembled buffer
        while self.try_extract_packet(&mut complete_packets) {}

        complete_packets
    }

    // Extract complete packet from stream buffer (4-byte size header)
    fn try_extract_packet(&mut self, complete_packets: &mut Vec<Vec<u8>>) -> bool {
        if self.stream_buffer.len() < 4 {
            return false;
        }

        let packet_size = u32::from_be_bytes([
            self.stream_buffer[0],
            self.stream_buffer[1],
            self.stream_buffer[2],
            self.stream_buffer[3],
        ]) as usize;

        if packet_size <= 4 || packet_size > 0x0fffff {
            self.stream_buffer.pop_front();
            return true;
        }

        if self.stream_buffer.len() < packet_size {
            return false;
        }

        let packet: Vec<u8> = self.stream_buffer.drain(..packet_size).collect();
        complete_packets.push(packet);
        true
    }

    pub fn process_packet(&mut self, packet_data: &[u8]) {
        let packet = match etherparse::SlicedPacket::from_ethernet(packet_data) {
            Ok(p) => p,
            Err(_) => return,
        };

        let ip_header = match packet.net {
            Some(etherparse::InternetSlice::Ipv4(h)) => h,
            _ => return,
        };

        let tcp_header = match packet.transport {
            Some(etherparse::TransportSlice::Tcp(h)) => h,
            _ => return,
        };

        let src_addr = ip_header.header().source_addr().to_string();
        let src_port = tcp_header.to_header().source_port;
        let dst_addr = ip_header.header().destination_addr().to_string();
        let dst_port = tcp_header.to_header().destination_port;
        let payload = tcp_header.payload();

        if payload.is_empty() {
            return;
        }

        let endpoint = ServerEndpoint::new(src_addr, src_port, dst_addr, dst_port);

        let is_match = if let Some(ref server) = self.current_server {
            endpoint == *server || endpoint == server.reverse()
        } else {
            false
        };

        if !is_match {
            let payload_len = payload.len();
            let is_likely_bp = payload_len >= 10
                && payload_len < 2000
                && payload[4] == 0
                && !((src_port == 443 || dst_port == 443) && payload_len >= 1400);

            if is_likely_bp && crate::capture::parser::detect_server_in_packet(payload, &endpoint) {
                self.current_server = Some(endpoint.clone());
                self.next_seq = Some(
                    tcp_header
                        .sequence_number()
                        .wrapping_add(payload.len() as u32),
                );
                self.last_any_packet_time = Some(std::time::SystemTime::now());

                log::info!(
                    "Blue Protocol server detected! Server: {}",
                    endpoint.to_string()
                );

                let _ = self
                    .tx
                    .send(crate::models::events::CombatEvent::ServerChange(
                        crate::models::events::ServerChangeUpdate {
                            server_endpoint: endpoint.to_string(),
                        },
                    ));

                let segments = self.process_segment(tcp_header.sequence_number(), payload);
                for segment in segments {
                    crate::capture::parser::process_bp_packet(&segment, &self.tx);
                }
            }
        } else {
            let now = std::time::SystemTime::now();

            if let Some(last_any) = self.last_any_packet_time {
                if now.duration_since(last_any).unwrap_or_default() > tcp::IDLE_TIMEOUT {
                    self.force_reconnect("idle timeout");
                    if crate::capture::parser::detect_server_in_packet(payload, &endpoint) {
                        log::info!(
                            "Blue Protocol server detected after reconnect: {}",
                            endpoint.to_string()
                        );
                        self.current_server = Some(endpoint.clone());
                        self.next_seq = Some(
                            tcp_header
                                .sequence_number()
                                .wrapping_add(payload.len() as u32),
                        );
                        self.last_any_packet_time = Some(now);
                        let _ = self
                            .tx
                            .send(crate::models::events::CombatEvent::ServerChange(
                                crate::models::events::ServerChangeUpdate {
                                    server_endpoint: endpoint.to_string(),
                                },
                            ));
                        let segments = self.process_segment(tcp_header.sequence_number(), payload);
                        for segment in segments {
                            crate::capture::parser::process_bp_packet(&segment, &self.tx);
                        }
                    }
                } else {
                    let segments = self.process_segment(tcp_header.sequence_number(), payload);
                    for segment in segments {
                        crate::capture::parser::process_bp_packet(&segment, &self.tx);
                    }
                }
            } else {
                let segments = self.process_segment(tcp_header.sequence_number(), payload);
                for segment in segments {
                    crate::capture::parser::process_bp_packet(&segment, &self.tx);
                }
            }
        }
    }
}
