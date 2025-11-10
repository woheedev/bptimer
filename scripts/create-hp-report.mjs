const MONSTER_ID = 10904; // Loyal Boarlet
const HP_PCT = 100; // HP percentage (0-100)
const LINE = 10; // Line number (1-XXX)
const POS_X = 222; // Loyal Boarlet SCOUT 1 location
const POS_Y = 142;
const POS_Z = 32;

class BPTimer {
  constructor(apiKey, dbURL) {
    this.dbURL = dbURL;
    this.apiKey = apiKey;
  }

  // API request handler
  async request(endpoint, options = {}) {
    const url = `${this.dbURL}${endpoint}`;
    const headers = {
      'X-API-Key': this.apiKey,
      'Content-Type': 'application/json',
      ...options.headers
    };

    return fetch(url, { ...options, headers });
  }

  // Create HP report
  async createHpReport(monsterId, hpPct, line, posX, posY, posZ) {
    try {
      const payload = {
        monster_id: monsterId,
        hp_pct: hpPct,
        line: line
      };

      if (posX !== undefined && posY !== undefined && posZ !== undefined) {
        payload.pos_x = posX;
        payload.pos_y = posY;
        payload.pos_z = posZ;
      }

      const response = await this.request('/api/create-hp-report', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`API Error: ${response.status} - ${error.message || error}`);
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }
}

const [dbURL, apiKey] = process.argv.slice(2);

if (!dbURL || !apiKey) {
  console.error('Usage: bun create-hp-report.mjs <db_url> <api_key>');
  process.exit(1);
}

const app = new BPTimer(apiKey, dbURL);

try {
  const result = await app.createHpReport(MONSTER_ID, HP_PCT, LINE, POS_X, POS_Y, POS_Z);
  console.log('HP Report created successfully:', result);
} catch (error) {
  console.error('Test failed:', error.message);
  process.exit(1);
}
