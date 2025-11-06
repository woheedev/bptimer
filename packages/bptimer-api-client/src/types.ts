export type LogLevel = 'silent' | 'info' | 'debug';

export interface Logger {
  info: (message: string) => void;
  debug: (message: string) => void;
}

export interface ClientConfig {
  api_url: string;
  api_key: string;
  enabled?: boolean;
  logger?: Logger;
  log_level?: LogLevel;
}

export interface ReportPayload {
  monster_id: number;
  hp_pct: number;
  line: number;
  pos_x?: number;
  pos_y?: number;
  region?: string;
}

export interface ReportResponse {
  success: boolean;
  message?: string;
  data?: unknown;
}

export interface CacheEntry {
  timestamp: number;
  last_reported_hp: number | null;
  is_pending: boolean;
}
