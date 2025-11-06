import { CACHE_EXPIRY_MS, HP_REPORT_INTERVAL, MOB_MAPPING } from './constants';
import type { CacheEntry, ClientConfig, LogLevel, ReportPayload, ReportResponse } from './types';

export * from './constants';
export * from './types';

export class BPTimerClient {
  private api_url: string;
  private api_key: string;
  private enabled: boolean;
  private log_level: LogLevel;
  private cache = new Map<string, CacheEntry>();

  constructor(config: ClientConfig) {
    this.api_url = config.api_url;
    this.api_key = config.api_key;
    this.enabled = config.enabled ?? true;
    this.log_level = config.log_level ?? 'info';
  }

  private log(level: 'info' | 'debug', message: string): void {
    if (this.log_level === 'silent') return;
    if (level === 'debug' && this.log_level !== 'debug') return;
    console.log(`[BPTimer] ${message}`);
  }

  async reportHP(
    monster_id: string | number,
    hp_pct: number,
    line: number,
    options?: { pos_x?: number; pos_y?: number; region?: string }
  ): Promise<ReportResponse> {
    if (!this.enabled) {
      this.log('debug', 'Client is disabled');
      return { success: false, message: 'Client is disabled' };
    }

    if (!this.api_key || !this.api_url) {
      this.log('debug', 'API key or URL not configured');
      return { success: false, message: 'API key or URL not configured' };
    }

    const monster_key = String(monster_id);
    if (!MOB_MAPPING.has(monster_key)) {
      this.log('debug', `Monster ${monster_key} not tracked`);
      return { success: false, message: 'Monster ID not tracked' };
    }

    // Round to nearest HP_REPORT_INTERVAL
    const current_hp = Math.round(hp_pct / HP_REPORT_INTERVAL) * HP_REPORT_INTERVAL;

    const cache_key = `${monster_key}-${line}`;
    let entry = this.cache.get(cache_key);
    const now = Date.now();

    // Create new entry if missing or expired
    if (!entry || now - entry.timestamp > CACHE_EXPIRY_MS) {
      if (entry) {
        this.log('debug', `Expired cache for ${monster_key}-${line}`);
      }
      entry = {
        timestamp: now,
        last_reported_hp: null,
        is_pending: false
      };
      this.cache.set(cache_key, entry);
    }

    // Skip if we already reported this HP value
    if (entry.last_reported_hp === current_hp) {
      this.log(
        'debug',
        `Already reported ${current_hp}% HP for ${monster_key}-${line} (cache hit)`
      );
      return { success: false, message: 'Already reported this HP' };
    }

    // Skip if a request is already in progress
    if (entry.is_pending) {
      this.log('debug', `Request already pending for ${monster_key}-${line}-${current_hp}`);
      return { success: false, message: 'Report in progress' };
    }

    entry.is_pending = true;

    try {
      const payload: ReportPayload = {
        monster_id: Number(monster_id),
        hp_pct: current_hp,
        line,
        ...(options?.pos_x !== undefined && { pos_x: options.pos_x }),
        ...(options?.pos_y !== undefined && { pos_y: options.pos_y }),
        ...(options?.region && { region: options.region })
      };

      const response = await fetch(`${this.api_url}/api/create-hp-report`, {
        method: 'POST',
        headers: {
          'X-API-Key': this.api_key,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const error_data = (await response.json().catch(() => ({}))) as { message?: string };
        const error_message = error_data.message || `API error: ${response.status}`;
        this.log('info', `Failed to report HP: ${error_message}`);
        return { success: false, message: error_message };
      }

      const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;
      entry.last_reported_hp = current_hp;
      const monster_name = MOB_MAPPING.get(monster_key) || monster_key;
      this.log(
        'info',
        `Reported ${current_hp}% HP for ${monster_name} (${monster_key}) on Line ${line}`
      );
      return { success: true, data };
    } catch (error) {
      const error_message = error instanceof Error ? error.message : 'Unknown error';
      this.log('info', `Failed to report HP: ${error_message}`);
      return {
        success: false,
        message: error_message
      };
    } finally {
      entry.is_pending = false;
    }
  }

  resetMonster(monster_id: string | number, line?: number): void {
    const monster_key = String(monster_id);
    if (line !== undefined) {
      this.cache.delete(`${monster_key}-${line}`);
    } else {
      const prefix = `${monster_key}-`;
      for (const key of this.cache.keys()) {
        if (key.startsWith(prefix)) {
          this.cache.delete(key);
        }
      }
    }
  }

  clearAll(): void {
    this.cache.clear();
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  async testConnection(): Promise<ReportResponse> {
    this.log('debug', 'Testing API endpoint...');

    try {
      const response = await fetch(`${this.api_url}/api/health`, {
        method: 'GET',
        headers: {
          'X-API-Key': this.api_key
        }
      });

      if (!response.ok) {
        const error_message = `API endpoint returned ${response.status}`;
        this.log('info', `API test failed: ${error_message}`);
        return { success: false, message: error_message };
      }

      this.log('info', 'API endpoint responding, key validated');
      return { success: true };
    } catch (error) {
      const error_message = error instanceof Error ? error.message : 'Unknown error';
      this.log('info', `API test failed: ${error_message}`);
      return { success: false, message: error_message };
    }
  }
}
