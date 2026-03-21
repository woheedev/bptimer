use crate::models::events::{CombatEvent, ServerChangeUpdate};
use crate::protocol::constants::tcp;
use std::collections::{HashMap, VecDeque};
use std::sync::mpsc;
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
}

/// Directional key for a TCP stream (order-dependent)
fn conn_key(ep: &ServerEndpoint) -> String {
    format!(
        "{}:{}>{}:{}",
        ep.src_addr, ep.src_port, ep.dst_addr, ep.dst_port
    )
}

/// Per-connection TCP reassembly state
#[derive(Debug)]
struct ConnectionState {
    next_seq: Option<u32>,
    tcp_cache: HashMap<u32, Vec<u8>>,
    stream_buffer: VecDeque<u8>,
    last_any_packet_time: Option<SystemTime>,
    waiting_gap_since: Option<SystemTime>,
}

impl ConnectionState {
    fn new() -> Self {
        Self {
            next_seq: None,
            tcp_cache: HashMap::new(),
            stream_buffer: VecDeque::new(),
            last_any_packet_time: None,
            waiting_gap_since: None,
        }
    }

    fn seq_cmp(a: u32, b: u32) -> i32 {
        a.wrapping_sub(b) as i32
    }

    fn force_resync_to(&mut self, seq: u32) {
        self.tcp_cache.clear();
        self.stream_buffer.clear();
        self.next_seq = Some(seq);
        self.waiting_gap_since = None;
    }

    fn process_segment(&mut self, seq: u32, payload: &[u8]) -> Vec<Vec<u8>> {
        let mut complete_packets = Vec::new();
        let now = SystemTime::now();

        self.last_any_packet_time = Some(now);

        if self.next_seq.is_none() {
            if payload.len() > 4 {
                let packet_size =
                    u32::from_be_bytes([payload[0], payload[1], payload[2], payload[3]]) as usize;
                if packet_size < tcp::MAX_PACKET_SIZE as usize {
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

        while let Some(next_seq) = self.next_seq {
            if let Some(segment) = self.tcp_cache.remove(&next_seq) {
                self.stream_buffer.extend(&segment);
                self.next_seq = Some(next_seq.wrapping_add(segment.len() as u32));
            } else {
                break;
            }
        }

        while self.try_extract_packet(&mut complete_packets) {}

        complete_packets
    }

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

        if packet_size <= 4 || packet_size > tcp::MAX_PACKET_SIZE as usize {
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
}

/// TCP Stream Processor — tracks multiple game connections
#[derive(Debug)]
pub struct TcpStreamProcessor {
    pub current_server: Option<ServerEndpoint>,
    connections: HashMap<String, ConnectionState>,
    game_server_prefix: Option<String>,
    pub tx: mpsc::Sender<CombatEvent>,
}

impl TcpStreamProcessor {
    pub fn new(tx: mpsc::Sender<CombatEvent>) -> Self {
        Self {
            current_server: None,
            connections: HashMap::new(),
            game_server_prefix: None,
            tx,
        }
    }

    fn extract_ip_prefix(addr: &str) -> Option<String> {
        let parts: Vec<&str> = addr.split('.').collect();
        if parts.len() >= tcp::GAME_SUBNET_PREFIX_OCTETS {
            Some(format!("{}.{}.", parts[0], parts[1]))
        } else {
            None
        }
    }

    fn is_game_subnet(&self, addr: &str) -> bool {
        if let Some(ref prefix) = self.game_server_prefix {
            addr.starts_with(prefix)
        } else {
            false
        }
    }

    fn process_conn_segments(
        conn: &mut ConnectionState,
        seq: u32,
        payload: &[u8],
        tx: &mpsc::Sender<CombatEvent>,
    ) {
        let segments = conn.process_segment(seq, payload);
        for segment in segments {
            crate::capture::parser::process_bp_packet(&segment, tx);
        }
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

        let endpoint = ServerEndpoint::new(src_addr.clone(), src_port, dst_addr.clone(), dst_port);
        let key = conn_key(&endpoint);

        // Already-tracked connection
        if self.connections.contains_key(&key) {
            let now = SystemTime::now();
            let conn = self.connections.get_mut(&key).unwrap();

            if let Some(last_any) = conn.last_any_packet_time {
                if now.duration_since(last_any).unwrap_or_default() > tcp::IDLE_TIMEOUT {
                    log::info!("Removing idle connection: {}", endpoint.to_string());
                    self.connections.remove(&key);
                    if let Some(ref server) = self.current_server {
                        let server_key = conn_key(server);
                        let server_rev_key = conn_key(&ServerEndpoint::new(
                            server.dst_addr.clone(),
                            server.dst_port,
                            server.src_addr.clone(),
                            server.src_port,
                        ));
                        if key == server_key || key == server_rev_key {
                            self.current_server = None;
                        }
                    }
                    return;
                }
            }

            Self::process_conn_segments(conn, tcp_header.sequence_number(), payload, &self.tx);
            return;
        }

        // New connection — check for game server signature
        let payload_len = payload.len();
        let is_likely_bp = payload_len >= tcp::BP_DETECT_MIN_PAYLOAD
            && payload_len < tcp::BP_DETECT_MAX_PAYLOAD
            && payload[4] == 0
            && !((src_port == tcp::TLS_PORT || dst_port == tcp::TLS_PORT)
                && payload_len >= tcp::TLS_LARGE_PACKET_THRESHOLD);

        if is_likely_bp && crate::capture::parser::detect_server_in_packet(payload, &endpoint) {
            if self.game_server_prefix.is_none() {
                self.game_server_prefix = Self::extract_ip_prefix(&src_addr);
                if let Some(ref prefix) = self.game_server_prefix {
                    log::info!("Game server subnet detected: {}*", prefix);
                }
            }

            self.current_server = Some(endpoint.clone());

            log::info!(
                "Blue Protocol server detected! Server: {}",
                endpoint.to_string()
            );

            let _ = self.tx.send(CombatEvent::ServerChange(ServerChangeUpdate {
                server_endpoint: endpoint.to_string(),
            }));

            let mut conn = ConnectionState::new();
            conn.last_any_packet_time = Some(SystemTime::now());

            Self::process_conn_segments(&mut conn, tcp_header.sequence_number(), payload, &self.tx);

            self.connections.insert(key, conn);
            return;
        }

        if self.is_game_subnet(&src_addr) || self.is_game_subnet(&dst_addr) {
            if src_port <= tcp::MIN_NON_SYSTEM_PORT || dst_port <= tcp::MIN_NON_SYSTEM_PORT {
                return;
            }

            if self.connections.len() >= tcp::MAX_TRACKED_CONNECTIONS {
                return;
            }

            log::info!(
                "Auto-tracking game subnet connection: {}",
                endpoint.to_string()
            );

            let mut conn = ConnectionState::new();
            conn.last_any_packet_time = Some(SystemTime::now());

            Self::process_conn_segments(&mut conn, tcp_header.sequence_number(), payload, &self.tx);

            self.connections.insert(key, conn);
        }
    }
}
