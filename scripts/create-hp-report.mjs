const MONSTER_ID = 80004; // Inferno Ogre
const HP_PCT = 20; // HP percentage (0-100)
const LINE = 10; // Line number (1-XXX)

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
  async createHpReport(monsterId, hpPct, line) {
    try {
      const response = await this.request('/api/create-hp-report', {
        method: 'POST',
        body: JSON.stringify({
          monster_id: monsterId,
          hp_pct: hpPct,
          line: line
        })
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
  const result = await app.createHpReport(MONSTER_ID, HP_PCT, LINE);
  console.log('HP Report created successfully:', result);
} catch (error) {
  console.error('Test failed:', error.message);
  process.exit(1);
}
